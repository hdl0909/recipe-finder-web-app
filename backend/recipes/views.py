from rest_framework import viewsets, permissions
from .models import Product, Recipe, UserPantry
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
        if self.request.user.is_authenticated:
            return Recipe.objects.filter(author=self.request.user)
        return Recipe.objects.all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class UserPantryViewSet(viewsets.ModelViewSet):
    serializer_class = UserPantrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserPantry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)