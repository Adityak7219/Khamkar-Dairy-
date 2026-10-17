from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("splash/", views.splash, name="splash"),
    path("shop/", views.shop_product, name="shop_product"),
    path("cart/", views.cart, name="cart"),
    path("cart/add/<int:product_id>/", views.add_to_cart, name="add_to_cart"),
    path("cart/update/<int:item_id>/", views.update_cart_item, name="update_cart_item"),
    path("cart/remove/<int:item_id>/", views.remove_cart_item, name="remove_cart_item"),
    path("cart/clear/", views.clear_cart, name="clear_cart"),
    path("favourite/", views.favourite, name="favourite"),
    path("favourite/toggle/<int:product_id>/", views.toggle_favorite, name="toggle_favorite"),
    path("favourite/remove/<int:product_id>/", views.remove_favorite, name="remove_favorite"),
    path("orders/", views.orders, name="orders"),
    path("orders/reorder/<str:order_id>/", views.reorder_order, name="reorder_order"),
    path("orders/cancel/<str:order_id>/", views.cancel_order, name="cancel_order"),
    path("orders/delete/<str:order_id>/", views.delete_order, name="delete_order"),
    path("orders/<str:order_id>/invoice/", views.order_invoice, name="order_invoice"),
    path("orders/update-location/<str:order_id>/", views.update_order_location, name="update_order_location"),
    path("wallet/", views.wallet_view, name="wallet"),
    path("wallet/add/", views.wallet_add_funds, name="wallet_add_funds"),
    path("api/review/submit/", views.submit_review, name="submit_review"),
    path("profile/", views.profile, name="profile"),
    path("profile/update/", views.update_profile, name="update_profile"),
    path("profile/avatar/", views.upload_avatar, name="upload_avatar"),
    path("profile/change-password/", views.change_password, name="change_password"),
    path("payment/", views.payment, name="payment"),
    path("payment/process/", views.process_checkout, name="process_checkout"),
    path("contact/", views.contact, name="contact"),
    path("login/", views.login_view, name="login"),
    path("register/", views.register_view, name="register"),
    path("logout/", views.logout_view, name="logout"),
    path("admin-panel/", views.admin_panel, name="admin_panel"),
    path("admin/", views.admin_panel, name="admin_alias"),

    # ---- Delivery Partner Portal ----
    path("delivery/", views.delivery_dashboard, name="delivery_dashboard"),
    path("delivery/update-status/<str:order_id>/", views.delivery_update_status, name="delivery_update_status"),
    path("delivery/take-order/<str:order_id>/", views.delivery_take_order, name="delivery_take_order"),
    path("delivery/complete-order/<str:order_id>/", views.delivery_complete_order, name="delivery_complete_order"),
    path("delivery/api/priority-orders/", views.delivery_api_priority_orders, name="delivery_api_priority_orders"),
    path("delivery/run-sheet/", views.delivery_run_sheet, name="delivery_run_sheet"),

    # ---- Admin API endpoints ----
    path("admin/api/dashboard/", views.admin_api_dashboard, name="admin_api_dashboard"),

    # Products
    path("admin/api/products/", views.admin_api_products, name="admin_api_products"),
    path("admin/api/products/add/", views.admin_api_product_add, name="admin_api_product_add"),
    path("admin/api/products/<int:product_id>/edit/", views.admin_api_product_edit, name="admin_api_product_edit"),
    path("admin/api/products/<int:product_id>/toggle-availability/", views.admin_api_product_toggle_availability, name="admin_api_product_toggle_availability"),
    path("admin/api/products/<int:product_id>/delete/", views.admin_api_product_delete, name="admin_api_product_delete"),

    # Orders
    path("admin/api/orders/", views.admin_api_orders, name="admin_api_orders"),
    path("admin/api/orders/<int:order_id>/status/", views.admin_api_order_status, name="admin_api_order_status"),
    path("admin/api/orders/<int:order_id>/delete/", views.admin_api_order_delete, name="admin_api_order_delete"),

    # Customers
    path("admin/api/customers/", views.admin_api_customers, name="admin_api_customers"),
    path("admin/api/customers/<int:customer_id>/edit/", views.admin_api_customer_edit, name="admin_api_customer_edit"),
    path("admin/api/customers/<int:customer_id>/toggle-status/", views.admin_api_customer_toggle_status, name="admin_api_customer_toggle_status"),
    path("admin/api/customers/<int:customer_id>/toggle-role/", views.admin_api_customer_toggle_role, name="admin_api_customer_toggle_role"),
    path("admin/api/customers/<int:customer_id>/delete/", views.admin_api_customer_delete, name="admin_api_customer_delete"),

    # Categories
    path("admin/api/categories/", views.admin_api_categories, name="admin_api_categories"),
    path("admin/api/categories/add/", views.admin_api_category_add, name="admin_api_category_add"),
    path("admin/api/categories/<int:category_id>/edit/", views.admin_api_category_edit, name="admin_api_category_edit"),
    path("admin/api/categories/<int:category_id>/delete/", views.admin_api_category_delete, name="admin_api_category_delete"),

    # Coupons
    path("admin/api/coupons/add/", views.admin_api_coupon_add, name="admin_api_coupon_add"),
    path("admin/api/coupons/<int:coupon_id>/toggle-status/", views.admin_api_coupon_toggle_status, name="admin_api_coupon_toggle_status"),
    path("admin/api/coupons/<int:coupon_id>/delete/", views.admin_api_coupon_delete, name="admin_api_coupon_delete"),

    # Delivery Boys Admin API
    path("admin/api/delivery-boys/", views.admin_api_delivery_boys, name="admin_api_delivery_boys"),
    path("admin/api/delivery-boys/add/", views.admin_api_delivery_boy_add, name="admin_api_delivery_boy_add"),
    path("admin/api/delivery-boys/<int:boy_id>/edit/", views.admin_api_delivery_boy_edit, name="admin_api_delivery_boy_edit"),
    path("admin/api/delivery-boys/<int:boy_id>/toggle-status/", views.admin_api_delivery_boy_toggle_status, name="admin_api_delivery_boy_toggle_status"),
    path("admin/api/delivery-boys/<int:boy_id>/delete/", views.admin_api_delivery_boy_delete, name="admin_api_delivery_boy_delete"),
    path("admin/api/delivery-boys/<int:boy_id>/sales/", views.admin_api_delivery_boy_sales, name="admin_api_delivery_boy_sales"),

    # Settings
    path("admin/api/settings/update/", views.admin_api_settings_update, name="admin_api_settings_update"),
]
