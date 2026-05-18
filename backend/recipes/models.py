from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Product(models.Model):
    name = models.CharField(max_length=100, unique=True)
    calories = models.FloatField()
    proteins = models.FloatField()
    fats = models.FloatField()
    carbs = models.FloatField()
    is_custom = models.BooleanField(default=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self): return self.name

class Recipe(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    liked_by = models.ManyToManyField(User, related_name='liked_recipes', blank=True)
    favorited_by = models.ManyToManyField(User, related_name='favorite_recipes', blank=True)
    
    def __str__(self): return self.title

class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe, related_name='ingredients', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    weight_g = models.FloatField()
    weight_g = models.FloatField(validators=[MinValueValidator(0.01)])

class UserPantry(models.Model):
    user = models.ForeignKey(User, related_name='pantry', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity_g = models.FloatField(default=0)

    class Meta:
        unique_together = ('user', 'product')

class UserProfile(models.Model):
    GOAL_CHOICES = [
        ('weight_loss', 'Похудение'),
        ('maintenance', 'Поддержание веса'),
        ('weight_gain', 'Набор массы'),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile',
        verbose_name='Пользователь'
    )
    age = models.PositiveIntegerField(
        null=True, 
        blank=True, 
        verbose_name='Возраст',
        validators=[MinValueValidator(1), MaxValueValidator(120)]
    )
    weight = models.FloatField(
        null=True, 
        blank=True, 
        verbose_name='Вес (кг)',
        validators=[MinValueValidator(30), MaxValueValidator(300)]
    )
    goal = models.CharField(
        max_length=20, 
        choices=GOAL_CHOICES, 
        default='maintenance',
        verbose_name='Цель питания'
    )
    allergens = models.TextField(
        blank=True, 
        verbose_name='Аллергены',
        help_text='Перечислите продукты через запятую (например: арахис, молоко, глютен)'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлён')
    
    class Meta:
        verbose_name = 'Профиль пользователя'
        verbose_name_plural = 'Профили пользователей'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f'Профиль {self.user.username}'
    

class Comment(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipe_comments')
    text = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.author.username} → {self.recipe.title}'