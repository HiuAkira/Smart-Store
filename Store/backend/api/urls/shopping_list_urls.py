from django.urls import path
from ..views.shopping_list_view import (
    ShoppingListView, 
    ShoppingListDetailView,
    AddToListView,
    AddToListDetailView,
    ToggleItemStatusView,
    PurchasedShoppingStatsView,
    PurchasedStatsByCategoryView
)

urlpatterns = [
    # Shopping List endpoints
    path('', ShoppingListView.as_view(), name='shopping-list'),  # GET: danh sách, POST: tạo mới
    path('<int:list_id>/', ShoppingListDetailView.as_view(), name='shopping-list-detail'),  # GET, PUT, DELETE
    
    # Shopping List Items endpoints
    path('<int:list_id>/items/', AddToListView.as_view(), name='add-to-list'),  # POST: thêm item
    path('<int:list_id>/items/<int:item_id>/', AddToListDetailView.as_view(), name='add-to-list-detail'),  # PUT, DELETE
    path('<int:list_id>/items/<int:item_id>/toggle/', ToggleItemStatusView.as_view(), name='toggle-item-status'),  # PATCH: toggle status

    # Purchased Shopping Stats endpoints
    path('purchased-shopping-stats/', PurchasedShoppingStatsView.as_view(), name='purchased-shopping-stats'),
    path('purchased-stats-by-category/', PurchasedStatsByCategoryView.as_view(), name='purchased-stats-by-category'),
] 