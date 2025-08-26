from django.urls import path
from ..views.meal_plan import (
    MealPlanListView,
    MealPlanDetailView,
    MealPlanRecipeView
)

urlpatterns = [
    path('', MealPlanListView.as_view(), name='meal-plan-list'),
    path('<int:pk>/', MealPlanDetailView.as_view(), name='meal-plan-detail'),
    path('<int:pk>/recipes/', MealPlanRecipeView.as_view(), name='meal-plan-recipes'),
] 