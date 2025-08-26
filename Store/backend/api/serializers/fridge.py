from rest_framework import serializers
from ..models.fridge import Fridge
from ..models.add_to_fridge import AddToFridge

class FridgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fridge
        fields = "__all__"
        read_only_fields = ['fridgeID', 'group']

class AddToFridgeSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.productName', read_only=True)
    product_unit = serializers.CharField(source='product.unit', read_only=True)
    product_category_name = serializers.CharField(source='product.category.categoryName', read_only=True, allow_null=True)
    category_id = serializers.IntegerField(source='product.category.categoryID', read_only=True, allow_null=True)

    class Meta:
        model = AddToFridge
        fields = [
            'id',
            'product',
            'product_name',
            'product_unit',
            'product_category_name',
            'category_id',
            'quantity',
            'expiredDate',
            'location',
        ]

        # Đảm bảo 'addedAt' vẫn nằm trong 'read_only_fields'
        read_only_fields = ['id', 'addedAt', 'product_name', 'product_unit', 'product_category_name', 'category_id']