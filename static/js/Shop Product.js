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
   PRODUCT DATA
===================================================== */

const products = window.DB_PRODUCTS || [

    {
        id: 1,
        category: "Curd",
        name: "Regular Curd",
        size: "500 g",
        price: 40,
        emoji: "🥣"

    },

    {
        id: 2,
        category: "Curd",
        name: "Premium Curd",
        size: "500 g",
        price: 50,
        emoji: "🥣"
    },

    {
        id: 3,
        category: "Curd",
        name: "Dahi (Matka)",
        size: "1 Kg",
        price: 70,
        emoji: "🥣"
    },

    {
        id: 4,
        category: "Curd",
        name: "Thick Curd",
        size: "500 g",
        price: 45,
        emoji: "🥣"
    },

    {
        id: 5,
        category: "Curd",
        name: "Low Fat Curd",
        size: "500 g",
        price: 45,
        emoji: "🥣"
    },

    {
        id: 6,
        category: "Curd",
        name: "Curd (Family Pack)",
        size: "1 Kg",
        price: 80,
        emoji: "🥛"
    },

    {
        id: 7,
        category: "Milk",
        name: "Full Cream Cow Milk",
        size: "1 Ltr",
        price: 60,
        image: "images/full-cream-milk.jpg"
    },

    {
        id: 8,
        category: "Milk",
        name: "Toned Cow Milk",
        size: "1 Ltr",
        price: 50,
        image: "images/toned-cow-milk.jpg"
    },

    {
        id: 9,
        category: "Milk",
        name: "Double Toned Milk",
        size: "1 Ltr",
        price: 45,
        image: "images/double-toned-milk.jpg"
    },

    {
        id: 10,
        category: "Milk",
        name: "Buffalo Milk",
        size: "1 Ltr",
        price: 55,
        image: "images/buffalo-milk.jpg"
    },

    {
        id: 11,
        category: "Milk",
        name: "Cow Milk (Pouch)",
        size: "500 ml",
        price: 30,
        image: "images/cow-milk-pouch.jpg"
    },

    {
        id: 12,
        category: "Paneer",
        name: "Fresh Paneer",
        size: "200 g",
        price: 100,
        image: "images/fresh-paneer.jpg"
    },

    {
        id: 13,
        category: "Paneer",
        name: "Paneer (500 g)",
        size: "500 g",
        price: 220,
        image: "images/paneer-500g.jpg"
    },

    {
        id: 14,
        category: "Paneer",
        name: "Paneer (1 Kg)",
        size: "1 Kg",
        price: 420,
        image: "images/paneer-1kg.jpg"
    },

    {
        id: 15,
        category: "Paneer",
        name: "Paneer (Grated)",
        size: "200 g",
        price: 110,
        image: "images/grated-paneer.jpg"
    },

    {
        id: 16,
        category: "Paneer",
        name: "Paneer (Marinated)",
        size: "200 g",
        price: 120,
        image: "images/marinated-paneer.jpg"
    },

    {
        id: 17,
        category: "Paneer",
        name: "Vacuum Packed Paneer",
        size: "200 g",
        price: 115,
        image: "images/vacuum-packed-paneer.jpg"
    },
    {
        id: 18,
        category: "Butter",
        name: "Unsalted Butter",
        size: "200 g",
        price: 70,
        image: "images/unsalted-butter.jpg"
    },

    {
        id: 19,
        category: "Butter",
        name: "Salted Butter",
        size: "200 g",
        price: 75,
        image: "images/salted-butter.jpg"
    },

    {
        id: 20,
        category: "Butter",
        name: "Pasteurized Butter",
        size: "500 g",
        price: 160,
        image: "images/pasteurized-butter.jpg"
    },

    {
        id: 21,
        category: "Butter",
        name: "Amul Butter",
        size: "100 g",
        price: 50,
        image: "images/amul-butter.jpg"
    },

    {
        id: 22,
        category: "Butter",
        name: "Amul Butter (Tub)",
        size: "500 g",
        price: 180,
        image: "images/amul-butter-tub.jpg"
    },

    {
        id: 23,
        category: "Butter",
        name: "White Butter (Bulk Pack)",
        size: "1 Kg",
        price: 320,
        image: "images/white-butter-bulk.jpg"
    },
    {
        id: 24,
        category: "Buttermilk",
        name: "Regular Buttermilk",
        size: "250 ml",
        price: 20,
        image: "images/regular-buttermilk.jpg"
    },

    {
        id: 25,
        category: "Buttermilk",
        name: "Spiced Buttermilk",
        size: "250 ml",
        price: 25,
        image: "images/spiced-buttermilk.jpg"
    },

    {
        id: 26,
        category: "Buttermilk",
        name: "Plain Buttermilk (Bottle)",
        size: "500 ml",
        price: 35,
        image: "images/plain-buttermilk-bottle.jpg"
    },

    {
        id: 27,
        category: "Buttermilk",
        name: "Salted Buttermilk (Bottle)",
        size: "1 Ltr",
        price: 60,
        image: "images/salted-buttermilk-bottle.jpg"
    },

    {
        id: 28,
        category: "Buttermilk",
        name: "Masala Buttermilk (Bottle)",
        size: "1 Ltr",
        price: 65,
        image: "images/masala-buttermilk-bottle.jpg"
    },

    {
        id: 29,
        category: "Buttermilk",
        name: "Buttermilk (Pouch)",
        size: "500 ml",
        price: 30,
        image: "images/buttermilk-pouch.jpg"
    },

    {
        id: 30,
        category: "Ghee",
        name: "Cow Ghee",
        size: "200 ml",
        price: 120,
        image: "images/cow-ghee-200ml.jpg"
    },

    {
        id: 31,
        category: "Ghee",
        name: "Cow Ghee",
        size: "500 ml",
        price: 250,
        image: "images/cow-ghee-500ml.jpg"
    },

    {
        id: 32,
        category: "Ghee",
        name: "A2 Cow Ghee",
        size: "500 ml",
        price: 320,
        image: "images/a2-cow-ghee-500ml.jpg"
    },

    {
        id: 33,
        category: "Ghee",
        name: "A2 Cow Ghee",
        size: "1 Ltr",
        price: 600,
        image: "images/a2-cow-ghee-1ltr.jpg"
    },

    {
        id: 34,
        category: "Ghee",
        name: "Bilona Ghee",
        size: "500 ml",
        price: 350,
        image: "images/bilona-ghee-500ml.jpg"
    },

    {
        id: 35,
        category: "Ghee",
        name: "Bilona Ghee",
        size: "1 Ltr",
        price: 650,
        image: "images/bilona-ghee-1ltr.jpg"
    },
    {
        id: 36,
        category: "Shrikhand",
        name: "Kesar Shrikhand",
        size: "200 g",
        price: 80,
        image: "images/kesar-shrikhand.jpg"
    },

    {
        id: 37,
        category: "Shrikhand",
        name: "Plain Shrikhand",
        size: "200 g",
        price: 60,
        image: "images/plain-shrikhand.jpg"
    },

    {
        id: 38,
        category: "Shrikhand",
        name: "Mango Shrikhand",
        size: "200 g",
        price: 90,
        image: "images/mango-shrikhand.jpg"
    },

    {
        id: 39,
        category: "Shrikhand",
        name: "Elaichi Shrikhand",
        size: "200 g",
        price: 70,
        image: "images/elaichi-shrikhand.jpg"
    },

    {
        id: 40,
        category: "Shrikhand",
        name: "Dry Fruit Shrikhand",
        size: "200 g",
        price: 100,
        image: "images/dry-fruit-shrikhand.jpg"
    },

    {
        id: 41,
        category: "Shrikhand",
        name: "Family Pack Shrikhand",
        size: "500 g",
        price: 180,
        image: "images/family-pack-shrikhand.jpg"
    },
    {
        id: 42,
        category: "Flavored Milk",
        name: "Strawberry Flavored Milk",
        size: "200 ml",
        price: 40,
        image: "images/strawberry-flavored-milk.jpg"
    },

    {
        id: 43,
        category: "Flavored Milk",
        name: "Chocolate Flavored Milk",
        size: "200 ml",
        price: 40,
        image: "images/chocolate-flavored-milk.jpg"
    },

    {
        id: 44,
        category: "Flavored Milk",
        name: "Mango Flavored Milk",
        size: "200 ml",
        price: 40,
        image: "images/mango-flavored-milk.jpg"
    },

    {
        id: 45,
        category: "Flavored Milk",
        name: "Vanilla Flavored Milk",
        size: "200 ml",
        price: 40,
        image: "images/vanilla-flavored-milk.jpg"
    },

    {
        id: 46,
        category: "Flavored Milk",
        name: "Butterscotch Flavored Milk",
        size: "200 ml",
        price: 40,
        image: "images/butterscotch-flavored-milk.jpg"
    },

    {
        id: 47,
        category: "Flavored Milk",
        name: "Rose Flavored Milk",
        size: "200 ml",
        price: 40,
        image: "images/rose-flavored-milk.jpg"
    },

    {
        id: 48,
        category: "Flavored Milk",
        name: "Kesar Flavored Milk",
        size: "200 ml",
        price: 45,
        image: "images/kesar-flavored-milk.jpg"
    },
    {
        id: 49,
        category: "Lassi",
        name: "Sweet Lassi",
        size: "250 ml",
        price: 30,
        image: "images/sweet-lassi.jpg"
    },

    {
        id: 50,
        category: "Lassi",
        name: "Salted Lassi",
        size: "250 ml",
        price: 30,
        image: "images/salted-lassi.jpg"
    },

    {
        id: 51,
        category: "Lassi",
        name: "Mango Lassi",
        size: "250 ml",
        price: 40,
        image: "images/mango-lassi.jpg"
    },

    {
        id: 52,
        category: "Lassi",
        name: "Strawberry Lassi",
        size: "250 ml",
        price: 40,
        image: "images/strawberry-lassi.jpg"
    },

    {
        id: 53,
        category: "Lassi",
        name: "Kesar Lassi",
        size: "250 ml",
        price: 45,
        image: "images/kesar-lassi.jpg"
    },

    {
        id: 54,
        category: "Lassi",
        name: "Chocolate Lassi",
        size: "250 ml",
        price: 45,
        image: "images/chocolate-lassi.jpg"
    },
    {
        id: 55,
        category: "Cheese",
        name: "Cheese Cubes",
        size: "200 g",
        price: 95,
        image: "images/cheese-cubes.jpg"
    },

    {
        id: 56,
        category: "Cheese",
        name: "Cheese Slices",
        size: "200 g (10 Slices)",
        price: 85,
        image: "images/cheese-slices.jpg"
    },

    {
        id: 57,
        category: "Cheese",
        name: "Mozzarella Cheese",
        size: "200 g",
        price: 120,
        image: "images/mozzarella-cheese.jpg"
    },

    {
        id: 58,
        category: "Cheese",
        name: "Cheddar Cheese",
        size: "200 g",
        price: 110,
        image: "images/cheddar-cheese.jpg"
    },

    {
        id: 59,
        category: "Cheese",
        name: "Cheese Spread",
        size: "200 g",
        price: 80,
        image: "images/cheese-spread.jpg"
    },

    {
        id: 60,
        category: "Cheese",
        name: "Cream Cheese",
        size: "200 g",
        price: 100,
        image: "images/cream-cheese.jpg"
    },

    {
        id: 61,
        category: "Cheese",
        name: "Herb & Chili Cheese",
        size: "200 g",
        price: 115,
        image: "images/herb-chili-cheese.jpg"
    },
    {
        id: 62,
        category: "Yogurt",
        name: "Plain Yogurt",
        size: "400 g",
        price: 40,
        image: "images/plain-yogurt.jpg"
    },

    {
        id: 63,
        category: "Yogurt",
        name: "Greek Yogurt",
        size: "400 g",
        price: 70,
        image: "images/greek-yogurt.jpg"
    },

    {
        id: 64,
        category: "Yogurt",
        name: "Fruit Yogurt",
        size: "400 g",
        price: 60,
        image: "images/fruit-yogurt.jpg"
    },

    {
        id: 65,
        category: "Yogurt",
        name: "Masala Yogurt",
        size: "400 g",
        price: 45,
        image: "images/masala-yogurt.jpg"
    },

    {
        id: 66,
        category: "Yogurt",
        name: "Sweet Yogurt",
        size: "400 g",
        price: 50,
        image: "images/sweet-yogurt.jpg"
    },

    {
        id: 67,
        category: "Yogurt",
        name: "Yogurt Family Pack",
        size: "1 Kg",
        price: 90,
        image: "images/yogurt-family-pack.jpg"
    },
    {
        id: 68,
        category: "Malai & Cream",
        name: "Fresh Malai",
        size: "200 g",
        price: 60,
        image: "images/fresh-malai.jpg"
    },

    {
        id: 69,
        category: "Malai & Cream",
        name: "Malai",
        size: "500 g",
        price: 120,
        image: "images/malai-500g.jpg"
    },

    {
        id: 70,
        category: "Malai & Cream",
        name: "Fresh Cream",
        size: "200 ml",
        price: 70,
        image: "images/fresh-cream.jpg"
    },

    {
        id: 71,
        category: "Malai & Cream",
        name: "Whipping Cream",
        size: "200 ml",
        price: 95,
        image: "images/whipping-cream.jpg"
    },

    {
        id: 72,
        category: "Malai & Cream",
        name: "Fresh Cream (Amul)",
        size: "200 ml",
        price: 85,
        image: "images/amul-fresh-cream.jpg"
    },

    {
        id: 73,
        category: "Malai & Cream",
        name: "Malai (Heritage)",
        size: "500 g",
        price: 110,
        image: "images/heritage-malai.jpg"
    },
    {
        id: 74,
        category: "Desi Products",
        name: "White Makhana",
        size: "500 g",
        price: 130,
        image: "images/white-makhan.jpg"
    },

    {
        id: 75,
        category: "Desi Products",
        name: "Desi Chaas (Masala)",
        size: "1 L",
        price: 45,
        image: "images/desi-chaas-masala.jpg"
    },

    {
        id: 76,
        category: "Desi Products",
        name: "Desi Lassi (Mitti Matka)",
        size: "500 ml",
        price: 50,
        image: "images/desi-lassi-mitti-matka.jpg"
    },

    {
        id: 77,
        category: "Desi Products",
        name: "Desi Gur (Jaggery)",
        size: "500 g",
        price: 60,
        image: "images/desi-gur.jpg"
    },

    {
        id: 78,
        category: "Desi Products",
        name: "Bilona Ghee (Desi)",
        size: "500 ml",
        price: 280,
        image: "images/bilona-ghee-desi.jpg"
    },

    {
        id: 79,
        category: "Desi Products",
        name: "Desi Paneer",
        size: "200 g",
        price: 70,
        image: "images/desi-paneer.jpg"
    },

    {
        id: 80,
        category: "Desi Products",
        name: "Desi Khoya (Mawa)",
        size: "500 g",
        price: 150,
        image: "images/desi-khoya-mawa.jpg"
    },
    {
        id: 81,
        category: "Value Packs",
        name: "Daily Milk Value Pack",
        size: "500 ml × 4 Pouches",
        price: 120,
        oldPrice: 130,
        save: "Save ₹10",
        image: "images/daily-milk-value-pack.jpg"
    },

    {
        id: 82,
        category: "Value Packs",
        name: "Paneer Value Pack",
        size: "200 g × 3 Packs",
        price: 165,
        oldPrice: 180,
        save: "Save ₹15",
        image: "images/paneer-value-pack.jpg"
    },

    {
        id: 83,
        category: "Value Packs",
        name: "Curd Family Pack",
        size: "200 g × 4 Cups",
        price: 88,
        oldPrice: 100,
        save: "Save ₹12",
        image: "images/curd-family-pack.jpg"
    },

    {
        id: 84,
        category: "Value Packs",
        name: "Ghee Value Pack",
        size: "200 ml × 2 Jars",
        price: 460,
        oldPrice: 480,
        save: "Save ₹20",
        image: "images/ghee-value-pack.jpg"
    },

    {
        id: 85,
        category: "Value Packs",
        name: "Dairy Combo Pack",
        size: "1 Ltr Milk + 200 g Paneer + 200 g Curd + 200 ml Ghee",
        price: 275,
        oldPrice: 310,
        save: "Save ₹35",
        image: "images/dairy-combo-pack.jpg"
    },

    {
        id: 86,
        category: "Value Packs",
        name: "Buttermilk Value Pack",
        size: "200 ml × 6 Pouches",
        price: 60,
        oldPrice: 70,
        save: "Save ₹10",
        image: "images/buttermilk-value-pack.jpg"
    },

];


