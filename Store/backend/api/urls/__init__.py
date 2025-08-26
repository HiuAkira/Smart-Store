from django.urls import path, include
from ..views.categories_view import CategoriesView, CategoriesDetailView
from ..views.user import UserListView, UserMeView, UserUpdateView, UserDetailView, UserStatusView, UserRoleView
from ..views.auth import RegisterView, CustomTokenObtainPairView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework import routers
from ..views.recipe import IngredientView, RecipeView
from .favorite_recipe import *
from ..views.change_password import ChangePasswordView
from ..views.password_reset import PasswordResetRequestView, PasswordResetConfirmView

router = routers.DefaultRouter()
router.register(r'recipes', RecipeView)
router.register(r'ingredients', IngredientView)


urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path("api/change-password/", ChangePasswordView.as_view(), name="change-password"),
    # Password Reset URLs
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    # Product URLs
    path('products/', include('api.urls.products')),
    # Category URLs
    path('categories/', CategoriesView.as_view(), name='categories'),
    path('categories/<int:pk>/', CategoriesDetailView.as_view(), name='category-detail'),
    # Group URLs
    path('groups/', include('api.urls.group')),
    path('users/', UserListView.as_view(), name='user-list'),
    # User profile APIs
    path('user/me/', UserMeView.as_view(), name='user-me'),
    path('user/update/', UserUpdateView.as_view(), name='user-update'),
    # User management APIs
    path('users/<int:user_id>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:user_id>/status/', UserStatusView.as_view(), name='user-status'),
    path('users/<int:user_id>/role/', UserRoleView.as_view(), name='user-role'),
    # Shopping List URLs
    path('shopping-lists/', include('api.urls.shopping_list_urls')),
    #Fridge
    path('fridge/', include('api.urls.fridge')),
    # Meal Plan URLs
    path('meal-plans/', include('api.urls.meal_plan')),
    #Recipe + Ingredients
    path('', include(router.urls)),
    path('favorite-recipes/', include('api.urls.favorite_recipe')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)