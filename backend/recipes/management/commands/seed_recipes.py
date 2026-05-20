from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from recipes.models import Recipe, Product, RecipeIngredient

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        author = User.objects.filter(is_superuser=True).first()
        if not author:
            author = User.objects.create_user(username='system', password='system')

        recipes_data = [
            {"title": "Куриное филе с гречкой", "desc": "Сытное блюдо на каждый день.", "ings": [("Куриное филе", 200), ("Гречка", 80), ("Морковь", 50), ("Лук репчатый", 40), ("Масло сливочное", 10)]},
            {"title": "Овсяная каша с яблоком", "desc": "Полезный завтрак, богатый клетчаткой.", "ings": [("Овсянка", 60), ("Молоко 2.5%", 150), ("Яблоко", 100), ("Мёд", 15)]},
            {"title": "Творожная запеканка", "desc": "Нежная запеканка с минимальным количеством сахара.", "ings": [("Творог 5%", 300), ("Яйцо куриное", 50), ("Сахар", 20), ("Сметана 15%", 30)]},
            {"title": "Салат из огурцов и помидоров", "desc": "Лёгкий салат с зеленью.", "ings": [("Помидор", 150), ("Огурец", 100), ("Укроп/петрушка", 10), ("Оливковое масло", 10), ("Соль", 2)]},
            {"title": "Паста с курицей", "desc": "Итальянская паста с нежным филе.", "ings": [("Макароны тв. сортов", 100), ("Куриное филе", 150), ("Масло сливочное", 15), ("Сыр Российский", 30)]},
            {"title": "Запеченный картофель", "desc": "Ароматный гарнир с сыром.", "ings": [("Картофель", 300), ("Сыр Российский", 50), ("Сметана 15%", 30), ("Зеленый лук", 10)]},
            {"title": "Омлет с помидорами", "desc": "Быстрый белковый завтрак.", "ings": [("Яйцо куриное", 100), ("Помидор", 80), ("Молоко 2.5%", 30), ("Масло сливочное", 5)]},
            {"title": "Рис с овощами", "desc": "Диетическое блюдо.", "ings": [("Рис белый", 80), ("Морковь", 60), ("Лук репчатый", 40), ("Оливковое масло", 10), ("Соль", 2)]},
            {"title": "Бананово-клубничный смузи", "desc": "Витаминный напиток.", "ings": [("Банан", 120), ("Клубника", 80), ("Молоко 2.5%", 150)]},
            {"title": "Борщ вегетарианский", "desc": "Классический суп без мяса.", "ings": [("Свёкла", 200), ("Капуста белокоч.", 150), ("Картофель", 150), ("Морковь", 60), ("Лук репчатый", 50), ("Сметана 15%", 20)]},
            {"title": "Гречка по-купечески", "desc": "Сытное блюдо с грибами.", "ings": [("Гречка", 100), ("Грибы шампиньоны", 150), ("Лук репчатый", 50), ("Морковь", 50), ("Масло сливочное", 15)]},
            {"title": "Сэндвич с сыром", "desc": "Быстрый перекус.", "ings": [("Хлеб белый", 60), ("Сыр Российский", 40), ("Масло сливочное", 10), ("Помидор", 50)]}
        ]

        created = 0
        for r in recipes_data:
            recipe, r_created = Recipe.objects.get_or_create(
                title=r["title"], defaults={"description": r["desc"], "author": author}
            )
            if not r_created:
                continue

            for prod_name, weight in r["ings"]:
                try:
                    prod = Product.objects.get(name=prod_name)
                    RecipeIngredient.objects.create(recipe=recipe, product=prod, weight_g=weight)
                except Product.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'Продукт "{prod_name}" не найден.'))
            created += 1
