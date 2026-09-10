function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');


/* =====================================================
   QUANTITY
===================================================== */

function changeQty(button, change) {

    const item = button.closest(".cart-item");
    const itemId = item ? item.dataset.id : null;

    const quantityElement =
        item.querySelector(".qty-number");

    let quantity =
        parseInt(quantityElement.textContent);

    quantity += change;

    if (quantity < 1) {
        quantity = 1;
    }

    quantityElement.textContent = quantity;

    updateItemTotal(item);

    updateCartTotal();

    if (itemId) {
        fetch(`/cart/update/${itemId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ quantity: quantity })
        });
    }
}


/* =====================================================
   ITEM TOTAL
===================================================== */

function updateItemTotal(item) {

    const price =
        parseFloat(item.dataset.price);

    const quantity =
        parseInt(
            item.querySelector(".qty-number").textContent
        );

    const total =
        price * quantity;

    item.querySelector(".item-total")
        .textContent = "₹" + total;

}


/* =====================================================
   CART TOTAL
===================================================== */

function updateCartTotal() {

    const items =
        document.querySelectorAll(".cart-item");

    let subtotal = 0;
    let totalQuantity = 0;

    items.forEach(item => {

        const price =
            parseFloat(item.dataset.price);

        const quantity =
            parseInt(
                item.querySelector(".qty-number").textContent
            );

        subtotal += price * quantity;

        totalQuantity += quantity;

    });

    const packaging = items.length > 0 ? 10 : 0;
    const totalToPay = subtotal + packaging;

    document.getElementById("subtotal")
        .textContent = "₹" + subtotal;

    document.getElementById("totalPrice")
        .textContent = "₹" + totalToPay;

    document.getElementById("summaryItems")
        .textContent = totalQuantity;

    document.getElementById("itemCount")
        .textContent = items.length;

    document.querySelectorAll('.cart-count, #bottomCartCount, #cartBadge, .badge').forEach(b => {
        if (items.length > 0) {
            b.textContent = items.length;
            b.style.display = 'flex';
        } else {
            b.textContent = '';
            b.style.display = 'none';
        }
    });

}


/* =====================================================
   REMOVE ITEM
===================================================== */

function removeItem(button) {

    const item =
        button.closest(".cart-item");
    const itemId = item ? item.dataset.id : null;

    item.remove();

    updateCartTotal();

    checkEmptyCart();

    if (itemId) {
        fetch(`/cart/remove/${itemId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            }
        });
    }

}


/* =====================================================
   CLEAR CART
===================================================== */

function clearCart() {

    const items =
        document.querySelectorAll(".cart-item");

    items.forEach(item => item.remove());

    updateCartTotal();

    checkEmptyCart();

    fetch('/cart/clear/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        }
    });

}


/* =====================================================
   EMPTY CART
===================================================== */

function checkEmptyCart() {

    const items =
        document.querySelectorAll(".cart-item");

    const emptyCart =
        document.getElementById("emptyCart");

    if (items.length === 0) {

        emptyCart.style.display = "block";

    } else {

        emptyCart.style.display = "none";

    }

}


/* =====================================================
   CHECKOUT
===================================================== */

function checkout() {

    const items =
        document.querySelectorAll(".cart-item");

    if (items.length === 0) {

        alert("Your cart is empty.");

        return;

    }

    window.location.href = "/payment/";
}


/* =====================================================
   NAVIGATION
===================================================== */

function goBack() {
    history.back();
}


function goHome() {
    window.location.href = "/";
}


function goOrders() {
    window.location.href = "/orders/";
}


function goFavorites() {
    window.location.href = "/favourite/";
}


function goProfile() {
    window.location.href = "/profile/";
}


function continueShopping() {
    window.location.href = "/shop/";
}


/* =====================================================
   INITIAL
===================================================== */

updateCartTotal();
