from django.urls import path
from ..views.favorite_recipe import FavoriteRecipeView
 
urlpatterns = [
    path('', FavoriteRecipeView.as_view(), name='favorite-recipes'),
] 