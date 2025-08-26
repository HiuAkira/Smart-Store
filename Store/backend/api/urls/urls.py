from django.urls import path, include 
from ..views.user import (
    UserListView,
    UserMeView,
    UserUpdateView,
    UserDetailView,
    UserStatusView,
    UserRoleView,
)



urlpatterns = [
    # ... existing urls ...
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/me/', UserMeView.as_view(), name='user-me'),
    path('users/me/update/', UserUpdateView.as_view(), name='user-update'),
    path('users/<int:user_id>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:user_id>/status/', UserStatusView.as_view(), name='user-status'),
    path('users/<int:user_id>/role/', UserRoleView.as_view(), name='user-role'),
    
] 