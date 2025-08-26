from rest_framework import serializers
from ..models.categories import Categories

class CategoriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categories
        fields = ['categoryID', 'categoryName'] 