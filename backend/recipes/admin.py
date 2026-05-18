from django.contrib import admin
from .models import Product, Recipe, RecipeIngredient, UserPantry, Comment

admin.site.register(Comment)
admin.site.register(Product)
admin.site.register(Recipe)
admin.site.register(RecipeIngredient)
admin.site.register(UserPantry)