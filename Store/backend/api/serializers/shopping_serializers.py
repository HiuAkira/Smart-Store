from rest_framework import serializers
from ..models.add_to_list import AddToList
from ..models.shopping_list import ShoppingList
from .product_catalog_serializer import ProductCatalogSerializer

class AddToListSerializer(serializers.ModelSerializer):
    product_details = ProductCatalogSerializer(source='product', read_only=True)
    
    class Meta:
        model = AddToList
        fields = ['id', 'list', 'product', 'quantity', 'status', 'product_details']

class ShoppingListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShoppingList
        fields = ['listID', 'createdAt', 'listName', 'date', 'group', 'user', 'type']
        read_only_fields = ['listID', 'createdAt']
        