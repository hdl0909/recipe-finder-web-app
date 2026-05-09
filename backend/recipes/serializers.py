from rest_framework import serializers
from .models import Product, Recipe, RecipeIngredient, UserPantry

class RecipeIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeIngredient
        fields = ['product', 'weight_g']

class RecipeSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientSerializer(many=True)
    author = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Recipe
        fields = ['id', 'title', 'description', 'author', 'created_at', 'ingredients']

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients')
        recipe = Recipe.objects.create(**validated_data)
        for item in ingredients_data:
            RecipeIngredient.objects.create(recipe=recipe, **item)
        return recipe

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class UserPantrySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPantry
        fields = ['product', 'quantity_g']