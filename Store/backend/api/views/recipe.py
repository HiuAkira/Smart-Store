from rest_framework import viewsets
from ..models.recipe import Recipe
from ..serializers.recipe_serializers import RecipeSerializer, IngredientSerializer
from ..models.ingredient import Ingredient

class RecipeView(viewsets.ModelViewSet):
    queryset = Recipe.objects.all().prefetch_related('ingredients__product')
    serializer_class = RecipeSerializer
    
class IngredientView(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
