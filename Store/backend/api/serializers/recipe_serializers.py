from rest_framework import serializers
from ..models.recipe import Recipe
from ..models.ingredient import Ingredient
from .product_catalog_serializer import ProductCatalogSerializer
from ..models.product_catalog import ProductCatalog
import cloudinary.uploader


class IngredientSerializer(serializers.ModelSerializer):
    product = ProductCatalogSerializer(read_only=True) # Lấy product Details

    class Meta:
        model = Ingredient
        fields = ['product']

class RecipeSerializer(serializers.ModelSerializer):
    ingredients = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )
    ingredient_set = IngredientSerializer(source='ingredients',many=True, read_only=True)
    image_upload = serializers.ImageField(write_only=True, required=False, allow_null=True)
    class Meta:
        model = Recipe
        fields = ['recipeID', 'recipeName', 'description', 'instruction', 'isCustom', 'image', 'ingredients', 'ingredient_set', 'image_upload']
        read_only_fields = ['recipeID', 'image']

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients', [])
        image_file = validated_data.pop('image_upload', None)

        if image_file:
            try:
                upload_result = cloudinary.uploader.upload(image_file)
                validated_data['image'] = upload_result['secure_url']
            except Exception as e:
                raise serializers.ValidationError(f"Cloudinary upload failed: {e}")
        else:
            validated_data['image'] = None

        recipe = Recipe.objects.create(**validated_data)

        for product_id in ingredients_data:
            try:
                product = ProductCatalog.objects.get(productID=product_id)
            except ProductCatalog.DoesNotExist:
                raise serializers.ValidationError(f"Sản phẩm với ID {product_id} không tồn tại.")
            Ingredient.objects.create(recipe=recipe, product=product)

        return recipe


    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('ingredients', None)
        image_file = validated_data.pop('image_upload', None)

        if image_file:
            try:
                upload_result = cloudinary.uploader.upload(image_file)
                instance.image = upload_result['secure_url']
            except Exception as e:
                raise serializers.ValidationError(f"Cloudinary upload failed: {e}")
        elif 'image_upload' in validated_data:
            instance.image = None

        instance.recipeName = validated_data.get('recipeName', instance.recipeName)
        instance.description = validated_data.get('description', instance.description)
        instance.instruction = validated_data.get('instruction', instance.instruction)
        instance.isCustom = validated_data.get('isCustom', instance.isCustom)
        instance.save()

        if ingredients_data is not None:
            instance.ingredients.all().delete()  # Xóa nguyên liệu cũ

            for product_id in ingredients_data:
                try:
                    product = ProductCatalog.objects.get(productID=product_id)
                except ProductCatalog.DoesNotExist:
                    raise serializers.ValidationError(f"Sản phẩm với ID {product_id} không tồn tại.")
                Ingredient.objects.create(recipe=instance, product=product)

        return instance