"""
Management command to seed the database with all products and categories
from the Shop Product page.
"""
from django.core.management.base import BaseCommand
from shop.models import Category, Product


# All products from Shop Product.js
PRODUCTS = [
    {"category": "Curd", "name": "Regular Curd", "size": "500 g", "price": 40},
    {"category": "Curd", "name": "Premium Curd", "size": "500 g", "price": 50},
    {"category": "Curd", "name": "Dahi (Matka)", "size": "1 Kg", "price": 70},
    {"category": "Curd", "name": "Thick Curd", "size": "500 g", "price": 45},
    {"category": "Curd", "name": "Low Fat Curd", "size": "500 g", "price": 45},
    {"category": "Curd", "name": "Curd (Family Pack)", "size": "1 Kg", "price": 80},
    {"category": "Milk", "name": "Full Cream Cow Milk", "size": "1 Ltr", "price": 60},
    {"category": "Milk", "name": "Toned Cow Milk", "size": "1 Ltr", "price": 50},
    {"category": "Milk", "name": "Double Toned Milk", "size": "1 Ltr", "price": 45},
    {"category": "Milk", "name": "Buffalo Milk", "size": "1 Ltr", "price": 55},
    {"category": "Milk", "name": "Cow Milk (Pouch)", "size": "500 ml", "price": 30},
    {"category": "Paneer", "name": "Fresh Paneer", "size": "200 g", "price": 100},
    {"category": "Paneer", "name": "Paneer (500 g)", "size": "500 g", "price": 220},
    {"category": "Paneer", "name": "Paneer (1 Kg)", "size": "1 Kg", "price": 420},
    {"category": "Paneer", "name": "Paneer (Grated)", "size": "200 g", "price": 110},
    {"category": "Paneer", "name": "Paneer (Marinated)", "size": "200 g", "price": 120},
    {"category": "Paneer", "name": "Vacuum Packed Paneer", "size": "200 g", "price": 115},
    {"category": "Butter", "name": "Unsalted Butter", "size": "200 g", "price": 70},
    {"category": "Butter", "name": "Salted Butter", "size": "200 g", "price": 75},
    {"category": "Butter", "name": "Pasteurized Butter", "size": "500 g", "price": 160},
    {"category": "Butter", "name": "Amul Butter", "size": "100 g", "price": 50},
    {"category": "Butter", "name": "Amul Butter (Tub)", "size": "500 g", "price": 180},
    {"category": "Butter", "name": "White Butter (Bulk Pack)", "size": "1 Kg", "price": 320},
    {"category": "Buttermilk", "name": "Regular Buttermilk", "size": "250 ml", "price": 20},
    {"category": "Buttermilk", "name": "Spiced Buttermilk", "size": "250 ml", "price": 25},
    {"category": "Buttermilk", "name": "Plain Buttermilk (Bottle)", "size": "500 ml", "price": 35},
    {"category": "Buttermilk", "name": "Salted Buttermilk (Bottle)", "size": "1 Ltr", "price": 60},
    {"category": "Buttermilk", "name": "Masala Buttermilk (Bottle)", "size": "1 Ltr", "price": 65},
    {"category": "Buttermilk", "name": "Buttermilk (Pouch)", "size": "500 ml", "price": 30},
    {"category": "Ghee", "name": "Cow Ghee", "size": "200 ml", "price": 120},
    {"category": "Ghee", "name": "Cow Ghee", "size": "500 ml", "price": 250},
    {"category": "Ghee", "name": "A2 Cow Ghee", "size": "500 ml", "price": 320},
    {"category": "Ghee", "name": "A2 Cow Ghee", "size": "1 Ltr", "price": 600},
    {"category": "Ghee", "name": "Bilona Ghee", "size": "500 ml", "price": 350},
    {"category": "Ghee", "name": "Bilona Ghee", "size": "1 Ltr", "price": 650},
    {"category": "Shrikhand", "name": "Kesar Shrikhand", "size": "200 g", "price": 80},
    {"category": "Shrikhand", "name": "Plain Shrikhand", "size": "200 g", "price": 60},
    {"category": "Shrikhand", "name": "Mango Shrikhand", "size": "200 g", "price": 90},
    {"category": "Shrikhand", "name": "Elaichi Shrikhand", "size": "200 g", "price": 70},
    {"category": "Shrikhand", "name": "Dry Fruit Shrikhand", "size": "200 g", "price": 100},
    {"category": "Shrikhand", "name": "Family Pack Shrikhand", "size": "500 g", "price": 180},
    {"category": "Flavored Milk", "name": "Strawberry Flavored Milk", "size": "200 ml", "price": 40},
    {"category": "Flavored Milk", "name": "Chocolate Flavored Milk", "size": "200 ml", "price": 40},
    {"category": "Flavored Milk", "name": "Mango Flavored Milk", "size": "200 ml", "price": 40},
    {"category": "Flavored Milk", "name": "Vanilla Flavored Milk", "size": "200 ml", "price": 40},
    {"category": "Flavored Milk", "name": "Butterscotch Flavored Milk", "size": "200 ml", "price": 40},
    {"category": "Flavored Milk", "name": "Rose Flavored Milk", "size": "200 ml", "price": 40},
    {"category": "Flavored Milk", "name": "Kesar Flavored Milk", "size": "200 ml", "price": 45},
    {"category": "Lassi", "name": "Sweet Lassi", "size": "250 ml", "price": 30},
    {"category": "Lassi", "name": "Salted Lassi", "size": "250 ml", "price": 30},
    {"category": "Lassi", "name": "Mango Lassi", "size": "250 ml", "price": 40},
    {"category": "Lassi", "name": "Strawberry Lassi", "size": "250 ml", "price": 40},
    {"category": "Lassi", "name": "Kesar Lassi", "size": "250 ml", "price": 45},
    {"category": "Lassi", "name": "Chocolate Lassi", "size": "250 ml", "price": 45},
    {"category": "Cheese", "name": "Cheese Cubes", "size": "200 g", "price": 95},
    {"category": "Cheese", "name": "Cheese Slices", "size": "200 g (10 Slices)", "price": 85},
    {"category": "Cheese", "name": "Mozzarella Cheese", "size": "200 g", "price": 120},
    {"category": "Cheese", "name": "Cheddar Cheese", "size": "200 g", "price": 110},
    {"category": "Cheese", "name": "Cheese Spread", "size": "200 g", "price": 80},
    {"category": "Cheese", "name": "Cream Cheese", "size": "200 g", "price": 100},
    {"category": "Cheese", "name": "Herb & Chili Cheese", "size": "200 g", "price": 115},
    {"category": "Yogurt", "name": "Plain Yogurt", "size": "400 g", "price": 40},
    {"category": "Yogurt", "name": "Greek Yogurt", "size": "400 g", "price": 70},
    {"category": "Yogurt", "name": "Fruit Yogurt", "size": "400 g", "price": 60},
    {"category": "Yogurt", "name": "Masala Yogurt", "size": "400 g", "price": 45},
    {"category": "Yogurt", "name": "Sweet Yogurt", "size": "400 g", "price": 50},
    {"category": "Yogurt", "name": "Yogurt Family Pack", "size": "1 Kg", "price": 90},
    {"category": "Malai & Cream", "name": "Fresh Malai", "size": "200 g", "price": 60},
    {"category": "Malai & Cream", "name": "Malai", "size": "500 g", "price": 120},
    {"category": "Malai & Cream", "name": "Fresh Cream", "size": "200 ml", "price": 70},
    {"category": "Malai & Cream", "name": "Whipping Cream", "size": "200 ml", "price": 95},
    {"category": "Malai & Cream", "name": "Fresh Cream (Amul)", "size": "200 ml", "price": 85},
    {"category": "Malai & Cream", "name": "Malai (Heritage)", "size": "500 g", "price": 110},
    {"category": "Desi Products", "name": "White Makhana", "size": "500 g", "price": 130},
    {"category": "Desi Products", "name": "Desi Chaas (Masala)", "size": "1 L", "price": 45},
    {"category": "Desi Products", "name": "Desi Lassi (Mitti Matka)", "size": "500 ml", "price": 50},
    {"category": "Desi Products", "name": "Desi Gur (Jaggery)", "size": "500 g", "price": 60},
    {"category": "Desi Products", "name": "Bilona Ghee (Desi)", "size": "500 ml", "price": 280},
    {"category": "Desi Products", "name": "Desi Paneer", "size": "200 g", "price": 70},
    {"category": "Desi Products", "name": "Desi Khoya (Mawa)", "size": "500 g", "price": 150},
    {"category": "Value Packs", "name": "Daily Milk Value Pack", "size": "500 ml x 4 Pouches", "price": 120},
    {"category": "Value Packs", "name": "Paneer Value Pack", "size": "200 g x 3 Packs", "price": 165},
    {"category": "Value Packs", "name": "Curd Family Pack", "size": "200 g x 4 Cups", "price": 88},
    {"category": "Value Packs", "name": "Ghee Value Pack", "size": "200 ml x 2 Jars", "price": 460},
    {"category": "Value Packs", "name": "Dairy Combo Pack", "size": "1 Ltr Milk + 200 g Paneer + 200 g Curd + 200 ml Ghee", "price": 275},
    {"category": "Value Packs", "name": "Buttermilk Value Pack", "size": "200 ml x 6 Pouches", "price": 60},
]


class Command(BaseCommand):
    help = "Seed the database with all dairy products and categories from the Shop Product page."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear all existing products and categories before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing products and categories...")
            Product.objects.all().delete()
            Category.objects.all().delete()

        created_categories = 0
        created_products = 0
        skipped_products = 0

        for item in PRODUCTS:
            # Get or create category
            category, cat_created = Category.objects.get_or_create(
                name=item["category"]
            )
            if cat_created:
                created_categories += 1

            # Check if product already exists (same name + category)
            exists = Product.objects.filter(
                name=item["name"],
                category=category,
                quantity_label=item["size"],
            ).exists()

            if exists:
                skipped_products += 1
                continue

            Product.objects.create(
                name=item["name"],
                category=category,
                quantity_label=item["size"],
                price=item["price"],
                stock=50,  # default stock
                is_active=True,
                is_fresh=True,
            )
            created_products += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone! Created {created_categories} categories, "
                f"{created_products} products. "
                f"Skipped {skipped_products} existing products."
            )
        )
