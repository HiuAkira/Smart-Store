from django.db import models
from .meal_plan import MealPlan
from .recipe import Recipe

class Have(models.Model):
    plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('plan', 'recipe')

    def __str__(self):
        return f'{self.recipe.recipeName} in {self.plan.mealType} Plan'
