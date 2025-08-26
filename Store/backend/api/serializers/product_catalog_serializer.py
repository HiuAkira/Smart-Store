from rest_framework import serializers
from ..models.product_catalog import ProductCatalog

class ProductCatalogSerializer(serializers.ModelSerializer):
    categoryID = serializers.IntegerField(source='category.categoryID', read_only=True)  # ✅ THÊM DÒNG NÀY
    category_name = serializers.CharField(source='category.categoryName', read_only=True)
    estimatedPrice = serializers.DecimalField(source='price', max_digits=10, decimal_places=2, read_only=True)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = ProductCatalog
        fields = [
            'productID', 
            'productName', 
            'original_price',
            'price', 
            'discount',
            'discount_amount',
            'discount_percentage',
            'estimatedPrice',
            'unit',
            'categoryID',           
            'category_name',
            'image', 
            'description',
            'shelfLife',
            'isCustom'
        ]
        read_only_fields = ['productID', 'price', 'discount_amount', 'discount_percentage']
