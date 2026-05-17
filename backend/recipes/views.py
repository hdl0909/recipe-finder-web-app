from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Product, Recipe, UserPantry, RecipeIngredient, UserProfile
from .serializers import ProductSerializer, RecipeSerializer, UserPantrySerializer, UserProfileSerializer
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserRegisterSerializer
from rest_framework.permissions import IsAuthenticated


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Пользователь успешно создан"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        
        qs = Recipe.objects.prefetch_related('ingredients__product').order_by('-created_at')
        
        ingredients_param = self.request.query_params.get('ingredients', '').strip()
        
        if ingredients_param:
            names = [name.strip().lower() for name in ingredients_param.split(',') if name.strip()]
            if names:
                qs = Recipe.objects.filter(
                    ingredients__product__name__icontains=names[0]
                ).prefetch_related('ingredients__product').order_by('-created_at').distinct()
                
                for name in names[1:]:
                    qs = qs.filter(
                        ingredients__product__name__icontains=name
                    ).distinct()
                    
        return qs
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
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

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Получить профиль текущего пользователя"""
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    def put(self, request):
        """Обновить профиль текущего пользователя"""
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)