/* =====================================================
   VARIABLES
===================================================== */

let selectedCategory = "all";
let cartCount = 2;

const quantities = {};


/* =====================================================
   DOM ELEMENTS
===================================================== */

const productList =
    document.getElementById("productList");

const searchInput =
    document.getElementById("searchInput");

const categoryTitle =
    document.getElementById("categoryTitle");

const categoryDescription =
    document.getElementById("categoryDescription");


/* =====================================================
   DISPLAY PRODUCTS
===================================================== */

function displayProducts() {

    const searchText =
        searchInput.value.toLowerCase().trim();


    let filteredProducts = products.filter(product => {

        const categoryMatch =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        const searchMatch =
            product.name.toLowerCase().includes(searchText) ||
            product.category.toLowerCase().includes(searchText);

        return categoryMatch && searchMatch;

    });


    productList.innerHTML = "";


    if (filteredProducts.length === 0) {

        productList.innerHTML = `
            <div class="empty-message">
                No products found.
            </div>
        `;

        return;
    }


    filteredProducts.forEach((product, index) => {

        if (!quantities[product.id]) {
            quantities[product.id] = 1;
        }


        const card = document.createElement("div");

        card.className = "product-card";
        card.style.animationDelay = `${index * 40}ms`;

        // Image or emoji fallback
        const imageHtml = product.image
            ? `<img
                src="${product.image}"
                alt="${product.name}"
                class="product-photo"
                onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
               >
               <span class="food" style="display:none">${product.emoji || '🥛'}</span>`
            : `<span class="food">${product.emoji || '🥛'}</span>`;

        // Availability badge
        const isAvailable = (product.stock === undefined || product.stock > 0) && (product.is_active === undefined || product.is_active !== false);
        const availabilityHtml = isAvailable
            ? `<span class="availability-badge available">● Available</span>`
            : `<span class="availability-badge unavailable">● Unavailable</span>`;

        const isFav = !!product.is_favorite;
        const favHeartSymbol = isFav ? '❤️' : '♡';
        const favActiveClass = isFav ? 'active' : '';

        card.innerHTML = `
<div class="product-image" onclick="openProductModal(${product.id})" style="cursor:pointer;">
    ${imageHtml}
    <button type="button" class="fav-heart-btn ${favActiveClass}" onclick="toggleShopFavorite(${product.id}, this, event)" title="Add to Favorites">
        ${favHeartSymbol}
    </button>
</div>

            <div class="product-details" onclick="openProductModal(${product.id})" style="cursor:pointer;">

                <div class="product-name">
                    ${product.name}
                </div>

                <div class="product-size">
                    ${product.size}
                </div>

                <div class="product-price">
                    ₹${product.price}
                </div>

                <div class="product-status-wrap">
                    ${availabilityHtml}
                </div>

            </div>

            ${isAvailable ? `
            <div class="product-actions">

                <div class="quantity">

                    <button
                        onclick="changeQuantity(${product.id}, -1)">
                        −
                    </button>

                    <span
                        class="quantity-number"
                        id="qty-${product.id}">
                        ${quantities[product.id]}
                    </span>

                    <button
                        onclick="changeQuantity(${product.id}, 1)">
                        +
                    </button>

                </div>


                <button
                    class="add-cart"
                    onclick="addToCart(${product.id}, this)">

                    🛒 Add to Cart

                </button>

            </div>
            ` : `
            <div class="product-actions">
                <button
                    class="add-cart"
                    style="background:#e0e8e3; color:#888; cursor:not-allowed; width: 100%;"
                    disabled>
                    Unavailable
                </button>
            </div>
            `}

        `;


        productList.appendChild(card);

    });

}


