from rest_framework import serializers
from .models import Product, Recipe, RecipeIngredient, UserPantry, UserProfile
from django.db.models import Sum, F, ExpressionWrapper, FloatField
from django.contrib.auth.models import User


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class RecipeIngredientSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ['product', 'product_name', 'weight_g']
        extra_kwargs = {'weight_g': {'min_value': 0.01}}


class RecipeSerializer(serializers.ModelSerializer):
    ingredients = RecipeIngredientSerializer(many=True)
    author = serializers.StringRelatedField(read_only=True)
    
    total_calories = serializers.SerializerMethodField()
    total_proteins = serializers.SerializerMethodField()
    total_fats = serializers.SerializerMethodField()
    total_carbs = serializers.SerializerMethodField()
    
    likes_count = serializers.SerializerMethodField()
    favorites_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = ['id', 'title', 'description', 'author', 'created_at', 
                  'ingredients', 'total_calories', 'total_proteins', 
                  'total_fats', 'total_carbs', 'likes_count', 'favorites_count',
                  'is_liked', 'is_favorited']

    def get_likes_count(self, obj):
        return obj.liked_by.count()

    def get_favorites_count(self, obj):
        return obj.favorited_by.count()

    def get_is_liked(self, obj):
        req = self.context.get('request')
        return req and req.user.is_authenticated and obj.liked_by.filter(id=req.user.id).exists()

    def get_is_favorited(self, obj):
        req = self.context.get('request')
        return req and req.user.is_authenticated and obj.favorited_by.filter(id=req.user.id).exists()

    def _calculate_kbzhu(self, ingredients_qs):
        total_c = total_p = total_f = total_ch = 0.0
        for ing in ingredients_qs:
            m = ing.weight_g / 100.0
            total_c += m * (ing.product.calories or 0)
            total_p += m * (ing.product.proteins or 0)
            total_f += m * (ing.product.fats or 0)
            total_ch += m * (ing.product.carbs or 0)
        return {
            'calories': round(total_c, 2),
            'proteins': round(total_p, 2),
            'fats': round(total_f, 2),
            'carbs': round(total_ch, 2),
        }

    def get_total_calories(self, obj):
        return self._calculate_kbzhu(obj.ingredients.all())['calories']
    def get_total_proteins(self, obj):
        return self._calculate_kbzhu(obj.ingredients.all())['proteins']
    def get_total_fats(self, obj):
        return self._calculate_kbzhu(obj.ingredients.all())['fats']
    def get_total_carbs(self, obj):
        return self._calculate_kbzhu(obj.ingredients.all())['carbs']

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients')
        recipe = Recipe.objects.create(**validated_data)
        RecipeIngredient.objects.bulk_create([
            RecipeIngredient(recipe=recipe, **item) for item in ingredients_data
        ])
        return recipe
    

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class UserPantrySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPantry
        fields = ['product', 'quantity_g']


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'age', 'weight', 
            'goal', 'allergens', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'username', 'email', 'created_at', 'updated_at']