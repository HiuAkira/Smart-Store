from django.urls import path
from ..views.product_catalog_view import ProductCatalogView, ProductCatalogDetailView, ProductPriceView, ProductCatalogSearchView

urlpatterns = [
    path('', ProductCatalogView.as_view(), name='product-catalog'),
    path('<int:pk>/', ProductCatalogDetailView.as_view(), name='product-detail'),
    path('<int:pk>/price/', ProductPriceView.as_view(), name='product-price'),
    path('search/', ProductCatalogSearchView.as_view(), name='product-search'),
]