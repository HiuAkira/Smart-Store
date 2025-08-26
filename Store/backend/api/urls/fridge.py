from django.urls import path
from ..views.fridge import FridgeDetailView, FridgeNotificationView
from ..views.recommendation import RecipeRecommendationView

urlpatterns = [
    path('', FridgeDetailView.as_view(), name='fridge-list'),
    path('notifications/', FridgeNotificationView.as_view(), name='fridge-notifications'),
    path('<int:id>/', FridgeDetailView.as_view(), name='fridge-item'),
    path('recommendation/', RecipeRecommendationView.as_view(), name='recipe-recommendation'),
    #Test
    path('', FridgeDetailView.as_view(), name='fridge-list-create'),
    path('<int:id>/', FridgeDetailView.as_view(), name='fridge-detail-update-delete'),
    path('recommendation/', RecipeRecommendationView.as_view(), name='recipe-recommendations'),
]


