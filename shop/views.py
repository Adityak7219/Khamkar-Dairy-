from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.db.models import Sum

from .models import Profile, Product, Category, Order, OrderItem, CartItem, Favorite, Review, Coupon, StoreSetting


def splash(request):
    """Splash / loading screen - shown when app first opens."""
    return render(request, 'shop/splash.html')


def home(request):
    categories = Category.objects.all()[:7]
    
    # Specific popular products requested: Buffalo milk, Cow milk, Curd, Paneer
    keywords = ["Buffalo Milk", "Cow Milk", "Curd", "Paneer"]
    popular_products = []
    selected_ids = []
    
    for kw in keywords:
        prod = Product.objects.filter(name__icontains=kw).exclude(id__in=selected_ids).first()
        if prod:
            popular_products.append(prod)
            selected_ids.append(prod.id)
            
    if len(popular_products) < 4:
        remaining = Product.objects.all().exclude(id__in=selected_ids)[:4 - len(popular_products)]
        popular_products.extend(list(remaining))

    cart_count = 0
    user_favorite_ids = set()
    if hasattr(request, "user") and request.user.is_authenticated:
        cart_count = CartItem.objects.filter(user=request.user).count()
        user_favorite_ids = set(Favorite.objects.filter(user=request.user).values_list("product_id", flat=True))

    return render(request, "shop/Home.html", {
        "categories": categories,
        "popular_products": popular_products,
        "cart_count": cart_count,
        "user_favorite_ids": user_favorite_ids,
    })


import json


def shop_product(request):
    categories = Category.objects.all()
    products = Product.objects.all().select_related("category")
    
    user_favorite_ids = set()
    cart_count = 0
    if hasattr(request, "user") and request.user.is_authenticated:
        cart_count = CartItem.objects.filter(user=request.user).count()
        user_favorite_ids = set(Favorite.objects.filter(user=request.user).values_list("product_id", flat=True))

    product_list = []
    for p in products:
        product_list.append({
            "id": p.id,
            "category": p.category.name if p.category else "Other",
            "name": p.name,
            "size": p.quantity_label,
            "price": float(p.price),
            "image": p.image.url if p.image else "",
            "is_fresh": p.is_fresh,
            "stock": p.stock,
            "is_active": p.is_active,
            "is_favorite": p.id in user_favorite_ids,
        })

    context = {
        "categories": categories,
        "products_json": json.dumps(product_list),
        "cart_count": cart_count,
    }
    return render(request, "shop/Shop Product.html", context)


from .models import Profile, Product, Category, Order, OrderItem, CartItem


@login_required(login_url="login")
def cart(request):
    cart_items = CartItem.objects.filter(user=request.user).select_related("product")
    
    subtotal = sum(item.product.price * item.quantity for item in cart_items)
    total_items = sum(item.quantity for item in cart_items)
    item_count = cart_items.count()
    packaging_charges = 10 if item_count > 0 else 0

    # Delivery: FREE above ₹200, else ₹50
    FREE_DELIVERY_THRESHOLD = 200
    DELIVERY_CHARGE = 50
    delivery_charges = 0 if subtotal > FREE_DELIVERY_THRESHOLD else (DELIVERY_CHARGE if item_count > 0 else 0)
    is_free_delivery = subtotal > FREE_DELIVERY_THRESHOLD

    total_price = subtotal + packaging_charges + delivery_charges

    progress_percent = min(100, int((subtotal / FREE_DELIVERY_THRESHOLD) * 100)) if FREE_DELIVERY_THRESHOLD else 100
    needed_for_free = max(0, FREE_DELIVERY_THRESHOLD - subtotal)

    context = {
        "cart_items": cart_items,
        "subtotal": subtotal,
        "total_items": total_items,
        "item_count": item_count,
        "packaging_charges": packaging_charges,
        "delivery_charges": delivery_charges,
        "is_free_delivery": is_free_delivery,
        "total_price": total_price,
        "progress_percent": progress_percent,
        "needed_for_free": needed_for_free,
    }
    return render(request, "shop/Cart.html", context)


