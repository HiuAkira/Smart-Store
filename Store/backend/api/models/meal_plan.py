from django.db import models
from .group import Group
from .user import User
from .recipe import Recipe
from django.utils import timezone

class MealPlan(models.Model):
    planID = models.AutoField(primary_key=True)
    plan_name = models.CharField(max_length=255, default="Kế hoạch bữa ăn")
    start_date = models.DateField(default=timezone.now)
    description = models.TextField(blank=True, null=True)
    mealType = models.CharField(max_length=50)
    day_of_week = models.IntegerField(default=0)  # 0-6 for Monday-Sunday
    recipes = models.ManyToManyField(Recipe, through='Have', blank=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    

    class Meta:
        unique_together = [['plan_name', 'day_of_week', 'mealType', 'group', 'start_date']]

    def __str__(self):
        recipe_name = self.recipes.first().recipeName if self.recipes.exists() else "Không có món"
        return f'{self.plan_name} - {self.mealType} ({self.get_day_name()}) - {recipe_name}'
    
    def get_day_name(self):
        days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"]
        return days[self.day_of_week] if 0 <= self.day_of_week <= 6 else "Không xác định"

    def get_meal_type_display(self):
        meal_types = {
            'breakfast': 'Bữa sáng',
            'lunch': 'Bữa trưa', 
            'dinner': 'Bữa tối'
        }
        return meal_types.get(self.mealType, self.mealType)
