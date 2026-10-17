from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.db.models import Sum
from decimal import Decimal

from .models import (
    Profile, Product, Category, Order, OrderItem,
    CartItem, Favorite, Review, Coupon, StoreSetting,
    Wallet, WalletTransaction
)


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
    store = StoreSetting.get_settings()

    subtotal = sum(item.product.price * item.quantity for item in cart_items)
    total_items = sum(item.quantity for item in cart_items)
    item_count = cart_items.count()
    packaging_charges = store.packaging_charge if item_count > 0 else 0

    # Delivery: FREE above threshold from StoreSetting, else standard charge
    FREE_DELIVERY_THRESHOLD = store.free_delivery_threshold
    DELIVERY_CHARGE = store.standard_delivery_charge
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
        "free_delivery_threshold": FREE_DELIVERY_THRESHOLD,
        "standard_delivery_charge": DELIVERY_CHARGE,
    }
    return render(request, "shop/Cart.html", context)


@login_required(login_url="login")
@require_http_methods(["POST"])
def add_to_cart(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Product not found."}, status=404)

    store = StoreSetting.get_settings()
    if not store.store_open:
        return JsonResponse({"error": "Shop is currently closed and not accepting new orders."}, status=400)

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
def cancel_order(request, order_id):
    """Allow customer to cancel their pending order without deleting it from history."""
    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found."}, status=404)

    if order.status == "delivered":
        return JsonResponse({
            "error": "Delivered orders cannot be cancelled."
        }, status=400)

    if order.status == "cancelled":
        return JsonResponse({
            "error": "This order is already cancelled."
        }, status=400)

    order.status = "cancelled"
    order.save()

    return JsonResponse({
        "success": True,
        "message": f"Order #{order.order_id} has been cancelled successfully.",
        "order_id": order.order_id,
        "status": "cancelled",
    })


@login_required(login_url="login")
@require_http_methods(["POST"])
def delete_order(request, order_id):
    """Customer order deletion is disabled; orders can only be cancelled."""
    return JsonResponse({
        "error": "Orders cannot be deleted. You can cancel pending orders instead."
    }, status=400)


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
    lat = request.POST.get("latitude")
    lng = request.POST.get("longitude")
    if lat and lng:
        try:
            user_profile.latitude = float(lat)
            user_profile.longitude = float(lng)
        except (ValueError, TypeError):
            pass
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
        "latitude": float(user_profile.latitude) if user_profile.latitude else None,
        "longitude": float(user_profile.longitude) if user_profile.longitude else None,
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
    store = StoreSetting.get_settings()

    subtotal = sum(item.product.price * item.quantity for item in cart_items)
    total_items = sum(item.quantity for item in cart_items)
    item_count = cart_items.count()
    packaging_charges = store.packaging_charge if item_count > 0 else 0

    # Delivery: FREE above threshold from StoreSetting, else standard charge
    FREE_DELIVERY_THRESHOLD = store.free_delivery_threshold
    DELIVERY_CHARGE = store.standard_delivery_charge
    delivery_charges = 0 if subtotal > FREE_DELIVERY_THRESHOLD else (DELIVERY_CHARGE if item_count > 0 else 0)
    is_free_delivery = subtotal > FREE_DELIVERY_THRESHOLD

    total_price = subtotal + packaging_charges + delivery_charges

    user_wallet = Wallet.get_wallet(request.user)
    user_profile, _ = Profile.objects.get_or_create(user=request.user)

    context = {
        "cart_items": cart_items,
        "user_wallet": user_wallet,
        "user_profile": user_profile,
        "subtotal": subtotal,
        "total_items": total_items,
        "item_count": item_count,
        "packaging_charges": packaging_charges,
        "delivery_charges": delivery_charges,
        "is_free_delivery": is_free_delivery,
        "total_price": total_price,
        "needed_for_free": max(0, FREE_DELIVERY_THRESHOLD - subtotal),
        "free_delivery_threshold": FREE_DELIVERY_THRESHOLD,
        "standard_delivery_charge": DELIVERY_CHARGE,
    }
    return render(request, "shop/Payment.html", context)



@login_required(login_url="login")
@require_http_methods(["POST"])
def process_checkout(request):
    cart_items = CartItem.objects.filter(user=request.user).select_related("product")
    if not cart_items.exists():
        return JsonResponse({"error": "Your cart is empty."}, status=400)

    store = StoreSetting.get_settings()
    if not store.store_open:
        return JsonResponse({"error": "Shop is currently closed and not accepting new orders right now. Please try again later."}, status=400)

    subtotal = sum(item.product.price * item.quantity for item in cart_items)
    packaging_charges = store.packaging_charge if cart_items.exists() else 0

    # Delivery: FREE above threshold from StoreSetting, else standard charge
    FREE_DELIVERY_THRESHOLD = store.free_delivery_threshold
    DELIVERY_CHARGE = store.standard_delivery_charge
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

    order_id = "ORD" + str(uuid.uuid4().hex[:8]).upper()

    # Delivery slot & date parsing
    delivery_date_raw = data.get("delivery_date")
    delivery_slot = data.get("delivery_slot", "morning")
    if delivery_slot not in ["morning", "evening", "anytime"]:
        delivery_slot = "morning"

    delivery_date = None
    if delivery_date_raw:
        try:
            from datetime import datetime
            delivery_date = datetime.strptime(str(delivery_date_raw).strip(), "%Y-%m-%d").date()
        except Exception:
            delivery_date = None

    # Payment method processing
    if method == "wallet":
        wallet = Wallet.get_wallet(request.user)
        if wallet.balance < Decimal(str(total_amount)):
            needed = Decimal(str(total_amount)) - wallet.balance
            return JsonResponse({
                "error": f"Insufficient Dairy Wallet balance! Available: â‚¹{wallet.balance}. Needed: â‚¹{total_amount}. Please add at least â‚¹{needed} to your wallet or choose another payment method."
            }, status=400)

        # Deduct wallet funds
        wallet.deduct(Decimal(str(total_amount)), f"Payment for Order #{order_id}")
        db_method = "wallet"

    elif method == "upi":
        upi_id = str(data.get("upi_id", "")).strip()
        if upi_id and ("@" not in upi_id or len(upi_id) < 5):
            return JsonResponse({"error": "Please enter a valid UPI ID (e.g. name@okhdfcbank)."}, status=400)
        db_method = "online"

    elif method in ["card", "bank"]:
        db_method = "online"

    else:
        db_method = "cod"

    # Save delivery address if updated at checkout
    address = str(data.get("address", "")).strip()
    if address:
        try:
            profile = request.user.profile
            profile.address = address
            profile.save()
        except Exception:
            pass

    lat = data.get("latitude") or data.get("lat")
    lng = data.get("longitude") or data.get("lng")
    try:
        lat = float(lat) if lat is not None and str(lat).strip() != "" else None
        lng = float(lng) if lng is not None and str(lng).strip() != "" else None
    except (ValueError, TypeError):
        lat, lng = None, None

    # Auto fallback to user's saved profile GPS coordinates if not sent in request
    if (lat is None or lng is None) and hasattr(request.user, "profile"):
        if request.user.profile.latitude and request.user.profile.longitude:
            try:
                lat = float(request.user.profile.latitude)
                lng = float(request.user.profile.longitude)
            except (ValueError, TypeError):
                pass

    if lat and lng:
        try:
            profile = request.user.profile
            profile.latitude = lat
            profile.longitude = lng
            profile.save()
        except Exception:
            pass

    order = Order.objects.create(
        user=request.user,
        order_id=order_id,
        total_amount=total_amount,
        payment_method=db_method,
        status="pending",
        delivery_date=delivery_date,
        delivery_slot=delivery_slot,
        latitude=lat,
        longitude=lng,
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


@login_required(login_url="login")
def order_invoice(request, order_id):
    """Render printable order invoice / bill."""
    if request.user.is_staff:
        order = get_object_or_404(Order.objects.prefetch_related("items__product"), order_id=order_id)
    else:
        order = get_object_or_404(Order.objects.prefetch_related("items__product"), order_id=order_id, user=request.user)

    store = StoreSetting.get_settings()
    customer_profile, _ = Profile.objects.get_or_create(user=order.user)

    return render(request, "shop/Invoice.html", {
        "order": order,
        "store": store,
        "customer_profile": customer_profile,
    })


@csrf_exempt
@login_required(login_url="login")
@require_http_methods(["POST"])
def update_order_location(request, order_id):
    """
    Allow customer or delivery boy to update / pin live GPS coordinates for an order.
    Also syncs to customer's profile so future orders have it too.
    """
    try:
        if request.user.is_staff or getattr(getattr(request.user, 'profile', None), 'role', '') == 'delivery_boy':
            order = Order.objects.get(order_id=order_id)
        else:
            order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return JsonResponse({"error": "Order not found."}, status=404)

    import json
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        data = request.POST

    lat = data.get("latitude") or data.get("lat")
    lng = data.get("longitude") or data.get("lng")
    address = str(data.get("address", "")).strip()

    try:
        lat = float(lat) if lat is not None and str(lat).strip() != "" else None
        lng = float(lng) if lng is not None and str(lng).strip() != "" else None
    except (ValueError, TypeError):
        lat, lng = None, None

    if not lat or not lng:
        return JsonResponse({"error": "Invalid GPS coordinates."}, status=400)

    order.latitude = lat
    order.longitude = lng
    order.save()

    # Also update profile
    if hasattr(order.user, "profile"):
        prof = order.user.profile
        prof.latitude = lat
        prof.longitude = lng
        if address:
            prof.address = address
        prof.save()

    return JsonResponse({
        "success": True,
        "message": "Live location updated and shared with delivery partner successfully!",
        "latitude": float(lat),
        "longitude": float(lng),
        "maps_url": order.maps_navigation_url
    })


@login_required(login_url="login")
def wallet_view(request):
    """User digital wallet page with balance, quick top-up, and passbook history."""
    wallet = Wallet.get_wallet(request.user)
    transactions = wallet.transactions.all()[:50]
    total_credited = wallet.transactions.filter(transaction_type="credit").aggregate(Sum("amount"))["amount__sum"] or 0
    total_spent = wallet.transactions.filter(transaction_type="debit").aggregate(Sum("amount"))["amount__sum"] or 0

    return render(request, "shop/Wallet.html", {
        "wallet": wallet,
        "transactions": transactions,
        "total_credited": total_credited,
        "total_spent": total_spent,
    })


@login_required(login_url="login")
@require_http_methods(["POST"])
def wallet_add_funds(request):
    """Top-up money into user's dairy wallet."""
    import json
    try:
        data = json.loads(request.body)
        amount_raw = data.get("amount", 0)
    except Exception:
        amount_raw = request.POST.get("amount", 0)

    try:
        amount = Decimal(str(amount_raw))
    except Exception:
        return JsonResponse({"error": "Invalid amount provided."}, status=400)

    if amount < Decimal("10"):
        return JsonResponse({"error": "Minimum top-up amount is â‚¹10."}, status=400)
    if amount > Decimal("50000"):
        return JsonResponse({"error": "Maximum top-up amount is â‚¹50,000."}, status=400)

    source = data.get("source", "PhonePe UPI") if isinstance(data, dict) else "PhonePe UPI"
    wallet = Wallet.get_wallet(request.user)
    new_bal = wallet.deposit(amount, description=f"Wallet Top-up ({source})")

    return JsonResponse({
        "success": True,
        "message": f"â‚¹{amount:.2f} successfully added via {source} to your Dairy Wallet!",
        "new_balance": str(new_bal),
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

            next_url = request.GET.get("next") or request.POST.get("next")
            if not next_url:
                prof = getattr(user, "profile", None)
                if user.is_staff or (prof and prof.role == "admin"):
                    next_url = "admin_panel"
                elif prof and prof.role == "delivery_boy":
                    next_url = "delivery_dashboard"
                else:
                    next_url = "home"
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

        # --- Autoâ€‘login after signup ---
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
#  ADMIN PANEL â€” Main Page
# ============================================================

@login_required(login_url="login")
def admin_panel(request):
    """Render the admin dashboard with real data from the database."""
    profile = getattr(request.user, "profile", None)
    is_admin = request.user.is_staff or (profile and profile.role == "admin")
    if not is_admin:
        messages.error(request, "Access denied. Only Store Admins can access the Admin Panel.")
        if profile and profile.role == "delivery_boy":
            return redirect("delivery_dashboard")
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

    # --- Delivery Boys ---
    delivery_boys = (
        User.objects.filter(profile__role="delivery_boy")
        .select_related("profile")
        .annotate(
            orders_delivered=Count("orders", filter=Q(orders__status="delivered")),
            total_orders_handled=Count("orders")
        )
        .order_by("-date_joined")
    )

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
        "delivery_boys": delivery_boys,
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
#  ADMIN API â€” Products
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
#  ADMIN API â€” Orders
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
#  ADMIN API â€” Customers
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
        role_str = "Admin" if c.is_staff else (profile.role_display if profile else "Customer")
        data.append({
            "id": c.id,
            "name": c.get_full_name() or c.username,
            "email": c.email,
            "phone": profile.phone if profile else "",
            "is_active": c.is_active,
            "is_staff": c.is_staff,
            "role": role_str,
            "raw_role": profile.role if profile else ("admin" if c.is_staff else "customer"),
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

        profile, _ = Profile.objects.get_or_create(user=customer)
        if role:
            role_clean = role.lower().replace(" ", "_")
            if role_clean in ["admin", "store_admin"]:
                customer.is_staff = True
                profile.role = "admin"
            elif role_clean in ["delivery_boy", "delivery"]:
                customer.is_staff = False
                profile.role = "delivery_boy"
            else:
                customer.is_staff = False
                profile.role = "customer"

        customer.save()

        if phone:
            profile.phone = phone
        profile.save()

        return JsonResponse({
            "success": True,
            "customer": {
                "id": customer.id,
                "name": customer.get_full_name() or customer.username,
                "email": customer.email,
                "phone": profile.phone,
                "is_active": customer.is_active,
                "is_staff": customer.is_staff,
                "role": profile.role_display,
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
        "message": f"Account has been {'activated' if customer.is_active else 'deactivated'}."
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_customer_toggle_role(request, customer_id):
    """Cycle user role (Customer -> Delivery Boy -> Admin -> Customer)."""
    try:
        customer = User.objects.get(id=customer_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

    profile, _ = Profile.objects.get_or_create(user=customer)
    
    if customer.is_staff:
        customer.is_staff = False
        profile.role = "customer"
    elif profile.role == "delivery_boy":
        customer.is_staff = True
        profile.role = "admin"
    else:
        customer.is_staff = False
        profile.role = "delivery_boy"

    customer.save()
    profile.save()

    role_str = profile.role_display
    return JsonResponse({
        "success": True,
        "is_staff": customer.is_staff,
        "role": role_str,
        "message": f"User '{customer.username}' role updated to {role_str}."
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
#  ADMIN API â€” Categories
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
                "error": f"Cannot delete '{category.name}' â€” it has {category.products.count()} product(s). Move them first."
            }, status=400)
        category.delete()
        return JsonResponse({"success": True})
    except Category.DoesNotExist:
        return JsonResponse({"error": "Category not found."}, status=404)


# ============================================================
#  ADMIN API â€” Dashboard Stats
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
#  ADMIN API â€” Coupons
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
#  ADMIN API â€” Store Settings
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


# ============================================================
#  DELIVERY PARTNER (DELIVERY BOY) PORTAL VIEWS
# ============================================================

from django.utils import timezone

@login_required(login_url="login")
def delivery_dashboard(request):
    """
    Premium Desktop Delivery Boy Dashboard.
    Displays KPI stats, filterable orders table, map widget, quick actions,
    and today's collection breakdown.
    """
    profile = getattr(request.user, "profile", None)
    is_delivery = (profile and profile.role == "delivery_boy")
    is_admin = request.user.is_staff or (profile and profile.role == "admin")

    if not (is_delivery or is_admin):
        messages.error(request, "Access denied. Only Delivery Partners and Store Admins can access the Delivery App.")
        return redirect("home")

    selected_slot = request.GET.get("slot", "all")
    selected_status = request.GET.get("status", "all")
    search_query = request.GET.get("q", "").strip()

    today = timezone.now().date()
    from django.db.models import Q

    # Isolation: Delivery boys only see their own taken orders in My Orders.
    # Unassigned orders appear only on Dashboard until taken!
    if not is_admin:
        visible_orders = Order.objects.filter(delivery_boy=request.user)
    else:
        visible_orders = Order.objects.all()

    orders_qs = visible_orders.select_related("user", "user__profile", "delivery_boy").prefetch_related("items", "items__product").order_by("-created_at")

    # Filter by slot if specified
    if selected_slot in ["morning", "evening", "anytime"]:
        orders_qs = orders_qs.filter(delivery_slot=selected_slot)

    # Filter by status if specified (server-side for URL-based filtering)
    if selected_status == "pending":
        orders_qs = orders_qs.filter(status__in=["pending", "confirmed"])
    elif selected_status == "out":
        orders_qs = orders_qs.filter(status="out_for_delivery")
    elif selected_status == "delivered":
        orders_qs = orders_qs.filter(status="delivered")
    elif selected_status == "cancelled":
        orders_qs = orders_qs.filter(status="cancelled")

    # Search filter
    if search_query:
        from django.db import models as db_models
        orders_qs = orders_qs.filter(
            db_models.Q(order_id__icontains=search_query) |
            db_models.Q(user__username__icontains=search_query) |
            db_models.Q(user__first_name__icontains=search_query) |
            db_models.Q(user__last_name__icontains=search_query) |
            db_models.Q(user__profile__phone__icontains=search_query)
        )

    # Summary Statistics & Active Orders
    if not is_admin:
        my_delivered = visible_orders.filter(status="delivered")
        my_out = visible_orders.filter(status="out_for_delivery")
        my_cancelled = visible_orders.filter(status="cancelled")
        available_pending = Order.objects.filter(delivery_boy__isnull=True, status__in=["pending", "confirmed"])

        delivered_count = my_delivered.count()
        out_count = my_out.count()
        cancelled_count = my_cancelled.count()
        total_count = visible_orders.count()
        pending_count = available_pending.count()

        delivered_cod_total = my_delivered.filter(payment_method="cod").aggregate(total=Sum("total_amount"))["total"] or 0
        delivered_upi_total = my_delivered.filter(payment_method__in=["online", "wallet"]).aggregate(total=Sum("total_amount"))["total"] or 0
        delivered_collection_total = delivered_cod_total + delivered_upi_total

        cash_collected = delivered_cod_total
        upi_collected = delivered_upi_total
        total_collection = delivered_collection_total

        # Dashboard priority orders & Route stops: include delivery boy's active deliveries plus available pending
        active_orders = (
            (my_out | available_pending)
            .select_related("user", "user__profile", "delivery_boy")
            .prefetch_related("items", "items__product")
            .order_by("status", "-created_at")[:30]
        )
        delivered_orders = (
            my_delivered.select_related("user", "user__profile", "delivery_boy")
            .prefetch_related("items", "items__product")
            .order_by("-delivered_at", "-created_at")[:15]
        )
    else:
        all_orders = Order.objects.all()
        total_count = all_orders.exclude(status="cancelled").count()
        pending_count = all_orders.filter(status__in=["pending", "confirmed"]).count()
        out_count = all_orders.filter(status="out_for_delivery").count()
        delivered_count = all_orders.filter(status="delivered").count()
        cancelled_count = all_orders.filter(status="cancelled").count()

        cod_orders = all_orders.filter(payment_method="cod").exclude(status="cancelled")
        online_orders = all_orders.filter(payment_method__in=["online", "wallet"]).exclude(status="cancelled")

        cash_collected = cod_orders.aggregate(total=Sum("total_amount"))["total"] or 0
        upi_collected = online_orders.aggregate(total=Sum("total_amount"))["total"] or 0
        total_collection = cash_collected + upi_collected

        delivered_cod_total = all_orders.filter(status="delivered", payment_method="cod").aggregate(total=Sum("total_amount"))["total"] or 0
        delivered_upi_total = all_orders.filter(status="delivered", payment_method__in=["online", "wallet"]).aggregate(total=Sum("total_amount"))["total"] or 0
        delivered_collection_total = delivered_cod_total + delivered_upi_total

        active_orders = (
            Order.objects.filter(status__in=["pending", "confirmed", "out_for_delivery"])
            .select_related("user", "user__profile", "delivery_boy")
            .prefetch_related("items", "items__product")
            .order_by("status", "-created_at")[:30]
        )
        delivered_orders = (
            Order.objects.filter(status="delivered")
            .select_related("user", "user__profile", "delivery_boy")
            .prefetch_related("items", "items__product")
            .order_by("-delivered_at", "-created_at")[:15]
        )

    # Delivery Boy Incentive / Payout
    incentive_rate = 25
    earned_today = delivered_count * incentive_rate
    base_pay = 350
    total_payout = base_pay + earned_today

    # Estimated distance (approx 2.5km per delivery)
    total_distance = round(delivered_count * 2.5, 1)

    # Delivery boy profile
    delivery_profile = None
    delivery_boy_name = "Delivery Partner"
    if request.user.is_authenticated:
        delivery_profile, _ = Profile.objects.get_or_create(user=request.user)
        delivery_boy_name = request.user.get_full_name() or request.user.username

    # Formatted date
    try:
        today_date_formatted = today.strftime("%A, %d %B %Y")
    except Exception:
        today_date_formatted = today.strftime("%d %b %Y")

    # Slot counts
    morning_count = visible_orders.filter(delivery_slot="morning").exclude(status="cancelled").count()
    evening_count = visible_orders.filter(delivery_slot="evening").exclude(status="cancelled").count()

    context = {
        "orders": orders_qs[:100],
        "active_orders": active_orders,
        "delivered_orders": delivered_orders,
        "selected_slot": selected_slot,
        "selected_status": selected_status,
        "search_query": search_query,
        "total_count": total_count,
        "pending_count": pending_count,
        "out_count": out_count,
        "delivered_count": delivered_count,
        "cancelled_count": cancelled_count,
        "morning_count": morning_count,
        "evening_count": evening_count,
        "cash_collected": cash_collected,
        "upi_collected": upi_collected,
        "total_collection": total_collection,
        "delivered_cod_total": delivered_cod_total,
        "delivered_upi_total": delivered_upi_total,
        "delivered_collection_total": delivered_collection_total,
        "incentive_rate": incentive_rate,
        "earned_today": earned_today,
        "base_pay": base_pay,
        "total_payout": total_payout,
        "total_distance": total_distance,
        "cash_to_collect": cash_collected,
        "today_date": today.strftime("%b %d, %Y"),
        "today_date_formatted": today_date_formatted,
        "today_date_iso": today.strftime("%Y-%m-%d"),
        "delivery_boy_name": delivery_boy_name,
        "delivery_profile": delivery_profile,
    }
    return render(request, "shop/Delivery.html", context)


from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@login_required
@require_http_methods(["POST"])
def delivery_update_status(request, order_id):
    """
    Delivery boy updates status of an order (out_for_delivery, delivered, cancelled).
    """
    try:
        order = Order.objects.get(order_id=order_id)
    except Order.DoesNotExist:
        return JsonResponse({"error": f"Order #{order_id} not found."}, status=404)

    # Permission check: must be assigned to this delivery boy, unassigned, or staff
    if order.delivery_boy and order.delivery_boy != request.user and not request.user.is_staff:
        return JsonResponse({"error": "You cannot change status of an order assigned to another delivery partner."}, status=403)

    import json
    new_status = ""
    try:
        data = json.loads(request.body)
        new_status = data.get("status", "").strip()
    except Exception:
        new_status = request.POST.get("status", "").strip()

    valid_statuses = ["out_for_delivery", "delivered", "cancelled"]
    if new_status not in valid_statuses:
        return JsonResponse({"error": f"Invalid status: '{new_status}'"}, status=400)

    order.status = new_status
    if not order.delivery_boy:
        order.delivery_boy = request.user

    if new_status == "delivered":
        order.delivered_at = timezone.now()
    elif new_status in ["out_for_delivery", "cancelled"]:
        order.delivered_at = None

    order.save()

    return JsonResponse({
        "success": True,
        "message": f"Order #{order.order_id} status updated to '{order.get_status_display()}'.",
        "order_id": order.order_id,
        "status": order.status,
        "status_display": order.get_status_display(),
        "delivered_at": order.delivered_at.strftime("%I:%M %p") if order.delivered_at else "",
    })


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def delivery_take_order(request, order_id):
    """
    Delivery boy accepts / takes an incoming order from Priority Deliveries on the Dashboard.
    Assigns the order to request.user and sets status to 'out_for_delivery'.
    Once taken, it will NOT show on the dashboard, and will show in My Orders!
    """
    try:
        order = Order.objects.get(order_id=order_id)
        if order.status == "delivered":
            return JsonResponse({"error": "Order has already been delivered."}, status=400)
        if order.status == "cancelled":
            return JsonResponse({"error": "Order has been cancelled."}, status=400)

        # Check if already taken by another delivery boy
        if order.delivery_boy and order.delivery_boy != request.user:
            other_name = order.delivery_boy.get_full_name() or order.delivery_boy.username
            return JsonResponse({"error": f"This order is already taken by {other_name}."}, status=400)

        order.delivery_boy = request.user
        order.status = "out_for_delivery"
        order.save()

        items_summary = ", ".join([f"{item.quantity} {item.item_label}" for item in order.items.all()[:3]]) or "1 Order Pack"
        items_data = [{"name": item.item_name, "qty": item.quantity, "total": str(item.total_price)} for item in order.items.all()]

        return JsonResponse({
            "success": True,
            "message": f"Order #{order.order_id} taken successfully! Moved to My Orders.",
            "order_id": order.order_id,
            "status": "out_for_delivery",
            "status_display": "Out for Delivery",
            "delivery_boy_name": request.user.get_full_name() or request.user.username,
            "order": {
                "order_id": order.order_id,
                "customer_name": order.customer_name,
                "customer_phone": order.customer_phone,
                "customer_address": order.customer_address,
                "total_amount": str(order.total_amount),
                "is_prepaid": order.is_prepaid,
                "payment_display": order.get_payment_method_display(),
                "status": order.status,
                "status_display": "Out for Delivery",
                "delivery_slot": order.delivery_slot,
                "slot_display": order.get_delivery_slot_display(),
                "created_time": order.created_at.strftime("%I:%M %p") if order.created_at else "",
                "maps_navigation_url": order.maps_navigation_url,
                "items_summary": items_summary,
                "items": items_data,
            }
        })
    except Order.DoesNotExist:
        return JsonResponse({"error": f"Order #{order_id} not found."}, status=404)


@csrf_exempt
@login_required
@require_http_methods(["POST"])
def delivery_complete_order(request, order_id):
    """
    Delivery boy marks their accepted order as delivered once handed to customer.
    """
    try:
        order = Order.objects.get(order_id=order_id)
        if order.status == "delivered":
            return JsonResponse({"error": "Order is already marked as delivered."}, status=400)
        if order.status == "cancelled":
            return JsonResponse({"error": "Order has been cancelled."}, status=400)

        if order.delivery_boy and order.delivery_boy != request.user and not request.user.is_staff:
            return JsonResponse({"error": "You cannot complete an order assigned to another delivery partner."}, status=403)

        order.delivery_boy = request.user
        order.status = "delivered"
        order.delivered_at = timezone.now()
        order.save()

        return JsonResponse({
            "success": True,
            "message": f"Order #{order.order_id} marked as Delivered! Great job.",
            "order_id": order.order_id,
            "status": "delivered",
            "status_display": "Delivered",
            "delivered_at": order.delivered_at.strftime("%I:%M %p"),
        })
    except Order.DoesNotExist:
        return JsonResponse({"error": f"Order #{order_id} not found."}, status=404)


@login_required
@require_http_methods(["GET"])
def delivery_api_priority_orders(request):
    """
    Live polling endpoint for Priority Deliveries on the Dashboard.
    Returns ONLY unassigned pending orders (not taken by anyone).
    Orders taken by a delivery boy will NEVER show on the dashboard.
    """
    profile = getattr(request.user, "profile", None)
    is_admin = request.user.is_staff or (profile and profile.role == "admin")

    orders = (
        Order.objects.filter(delivery_boy__isnull=True, status__in=["pending", "confirmed"])
        .select_related("user", "user__profile")
        .prefetch_related("items", "items__product")
        .order_by("-created_at")[:25]
    )

    data = []
    for o in orders:
        items_summary = ", ".join([f"{item.quantity} {item.item_label}" for item in o.items.all()[:3]]) or "1 Order Pack"
        data.append({
            "order_id": o.order_id,
            "customer_name": o.customer_name,
            "customer_phone": o.customer_phone,
            "customer_address": o.customer_address,
            "total_amount": str(o.total_amount),
            "is_prepaid": o.is_prepaid,
            "status": o.status,
            "status_display": o.get_status_display(),
            "delivery_slot": o.delivery_slot,
            "slot_display": o.get_delivery_slot_display(),
            "maps_navigation_url": o.maps_navigation_url,
            "has_live_location": o.has_live_location,
            "latitude": float(o.effective_latitude) if o.effective_latitude else None,
            "longitude": float(o.effective_longitude) if o.effective_longitude else None,
            "can_take": True,
            "items_summary": items_summary,
            "created_time": o.created_at.strftime("%I:%M %p") if o.created_at else "",
        })

    return JsonResponse({
        "success": True,
        "orders": data,
        "pending_count": orders.count(),
    })


import csv
from datetime import datetime, date, timedelta
from django.http import HttpResponse

@login_required(login_url="login")
def delivery_run_sheet(request):
    """
    Day-wise Delivery Run Sheet view for Delivery Boys and Admins.
    Generates structured run sheets by date and shift, with vehicle crate loading summary,
    customer route stops table, print styling, and CSV/Excel export.
    """
    profile = getattr(request.user, "profile", None)
    is_delivery = (profile and profile.role == "delivery_boy")
    is_admin = request.user.is_staff or (profile and profile.role == "admin")

    if not (is_delivery or is_admin):
        messages.error(request, "Access denied. Only Delivery Partners and Admins can view Delivery Run Sheets.")
        return redirect("home")

    # Date handling (default to today)
    date_str = request.GET.get("date", "").strip()
    today_dt = timezone.now().date()
    target_date = today_dt
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            target_date = today_dt

    selected_slot = request.GET.get("slot", "all").strip().lower()
    selected_status = request.GET.get("status", "all").strip().lower()
    selected_boy_id = request.GET.get("boy_id", "").strip()

    from django.db.models import Q
    day_filter = Q(delivery_date=target_date) | Q(delivery_date__isnull=True, created_at__date=target_date)
    orders_qs = Order.objects.filter(day_filter)

    delivery_boys_list = []
    current_boy_name = request.user.get_full_name() or request.user.username
    current_boy_phone = profile.phone if profile else ""

    if not is_admin:
        # Delivery boy sees their assigned orders for that date. If none assigned, show unassigned on that date.
        assigned_orders = orders_qs.filter(delivery_boy=request.user)
        if assigned_orders.exists():
            orders_qs = assigned_orders
        else:
            orders_qs = orders_qs.filter(Q(delivery_boy=request.user) | Q(delivery_boy__isnull=True))
    else:
        delivery_boys_list = User.objects.filter(profile__role="delivery_boy").select_related("profile")
        if selected_boy_id:
            if selected_boy_id == "unassigned":
                orders_qs = orders_qs.filter(delivery_boy__isnull=True)
                current_boy_name = "Unassigned Orders"
                current_boy_phone = "-"
            else:
                orders_qs = orders_qs.filter(delivery_boy_id=selected_boy_id)
                boy_obj = delivery_boys_list.filter(id=selected_boy_id).first()
                if boy_obj:
                    current_boy_name = boy_obj.get_full_name() or boy_obj.username
                    current_boy_phone = boy_obj.profile.phone if hasattr(boy_obj, 'profile') else ""

    # Slot filter
    if selected_slot in ["morning", "evening", "anytime"]:
        orders_qs = orders_qs.filter(delivery_slot=selected_slot)

    # Status filter
    if selected_status == "pending":
        orders_qs = orders_qs.filter(status__in=["pending", "confirmed"])
    elif selected_status == "out":
        orders_qs = orders_qs.filter(status="out_for_delivery")
    elif selected_status == "delivered":
        orders_qs = orders_qs.filter(status="delivered")
    elif selected_status == "active":
        orders_qs = orders_qs.exclude(status__in=["delivered", "cancelled"])

    orders_qs = (
        orders_qs.exclude(status="cancelled")
        .select_related("user", "user__profile", "delivery_boy")
        .prefetch_related("items", "items__product")
        .order_by("delivery_slot", "created_at")
    )

    orders_list = list(orders_qs)

    # Crate loading / product quantity summary
    product_summary = {}
    total_cod_amount = Decimal("0.00")
    total_prepaid_amount = Decimal("0.00")
    total_value = Decimal("0.00")
    cod_orders_count = 0
    prepaid_orders_count = 0
    delivered_count = 0
    pending_count = 0

    for order in orders_list:
        total_value += order.total_amount
        if order.is_prepaid:
            total_prepaid_amount += order.total_amount
            prepaid_orders_count += 1
        else:
            total_cod_amount += order.total_amount
            cod_orders_count += 1

        if order.status == "delivered":
            delivered_count += 1
        else:
            pending_count += 1

        for item in order.items.all():
            p_name = item.product.name if item.product else "Other Product"
            p_unit = item.product.quantity_label if (item.product and item.product.quantity_label) else "Units"
            key = f"{p_name} ({p_unit})" if p_unit and p_unit not in p_name else p_name
            if key not in product_summary:
                product_summary[key] = {
                    "name": p_name,
                    "unit": p_unit,
                    "label": key,
                    "total_qty": 0,
                    "order_count": 0
                }
            product_summary[key]["total_qty"] += item.quantity
            product_summary[key]["order_count"] += 1

    sorted_product_summary = sorted(product_summary.values(), key=lambda x: x["total_qty"], reverse=True)

    # CSV Export format
    if request.GET.get("export") == "csv":
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        filename = f"run_sheet_{target_date.strftime('%Y%m%d')}_{selected_slot}.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response.write('\ufeff')  # UTF-8 BOM for Excel compatibility on Windows
        writer = csv.writer(response)

        # Header Info
        writer.writerow(["KHAMKAR DAIRY & PRODUCTS - DAILY DELIVERY RUN SHEET"])
        writer.writerow([f"Date: {target_date.strftime('%d-%b-%Y (%A)')}", f"Shift: {selected_slot.upper()}", f"Delivery Partner: {current_boy_name}", f"Phone: {current_boy_phone}"])
        writer.writerow([f"Total Orders: {len(orders_list)}", f"COD Cash To Collect: Rs. {total_cod_amount}", f"Prepaid Orders: {prepaid_orders_count} (Rs. {total_prepaid_amount})", f"Total Value: Rs. {total_value}"])
        writer.writerow([])

        # Product Loading Summary
        writer.writerow(["--- CRATE / VEHICLE LOADING SUMMARY ---"])
        writer.writerow(["Sr No.", "Product / Item", "Unit", "Total Packets / Qty Needed", "Customer Stops Count"])
        for i, p in enumerate(sorted_product_summary, 1):
            writer.writerow([i, p["name"], p["unit"], p["total_qty"], p["order_count"]])
        writer.writerow([])

        # Stop-by-stop orders
        writer.writerow(["--- DELIVERY STOPS & CUSTOMER LIST ---"])
        writer.writerow(["Stop #", "Order ID", "Customer Name", "Phone", "Full Delivery Address", "Slot / Shift", "Items & Quantities", "Payment Mode", "Cash to Collect (Rs)", "Current Status", "Customer Signature / Notes"])
        for idx, o in enumerate(orders_list, 1):
            items_str = "; ".join([f"{it.quantity}x {it.item_name}" for it in o.items.all()])
            cod_collect = f"Rs. {o.total_amount}" if not o.is_prepaid else "0.00 (PREPAID)"
            writer.writerow([
                idx,
                f"#{o.order_id}",
                o.customer_name,
                o.customer_phone,
                o.customer_address,
                o.get_delivery_slot_display(),
                items_str,
                "PREPAID" if o.is_prepaid else "CASH ON DELIVERY",
                cod_collect,
                o.get_status_display(),
                ""
            ])
        return response

    # Dates for quick selector
    prev_date = (target_date - timedelta(days=1)).strftime("%Y-%m-%d")
    next_date = (target_date + timedelta(days=1)).strftime("%Y-%m-%d")
    yesterday_date = (today_dt - timedelta(days=1)).strftime("%Y-%m-%d")
    today_date = today_dt.strftime("%Y-%m-%d")
    tomorrow_date = (today_dt + timedelta(days=1)).strftime("%Y-%m-%d")

    context = {
        "orders": orders_list,
        "product_summary": sorted_product_summary,
        "target_date": target_date,
        "target_date_iso": target_date.strftime("%Y-%m-%d"),
        "target_date_formatted": target_date.strftime("%A, %d %B %Y"),
        "selected_slot": selected_slot,
        "selected_status": selected_status,
        "selected_boy_id": selected_boy_id,
        "delivery_boys_list": delivery_boys_list,
        "current_boy_name": current_boy_name,
        "current_boy_phone": current_boy_phone,
        "is_admin": is_admin,
        "total_orders": len(orders_list),
        "total_value": total_value,
        "total_cod_amount": total_cod_amount,
        "total_prepaid_amount": total_prepaid_amount,
        "cod_orders_count": cod_orders_count,
        "prepaid_orders_count": prepaid_orders_count,
        "delivered_count": delivered_count,
        "pending_count": pending_count,
        "prev_date": prev_date,
        "next_date": next_date,
        "yesterday_date": yesterday_date,
        "today_date": today_date,
        "tomorrow_date": tomorrow_date,
        "generated_time": timezone.now().strftime("%d %b %Y, %I:%M %p"),
    }
    return render(request, "shop/delivery_run_sheet.html", context)



#  ADMIN API â€” Delivery Boys Management
# ============================================================

@staff_member_required
@require_http_methods(["GET"])
def admin_api_delivery_boys(request):
    """Return all delivery boy accounts as JSON."""
    from django.db.models import Count, Q
    boys = (
        User.objects.filter(profile__role="delivery_boy")
        .select_related("profile")
        .annotate(
            orders_delivered=Count("orders", filter=Q(orders__status="delivered")),
            total_orders_handled=Count("orders")
        )
        .order_by("-date_joined")
    )
    data = []
    for b in boys:
        profile = getattr(b, "profile", None)
        data.append({
            "id": b.id,
            "username": b.username,
            "name": b.get_full_name() or b.username,
            "email": b.email,
            "phone": profile.phone if profile else "",
            "address": profile.address if profile else "",
            "is_active": b.is_active,
            "orders_delivered": b.orders_delivered,
            "date_joined": b.date_joined.strftime("%d %b %Y"),
        })
    return JsonResponse({"delivery_boys": data})


@staff_member_required
@require_http_methods(["POST"])
def admin_api_delivery_boy_add(request):
    """Create a new delivery boy account."""
    import json
    try:
        data = json.loads(request.body)
    except Exception:
        data = request.POST

    username = data.get("username", "").strip()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    address = data.get("address", "").strip()
    password = data.get("password", "").strip()
    is_active = data.get("is_active", True)
    if isinstance(is_active, str):
        is_active = is_active.lower() in ["true", "1", "on"]

    if not username:
        return JsonResponse({"error": "Username is required."}, status=400)
    if not password:
        return JsonResponse({"error": "Password is required for new delivery boy."}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": f"Username '{username}' already exists."}, status=400)

    first_name = name
    last_name = ""
    if name:
        parts = name.split(maxsplit=1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        is_active=is_active
    )

    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = "delivery_boy"
    profile.phone = phone
    profile.address = address
    profile.save()

    return JsonResponse({
        "success": True,
        "message": f"Delivery boy '{user.username}' created successfully!",
        "delivery_boy": {
            "id": user.id,
            "username": user.username,
            "name": user.get_full_name() or user.username,
            "email": user.email,
            "phone": profile.phone,
            "address": profile.address,
            "is_active": user.is_active,
            "orders_delivered": 0,
            "date_joined": user.date_joined.strftime("%d %b %Y"),
        }
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_delivery_boy_edit(request, boy_id):
    """Edit delivery boy account details."""
    try:
        boy = User.objects.get(id=boy_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "Delivery boy not found."}, status=404)

    import json
    try:
        data = json.loads(request.body)
    except Exception:
        data = request.POST

    name = data.get("name", "").strip()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    phone = data.get("phone", "").strip()
    address = data.get("address", "").strip()
    password = data.get("password", "").strip()
    is_active = data.get("is_active")

    if username and username != boy.username:
        if User.objects.filter(username=username).exclude(id=boy.id).exists():
            return JsonResponse({"error": f"Username '{username}' is already taken."}, status=400)
        boy.username = username

    if name:
        parts = name.split(maxsplit=1)
        boy.first_name = parts[0]
        boy.last_name = parts[1] if len(parts) > 1 else ""

    if email is not None:
        boy.email = email

    if password:
        boy.set_password(password)

    if is_active is not None:
        if isinstance(is_active, str):
            boy.is_active = is_active.lower() in ["true", "1", "on"]
        else:
            boy.is_active = bool(is_active)

    boy.save()

    profile, _ = Profile.objects.get_or_create(user=boy)
    profile.role = "delivery_boy"
    if phone is not None:
        profile.phone = phone
    if address is not None:
        profile.address = address
    profile.save()

    return JsonResponse({
        "success": True,
        "message": "Delivery boy details updated successfully!",
        "delivery_boy": {
            "id": boy.id,
            "username": boy.username,
            "name": boy.get_full_name() or boy.username,
            "email": boy.email,
            "phone": profile.phone,
            "address": profile.address,
            "is_active": boy.is_active,
        }
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_delivery_boy_toggle_status(request, boy_id):
    """Toggle delivery boy active status (activate/deactivate)."""
    try:
        boy = User.objects.get(id=boy_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "Delivery boy not found."}, status=404)

    boy.is_active = not boy.is_active
    boy.save()

    return JsonResponse({
        "success": True,
        "is_active": boy.is_active,
        "message": f"Delivery boy '{boy.username}' has been {'activated' if boy.is_active else 'deactivated'}."
    })


@staff_member_required
@require_http_methods(["POST"])
def admin_api_delivery_boy_delete(request, boy_id):
    """Delete a delivery boy account."""
    try:
        boy = User.objects.get(id=boy_id)
        if boy.id == request.user.id:
            return JsonResponse({"error": "You cannot delete your own account."}, status=400)

        username = boy.username
        boy.delete()
        return JsonResponse({"success": True, "message": f"Delivery boy '{username}' deleted successfully."})
    except User.DoesNotExist:
        return JsonResponse({"error": "Delivery boy not found."}, status=404)


# ============================================================
#  ADMIN API â€” Delivery Boy Sales Report
# ============================================================

@staff_member_required
@require_http_methods(["GET"])
def admin_api_delivery_boy_sales(request, boy_id):
    """Return all delivered orders (with item breakdown) for a single delivery boy."""
    try:
        boy = User.objects.select_related('profile').get(id=boy_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "Delivery boy not found."}, status=404)

    orders = (
        Order.objects
        .filter(delivery_boy=boy, status="delivered")
        .prefetch_related("items", "items__product")
        .order_by("-delivered_at", "-created_at")
    )

    # If no orders are assigned via FK (new field — older orders won't have it),
    # fall back to ALL delivered orders in the system so admin can always see data
    if not orders.exists():
        orders = (
            Order.objects
            .filter(status="delivered")
            .prefetch_related("items", "items__product")
            .order_by("-delivered_at", "-created_at")
        )

    # Per-product aggregation
    product_map = {}
    order_list = []
    grand_total = 0

    for order in orders:
        grand_total += float(order.total_amount)
        items_data = []
        for item in order.items.all():
            name = item.product.name if item.product else "Deleted Product"
            price = float(item.price)
            qty = item.quantity
            line = round(price * qty, 2)
            items_data.append({"name": name, "qty": qty, "price": price, "total": line})
            if name not in product_map:
                product_map[name] = {"name": name, "qty": 0, "revenue": 0.0}
            product_map[name]["qty"] += qty
            product_map[name]["revenue"] = round(product_map[name]["revenue"] + line, 2)

        order_list.append({
            "order_id": order.order_id,
            "customer": order.customer_name,
            "total": float(order.total_amount),
            "payment": order.get_payment_method_display(),
            "delivered_at": order.delivered_at.strftime("%d %b %Y, %I:%M %p") if order.delivered_at else "-",
            "items": items_data,
        })

    return JsonResponse({
        "boy": {
            "id": boy.id,
            "name": boy.get_full_name() or boy.username,
            "username": boy.username,
            "phone": boy.profile.phone if hasattr(boy, 'profile') else "",
        },
        "summary": {
            "total_orders": len(order_list),
            "grand_total": round(grand_total, 2),
            "products": sorted(product_map.values(), key=lambda x: x["revenue"], reverse=True),
        },
        "orders": order_list,
    })

