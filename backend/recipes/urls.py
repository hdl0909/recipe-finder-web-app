from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views
from recipes.views import UserProfileView

router = DefaultRouter()
router.register('products', views.ProductViewSet, basename='product')
router.register('recipes', views.RecipeViewSet, basename='recipe')
router.register('pantry', views.UserPantryViewSet, basename='pantry')
router.register('comments', views.CommentViewSet, basename='comment')
router.register('diary', views.FoodDiaryEntryViewSet, basename='diary')

urlpatterns = [
    path('', include(router.urls)),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
]