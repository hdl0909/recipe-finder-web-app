from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Product, Recipe, UserPantry, RecipeIngredient, UserProfile, Comment, FoodDiaryEntry
from .serializers import ProductSerializer, RecipeSerializer, UserPantrySerializer, UserProfileSerializer, CommentSerializer, FoodDiaryEntrySerializer
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserRegisterSerializer
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from datetime import datetime, timedelta

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
        qs = Recipe.objects.prefetch_related('ingredients__product', 'liked_by', 'favorited_by').order_by('-created_at')
        
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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_like(self, request, pk=None):
        recipe = self.get_object()
        if recipe.liked_by.filter(id=request.user.id).exists():
            recipe.liked_by.remove(request.user)
            return Response({'status': 'unliked'})
        recipe.liked_by.add(request.user)
        return Response({'status': 'liked'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_favorite(self, request, pk=None):
        recipe = self.get_object()
        if recipe.favorited_by.filter(id=request.user.id).exists():
            recipe.favorited_by.remove(request.user)
            return Response({'status': 'unfavorited'})
        recipe.favorited_by.add(request.user)
        return Response({'status': 'favorited'})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_favorites(self, request):
        qs = request.user.favorite_recipes.all().prefetch_related('ingredients__product')
        return Response(self.get_serializer(qs, many=True).data)
    
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
    

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Comment.objects.select_related('author', 'recipe')
        recipe_id = self.request.query_params.get('recipe')
        return qs.filter(recipe_id=recipe_id) if recipe_id else qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    
class FoodDiaryEntryViewSet(viewsets.ModelViewSet):
    serializer_class = FoodDiaryEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = FoodDiaryEntry.objects.filter(user=self.request.user).select_related('recipe', 'product')
        date = self.request.query_params.get('date')
        return qs.filter(date=date) if date else qs

    def perform_create(self, serializer):
        recipe = serializer.validated_data.get('recipe')
        product = serializer.validated_data.get('product')
        portion = serializer.validated_data.get('portion_size', 0)

        cal = pro = fat = carb = 0.0

        if recipe:
            # Считаем КБЖУ рецепта по ингредиентам
            total_w = 0
            for ing in recipe.ingredients.all():
                p = ing.product
                w = ing.weight_g
                total_w += w
                cal += p.calories * w / 100
                pro += p.proteins * w / 100
                fat += p.fats * w / 100
                carb += p.carbs * w / 100
            
            if total_w > 0:
                factor = portion / total_w
                cal = round(cal * factor, 1)
                pro = round(pro * factor, 1)
                fat = round(fat * factor, 1)
                carb = round(carb * factor, 1)

        elif product:
            factor = portion / 100.0
            cal = round(product.calories * factor, 1)
            pro = round(product.proteins * factor, 1)
            fat = round(product.fats * factor, 1)
            carb = round(product.carbs * factor, 1)

        # Сохраняем с уже рассчитанными значениями
        serializer.save(
            user=self.request.user,
            calories=cal,
            proteins=pro,
            fats=fat,
            carbs=carb
        )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def daily_stats(self, request):
        date = request.query_params.get('date', datetime.now().date())
        entries = self.get_queryset().filter(date=date)
        
        totals = entries.aggregate(
            calories=Sum('calories'), proteins=Sum('proteins'),
            fats=Sum('fats'), carbs=Sum('carbs')
        )
        
        by_meal_raw = entries.values('meal_type').annotate(
            calories=Sum('calories'), count=Count('id')
        )
        
        choices_map = dict(FoodDiaryEntry.MEAL_TYPE_CHOICES)
        by_meal = []
        for item in by_meal_raw:
            item['meal_type_display'] = choices_map.get(item['meal_type'], item['meal_type'])
            by_meal.append(item)
            
        return Response({
            'date': date,
            'totals': {k: round(v or 0, 1) for k, v in totals.items()},
            'by_meal': by_meal,
            'entries_count': entries.count()
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def weekly_chart_data(self, request):
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=6)
        
        data = []
        current = start_date
        while current <= end_date:
            day_stats = self.get_queryset().filter(date=current).aggregate(
                calories=Sum('calories'),
                proteins=Sum('proteins'),
                fats=Sum('fats'),
                carbs=Sum('carbs')
            )
            data.append({
                'date': current.isoformat(),
                'day_name': current.strftime('%a'),  
                'calories': round(day_stats['calories'] or 0, 1),
                'proteins': round(day_stats['proteins'] or 0, 1),
                'fats': round(day_stats['fats'] or 1),
                'carbs': round(day_stats['carbs'] or 0, 1),
            })
            current += timedelta(days=1)
        
        return Response({'period': 'week', 'data': data})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def macro_distribution(self, request):
        date_from = request.query_params.get('from', (datetime.now().date() - timedelta(days=7)).isoformat())
        date_to = request.query_params.get('to', datetime.now().date().isoformat())
        
        totals = self.get_queryset().filter(date__range=[date_from, date_to]).aggregate(
            proteins=Sum('proteins'),
            fats=Sum('fats'),
            carbs=Sum('carbs')
        )
        
        p_cal = (totals['proteins'] or 0) * 4
        f_cal = (totals['fats'] or 0) * 9
        c_cal = (totals['carbs'] or 0) * 4
        total_cal = p_cal + f_cal + c_cal or 1  
        
        return Response({
            'period': {'from': date_from, 'to': date_to},
            'grams': {k: round(v or 0, 1) for k, v in totals.items()},
            'calories_from_macros': {
                'proteins': round(p_cal, 1),
                'fats': round(f_cal, 1),
                'carbs': round(c_cal, 1),
            },
            'percentages': {
                'proteins': round(p_cal / total_cal * 100, 1),
                'fats': round(f_cal / total_cal * 100, 1),
                'carbs': round(c_cal / total_cal * 100, 1),
            }
        })