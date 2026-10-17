from .models import CartItem, Profile, StoreSetting, Wallet


def cart_context(request):
    cart_count = 0
    user_profile = None
    user_wallet = None
    if request.user.is_authenticated:
        # Count number of distinct products added to cart
        cart_count = CartItem.objects.filter(user=request.user).count()
        user_profile, _ = Profile.objects.get_or_create(user=request.user)
        user_wallet = Wallet.get_wallet(request.user)

    store_settings = StoreSetting.get_settings()

    return {
        "cart_count": cart_count,
        "user_profile": user_profile,
        "user_wallet": user_wallet,
        "store_settings": store_settings,
    }

