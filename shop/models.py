from django.contrib.auth.models import User
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity_label = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    stock = models.PositiveIntegerField(default=0)
    is_fresh = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def avg_rating(self):
        avg = self.reviews.aggregate(models.Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0

    @property
    def review_count(self):
        return self.reviews.count()

    def __str__(self):
        return self.name

class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorites")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                name="unique_user_favorite"
            )
        ]

class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cart_items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                name="unique_user_cart_product"
            )
        ]

class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]

    PAYMENT_CHOICES = [
        ("cod", "Cash on Delivery"),
        ("online", "Paid Online"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    order_id = models.CharField(max_length=30, unique=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default="cod")
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(blank=True, null=True)

    @property
    def items_subtotal(self):
        return sum(item.price * item.quantity for item in self.items.all())

    @property
    def packaging_charge(self):
        return 10 if self.items.exists() else 0

    @property
    def delivery_charge(self):
        subtotal = self.items_subtotal
        return 0 if subtotal > 200 else (50 if self.items.exists() else 0)

    @property
    def items_count(self):
        return sum(item.quantity for item in self.items.all())

    def __str__(self):
        return f"Order #{self.order_id} - {self.user.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def total_price(self):
        return self.price * self.quantity

    def __str__(self):
        prod_name = self.product.name if self.product else "Deleted Product"
        return f"{self.quantity}x {prod_name} in #{self.order.order_id}"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    reward_points = models.PositiveIntegerField(default=0)

    def avatar_url(self):
        if self.avatar and hasattr(self.avatar, "url"):
            return self.avatar.url
        name = self.user.get_full_name() or self.user.username
        import urllib.parse
        encoded_name = urllib.parse.quote(name)
        return f"https://ui-avatars.com/api/?name={encoded_name}&background=075334&color=fff&size=200"

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Review(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviews")
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                name="unique_user_product_review"
            )
        ]

    def __str__(self):
        prod_name = self.product.name if self.product else "Deleted Product"
        return f"Review by {self.user.username} ({self.rating}★) for {prod_name}"


class Coupon(models.Model):
    DISCOUNT_TYPES = [
        ("percentage", "Percentage (%)"),
        ("flat", "Flat Amount (₹)"),
    ]

    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default="percentage")
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    valid_until = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    used_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Coupon {self.code} ({self.discount_value}{'%' if self.discount_type == 'percentage' else '₹'})"


class StoreSetting(models.Model):
    store_name = models.CharField(max_length=200, default="Khamkar Dairy")
    contact_phone = models.CharField(max_length=50, default="+91 72196 21129")
    contact_email = models.EmailField(default="khamkardairy72@gmail.com")
    store_address = models.TextField(default="Near Market Yard, Sangli, Maharashtra - 416416")
    operating_hours = models.CharField(max_length=100, default="06:00 AM - 10:00 PM")
    free_delivery_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=200.00)
    standard_delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    packaging_charge = models.DecimalField(max_digits=10, decimal_places=2, default=10.00)
    store_open = models.BooleanField(default=True)
    enable_cod = models.BooleanField(default=True)
    enable_online = models.BooleanField(default=True)
    announcement_text = models.CharField(max_length=300, default="Fresh Morning Milk batch delivered daily before 7 AM!", blank=True)
    show_announcement = models.BooleanField(default=True)

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(id=1)
        return obj

    def __str__(self):
        return f"{self.store_name} Settings"



