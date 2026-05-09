from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

router = DefaultRouter()
router.register('products', views.ProductViewSet, basename='product')
router.register('recipes', views.RecipeViewSet, basename='recipe')
router.register('pantry', views.UserPantryViewSet, basename='pantry')

urlpatterns = [
    path('', include(router.urls)),
]