from django.urls import path
from ..views.group import GroupListView, CreateGroupView, JoinGroupView

urlpatterns = [
    path('', GroupListView.as_view(), name='group-list'),
    path('create/', CreateGroupView.as_view(), name='group-create'),
    path('<int:group_id>/join/', JoinGroupView.as_view(), name='group-join'),
]
