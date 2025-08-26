from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models.favorite_recipe import FavoriteRecipe
from ..models.recipe import Recipe

class FavoriteRecipeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        recipe_id = request.data.get('recipe_id')
        if not recipe_id:
            return Response({'success': False, 'message': 'Thiếu recipe_id'}, status=400)
        try:
            recipe = Recipe.objects.get(recipeID=recipe_id)
            fav, created = FavoriteRecipe.objects.get_or_create(user=request.user, recipe=recipe)
            return Response({'success': True, 'favorite': True})
        except Recipe.DoesNotExist:
            return Response({'success': False, 'message': 'Recipe không tồn tại'}, status=404)

    def delete(self, request):
        recipe_id = request.data.get('recipe_id')
        if not recipe_id:
            return Response({'success': False, 'message': 'Thiếu recipe_id'}, status=400)
        try:
            fav = FavoriteRecipe.objects.get(user=request.user, recipe_id=recipe_id)
            fav.delete()
            return Response({'success': True, 'favorite': False})
        except FavoriteRecipe.DoesNotExist:
            return Response({'success': False, 'message': 'Favorite không tồn tại'}, status=404)

    def get(self, request):
        # Lấy danh sách recipeID user đã yêu thích
        favs = FavoriteRecipe.objects.filter(user=request.user)
        recipe_ids = [f.recipe.recipeID for f in favs]
        return Response({'success': True, 'favorite_recipes': recipe_ids}) 