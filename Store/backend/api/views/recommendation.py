from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from ..models.fridge import Fridge
from ..models.add_to_fridge import AddToFridge
from ..models.group import Group
from ..models.recipe import Recipe
from ..models.ingredient import Ingredient
from ..serializers.recipe_serializers import RecipeSerializer
from django.db.models import Count

class RecipeRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get_group(self, request):
        group_id = request.query_params.get('group_id')
        user = request.user
        if group_id:
            group = get_object_or_404(Group, pk=group_id, members=user)
        else:
            group = user.joined_groups.first()
            if not group:
                return None
        return group

    def get(self, request):
        # Lấy nhóm và tủ lạnh
        group = self.get_group(request)
        if not group:
            return Response("User không thuộc nhóm nào", status=status.HTTP_400_BAD_REQUEST)

        fridge, _ = Fridge.objects.get_or_create(group=group)

        # Lấy tất cả products trong tủ lạnh
        fridge_items = AddToFridge.objects.filter(fridge=fridge).select_related('product')
        fridge_product_ids = set(item.product.productID for item in fridge_items)

        # Lấy tất cả thực đơn với lại ingredients của nó
        recipes = Recipe.objects.prefetch_related('ingredients__product').annotate(
            ingredient_count=Count('ingredients')
        )

        recommendations = []
        
        for recipe in recipes:
            # Lấy ingredients' ID cho recipe
            recipe_ingredient_ids = set(
                ingredient.product.productID 
                for ingredient in recipe.ingredients.all() 
                if ingredient.product
            )
            
            # Tính số lượng match 
            matching_ingredients = recipe_ingredient_ids.intersection(fridge_product_ids)
            total_ingredients = len(recipe_ingredient_ids)
            
            # Tính % match 
            match_percentage = (
                (len(matching_ingredients) / total_ingredients * 100) 
                if total_ingredients > 0 else 0
            )
            
            # Lấy các nguyên liệu còn thiếu
            missing_ingredients = recipe_ingredient_ids - fridge_product_ids
            missing_ingredient_details = [
                {
                    'product_id': pid,
                    'product_name': Ingredient.objects.get(
                        recipe=recipe, 
                        product__productID=pid
                    ).product.productName
                }
                for pid in missing_ingredients
            ]

            serializer = RecipeSerializer(recipe)
            recipe_data = serializer.data
            
            # Recommendation details
            recipe_data.update({
                'match_percentage': round(match_percentage, 2),
                'matching_ingredients_count': len(matching_ingredients),
                'total_ingredients': total_ingredients,
                'missing_ingredients': missing_ingredient_details
            })
            
            recommendations.append(recipe_data)

        # Sắp xếp theo thứ tự giảm dần
        recommendations.sort(key=lambda x: x['match_percentage'], reverse=True)


        page = request.query_params.get('page', 1)
        page_size = int(request.query_params.get('page_size', 4))  # 4 cái recommend cho 1 trang
        paginator = Paginator(recommendations, page_size)

        try:
            paginated_recommendations = paginator.page(page)
        except PageNotAnInteger:
            paginated_recommendations = paginator.page(1)
        except EmptyPage:
            paginated_recommendations = paginator.page(paginator.num_pages)

        return Response({
            'total_recommendations': len(recommendations),
            'page': int(page),
            'page_size': page_size,
            'total_pages': paginator.num_pages,
            'recommendations': paginated_recommendations.object_list
        })