/* =====================================================
   QUANTITY
===================================================== */

function changeQuantity(productId, change) {

    if (!quantities[productId]) {
        quantities[productId] = 1;
    }


    quantities[productId] += change;


    if (quantities[productId] < 1) {
        quantities[productId] = 1;
    }


    const quantityElement =
        document.getElementById(`qty-${productId}`);


    if (quantityElement) {

        quantityElement.textContent =
            quantities[productId];

    }

}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCart(productId, button) {

    const quantity =
        quantities[productId] || 1;

    fetch(`/cart/add/${productId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({ quantity: quantity })
    })
        .then(res => res.json())
        .then(data => {
            if (data && data.total_cart_count !== undefined) {
                cartCount = data.total_cart_count;
                document.querySelectorAll('.cart-count, #bottomCartCount, #cartBadge, .badge').forEach(b => {
                    if (cartCount > 0) {
                        b.textContent = cartCount;
                        b.style.display = 'flex';
                    } else {
                        b.textContent = '';
                        b.style.display = 'none';
                    }
                });
            }
        });

    button.classList.add("added");

    button.innerHTML = "✓ Added";


    setTimeout(() => {

        button.classList.remove("added");

        button.innerHTML = "🛒 Add to Cart";

    }, 1000);


    showToast(
        `${quantity} item added to cart`
    );

}


/* =====================================================
   CART COUNT
===================================================== */

function updateCartCount() {

    document.querySelectorAll(
        ".cart-count, .bottom-cart-count"
    ).forEach(element => {

        element.textContent = cartCount;

    });

}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    const oldToast =
        document.querySelector(".toast");

    if (oldToast) {
        oldToast.remove();
    }


    const toast =
        document.createElement("div");

    toast.className = "toast";

    toast.textContent = message;


    document.body.appendChild(toast);


    setTimeout(() => {

        toast.remove();

    }, 1800);

}


/* =====================================================
   CATEGORY CHANGE
===================================================== */

function selectCategoryByName(catName) {
    if (!catName || catName.toLowerCase() === "all") {
        document.querySelectorAll(".sidebar .category").forEach(item => {
            item.classList.remove("selected");
        });
        const allProductsCategory = document.querySelector('.sidebar .category[data-category="all"]');
        if (allProductsCategory) {
            allProductsCategory.classList.add("selected");
        }
        selectedCategory = "all";
        categoryTitle.textContent = "All Products";
        categoryDescription.textContent = "Fresh dairy products delivered directly to your doorstep.";
        displayProducts();
        return;
    }

    const categoriesList = Array.from(document.querySelectorAll(".sidebar .category"));
    const matchingCategory = categoriesList.find(c => {
        const d = (c.dataset.category || "").toLowerCase().trim();
        return d === catName.toLowerCase().trim();
    });

    categoriesList.forEach(item => item.classList.remove("selected"));

    if (matchingCategory) {
        matchingCategory.classList.add("selected");
        selectedCategory = matchingCategory.dataset.category;
        categoryTitle.textContent = selectedCategory;
        categoryDescription.textContent = getCategoryDescription(selectedCategory);
        setTimeout(() => {
            matchingCategory.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    } else {
        selectedCategory = catName;
        categoryTitle.textContent = catName;
        categoryDescription.textContent = getCategoryDescription(catName);
    }

    displayProducts();
}

document.querySelectorAll(".sidebar .category")
    .forEach(category => {
        category.addEventListener("click", () => {
            selectCategoryByName(category.dataset.category);
        });
    });


/* =====================================================
   CATEGORY DESCRIPTION
===================================================== */

function getCategoryDescription(category) {

    const descriptions = {

        "Milk":
            "Fresh, pure & healthy milk collected daily from our farm.",

        "Paneer":
            "Soft, fresh & protein-rich paneer made from pure milk.",

        "Curd":
            "Fresh, creamy & healthy curd made from pure cow milk.",

        "Butter":
            "Creamy and delicious fresh dairy butter.",

        "Buttermilk":
            "Refreshing and healthy traditional buttermilk.",

        "Ghee":
            "Pure, aromatic and traditionally prepared cow ghee.",

        "Shrikhand":
            "Sweet, creamy and delicious traditional shrikhand."

    };


    return descriptions[category] ||
        `Fresh and premium ${category} products.`;

}


/* =====================================================
   SEARCH
===================================================== */

searchInput.addEventListener(
    "input",
    displayProducts
);


/* =====================================================
   FILTER BUTTON
===================================================== */

document.getElementById("filterBtn")
    .addEventListener("click", () => {

        showToast("Filter options coming soon");

    });


/* =====================================================
   TOP CART
===================================================== */

const cartTopBtn = document.querySelector(".cart-top");
if (cartTopBtn) {
    cartTopBtn.addEventListener("click", () => {
        showToast(`Your cart has ${cartCount} items`);
    });
}


/* =====================================================
   NOTIFICATION
===================================================== */

const notifBtn = document.querySelector(".notification-btn");
if (notifBtn) {
    notifBtn.addEventListener("click", () => {
        showToast("You have 3 new notifications");
    });
}


/* =====================================================
   BOTTOM NAV
===================================================== */

document.querySelectorAll(".bottom-item")
    .forEach(item => {

        item.addEventListener("click", () => {

            document.querySelectorAll(".bottom-item")
                .forEach(nav => {

                    nav.classList.remove("active");

                });


            item.classList.add("active");


            const page =
                item.querySelector("small").textContent;


            if (page !== "Home") {

                showToast(
                    `${page} section selected`
                );

            }

        });

    });
// ================= INITIAL CATEGORY & LOAD =================

const urlParams = new URLSearchParams(window.location.search);
const initialCat = urlParams.get('category') || urlParams.get('cat') || 'all';

updateCartCount();

selectCategoryByName(initialCat);


/* =====================================================
   TOAST CSS DYNAMICALLY
===================================================== */

const toastStyle =
    document.createElement("style");

toastStyle.textContent = `

.toast {

    position: fixed;

    left: 50%;
    bottom: 95px;

    transform: translateX(-50%);

    background: #064e34;
    color: white;

    padding: 13px 22px;

    border-radius: 25px;

    font-size: 14px;

    z-index: 9999;

    box-shadow:
        0 5px 20px rgba(0,0,0,0.2);

    animation:
        toastIn 0.25s ease;

}

@keyframes toastIn {

    from {
        opacity: 0;
        transform:
            translate(-50%, 15px);
    }

    to {
        opacity: 1;
        transform:
            translate(-50%, 0);
    }

}

`;

document.head.appendChild(toastStyle);

/* ================= TOGGLE FAVORITE ================= */

function toggleShopFavorite(productId, buttonElem, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // csrftoken is already set at the top of this file via getCookie('csrftoken')
    if (!csrftoken) {
        window.location.href = '/login/';
        return;
    }

    buttonElem.style.transform = 'scale(1.3)';
    buttonElem.disabled = true;

    fetch('/favourite/toggle/' + productId + '/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(function (res) {
            if (res.status === 403 || res.status === 401 || res.redirected) {
                window.location.href = '/login/';
                return null;
            }
            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) {
                window.location.href = '/login/';
                return null;
            }
            return res.json();
        })
        .then(function (data) {
            buttonElem.style.transform = 'scale(1)';
            buttonElem.disabled = false;
            if (!data) return;

            if (data.error) {
                showToast(data.error);
                return;
            }

            if (data.is_favorite) {
                buttonElem.classList.add('active');
                buttonElem.innerHTML = '❤️';
                showToast('Added to Favorites! ❤️');
            } else {
                buttonElem.classList.remove('active');
                buttonElem.innerHTML = '♡';
                showToast('Removed from Favorites');
            }

            // Update product in array
            if (typeof products !== 'undefined' && Array.isArray(products)) {
                const p = products.find(function (item) { return item.id === productId; });
                if (p) p.is_favorite = data.is_favorite;
            }
        })
        .catch(function (err) {
            buttonElem.style.transform = 'scale(1)';
            buttonElem.disabled = false;
            console.error('Favorite toggle error:', err);
        });
}

/* ================= PRODUCT MODAL ================= */
const modalStyle = document.createElement('style');
modalStyle.textContent = `
.product-info-modal-backdrop {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; pointer-events: none; transition: opacity 0.3s;
}
.product-info-modal-backdrop.show { opacity: 1; pointer-events: auto; }
.product-info-modal {
    background: white; border-radius: 16px;
    width: 90%; max-width: 360px; padding: 20px; position: relative;
    transform: translateY(20px); transition: transform 0.3s;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
.product-info-modal-backdrop.show .product-info-modal { transform: translateY(0); }
.close-modal-btn {
    position: absolute; top: 12px; right: 12px;
    background: #f1f5f3; border: none; font-size: 16px;
    width: 30px; height: 30px; border-radius: 50%; color: #555;
    display: flex; align-items: center; justify-content: center;
}
.product-modal-image-container {
    width: 100%; height: 180px;
    background: linear-gradient(145deg, #e8f5ee, #c8e6d6);
    border-radius: 12px; display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
}
.modal-product-photo { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
.product-modal-image-container .food { font-size: 80px; }
.product-modal-category {
    font-size: 12px; font-weight: 700; color: var(--green, #006b3c);
    text-transform: uppercase; margin-bottom: 4px;
}
.product-modal-title { font-size: 22px; font-weight: 800; color: #111; margin-bottom: 6px; }
.product-modal-size { font-size: 14px; color: #6b7280; margin-bottom: 12px; }
.product-modal-price { font-size: 24px; font-weight: 800; color: var(--green, #006b3c); margin-bottom: 16px; }
.product-modal-description { font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 20px; }
.product-modal-actions .quantity {
    display: flex; align-items: center; justify-content: space-between;
    background: #eef7f2; border-radius: 20px; padding: 4px; width: 120px; margin: 0 auto 12px;
}
.product-modal-actions .quantity button {
    width: 32px; height: 32px; background: white; border: none; border-radius: 50%;
    font-size: 18px; font-weight: 700; color: #006b3c; display: flex; align-items: center; justify-content: center;
}
.product-modal-actions .quantity-number { font-weight: 700; font-size: 16px; color: #006b3c; }
.product-modal-actions .add-cart {
    width: 100%; padding: 12px; background: #006b3c; color: white; border: none; border-radius: 12px;
    font-weight: 700; font-size: 16px; transition: all 0.2s;
}
.product-modal-actions .add-cart:active { transform: translateY(2px); }
`;
document.head.appendChild(modalStyle);

function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modalProductCategory').textContent = product.category;
    document.getElementById('modalProductTitle').textContent = product.name;
    document.getElementById('modalProductSize').textContent = product.size;
    document.getElementById('modalProductPrice').textContent = '₹' + product.price;

    const imgEl = document.getElementById('modalProductImage');
    const emojiEl = document.getElementById('modalProductEmoji');
    if (product.image) {
        imgEl.src = product.image;
        imgEl.style.display = 'block';
        emojiEl.style.display = 'none';
        imgEl.onerror = function() {
            imgEl.style.display = 'none';
            emojiEl.textContent = product.emoji || '🥛';
            emojiEl.style.display = 'block';
        };
    } else {
        imgEl.style.display = 'none';
        emojiEl.textContent = product.emoji || '🥛';
        emojiEl.style.display = 'block';
    }

    let actionsHtml = '';
    const isAvailable = (product.stock === undefined || product.stock > 0) && (product.is_active === undefined || product.is_active !== false);
    
    if (isAvailable) {
        if (!quantities[product.id]) quantities[product.id] = 1;
        actionsHtml = `
            <div class="quantity">
                <button onclick="changeQuantity(${product.id}, -1); updateModalQty(${product.id})">−</button>
                <span class="quantity-number" id="modal-qty-${product.id}">${quantities[product.id]}</span>
                <button onclick="changeQuantity(${product.id}, 1); updateModalQty(${product.id})">+</button>
            </div>
            <button class="add-cart" onclick="addToCart(${product.id}, this); closeProductModal()">🛒 Add to Cart</button>
        `;
    } else {
        actionsHtml = `<button class="add-cart" style="background:#e0e8e3; color:#888; cursor:not-allowed;" disabled>Unavailable</button>`;
    }
    
    document.getElementById('modalProductActions').innerHTML = actionsHtml;

    const backdrop = document.getElementById('productInfoModalBackdrop');
    backdrop.style.display = 'flex';
    setTimeout(() => backdrop.classList.add('show'), 10);
}

function updateModalQty(productId) {
    const el = document.getElementById('modal-qty-' + productId);
    if (el) el.textContent = quantities[productId];
}

function closeProductModal() {
    const backdrop = document.getElementById('productInfoModalBackdrop');
    backdrop.classList.remove('show');
    setTimeout(() => backdrop.style.display = 'none', 300);
}