@login_required(login_url="login")
@require_http_methods(["POST"])
def add_to_cart(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found."}, status=404)

    if not product.is_active:
        return JsonResponse({"error": "This product is currently unavailable."}, status=400)

    if product.stock <= 0:
        return JsonResponse({"error": "This product is out of stock."}, status=400)

    # Read quantity from JSON body (sent by frontend)
    qty = 1
    try:
        body = json.loads(request.body)
        qty = max(1, int(body.get("quantity", 1)))
    except Exception:
        qty = 1

    cart_item, created = CartItem.objects.get_or_create(
        user=request.user,
        product=product,
        defaults={"quantity": qty}
    )
    if not created:
        cart_item.quantity += qty
        cart_item.save()

    total_cart_count = CartItem.objects.filter(user=request.user).count()
    return JsonResponse({
        "success": True,
        "message": f"Added {product.name} to cart.",
        "total_cart_count": total_cart_count
    })


@login_required(login_url="login")
@require_http_methods(["POST"])
def update_cart_item(request, item_id):
    try:
        cart_item = CartItem.objects.get(id=item_id, user=request.user)
    except CartItem.DoesNotExist:
        return JsonResponse({"error": "Cart item not found."}, status=404)

    import json
    try:
        data = json.loads(request.body)
        action = data.get("action")
        qty = data.get("quantity")
    except Exception:
        action = request.POST.get("action")
        qty = request.POST.get("quantity")

    if qty is not None:
        cart_item.quantity = max(1, int(qty))
    elif action == "increase":
        cart_item.quantity += 1
    elif action == "decrease":
        cart_item.quantity = max(1, cart_item.quantity - 1)

    cart_item.save()
    item_total = cart_item.product.price * cart_item.quantity

    return JsonResponse({
        "success": True,
        "quantity": cart_item.quantity,
        "item_total": str(item_total)
    })


@login_required(login_url="login")
@require_http_methods(["POST"])
def remove_cart_item(request, item_id):
    try:
        cart_item = CartItem.objects.get(id=item_id, user=request.user)
        cart_item.delete()
        total_cart_count = CartItem.objects.filter(user=request.user).count()
        return JsonResponse({"success": True, "total_cart_count": total_cart_count})
    except CartItem.DoesNotExist:
        return JsonResponse({"error": "Item not found."}, status=404)


@login_required(login_url="login")
@require_http_methods(["POST"])
def clear_cart(request):
    CartItem.objects.filter(user=request.user).delete()
    return JsonResponse({"success": True})


from .models import Favorite


@login_required(login_url="login")
def favourite(request):
    favorites = Favorite.objects.filter(user=request.user).select_related("product").order_by("-created_at")
    cart_count = CartItem.objects.filter(user=request.user).count()
    context = {
        "favorites": favorites,
        "favorite_count": favorites.count(),
        "cart_count": cart_count,
    }
    return render(request, "shop/Favourite.html", context)


@login_required(login_url="login")
@require_http_methods(["POST"])
def toggle_favorite(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found."}, status=404)

    favorite = Favorite.objects.filter(user=request.user, product=product).first()
    if favorite:
        favorite.delete()
        is_favorite = False
    else:
        Favorite.objects.create(user=request.user, product=product)
        is_favorite = True

    total_favs = Favorite.objects.filter(user=request.user).count()
    return JsonResponse({
        "success": True,
        "is_favorite": is_favorite,
        "total_favorites": total_favs
    })


@login_required(login_url="login")
@require_http_methods(["POST"])
def remove_favorite(request, product_id):
    Favorite.objects.filter(user=request.user, product_id=product_id).delete()
    total_favs = Favorite.objects.filter(user=request.user).count()
    return JsonResponse({"success": True, "total_favorites": total_favs})


from django.contrib.auth.decorators import login_required


from .models import Review


@login_required(login_url="login")
def orders(request):
    user_orders = (
        Order.objects.filter(user=request.user)
        .prefetch_related("items__product")
        .order_by("-created_at")
    )
    user_profile, _ = Profile.objects.get_or_create(user=request.user)
    cart_count = CartItem.objects.filter(user=request.user).count()
    user_reviews = {
        r.product_id: r for r in Review.objects.filter(user=request.user) if r.product_id
    }
    for order in user_orders:
        for item in order.items.all():
            item.user_review = user_reviews.get(item.product_id)

    return render(request, "shop/Orders.html", {
        "orders": user_orders,
        "user_profile": user_profile,
        "cart_count": cart_count,
    })


@login_required(login_url="login")
@require_http_methods(["POST"])
def submit_review(request):
    product_id = request.POST.get("product_id")
    rating = request.POST.get("rating")
    comment = request.POST.get("comment", "").strip()

    if not product_id or not rating:
        return JsonResponse({"error": "Product and rating are required."}, status=400)

    try:
        rating_val = int(rating)
        if rating_val < 1 or rating_val > 5:
            return JsonResponse({"error": "Rating must be between 1 and 5."}, status=400)
    except ValueError:
        return JsonResponse({"error": "Invalid rating."}, status=400)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found."}, status=404)

    # Verify user has at least one delivered order containing this product
    has_delivered = OrderItem.objects.filter(
        order__user=request.user,
        order__status="delivered",
        product=product
    ).exists()

    if not has_delivered:
        return JsonResponse({"error": "You can only review products from delivered orders."}, status=403)

    review, created = Review.objects.update_or_create(
        user=request.user,
        product=product,
        defaults={"rating": rating_val, "comment": comment}
    )

    return JsonResponse({
        "success": True,
        "message": "Review submitted successfully!" if created else "Review updated successfully!",
        "rating": review.rating,
        "comment": review.comment,
        "created": created
    })



@login_required(login_url="login")
@require_http_methods(["POST"])
def reorder_order(request, order_id):
    """Add all active available items from an existing order into current cart."""
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found."}, status=404)

    added_items = 0
    unavailable_items = 0

    for item in order.items.all():
        if item.product and item.product.is_active and item.product.stock > 0:
            cart_item, created = CartItem.objects.get_or_create(
                user=request.user,
                product=item.product,
                defaults={"quantity": item.quantity}
            )
            if not created:
                cart_item.quantity += item.quantity
                cart_item.save()
            added_items += 1
        else:
            unavailable_items += 1

    total_cart_count = CartItem.objects.filter(user=request.user).count()

    if added_items == 0:
        return JsonResponse({
            "error": "The items in this order are currently out of stock or unavailable."
        }, status=400)

    msg = f"Added {added_items} item(s) from Order #{order.order_id} to your cart!"
    if unavailable_items > 0:
        msg += f" ({unavailable_items} item(s) were unavailable/out of stock)"

    return JsonResponse({
        "success": True,
        "message": msg,
        "total_cart_count": total_cart_count,
    })


@login_required(login_url="login")
@require_http_methods(["POST"])
def delete_order(request, order_id):
    """Allow customer to delete an order from their order history (except delivered orders)."""
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found."}, status=404)

    if order.status == "delivered":
        return JsonResponse({
            "error": "Delivered orders cannot be deleted from your history."
        }, status=400)

    order_num = order.order_id
    order.items.all().delete()
    order.delete()

    remaining_count = Order.objects.filter(user=request.user).count()
    return JsonResponse({
        "success": True,
        "message": f"Order #{order_num} has been deleted successfully.",
        "remaining_count": remaining_count,
    })


@login_required(login_url="login")
def profile(request):
    user = request.user
    user_profile, created = Profile.objects.get_or_create(user=user)
    
    orders_count = Order.objects.filter(user=user).count()
    favorites_count = Favorite.objects.filter(user=user).count()
    cart_count = CartItem.objects.filter(user=user).count()

    context = {
        "user_profile": user_profile,
        "orders_count": orders_count,
        "favorites_count": favorites_count,
        "cart_count": cart_count,
    }
    return render(request, "shop/Profile.html", context)


from django.contrib.auth import update_session_auth_hash

@login_required(login_url="login")
@require_http_methods(["POST"])
def update_profile(request):
    """Update user personal information and address."""
    user = request.user
    user_profile, _ = Profile.objects.get_or_create(user=user)

    first_name = request.POST.get("first_name", "").strip()
    last_name = request.POST.get("last_name", "").strip()
    email = request.POST.get("email", "").strip()
    phone = request.POST.get("phone", "").strip()
    address = request.POST.get("address")

    if first_name:
        user.first_name = first_name
    if last_name:
        user.last_name = last_name
    if email:
        user.email = email
    user.save()

    if phone:
        user_profile.phone = phone
    if address is not None:
        user_profile.address = address.strip()
    if "avatar" in request.FILES:
        user_profile.avatar = request.FILES["avatar"]
    user_profile.save()

    return JsonResponse({
        "success": True,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.get_full_name() or user.username,
        "email": user.email,
        "phone": user_profile.phone,
        "address": user_profile.address,
        "avatar_url": user_profile.avatar_url(),
    })


@login_required(login_url="login")
@require_http_methods(["POST"])
def upload_avatar(request):
    """Upload or update user profile avatar photo."""
    if "avatar" not in request.FILES:
        return JsonResponse({"error": "No image file provided."}, status=400)
    
    avatar_file = request.FILES["avatar"]
    user_profile, _ = Profile.objects.get_or_create(user=request.user)
    user_profile.avatar = avatar_file
    user_profile.save()

    return JsonResponse({
        "success": True,
        "avatar_url": user_profile.avatar_url(),
        "message": "Profile photo updated successfully!"
    })


@login_required(login_url="login")
@require_http_methods(["POST"])
def change_password(request):
    """Change user account password."""
    current_password = request.POST.get("current_password")
    new_password = request.POST.get("new_password")
    confirm_password = request.POST.get("confirm_password")

    if not request.user.check_password(current_password):
        return JsonResponse({"error": "Incorrect current password."}, status=400)

    if new_password != confirm_password:
        return JsonResponse({"error": "New passwords do not match."}, status=400)

    if len(new_password) < 8:
        return JsonResponse({"error": "Password must be at least 8 characters long."}, status=400)

    request.user.set_password(new_password)
    request.user.save()
    update_session_auth_hash(request, request.user)

    return JsonResponse({"success": True, "message": "Password updated successfully!"})


import uuid
from django.urls import reverse


@login_required(login_url="login")
def payment(request):
    cart_items = CartItem.objects.filter(user=request.user).select_related("product")
    
    subtotal = sum(item.product.price * item.quantity for item in cart_items)
    total_items = sum(item.quantity for item in cart_items)
    item_count = cart_items.count()
    packaging_charges = 10 if item_count > 0 else 0

    # Delivery: FREE above ₹200, else ₹50
    FREE_DELIVERY_THRESHOLD = 200
    DELIVERY_CHARGE = 50
    delivery_charges = 0 if subtotal > FREE_DELIVERY_THRESHOLD else (DELIVERY_CHARGE if item_count > 0 else 0)
    is_free_delivery = subtotal > FREE_DELIVERY_THRESHOLD

    total_price = subtotal + packaging_charges + delivery_charges

    context = {
        "cart_items": cart_items,
        "subtotal": subtotal,
        "total_items": total_items,
        "item_count": item_count,
        "packaging_charges": packaging_charges,
        "delivery_charges": delivery_charges,
        "is_free_delivery": is_free_delivery,
        "total_price": total_price,
        "needed_for_free": max(0, FREE_DELIVERY_THRESHOLD - subtotal),
    }
    return render(request, "shop/Payment.html", context)



@login_required(login_url="login")
@require_http_methods(["POST"])
def process_checkout(request):
    cart_items = CartItem.objects.filter(user=request.user).select_related("product")
    if not cart_items.exists():
        return JsonResponse({"error": "Your cart is empty."}, status=400)

    subtotal = sum(item.product.price * item.quantity for item in cart_items)
    packaging_charges = 10 if cart_items.exists() else 0

    # Delivery: FREE above ₹200, else ₹50
    FREE_DELIVERY_THRESHOLD = 200
    DELIVERY_CHARGE = 50
    delivery_charges = 0 if subtotal > FREE_DELIVERY_THRESHOLD else DELIVERY_CHARGE

    total_amount = subtotal + packaging_charges + delivery_charges

    import json
    try:
        data = json.loads(request.body)
    except Exception:
        data = request.POST

    method = data.get("method", "cod")

    # --- Server-side validation for payment details ---
    if method == "card":
        card_number = str(data.get("card_number", "")).replace(" ", "").strip()
        card_expiry = str(data.get("card_expiry", "")).strip()
        card_cvv = str(data.get("card_cvv", "")).strip()
        card_holder = str(data.get("card_holder", "")).strip()

        if not card_number or len(card_number) < 15 or not card_number.isdigit():
            return JsonResponse({"error": "Please enter a valid 16-digit card number."}, status=400)
        if not card_expiry or "/" not in card_expiry:
            return JsonResponse({"error": "Please enter a valid card expiry date (MM/YY)."}, status=400)
        if not card_cvv or len(card_cvv) < 3 or not card_cvv.isdigit():
            return JsonResponse({"error": "Please enter a valid 3 or 4-digit CVV."}, status=400)
        if not card_holder or len(card_holder) < 2:
            return JsonResponse({"error": "Please enter the cardholder's full name."}, status=400)

    elif method == "bank":
        bank_name = str(data.get("bank_name", "")).strip()
        bank_user_id = str(data.get("bank_user_id", "")).strip()

        if not bank_name:
            return JsonResponse({"error": "Please select your bank for Net Banking."}, status=400)
        if not bank_user_id or len(bank_user_id) < 3:
            return JsonResponse({"error": "Please enter your Net Banking User ID / Customer ID."}, status=400)

    elif method == "wallet":
        wallet_name = str(data.get("wallet_name", "")).strip()
        wallet_mobile = str(data.get("wallet_mobile", "")).strip()

        if not wallet_name:
            return JsonResponse({"error": "Please select a wallet."}, status=400)
        if not wallet_mobile or len(wallet_mobile) != 10 or not wallet_mobile.isdigit():
            return JsonResponse({"error": "Please enter a valid 10-digit mobile number for wallet payment."}, status=400)

    elif method == "upi":
        upi_id = str(data.get("upi_id", "")).strip()
        if upi_id and ("@" not in upi_id or len(upi_id) < 5):
            return JsonResponse({"error": "Please enter a valid UPI ID (e.g. name@okhdfcbank)."}, status=400)

    db_method = "online" if method in ["upi", "card", "bank", "wallet"] else "cod"

    order_id = "ORD" + str(uuid.uuid4().hex[:8]).upper()

    order = Order.objects.create(
        user=request.user,
        order_id=order_id,
        total_amount=total_amount,
        payment_method=db_method,
        status="pending"
    )

    order_items = []
    for item in cart_items:
        order_items.append(
            OrderItem(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )
        )
    OrderItem.objects.bulk_create(order_items)

    cart_items.delete()

    messages.success(request, f"Order #{order_id} placed successfully!")
    return JsonResponse({
        "success": True,
        "order_id": order_id,
        "redirect_url": reverse("orders")
    })


def contact(request):
    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        email = request.POST.get("email", "").strip()
        subject = request.POST.get("subject", "").strip()
        message_text = request.POST.get("message", "").strip()

        if name and email and subject and message_text:
            messages.success(request, "Thank you for reaching out! Your message has been received.")
            return redirect("contact")
        else:
            messages.error(request, "Please fill in all fields.")

    cart_count = 0
    if request.user.is_authenticated:
        cart_count = CartItem.objects.filter(user=request.user).count()

    return render(request, "shop/Contact.html", {"cart_count": cart_count})


# ============================================================
#  LOGIN
# ============================================================

@require_http_methods(["GET", "POST"])
def login_view(request):
    """
    Authenticate using email or mobile number + password.
    """
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        email_or_mobile = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")

        if not email_or_mobile or not password:
            messages.error(request, "Please fill in all fields.")
            return render(request, "shop/login.html")

        # --- Resolve the User object ---
        user_obj = None

        # 1. Try email lookup
        user_obj = User.objects.filter(email__iexact=email_or_mobile).first()

        # 2. Try username lookup
        if user_obj is None:
            user_obj = User.objects.filter(username__iexact=email_or_mobile).first()

        # 3. Try mobile lookup (stored on Profile.phone)
        if user_obj is None:
            profile = Profile.objects.filter(phone=email_or_mobile).first()
            if profile:
                user_obj = profile.user

        if user_obj is None:
            messages.error(
                request,
                "No account found with that email, username, or mobile number.",
            )
            return render(request, "shop/login.html")

        # --- Authenticate with the resolved username ---
        user = authenticate(
            request,
            username=user_obj.username,
            password=password,
        )

        if user is not None:
            login(request, user)
            messages.success(request, f"Welcome back, {user.first_name or user.username}!")

            # Redirect to 'next' param if present, else home
            next_url = request.GET.get("next") or request.POST.get("next") or "home"
            return redirect(next_url)
        else:
            messages.error(request, "Invalid password. Please try again.")
            return render(request, "shop/login.html")

    return render(request, "shop/login.html")


# ============================================================
#  REGISTER / SIGNUP
# ============================================================

@require_http_methods(["GET", "POST"])
def register_view(request):
    """
    Create a new user account with Profile (phone).
    Fields expected: full_name, mobile, email, password, confirm_password.
    """
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        full_name = request.POST.get("full_name", "").strip()
        mobile = request.POST.get("mobile", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        confirm_password = request.POST.get("confirm_password", "")

        # --- Basic validation ---
        if not all([full_name, mobile, email, password, confirm_password]):
            messages.error(request, "Please fill in all fields.")
            return render(request, "shop/Signup.html")

        if password != confirm_password:
            messages.error(request, "Passwords do not match.")
            return render(request, "shop/Signup.html")

        if len(password) < 8:
            messages.error(request, "Password must be at least 8 characters.")
            return render(request, "shop/Signup.html")

        if User.objects.filter(email__iexact=email).exists():
            messages.error(request, "An account with this email already exists.")
            return render(request, "shop/Signup.html")

        if Profile.objects.filter(phone=mobile).exists():
            messages.error(request, "An account with this mobile number already exists.")
            return render(request, "shop/Signup.html")

        # --- Create user ---
        # Use email as username (unique identifier)
        name_parts = full_name.split(maxsplit=1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        user = User.objects.create_user(
            username=email.lower(),
            email=email.lower(),
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        # --- Create profile with phone ---
        Profile.objects.create(user=user, phone=mobile)

        # --- Auto‑login after signup ---
        login(request, user)
        messages.success(
            request,
            f"Welcome to Khamkar Dairy, {first_name}! Your account has been created.",
        )
        return redirect("home")

    return render(request, "shop/Signup.html")


# ============================================================
#  LOGOUT
# ============================================================

def logout_view(request):
    logout(request)
    messages.success(request, "You have been logged out successfully.")
    return redirect("login")

from django.contrib.admin.views.decorators import staff_member_required


# ============================================================
#  ADMIN PANEL — Main Page
# ============================================================

@login_required(login_url="login")
def admin_panel(request):
    """Render the admin dashboard with real data from the database."""
    if not request.user.is_staff:
        messages.error(request, "Access denied. You do not have permission to view the Admin Panel.")
        return redirect("home")
    from django.db.models import Sum, Count
    from datetime import timedelta
    from django.utils import timezone

    now = timezone.now()
    month_ago = now - timedelta(days=30)

    # --- Stats ---
    total_orders = Order.objects.count()
    total_sales = Order.objects.aggregate(total=Sum("total_amount"))["total"] or 0
    total_customers = User.objects.count()
    total_products = Product.objects.count()

    # Previous month stats for percentage change
    prev_month_start = month_ago - timedelta(days=30)
    prev_orders = Order.objects.filter(created_at__gte=prev_month_start, created_at__lt=month_ago).count()
    prev_sales = Order.objects.filter(created_at__gte=prev_month_start, created_at__lt=month_ago).aggregate(total=Sum("total_amount"))["total"] or 0
    prev_customers = User.objects.filter(date_joined__lt=month_ago).count()

    def calc_change(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return round(((current - previous) / previous) * 100, 1)

    orders_change = calc_change(total_orders, prev_orders)
    sales_change = calc_change(float(total_sales), float(prev_sales))
    customers_change = calc_change(total_customers, prev_customers)

    # --- Products ---
    products = Product.objects.select_related("category").order_by("-created_at")

    # --- Recent Orders ---
    recent_orders = (
        Order.objects.select_related("user")
        .prefetch_related("items__product")
        .order_by("-created_at")[:10]
    )

    # --- All Orders ---
    all_orders = (
        Order.objects.select_related("user")
        .prefetch_related("items__product")
        .order_by("-created_at")
    )

    # --- Customers ---
    customers = (
        User.objects.select_related("profile")
        .annotate(
            order_count=Count("orders"),
            total_spent=Sum("orders__total_amount"),
        )
        .order_by("-date_joined")
    )

    # --- Categories ---
    categories = Category.objects.annotate(product_count=Count("products")).order_by("name")

    # --- Reviews ---
    reviews = Review.objects.select_related("user", "product").order_by("-created_at")

    # --- Reports Data & Date Filtering ---
    from django.db.models import F, Q
    from datetime import datetime

    start_date_str = request.GET.get("start_date", "").strip()
    end_date_str = request.GET.get("end_date", "").strip()
    date_preset = request.GET.get("date_preset", "all").strip()

    report_orders = Order.objects.all()
    today = timezone.now().date()

    if date_preset == "today":
        report_orders = report_orders.filter(created_at__date=today)
    elif date_preset == "yesterday":
        report_orders = report_orders.filter(created_at__date=today - timedelta(days=1))
    elif date_preset == "7days":
        report_orders = report_orders.filter(created_at__date__gte=today - timedelta(days=7))
    elif date_preset == "30days":
        report_orders = report_orders.filter(created_at__date__gte=today - timedelta(days=30))
    elif date_preset == "this_month":
        report_orders = report_orders.filter(created_at__year=today.year, created_at__month=today.month)
    elif date_preset == "custom" or (start_date_str and end_date_str):
        date_preset = "custom"
        if start_date_str:
            try:
                s_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                report_orders = report_orders.filter(created_at__date__gte=s_date)
            except ValueError:
                pass
        if end_date_str:
            try:
                e_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
                report_orders = report_orders.filter(created_at__date__lte=e_date)
            except ValueError:
                pass

    rep_total_orders = report_orders.count()
    rep_total_sales = report_orders.aggregate(total=Sum("total_amount"))["total"] or 0
    delivered_orders_count = report_orders.filter(status="delivered").count()
    pending_orders_count = report_orders.filter(status="pending").count()
    cancelled_orders_count = report_orders.filter(status="cancelled").count()
    cod_orders_count = report_orders.filter(payment_method="cod").count()
    online_orders_count = report_orders.filter(payment_method="online").count()
    avg_order_value = round(float(rep_total_sales) / rep_total_orders, 2) if rep_total_orders > 0 else 0

    top_selling_products = Product.objects.annotate(
        units_sold=Sum("orderitem__quantity", filter=Q(orderitem__order__in=report_orders)),
        revenue=Sum(F("orderitem__price") * F("orderitem__quantity"), filter=Q(orderitem__order__in=report_orders))
    ).filter(units_sold__gt=0).order_by("-units_sold")[:10]

    category_reports = Category.objects.annotate(
        units_sold=Sum("products__orderitem__quantity", filter=Q(products__orderitem__order__in=report_orders)),
        revenue=Sum(F("products__orderitem__price") * F("products__orderitem__quantity"), filter=Q(products__orderitem__order__in=report_orders))
    ).order_by("-revenue")

    # --- Coupons ---
    from .models import Coupon
    coupons = Coupon.objects.all().order_by("-created_at")

    admin_profile, _ = Profile.objects.get_or_create(user=request.user)

    context = {
        "admin_profile": admin_profile,
        "total_orders": total_orders,
        "total_sales": total_sales,
        "total_customers": total_customers,
        "total_products": total_products,
        "orders_change": orders_change,
        "sales_change": sales_change,
        "customers_change": customers_change,
        "products": products,
        "recent_orders": recent_orders,
        "all_orders": all_orders,
        "customers": customers,
        "categories": categories,
        "reviews": reviews,
        "coupons": coupons,
        "rep_total_orders": rep_total_orders,
        "rep_total_sales": rep_total_sales,
        "delivered_orders_count": delivered_orders_count,
        "pending_orders_count": pending_orders_count,
        "cancelled_orders_count": cancelled_orders_count,
        "cod_orders_count": cod_orders_count,
        "online_orders_count": online_orders_count,
        "avg_order_value": avg_order_value,
        "top_selling_products": top_selling_products,
        "category_reports": category_reports,
        "date_preset": date_preset,
        "start_date": start_date_str,
        "end_date": end_date_str,
        "store_settings": StoreSetting.get_settings(),
    }

    return render(request, "shop/admin.html", context)


# ============================================================
#  ADMIN API — Products
# ============================================================

@staff_member_required
@require_http_methods(["GET"])
def admin_api_products(request):
    """Return all products as JSON."""
    products = Product.objects.select_related("category").order_by("-created_at")
    data = []
    for p in products:
        data.append({
            "id": p.id,
            "name": p.name,
            "category": p.category.name if p.category else "",
            "price": str(p.price),
            "stock": p.stock,
            "is_active": p.is_active,
            "image": p.image.url if p.image else "",
            "quantity_label": p.quantity_label,
            "description": p.description,
        })
    return JsonResponse({"products": data})


@staff_member_required
@require_http_methods(["POST"])
def admin_api_product_add(request):
    """Create a new product."""
    name = request.POST.get("name", "").strip()
    category_name = request.POST.get("category", "").strip()
    price = request.POST.get("price", "0")
    stock = request.POST.get("stock", "0")
    status = request.POST.get("status", "Active")
    quantity_label = request.POST.get("quantity_label", "").strip()
    description = request.POST.get("description", "").strip()
    image = request.FILES.get("image")

    if not name or not category_name or not price:
        return JsonResponse({"error": "Name, category, and price are required."}, status=400)

    # Get or create category
    category, _ = Category.objects.get_or_create(name=category_name)

    is_active_val = status in ["Active", "Available"]

    product = Product.objects.create(
        name=name,
        category=category,
        price=price,
        stock=int(stock) if stock else 0,
        is_active=is_active_val,
        quantity_label=quantity_label or name,
        description=description,
    )

    if image:
        product.image = image
        product.save()

    return JsonResponse({
        "success": True,
        "product": {
            "id": product.id,
            "name": product.name,
            "category": category.name,
            "price": str(product.price),
            "stock": product.stock,
            "is_active": product.is_active,
            "image": product.image.url if product.image else "",
            "quantity_label": product.quantity_label,
        }
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_product_edit(request, product_id):
    """Update an existing product."""
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found."}, status=404)

    name = request.POST.get("name", "").strip()
    category_name = request.POST.get("category", "").strip()
    price = request.POST.get("price")
    stock = request.POST.get("stock")
    quantity_label = request.POST.get("quantity_label")
    description = request.POST.get("description", "").strip()
    image = request.FILES.get("image")

    if name:
        product.name = name
    if category_name:
        category, _ = Category.objects.get_or_create(name=category_name)
        product.category = category
    if price is not None and price != "":
        product.price = price
    if stock is not None and stock != "":
        product.stock = int(stock)
    if status is not None:
        product.is_active = status in ["Active", "Available"]
    if quantity_label is not None and quantity_label.strip() != "":
        product.quantity_label = quantity_label.strip()
    if description:
        product.description = description
    if image:
        product.image = image

    product.save()

    return JsonResponse({
        "success": True,
        "product": {
            "id": product.id,
            "name": product.name,
            "category": product.category.name if product.category else "",
            "price": str(product.price),
            "stock": product.stock,
            "is_active": product.is_active,
            "image": product.image.url if product.image else "",
            "quantity_label": product.quantity_label,
        }
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_product_toggle_availability(request, product_id):
    """Toggle product availability (is_active) between Available and Unavailable."""
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found."}, status=404)

    product.is_active = not product.is_active
    product.save()

    return JsonResponse({
        "success": True,
        "is_active": product.is_active,
        "status_text": "Available" if product.is_active else "Unavailable",
        "message": f"'{product.name}' is now {'Available' if product.is_active else 'Unavailable'}."
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_product_delete(request, product_id):
    """Delete a product."""
    try:
        product = Product.objects.get(id=product_id)
        # Clear related references to ensure clean deletion
        CartItem.objects.filter(product=product).delete()
        Favorite.objects.filter(product=product).delete()
        OrderItem.objects.filter(product=product).update(product=None)
        product.delete()
        return JsonResponse({"success": True, "message": "Product deleted successfully."})
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found."}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"Failed to delete product: {str(e)}"}, status=500)


# ============================================================
#  ADMIN API — Orders
# ============================================================

@staff_member_required
@require_http_methods(["GET"])
def admin_api_orders(request):
    """Return all orders as JSON."""
    orders = (
        Order.objects.select_related("user")
        .prefetch_related("items__product")
        .order_by("-created_at")
    )
    data = []
    for o in orders:
        items = []
        for item in o.items.all():
            items.append({
                "product_name": item.product.name if item.product else "Deleted",
                "quantity": item.quantity,
                "price": str(item.price),
            })
        data.append({
            "id": o.id,
            "order_id": o.order_id,
            "customer": o.user.get_full_name() or o.user.username,
            "email": o.user.email,
            "total_amount": str(o.total_amount),
            "status": o.status,
            "payment_method": o.get_payment_method_display(),
            "created_at": o.created_at.strftime("%d %b %Y, %I:%M %p"),
            "items": items,
        })
    return JsonResponse({"orders": data})


@staff_member_required
@require_http_methods(["POST"])
def admin_api_order_status(request, order_id):
    """Update order status."""
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found."}, status=404)

    import json
    try:
        body = json.loads(request.body)
        new_status = body.get("status", "").strip()
    except (json.JSONDecodeError, AttributeError):
        new_status = request.POST.get("status", "").strip()

    valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
    if new_status not in valid_statuses:
        return JsonResponse({"error": f"Invalid status. Must be one of: {valid_statuses}"}, status=400)

    order.status = new_status
    if new_status == "delivered":
        from django.utils import timezone
        order.delivered_at = timezone.now()
    order.save()

    return JsonResponse({"success": True, "status": order.status})


@staff_member_required
@require_http_methods(["POST"])
def admin_api_order_delete(request, order_id):
    """Delete an order."""
    try:
        order = Order.objects.get(id=order_id)
        order_num = order.order_id
        # Delete related OrderItem records
        order.items.all().delete()
        order.delete()
        return JsonResponse({"success": True, "message": f"Order #{order_num} deleted successfully."})
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found."}, status=404)
    except Exception as e:
        return JsonResponse({"error": f"Failed to delete order: {str(e)}"}, status=500)


# ============================================================
#  ADMIN API — Customers
# ============================================================

@staff_member_required
@require_http_methods(["GET"])
def admin_api_customers(request):
    """Return all registered accounts as JSON."""
    customers = (
        User.objects.all()
        .select_related("profile")
        .order_by("-date_joined")
    )
    data = []
    for c in customers:
        profile = getattr(c, "profile", None)
        order_count = Order.objects.filter(user=c).count()
        total_spent = Order.objects.filter(user=c).aggregate(total=Sum("total_amount"))["total"] or 0
        data.append({
            "id": c.id,
            "name": c.get_full_name() or c.username,
            "email": c.email,
            "phone": profile.phone if profile else "",
            "is_active": c.is_active,
            "is_staff": c.is_staff,
            "role": "Admin" if c.is_staff else "Customer",
            "date_joined": c.date_joined.strftime("%d %b %Y"),
            "order_count": order_count,
            "total_spent": str(total_spent),
        })
    return JsonResponse({"customers": data})


@staff_member_required
@require_http_methods(["POST"])
def admin_api_customer_edit(request, customer_id):
    """Edit customer details (name, email, phone, role)."""
    try:
        customer = User.objects.get(id=customer_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "Customer not found."}, status=404)

    try:
        import json
        try:
            body = json.loads(request.body)
            full_name = body.get("name", "").strip()
            email = body.get("email", "").strip()
            phone = body.get("phone", "").strip()
            role = body.get("role", "").strip()
        except (json.JSONDecodeError, AttributeError):
            full_name = request.POST.get("name", "").strip()
            email = request.POST.get("email", "").strip()
            phone = request.POST.get("phone", "").strip()
            role = request.POST.get("role", "").strip()

        if full_name:
            parts = full_name.split(maxsplit=1)
            customer.first_name = parts[0]
            customer.last_name = parts[1] if len(parts) > 1 else ""

        if email:
            customer.email = email

        if role in ["Admin", "Customer"]:
            customer.is_staff = (role == "Admin")

        customer.save()

        if phone:
            profile, _ = Profile.objects.get_or_create(user=customer)
            profile.phone = phone
            profile.save()

        phone_number = ""
        try:
            if hasattr(customer, "profile") and customer.profile:
                phone_number = customer.profile.phone or ""
        except Exception:
            phone_number = ""

        return JsonResponse({
            "success": True,
            "customer": {
                "id": customer.id,
                "name": customer.get_full_name() or customer.username,
                "email": customer.email,
                "phone": phone_number,
                "is_active": customer.is_active,
                "is_staff": customer.is_staff,
                "role": "Admin" if customer.is_staff else "Customer",
            }
        })
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@staff_member_required
@require_http_methods(["POST"])
def admin_api_customer_toggle_status(request, customer_id):
    """Activate or deactivate customer account."""
    try:
        customer = User.objects.get(id=customer_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "Customer not found."}, status=404)

    customer.is_active = not customer.is_active
    customer.save()

    return JsonResponse({
        "success": True,
        "is_active": customer.is_active,
        "message": f"Customer account has been {'activated' if customer.is_active else 'deactivated'}."
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_customer_toggle_role(request, customer_id):
    """Assign or revoke Admin privilege (toggle is_staff)."""
    try:
        customer = User.objects.get(id=customer_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

    customer.is_staff = not customer.is_staff
    customer.save()

    role_str = "Admin" if customer.is_staff else "Customer"
    return JsonResponse({
        "success": True,
        "is_staff": customer.is_staff,
        "role": role_str,
        "message": f"User '{customer.username}' privilege updated to {role_str}."
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_customer_delete(request, customer_id):
    """Delete a customer account."""
    try:
        customer = User.objects.get(id=customer_id)
        if customer.id == request.user.id:
            return JsonResponse({"error": "You cannot delete your own account."}, status=400)
        customer.delete()
        return JsonResponse({"success": True, "message": "Customer deleted successfully."})
    except User.DoesNotExist:
        return JsonResponse({"error": "Customer not found."}, status=404)


# ============================================================
#  ADMIN API — Categories
# ============================================================

@staff_member_required
@require_http_methods(["GET"])
def admin_api_categories(request):
    """Return all categories as JSON."""
    from django.db.models import Count
    categories = Category.objects.annotate(product_count=Count("products")).order_by("name")
    data = []
    for cat in categories:
        data.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "product_count": cat.product_count,
            "image": cat.image.url if cat.image else "",
        })
    return JsonResponse({"categories": data})


@staff_member_required
@require_http_methods(["POST"])
def admin_api_category_add(request):
    """Create a new category with optional image."""
    name = request.POST.get("name", "").strip()
    description = request.POST.get("description", "").strip()
    image = request.FILES.get("image")

    if not name:
        return JsonResponse({"error": "Category name is required."}, status=400)

    if Category.objects.filter(name__iexact=name).exists():
        return JsonResponse({"error": "Category already exists."}, status=400)

    category = Category.objects.create(name=name, description=description)
    if image:
        category.image = image
        category.save()

    return JsonResponse({
        "success": True,
        "category": {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "product_count": 0,
            "image": category.image.url if category.image else "",
        }
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_category_edit(request, category_id):
    """Edit a category's name, description, and optional image."""
    try:
        category = Category.objects.get(id=category_id)
    except Category.DoesNotExist:
        return JsonResponse({"error": "Category not found."}, status=404)

    name = request.POST.get("name", "").strip()
    description = request.POST.get("description", "").strip()
    image = request.FILES.get("image")

    if not name:
        return JsonResponse({"error": "Category name is required."}, status=400)

    if Category.objects.filter(name__iexact=name).exclude(id=category_id).exists():
        return JsonResponse({"error": "Another category with this name already exists."}, status=400)

    category.name = name
    category.description = description
    if image:
        category.image = image
    category.save()

    product_count = category.products.count()

    return JsonResponse({
        "success": True,
        "category": {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "product_count": product_count,
            "image": category.image.url if category.image else "",
        }
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_category_delete(request, category_id):
    """Delete a category."""
    try:
        category = Category.objects.get(id=category_id)
        if category.products.exists():
            return JsonResponse({
                "error": f"Cannot delete '{category.name}' — it has {category.products.count()} product(s). Move them first."
            }, status=400)
        category.delete()
        return JsonResponse({"success": True})
    except Category.DoesNotExist:
        return JsonResponse({"error": "Category not found."}, status=404)


# ============================================================
#  ADMIN API — Dashboard Stats
# ============================================================

@staff_member_required
@require_http_methods(["GET"])
def admin_api_dashboard(request):
    """Return live dashboard statistics as JSON."""
    from django.db.models import Sum
    from datetime import timedelta
    from django.utils import timezone

    now = timezone.now()
    last_7_days = [now - timedelta(days=i) for i in range(6, -1, -1)]

    # Orders per day for the chart
    daily_orders = []
    for day in last_7_days:
        count = Order.objects.filter(
            created_at__date=day.date()
        ).count()
        daily_orders.append({
            "date": day.strftime("%d %b"),
            "count": count,
        })

    # Low stock products
    low_stock = Product.objects.filter(stock__lte=10, is_active=True).count()

    return JsonResponse({
        "total_orders": Order.objects.count(),
        "total_sales": str(Order.objects.aggregate(total=Sum("total_amount"))["total"] or 0),
        "total_customers": User.objects.count(),
        "total_products": Product.objects.count(),
        "daily_orders": daily_orders,
        "low_stock_count": low_stock,
    })


# ============================================================
#  ADMIN API — Coupons
# ============================================================

@staff_member_required
@require_http_methods(["POST"])
def admin_api_coupon_add(request):
    code = request.POST.get("code", "").strip().upper()
    discount_type = request.POST.get("discount_type", "percentage")
    discount_value = request.POST.get("discount_value")
    min_order_amount = request.POST.get("min_order_amount", 0)
    valid_until = request.POST.get("valid_until")

    if not code or not discount_value:
        return JsonResponse({"error": "Coupon code and discount value are required."}, status=400)

    if Coupon.objects.filter(code=code).exists():
        return JsonResponse({"error": "A coupon with code '" + code + "' already exists."}, status=400)

    try:
        disc_val = float(discount_value)
        min_amt = float(min_order_amount) if min_order_amount else 0
    except ValueError:
        return JsonResponse({"error": "Invalid discount or minimum order value."}, status=400)

    coupon = Coupon.objects.create(
        code=code,
        discount_type=discount_type,
        discount_value=disc_val,
        min_order_amount=min_amt,
        valid_until=valid_until if valid_until else None,
        is_active=True,
    )

    return JsonResponse({
        "success": True,
        "coupon": {
            "id": coupon.id,
            "code": coupon.code,
            "discount_type": coupon.get_discount_type_display(),
            "discount_value": str(coupon.discount_value),
            "min_order_amount": str(coupon.min_order_amount),
            "valid_until": coupon.valid_until.strftime("%b %d, %Y") if coupon.valid_until else "Never",
            "is_active": coupon.is_active,
            "used_count": coupon.used_count,
        }
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_coupon_toggle_status(request, coupon_id):
    try:
        coupon = Coupon.objects.get(id=coupon_id)
        coupon.is_active = not coupon.is_active
        coupon.save()
        return JsonResponse({"success": True, "is_active": coupon.is_active})
    except Coupon.DoesNotExist:
        return JsonResponse({"error": "Coupon not found."}, status=404)


@staff_member_required
@require_http_methods(["POST"])
def admin_api_coupon_delete(request, coupon_id):
    try:
        coupon = Coupon.objects.get(id=coupon_id)
        coupon.delete()
        return JsonResponse({"success": True})
    except Coupon.DoesNotExist:
        return JsonResponse({"error": "Coupon not found."}, status=404)


# ============================================================
#  ADMIN API — Store Settings
# ============================================================

@staff_member_required
@require_http_methods(["POST"])
def admin_api_settings_update(request):
    settings = StoreSetting.get_settings()

    settings.store_name = request.POST.get("store_name", settings.store_name).strip()
    settings.contact_phone = request.POST.get("contact_phone", settings.contact_phone).strip()
    settings.contact_email = request.POST.get("contact_email", settings.contact_email).strip()
    settings.store_address = request.POST.get("store_address", settings.store_address).strip()
    settings.operating_hours = request.POST.get("operating_hours", settings.operating_hours).strip()

    try:
        free_del = request.POST.get("free_delivery_threshold")
        if free_del is not None and free_del != "":
            settings.free_delivery_threshold = float(free_del)
        std_del = request.POST.get("standard_delivery_charge")
        if std_del is not None and std_del != "":
            settings.standard_delivery_charge = float(std_del)
        pkg = request.POST.get("packaging_charge")
        if pkg is not None and pkg != "":
            settings.packaging_charge = float(pkg)
    except ValueError:
        return JsonResponse({"error": "Invalid numerical values for charges."}, status=400)

    settings.store_open = request.POST.get("store_open") in ["true", "1", "on", True]
    settings.enable_cod = request.POST.get("enable_cod") in ["true", "1", "on", True]
    settings.enable_online = request.POST.get("enable_online") in ["true", "1", "on", True]
    settings.show_announcement = request.POST.get("show_announcement") in ["true", "1", "on", True]
    settings.announcement_text = request.POST.get("announcement_text", "").strip()

    settings.save()

    return JsonResponse({
        "success": True,
        "message": "Store settings updated successfully!"
    })


