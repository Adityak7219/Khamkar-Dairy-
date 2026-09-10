from .models import CartItem, Profile


def cart_context(request):
    cart_count = 0
    user_profile = None
    if request.user.is_authenticated:
        # Count number of distinct products added to cart
        cart_count = CartItem.objects.filter(user=request.user).count()
        user_profile, _ = Profile.objects.get_or_create(user=request.user)
    return {
        "cart_count": cart_count,
        "user_profile": user_profile,
    }
