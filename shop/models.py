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
        ("pending", "Order Placed"),
        ("confirmed", "Confirmed & Packing"),
        ("out_for_delivery", "Out for Delivery"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]

    PAYMENT_CHOICES = [
        ("cod", "Cash on Delivery"),
        ("online", "Paid Online"),
        ("wallet", "Dairy Wallet"),
    ]

    SLOT_CHOICES = [
        ("morning", "🌅 Morning (06:30 AM - 08:30 AM)"),
        ("evening", "🌆 Evening (05:30 PM - 07:30 PM)"),
        ("anytime", "⚡ Standard Delivery"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    order_id = models.CharField(max_length=30, unique=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default="cod")
    delivery_date = models.DateField(blank=True, null=True)
    delivery_slot = models.CharField(max_length=50, choices=SLOT_CHOICES, default="morning")
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    delivery_boy = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="delivered_orders",
        help_text="Delivery partner who delivered this order"
    )

    @property
    def tracking_step(self):
        mapping = {
            "pending": 1,
            "confirmed": 2,
            "out_for_delivery": 3,
            "delivered": 4,
            "cancelled": -1,
        }
        return mapping.get(self.status, 1)

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

    @property
    def is_prepaid(self):
        return self.payment_method in ["online", "wallet"]

    @property
    def customer_name(self):
        full_name = self.user.get_full_name()
        return full_name if full_name.strip() else self.user.username

    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)

    @property
    def effective_latitude(self):
        if self.latitude:
            return self.latitude
        if hasattr(self.user, 'profile') and self.user.profile.latitude:
            return self.user.profile.latitude
        return None

    @property
    def effective_longitude(self):
        if self.longitude:
            return self.longitude
        if hasattr(self.user, 'profile') and self.user.profile.longitude:
            return self.user.profile.longitude
        return None

    @property
    def has_live_location(self):
        return bool(self.effective_latitude and self.effective_longitude)

    @property
    def maps_navigation_url(self):
        import urllib.parse
        lat = self.effective_latitude
        lng = self.effective_longitude
        if lat and lng:
            return f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"
        addr = self.customer_address
        if not addr or addr.strip().lower() in ["standard address", "address not provided", "standard home delivery (khamkar dairy)", ""]:
            return "https://www.google.com/maps/search/?api=1&query=Sangli,+Maharashtra"
        clean_addr = addr.strip()
        if "sangli" not in clean_addr.lower():
            clean_addr = f"{clean_addr}, Sangli, Maharashtra"
        encoded_addr = urllib.parse.quote(clean_addr)
        return f"https://www.google.com/maps/dir/?api=1&destination={encoded_addr}"

    @property
    def customer_phone(self):
        if hasattr(self.user, 'profile') and self.user.profile.phone:
            return self.user.profile.phone
        return "Not Provided"

    @property
    def customer_address(self):
        if hasattr(self.user, 'profile') and self.user.profile.address:
            return self.user.profile.address
        return "Standard Address"

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

    @property
    def item_name(self):
        if self.product and self.product.name:
            return self.product.name
        return "Dairy Product"

    @property
    def item_label(self):
        if self.product:
            return self.product.quantity_label or self.product.name or "Item"
        return "Item"

    def __str__(self):
        prod_name = self.product.name if self.product else "Deleted Product"
        return f"{self.quantity}x {prod_name} in #{self.order.order_id}"

class Profile(models.Model):
    ROLE_CHOICES = [
        ("customer", "👤 Customer"),
        ("delivery_boy", "🛵 Delivery Boy"),
        ("admin", "🛡️ Store Admin"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    reward_points = models.PositiveIntegerField(default=0)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")
    is_on_duty = models.BooleanField(default=True, help_text="For delivery boys: indicates if they are currently accepting orders")

    @property
    def role_display(self):
        if self.user.is_staff:
            return "Admin"
        if self.role == "delivery_boy":
            return "Delivery Boy"
        return "Customer"

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


class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet")
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_wallet(cls, user):
        wallet, _ = cls.objects.get_or_create(user=user)
        return wallet

    def deposit(self, amount, description="Money Added to Wallet"):
        self.balance += amount
        self.save()
        WalletTransaction.objects.create(
            wallet=self,
            amount=amount,
            transaction_type="credit",
            description=description
        )
        return self.balance

    def deduct(self, amount, description="Order Payment"):
        if self.balance < amount:
            return False
        self.balance -= amount
        self.save()
        WalletTransaction.objects.create(
            wallet=self,
            amount=amount,
            transaction_type="debit",
            description=description
        )
        return True

    def __str__(self):
        return f"{self.user.username}'s Wallet (₹{self.balance})"


class WalletTransaction(models.Model):
    TYPE_CHOICES = [
        ("credit", "Credit (+ Added)"),
        ("debit", "Debit (- Spent)"),
    ]

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.transaction_type.upper()} ₹{self.amount} - {self.description}"




