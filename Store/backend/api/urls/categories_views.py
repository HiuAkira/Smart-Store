# /urls.py
from django.urls import path
from ..views.categories_view import CategoriesView, CategoriesDetailView

urlpatterns = [
    path('categories/', CategoriesView.as_view(), name='category-list'),
    path('categories/<int:pk>/', CategoriesDetailView.as_view(), name='category-detail'),
]