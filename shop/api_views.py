from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Category, Product, Favorite, CartItem, Order, Profile
from .api_serializers import (
    CategorySerializer,
    ProductSerializer,
    FavoriteSerializer,
    CartItemSerializer,
    OrderSerializer,
    ProfileSerializer,
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related("category")
    serializer_class = ProductSerializer

class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Favorite.objects.none()
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return CartItem.objects.none()
        return CartItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Order.objects.none()
        return Order.objects.filter(user=self.request.user).prefetch_related("items")

@api_view(["GET"])
def health(request):
    return Response({"status": "ok", "message": "Dairy backend is running"})

@api_view(["GET"])
def profile(request):
    if not request.user.is_authenticated:
        return Response({"detail": "Login required"}, status=status.HTTP_401_UNAUTHORIZED)

    obj, _ = Profile.objects.get_or_create(user=request.user)
    return Response(ProfileSerializer(obj).data)
