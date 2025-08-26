from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Q
from datetime import datetime, timedelta
from collections import defaultdict

from ..models.meal_plan import MealPlan
from ..models.have import Have
from ..models.recipe import Recipe
from ..models.ingredient import Ingredient
from ..models.product_catalog import ProductCatalog
from ..serializers.mealplan_serializers import (
    MealPlanSerializer, 
    MealPlanDetailSerializer, 
    MealPlanCreateSerializer,
    MealPlanWeeklySerializer
)

class MealPlanListView(APIView):
    """API để lấy danh sách và tạo kế hoạch bữa ăn"""
    permission_classes = [AllowAny]  # Cho phép anonymous access
    
    def get(self, request):
        """Lấy danh sách kế hoạch bữa ăn"""
        group_id = request.query_params.get('group_id')
        user_id = request.query_params.get('user_id')
        
        queryset = MealPlan.objects.all()
        
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        queryset = queryset.order_by('-created_at')
        serializer = MealPlanSerializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def post(self, request):
        """Tạo kế hoạch bữa ăn mới"""
        print(f"=== MealPlanListView.post() ===")
        print(f"request.data: {request.data}")
        
        serializer = MealPlanCreateSerializer(data=request.data)
        print(f"serializer.is_valid(): {serializer.is_valid()}")
        
        if serializer.is_valid():
            meal_plans = serializer.save()
            # Lưu các recipe từ plannedMeals vào bảng Have
            planned_meals = request.data.get('planned_meals', [])
            print(f"planned_meals: {planned_meals}")
            
            for meal_plan in meal_plans:
                for meal in planned_meals:
                    recipe_id = meal.get('recipe_id')
                    print(f"Processing recipe_id: {recipe_id}")
                    if recipe_id:
                        try:
                            recipe = Recipe.objects.get(recipeID=recipe_id)
                            have_relation, created = Have.objects.get_or_create(
                                plan=meal_plan,
                                recipe=recipe
                            )
                            print(f"Created Have relation: {created}")
                        except Recipe.DoesNotExist:
                            print(f"Recipe not found with ID: {recipe_id}")
                            pass
            return Response({
                'success': True,
                'message': 'Tạo kế hoạch bữa ăn thành công',
                'data': [MealPlanSerializer(plan).data for plan in meal_plans]
            }, status=status.HTTP_201_CREATED)
        
        print(f"Validation errors: {serializer.errors}")
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class MealPlanDetailView(APIView):
    """API để xem chi tiết, cập nhật và xóa kế hoạch bữa ăn"""
    permission_classes = [AllowAny]  # Cho phép anonymous access
    
    def get_object(self, pk):
        try:
            return MealPlan.objects.get(planID=pk)
        except MealPlan.DoesNotExist:
            return None
    
    def get(self, request, pk):
        """Lấy chi tiết kế hoạch bữa ăn"""
        meal_plan = self.get_object(pk)
        if not meal_plan:
            return Response({
                'success': False,
                'message': 'Kế hoạch bữa ăn không tồn tại'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MealPlanDetailSerializer(meal_plan)
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def put(self, request, pk):
        """Cập nhật kế hoạch bữa ăn"""
        meal_plan = self.get_object(pk)
        if not meal_plan:
            return Response({
                'success': False,
                'message': 'Kế hoạch bữa ăn không tồn tại'
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = MealPlanSerializer(meal_plan, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Xử lý cập nhật danh sách món ăn
            planned_meals = request.data.get('planned_meals', [])
            # Xóa hết các món cũ
            Have.objects.filter(plan=meal_plan).delete()
            # Thêm lại các món mới
            for meal in planned_meals:
                recipe_id = meal.get('recipe_id')
                if recipe_id:
                    try:
                        recipe = Recipe.objects.get(recipeID=recipe_id)
                        Have.objects.create(plan=meal_plan, recipe=recipe)
                    except Recipe.DoesNotExist:
                        pass
            return Response({
                'success': True,
                'message': 'Cập nhật kế hoạch thành công',
                'data': serializer.data
            })

        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """Xóa kế hoạch bữa ăn"""
        meal_plan = self.get_object(pk)
        if not meal_plan:
            return Response({
                'success': False,
                'message': 'Kế hoạch bữa ăn không tồn tại'
            }, status=status.HTTP_404_NOT_FOUND)
        
        meal_plan.delete()
        return Response({
            'success': True,
            'message': 'Xóa kế hoạch thành công'
        })



class MealPlanRecipeView(APIView):
    """API để quản lý món ăn trong kế hoạch"""
    permission_classes = [AllowAny]  # Cho phép anonymous access
    
    def get_meal_plan(self, pk):
        try:
            return MealPlan.objects.get(planID=pk)
        except MealPlan.DoesNotExist:
            return None
    
    def post(self, request, pk):
        """Thêm món ăn vào kế hoạch"""
        meal_plan = self.get_meal_plan(pk)
        if not meal_plan:
            return Response({
                'success': False,
                'message': 'Kế hoạch bữa ăn không tồn tại'
            }, status=status.HTTP_404_NOT_FOUND)
        
        recipe_id = request.data.get('recipe_id')
        
        if not recipe_id:
            return Response({
                'success': False,
                'message': 'Thiếu recipe_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            recipe = Recipe.objects.get(recipeID=recipe_id)
            have_relation, created = Have.objects.get_or_create(
                plan=meal_plan,
                recipe=recipe
            )
            
            if created:
                return Response({
                    'success': True,
                    'message': 'Đã thêm món ăn vào kế hoạch'
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Món ăn đã có trong kế hoạch'
                })
                
        except Recipe.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Món ăn không tồn tại'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk):
        """Xóa món ăn khỏi kế hoạch"""
        meal_plan = self.get_meal_plan(pk)
        if not meal_plan:
            return Response({
                'success': False,
                'message': 'Kế hoạch bữa ăn không tồn tại'
            }, status=status.HTTP_404_NOT_FOUND)
        
        recipe_id = request.data.get('recipe_id')
        
        if not recipe_id:
            return Response({
                'success': False,
                'message': 'Thiếu recipe_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            have_relation = Have.objects.get(
                plan=meal_plan,
                recipe_id=recipe_id
            )
            have_relation.delete()
            
            return Response({
                'success': True,
                'message': 'Đã xóa món ăn khỏi kế hoạch'
            })
            
        except Have.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Món ăn không có trong kế hoạch'
            }, status=status.HTTP_404_NOT_FOUND) 