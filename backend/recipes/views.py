from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Product, Recipe, UserPantry, RecipeIngredient
from .serializers import ProductSerializer, RecipeSerializer, UserPantrySerializer


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Product.objects.filter(is_custom=False) | Product.objects.filter(owner=self.request.user)
        return Product.objects.filter(is_custom=False)

class RecipeViewSet(viewsets.ModelViewSet):
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Recipe.objects.prefetch_related('ingredients__product')
        ingredients_param = self.request.query_params.get('ingredients', '').strip()
        
        if ingredients_param:
            names = [name.strip().lower() for name in ingredients_param.split(',') if name.strip()]
            if names:
                matching_recipes = Recipe.objects.filter(
                    Q(ingredients__product__name__icontains=names[0])
                ).distinct()
                for name in names[1:]:
                    matching_recipes = matching_recipes.filter(
                        Q(ingredients__product__name__icontains=name)
                    ).distinct()
                qs = matching_recipes
        return qs
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def missing_ingredients(self, request, pk=None):
        recipe = self.get_object()
        user_products = set()
        if request.user.is_authenticated:
            user_products = set(UserPantry.objects.filter(user=request.user).values_list('product__name', flat=True))
        
        recipe_products = set(recipe.ingredients.values_list('product__name', flat=True))
        missing = recipe_products - user_products
        return Response({'missing': list(missing), 'available': list(recipe_products - missing)})
    

class UserPantryViewSet(viewsets.ModelViewSet):
    serializer_class = UserPantrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserPantry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)