let currentTab = "all";


/* =====================================================
   GET PRODUCTS
===================================================== */

function getProducts() {

    return document.querySelectorAll(".product-card");

}


/* =====================================================
   SHOW FAVORITES
===================================================== */

function showFavorites(type, selectedTab) {

    currentTab = type;

    /* Remove active from all tabs */

    document.querySelectorAll(".tab").forEach(function(tab) {

        tab.classList.remove("active");

    });


    /* Add active to clicked tab */

    selectedTab.classList.add("active");


    /* Apply filter */

    applyFilters();

}


/* =====================================================
   SEARCH + TAB FILTER
===================================================== */

function applyFilters() {

    const searchInput =
        document.getElementById("searchInput");

    const search =
        searchInput.value.trim().toLowerCase();


    const products =
        getProducts();


    let visibleCount = 0;


    products.forEach(function(product) {

        const productName =
            product.dataset.name.toLowerCase();

        const productType =
            product.dataset.type;


        const matchesSearch =
            productName.includes(search);


        let matchesTab = false;


        if (currentTab === "all") {

            matchesTab = true;

        }
        else {

            matchesTab =
                productType === currentTab;

        }


        if (matchesSearch && matchesTab) {

            product.style.display = "";

            visibleCount++;

        }
        else {

            product.style.display = "none";

        }

    });


    /* Empty message */

    const emptyMessage =
        document.getElementById("emptyMessage");


    if (visibleCount === 0) {

        emptyMessage.style.display = "block";

    }
    else {

        emptyMessage.style.display = "none";

    }

}


/* =====================================================
   SEARCH
===================================================== */

document
    .getElementById("searchInput")
    .addEventListener("input", function() {

        applyFilters();

    });


/* =====================================================
   QUANTITY
===================================================== */

function changeQty(button, change) {

    const quantityBox =
        button.parentElement;

    const number =
        quantityBox.querySelector("span");


    let quantity =
        parseInt(number.innerText);


    quantity += change;


    if (quantity < 1) {

        quantity = 1;

    }


    number.innerText =
        quantity;

}


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
   ADD TO CART
===================================================== */

function addCart(button, productId) {
    if (!productId) return;

    fetch(`/cart/add/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data && data.total_cart_count !== undefined) {
            document.querySelectorAll('.cart-count, #bottomCartCount, #cartBadge, .badge').forEach(b => {
                if (data.total_cart_count > 0) {
                    b.textContent = data.total_cart_count;
                    b.style.display = 'flex';
                } else {
                    b.textContent = '';
                    b.style.display = 'none';
                }
            });
        }
    });
}


/* =====================================================
   REMOVE FAVORITE
===================================================== */

function removeFavorite(button, productId) {

    const card =
        button.closest(".product-card");

    if (card) {
        card.remove();
    }

    updateCounts();

    applyFilters();

    if (productId) {
        fetch(`/favourite/remove/${productId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            }
        });
    }

}


/* =====================================================
   UPDATE TAB COUNTS
===================================================== */

function updateCounts() {

    const products =
        getProducts();


    let all = 0;
    let frequent = 0;
    let recent = 0;


    products.forEach(function(product) {

        all++;


        if (
            product.dataset.type ===
            "frequent"
        ) {

            frequent++;

        }


        if (
            product.dataset.type ===
            "recent"
        ) {

            recent++;

        }

    });


    document
        .getElementById("allCount")
        .innerText = all;


    document
        .getElementById("frequentCount")
        .innerText = frequent;


    document
        .getElementById("recentCount")
        .innerText = recent;

}


/* =====================================================
   FILTER BUTTON
===================================================== */

function showFilterMessage() {

    alert(
        "Filter options can be added here."
    );

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


function openOrders() {
    window.location.href = "/orders/";
}

function openCart() {
    window.location.href = "/cart/";
}

function openProfile() {
    window.location.href = "/profile/";
}


/* =====================================================
   INITIAL LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateCounts();

        applyFilters();

    }
);
