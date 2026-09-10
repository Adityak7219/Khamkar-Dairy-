from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .api_views import (
    CategoryViewSet,
    ProductViewSet,
    FavoriteViewSet,
    CartItemViewSet,
    OrderViewSet,
    profile,
    health,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")
router.register("favorites", FavoriteViewSet, basename="favorite")
router.register("cart", CartItemViewSet, basename="cart")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("health/", health),
    path("profile/", profile),
    path("", include(router.urls)),
]
