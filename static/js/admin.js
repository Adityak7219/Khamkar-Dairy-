/* =========================================
   ADMIN PANEL JAVASCRIPT
   All CRUD operations use fetch() to persist
   changes to the Django backend.
========================================= */


/* ================= CSRF TOKEN ================= */

function getCSRFToken() {
    const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfInput) return csrfInput.value;

    // Fallback: read from cookie
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
        c = c.trim();
        if (c.startsWith('csrftoken=')) {
            return c.substring('csrftoken='.length);
        }
    }
    return '';
}

function updateToggleBadge(checkbox, badgeId) {
    const badge = document.getElementById(badgeId);
    if (!badge) return;
    if (checkbox.checked) {
        badge.innerText = 'ON';
        badge.className = 'toggle-status-badge on';
    } else {
        badge.innerText = 'OFF';
        badge.className = 'toggle-status-badge off';
    }
}


/* ================= DATE ================= */

function updateDate() {

    const dateElement = document.getElementById("currentDate");

    if (!dateElement) return;

    const today = new Date();

    const options = {
        day: "2-digit",
        month: "short",
        year: "numeric"
    };

    dateElement.textContent =
        today.toLocaleDateString("en-IN", options);
}

updateDate();


/* ================= PAGE NAVIGATION ================= */

function showPage(pageId, button) {

    const pages = document.querySelectorAll(".page");

    pages.forEach(function (page) {
        page.classList.remove("active-page");
    });


    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }


    const menuItems = document.querySelectorAll(".menu-item");

    menuItems.forEach(function (item) {
        item.classList.remove("active");
    });


    if (button) {
        button.classList.add("active");
    }


    // Mobile sidebar close
    const sidebar = document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (history.replaceState) {
        history.replaceState(null, null, '#' + pageId + window.location.search);
    } else {
        window.location.hash = pageId;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const hash = window.location.hash.replace("#", "");
    const urlParams = new URLSearchParams(window.location.search);

    if (hash === "reports" || urlParams.has("date_preset") || urlParams.has("start_date")) {
        const reportsBtn = document.querySelector(".menu-item[onclick*='reports']");
        showPage("reports", reportsBtn);
    } else if (hash) {
        const targetBtn = document.querySelector(".menu-item[onclick*='" + hash + "']");
        if (targetBtn) {
            showPage(hash, targetBtn);
        }
    }
});


/* ================= SIDEBAR ================= */

function toggleSidebar() {

    const sidebar = document.querySelector(".sidebar");

    sidebar.classList.toggle("open");
}


/* ================= NOTIFICATION ================= */

function showNotification() {

    alert(
        "You have 3 new notifications.\n\n" +
        "• New order received\n" +
        "• Product stock is low\n" +
        "• New customer registered"
    );
}


/* ================= TOAST NOTIFICATION ================= */

function showToast(message, type) {
    type = type || 'success';

    // Remove existing toast
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'admin-toast admin-toast-' + type;
    toast.textContent = message;
    toast.style.cssText =
        'position:fixed;top:20px;right:20px;padding:14px 24px;border-radius:10px;' +
        'color:#fff;font-weight:600;z-index:10000;animation:slideIn 0.3s ease;' +
        'box-shadow:0 4px 20px rgba(0,0,0,0.15);font-size:0.95rem;';

    if (type === 'success') {
        toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else if (type === 'error') {
        toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
    }

    document.body.appendChild(toast);

    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
}


/* ================= ADD PRODUCT MODAL ================= */

var isEditMode = false;

function openAddProduct() {

    const modal = document.getElementById("productModal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    // Reset to add mode
    isEditMode = false;
    document.getElementById("editProductId").value = "";
    document.getElementById("productModalTitle").textContent = "Add New Product";
    document.getElementById("productModalSubtitle").textContent = "Add a new product to your store";
    document.querySelector("#addProductForm .save-btn").textContent = "+ Add Product";
    document.getElementById("addProductForm").reset();
    const qtyInput = document.getElementById("productQuantityLabel");
    if (qtyInput) qtyInput.value = "";
}


function closeAddProduct() {

    const modal = document.getElementById("productModal");
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
    isEditMode = false;
    document.getElementById("editProductId").value = "";
}


/* ================= ADD PRODUCT FORM (BACKEND) ================= */

document
    .getElementById("addProductForm")
    .addEventListener("submit", function (event) {

        event.preventDefault();

        const productId = document.getElementById("editProductId").value;
        const name = document.getElementById("productName").value.trim();
        const quantityLabel = (document.getElementById("productQuantityLabel") ? document.getElementById("productQuantityLabel").value.trim() : "");
        const category = document.getElementById("productCategory").value;
        const price = document.getElementById("productPrice").value;
        const stock = document.getElementById("productStock").value;
        const status = document.getElementById("productStatus").value;
        const imageInput = document.getElementById("productImage");

        if (!name || !category || !price || !stock) {
            showToast("Please fill all required fields.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("quantity_label", quantityLabel);
        formData.append("category", category);
        formData.append("price", price);
        formData.append("stock", stock);
        formData.append("status", status);

        if (imageInput.files.length > 0) {
            formData.append("image", imageInput.files[0]);
        }

        let url = "/admin/api/products/add/";
        if (isEditMode && productId) {
            url = "/admin/api/products/" + productId + "/edit/";
        }

        fetch(url, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken()
            },
            body: formData
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {

                if (data.error) {
                    showToast(data.error, "error");
                    return;
                }

                if (isEditMode && productId) {
                    // Update existing row
                    const row = document.querySelector('tr[data-product-id="' + productId + '"]');
                    if (row) {
                        const p = data.product;
                        row.setAttribute("data-quantity-label", p.quantity_label || "");
                        const qtySubtext = p.quantity_label ? '<div style="font-size: 12px; color: #078046; font-weight: 500;">' + p.quantity_label + '</div>' : '';
                        row.cells[1].innerHTML = "<strong>" + p.name + "</strong>" + qtySubtext;
                        row.cells[2].textContent = p.category;
                        row.cells[3].textContent = "₹" + p.price;
                        row.cells[4].textContent = p.stock;

                        const statusClass = p.is_active ? "btn-available" : "btn-unavailable";
                        const statusText = p.is_active ? "● Available" : "● Unavailable";
                        row.cells[5].innerHTML = '<button type="button" class="status-toggle-btn ' + statusClass + '" onclick="toggleProductAvailability(this)" title="Click to change Availability">' + statusText + '</button>';

                        if (p.image) {
                            row.cells[0].innerHTML = '<div class="product-image"><img src="' + p.image + '" alt="' + p.name + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px;"></div>';
                        }
                    }
                    showToast("Product updated successfully!");
                } else {
                    // Add new row to table
                    const table = document.getElementById("productTable");
                    const p = data.product;

                    const row = document.createElement("tr");
                    row.setAttribute("data-product-id", p.id);
                    row.setAttribute("data-quantity-label", p.quantity_label || "");

                    const statusClass = p.is_active ? "btn-available" : "btn-unavailable";
                    const statusText = p.is_active ? "● Available" : "● Unavailable";
                    const imgHTML = p.image
                        ? '<img src="' + p.image + '" alt="' + p.name + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px;">'
                        : '📦';

                    const qtySubtext = p.quantity_label ? '<div style="font-size: 12px; color: #078046; font-weight: 500;">' + p.quantity_label + '</div>' : '';

                    row.innerHTML =
                        '<td><div class="product-image">' + imgHTML + '</div></td>' +
                        '<td><strong>' + p.name + '</strong>' + qtySubtext + '</td>' +
                        '<td>' + p.category + '</td>' +
                        '<td>₹' + p.price + '</td>' +
                        '<td>' + p.stock + '</td>' +
                        '<td><button type="button" class="status-toggle-btn ' + statusClass + '" onclick="toggleProductAvailability(this)" title="Click to change Availability">' + statusText + '</button></td>' +
                        '<td>' +
                        '<button class="edit-btn" onclick="editProduct(this)">✎ Edit</button>' +
                        '<button class="delete-btn" onclick="deleteProduct(this)">🗑 Delete</button>' +
                        '</td>';

                    // Remove "No products" row if it exists
                    const emptyRow = table.querySelector('td[colspan="7"]');
                    if (emptyRow) emptyRow.closest('tr').remove();

                    table.prepend(row);

                    // Update product count
                    const productCount = document.getElementById("totalProducts");
                    if (productCount) {
                        productCount.textContent = parseInt(productCount.textContent) + 1;
                    }

                    showToast("Product added successfully!");
                }

                document.getElementById("addProductForm").reset();
                closeAddProduct();
            })
            .catch(function (err) {
                console.error("Error:", err);
                showToast("Something went wrong. Please try again.", "error");
            });

    });


/* ================= TOGGLE PRODUCT AVAILABILITY ================= */

function toggleProductAvailability(button) {
    const row = button.closest("tr");
    const productId = row.getAttribute("data-product-id");
    if (!productId) return;

    button.disabled = true;
    button.style.opacity = "0.6";

    fetch("/admin/api/products/" + productId + "/toggle-availability/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json"
        }
    })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            button.disabled = false;
            button.style.opacity = "1";

            if (data.error) {
                showToast(data.error, "error");
                return;
            }

            if (data.is_active) {
                button.className = "status-toggle-btn btn-available";
                button.innerHTML = "● Available";
            } else {
                button.className = "status-toggle-btn btn-unavailable";
                button.innerHTML = "● Unavailable";
            }

            showToast(data.message || "Product availability updated!");
        })
        .catch(function (err) {
            button.disabled = false;
            button.style.opacity = "1";
            console.error("Error toggling availability:", err);
            showToast("Failed to update availability.", "error");
        });
}


/* ================= DELETE PRODUCT (BACKEND) ================= */

function deleteProduct(button) {

    const row = button.closest("tr");
    const productId = row.getAttribute("data-product-id");
    const productName = row.cells[1].innerText;

    const confirmDelete = confirm(
        "Are you sure you want to delete " + productName + "?"
    );

    if (!confirmDelete) return;

    fetch("/admin/api/products/" + productId + "/delete/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json"
        }
    })
        .then(function (response) { return response.json(); })
        .then(function (data) {

            if (data.error) {
                showToast(data.error, "error");
                return;
            }

            row.remove();

            const productCount = document.getElementById("totalProducts");
            if (productCount) {
                let currentCount = parseInt(productCount.textContent);
                if (currentCount > 0) {
                    productCount.textContent = currentCount - 1;
                }
            }

            showToast("Product deleted successfully!");
        })
        .catch(function (err) {
            console.error("Error:", err);
            showToast("Failed to delete product.", "error");
        });
}


/* ================= EDIT PRODUCT (BACKEND) ================= */

function editProduct(button) {

    const row = button.closest("tr");
    const productId = row.getAttribute("data-product-id");
    const quantityLabel = row.getAttribute("data-quantity-label") || "";

    const nameElem = row.cells[1].querySelector("strong");
    const name = nameElem ? nameElem.innerText : row.cells[1].innerText;
    const category = row.cells[2].innerText;
    const price = row.cells[3].innerText.replace("₹", "");
    const stock = row.cells[4].innerText;
    const statusText = row.cells[5].innerText.trim();

    // Open modal in edit mode
    isEditMode = true;
    document.getElementById("editProductId").value = productId;
    document.getElementById("productModalTitle").textContent = "Edit Product";
    document.getElementById("productModalSubtitle").textContent = "Update product details";
    document.querySelector("#addProductForm .save-btn").textContent = "✓ Save Changes";

    // Fill form
    document.getElementById("productName").value = name;
    if (document.getElementById("productQuantityLabel")) {
        document.getElementById("productQuantityLabel").value = quantityLabel;
    }
    document.getElementById("productPrice").value = price;
    document.getElementById("productStock").value = stock;
    document.getElementById("productStatus").value = (statusText.includes("Available") || statusText.includes("Active")) ? "Available" : "Unavailable";

    // Set category dropdown
    const categorySelect = document.getElementById("productCategory");
    for (let i = 0; i < categorySelect.options.length; i++) {
        if (categorySelect.options[i].value === category) {
            categorySelect.selectedIndex = i;
            break;
        }
    }

    const modal = document.getElementById("productModal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}


/* ================= ORDER STATUS UPDATE (BACKEND) ================= */

function updateOrderStatus(orderId, newStatus) {

    fetch("/admin/api/orders/" + orderId + "/status/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
    })
        .then(function (response) { return response.json(); })
        .then(function (data) {

            if (data.error) {
                showToast(data.error, "error");
                return;
            }

            // Update the status badge in the same row
            const row = document.querySelector('tr[data-order-id="' + orderId + '"]');
            if (row) {
                const statusCell = row.cells[5];
                const displayText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                statusCell.innerHTML = '<span class="status ' + newStatus + '">' + displayText + '</span>';
            }

            showToast("Order status updated to " + newStatus + "!");
        })
        .catch(function (err) {
            console.error("Error:", err);
            showToast("Failed to update order status.", "error");
        });
}


/* ================= DELETE ORDER (BACKEND) ================= */

function deleteOrder(orderId, button) {
    const row = button ? button.closest("tr") : document.querySelector('tr[data-order-id="' + orderId + '"]');
    const orderNumText = row ? row.cells[0].innerText.trim() : ("#" + orderId);

    const confirmDelete = confirm("Are you sure you want to delete order " + orderNumText + "?");
    if (!confirmDelete) return;

    if (button) {
        button.disabled = true;
        button.style.opacity = "0.5";
    }

    fetch("/admin/api/orders/" + orderId + "/delete/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json"
        }
    })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (button) {
                button.disabled = false;
                button.style.opacity = "1";
            }

            if (data.error) {
                showToast(data.error, "error");
                return;
            }

            if (row) {
                row.remove();
            }

            // Check if table is now empty
            const orderTable = document.getElementById("orderTable");
            if (orderTable && orderTable.querySelectorAll("tr").length === 0) {
                orderTable.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#888;">No orders yet.</td></tr>';
            }

            showToast(data.message || "Order deleted successfully!");
        })
        .catch(function (err) {
            if (button) {
                button.disabled = false;
                button.style.opacity = "1";
            }
            console.error("Error deleting order:", err);
            showToast("Failed to delete order.", "error");
        });
}


/* ================= CATEGORY MODAL ================= */

var isCategoryEditMode = false;

function openAddCategory() {
    const modal = document.getElementById("categoryModal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    isCategoryEditMode = false;
    document.getElementById("editCategoryId").value = "";
    document.getElementById("categoryModalTitle").textContent = "Add New Category";
    document.getElementById("categoryModalSubtitle").textContent = "Create a new product category";
    document.getElementById("categorySaveBtn").textContent = "+ Add Category";
    document.getElementById("addCategoryForm").reset();
}

function closeAddCategory() {
    const modal = document.getElementById("categoryModal");
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
    isCategoryEditMode = false;
    document.getElementById("editCategoryId").value = "";
}

function editCategory(button) {
    const row = button.closest("tr");
    const categoryId = row.getAttribute("data-category-id");
    const name = row.cells[1].innerText.trim();
    const description = row.cells[2].innerText.trim() === "—" ? "" : row.cells[2].innerText.trim();

    isCategoryEditMode = true;
    document.getElementById("editCategoryId").value = categoryId;
    document.getElementById("categoryModalTitle").textContent = "Edit Category";
    document.getElementById("categoryModalSubtitle").textContent = "Update category details";
    document.getElementById("categorySaveBtn").textContent = "✓ Save Changes";

    document.getElementById("categoryName").value = name;
    document.getElementById("categoryDescription").value = description;

    const modal = document.getElementById("categoryModal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}


/* ================= ADD / EDIT CATEGORY (BACKEND) ================= */

document
    .getElementById("addCategoryForm")
    .addEventListener("submit", function (event) {

        event.preventDefault();

        const categoryId = document.getElementById("editCategoryId").value;
        const name = document.getElementById("categoryName").value.trim();
        const description = document.getElementById("categoryDescription").value.trim();
        const imageInput = document.getElementById("categoryImage");

        if (!name) {
            showToast("Category name is required.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        if (imageInput.files.length > 0) {
            formData.append("image", imageInput.files[0]);
        }

        let url = "/admin/api/categories/add/";
        if (isCategoryEditMode && categoryId) {
            url = "/admin/api/categories/" + categoryId + "/edit/";
        }

        fetch(url, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken()
            },
            body: formData
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {

                if (data.error) {
                    showToast(data.error, "error");
                    return;
                }

                const cat = data.category;
                const imgHTML = cat.image
                    ? '<img src="' + cat.image + '" alt="' + cat.name + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px;">'
                    : '📁';

                if (isCategoryEditMode && categoryId) {
                    // Update existing row
                    const row = document.querySelector('tr[data-category-id="' + categoryId + '"]');
                    if (row) {
                        row.cells[0].innerHTML = '<div class="product-image">' + imgHTML + '</div>';
                        row.cells[1].innerHTML = "<strong>" + cat.name + "</strong>";
                        row.cells[2].textContent = cat.description || "—";
                        row.cells[3].textContent = cat.product_count;
                    }
                    showToast("Category updated successfully!");
                } else {
                    // Add new row to table
                    const table = document.getElementById("categoryTable");

                    const row = document.createElement("tr");
                    row.setAttribute("data-category-id", cat.id);
                    row.innerHTML =
                        '<td><div class="product-image">' + imgHTML + '</div></td>' +
                        '<td><strong>' + cat.name + '</strong></td>' +
                        '<td>' + (cat.description || '—') + '</td>' +
                        '<td>' + cat.product_count + '</td>' +
                        '<td>' +
                        '<button class="edit-btn" onclick="editCategory(this)">✏️ Edit</button>' +
                        '<button class="delete-btn" onclick="deleteCategory(' + cat.id + ', \'' + cat.name + '\')">🗑 Delete</button>' +
                        '</td>';

                    // Remove empty row
                    const emptyRow = table.querySelector('td[colspan="6"]');
                    if (emptyRow) emptyRow.closest('tr').remove();

                    table.appendChild(row);

                    // Also add to the product category dropdown
                    const catSelect = document.getElementById("productCategory");
                    if (catSelect) {
                        const option = document.createElement("option");
                        option.value = cat.name;
                        option.textContent = cat.name;
                        catSelect.appendChild(option);
                    }

                    showToast("Category added successfully!");
                }

                document.getElementById("addCategoryForm").reset();
                closeAddCategory();
            })
            .catch(function (err) {
                console.error("Error:", err);
                showToast("Failed to save category.", "error");
            });
    });


/* ================= DELETE CATEGORY (BACKEND) ================= */

function deleteCategory(categoryId, categoryName) {

    const confirmDelete = confirm(
        "Are you sure you want to delete the category '" + categoryName + "'?"
    );

    if (!confirmDelete) return;

    fetch("/admin/api/categories/" + categoryId + "/delete/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json"
        }
    })
        .then(function (response) { return response.json(); })
        .then(function (data) {

            if (data.error) {
                showToast(data.error, "error");
                return;
            }

            const row = document.querySelector('tr[data-category-id="' + categoryId + '"]');
            if (row) row.remove();

            showToast("Category deleted!");
        })
        .catch(function (err) {
            console.error("Error:", err);
            showToast("Failed to delete category.", "error");
        });
}


/* ================= SEARCH — Products ================= */

const productSearch = document.getElementById("productSearch");

if (productSearch) {
    productSearch.addEventListener("input", function () {
        const search = this.value.toLowerCase();
        const rows = document.querySelectorAll("#productTable tr");

        rows.forEach(function (row) {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(search) ? "" : "none";
        });
    });
}


/* ================= SEARCH — Orders ================= */

const orderSearch = document.getElementById("orderSearch");

if (orderSearch) {
    orderSearch.addEventListener("input", function () {
        const search = this.value.toLowerCase();
        const rows = document.querySelectorAll("#orderTable tr");

        rows.forEach(function (row) {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(search) ? "" : "none";
        });
    });
}


/* ================= SEARCH — Customers ================= */

const customerSearch = document.getElementById("customerSearch");

if (customerSearch) {
    customerSearch.addEventListener("input", function () {
        const search = this.value.toLowerCase();
        const rows = document.querySelectorAll("#customerTable tr");

        rows.forEach(function (row) {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(search) ? "" : "none";
        });
    });
}


/* ================= GLOBAL SEARCH ================= */

const globalSearch = document.getElementById("globalSearch");

if (globalSearch) {
    globalSearch.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            const value = this.value.trim().toLowerCase();
            if (!value) return;

            // Search across all visible tables
            const allRows = document.querySelectorAll(
                "#productTable tr, #orderTable tr, #customerTable tr"
            );

            let found = false;
            allRows.forEach(function (row) {
                if (row.innerText.toLowerCase().includes(value)) {
                    found = true;
                }
            });

            if (found) {
                showToast("Found results for: " + value, "info");
            } else {
                showToast("No results found for: " + value, "error");
            }
        }
    });
}


/* ================= EDIT CUSTOMER (BACKEND) ================= */

/* ================= EDIT CUSTOMER (BACKEND) ================= */

function editCustomer(button) {
    const row = button.closest("tr");
    const customerId = row.getAttribute("data-customer-id");

    const name = row.cells[0].innerText.trim();
    const email = row.cells[1].innerText.trim();
    const phone = row.cells[2].innerText.trim() === "—" ? "" : row.cells[2].innerText.trim();

    const roleSelectInTable = row.cells[6] ? row.cells[6].querySelector("select") : null;
    const roleText = roleSelectInTable ? roleSelectInTable.value : "Customer";

    document.getElementById("editCustomerId").value = customerId;
    document.getElementById("customerEditName").value = name;
    document.getElementById("customerEditEmail").value = email;
    document.getElementById("customerEditPhone").value = phone;

    const roleSelect = document.getElementById("customerEditRole");
    if (roleSelect) {
        roleSelect.value = roleText;
    }

    const modal = document.getElementById("customerModal");
    if (modal) {
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
    }
}

function closeCustomerModal() {
    const modal = document.getElementById("customerModal");
    if (modal) {
        modal.classList.remove("show");
        document.body.style.overflow = "auto";
    }
}

const editCustomerForm = document.getElementById("editCustomerForm");
if (editCustomerForm) {
    editCustomerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const customerId = document.getElementById("editCustomerId").value;
        const name = document.getElementById("customerEditName").value.trim();
        const email = document.getElementById("customerEditEmail").value.trim();
        const phone = document.getElementById("customerEditPhone").value.trim();
        const role = document.getElementById("customerEditRole") ? document.getElementById("customerEditRole").value : "Customer";

        fetch("/admin/api/customers/" + customerId + "/edit/", {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: name, email: email, phone: phone, role: role })
        })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (data.error) {
                    showToast(data.error, "error");
                    return;
                }
                const rows = document.querySelectorAll('tr[data-customer-id="' + customerId + '"]');
                rows.forEach(function(row) {
                    const c = data.customer;
                    if (row.cells[0]) row.cells[0].innerHTML = "<strong>" + c.name + "</strong>";
                    if (row.cells[1]) row.cells[1].textContent = c.email;
                    if (row.cells[2]) row.cells[2].textContent = c.phone || "—";

                    const roleSelect = row.cells[6] ? row.cells[6].querySelector("select") : null;
                    if (roleSelect) {
                        roleSelect.value = c.role;
                        if (c.is_staff || c.role === "Admin") {
                            roleSelect.style.background = "#e0f2fe";
                            roleSelect.style.color = "#0369a1";
                            roleSelect.style.borderColor = "#7dd3fc";
                        } else if (c.role === "Delivery Boy") {
                            roleSelect.style.background = "#fef3c7";
                            roleSelect.style.color = "#92400e";
                            roleSelect.style.borderColor = "#fcd34d";
                        } else {
                            roleSelect.style.background = "#f3f4f6";
                            roleSelect.style.color = "#374151";
                            roleSelect.style.borderColor = "#d1d5db";
                        }
                    }
                });
                closeCustomerModal();
                showToast("Account details updated successfully!");
            })
            .catch(function (err) {
                console.error("Error:", err);
                showToast("Failed to update account.", "error");
            });
    });
}


/* ================= CHANGE CUSTOMER ROLE (DIRECT SELECT DROPDOWN) ================= */

function changeCustomerRole(selectElement) {
    const row = selectElement.closest("tr");
    const customerId = row.getAttribute("data-customer-id");
    const newRole = selectElement.value;

    fetch("/admin/api/customers/" + customerId + "/edit/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: newRole })
    })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (data.error) {
                showToast(data.error, "error");
                return;
            }
            const isStaff = data.customer.is_staff;
            const role = data.customer.role;
            if (isStaff || role === "Admin") {
                selectElement.style.background = "#e0f2fe";
                selectElement.style.color = "#0369a1";
                selectElement.style.borderColor = "#7dd3fc";
            } else if (role === "Delivery Boy") {
                selectElement.style.background = "#fef3c7";
                selectElement.style.color = "#92400e";
                selectElement.style.borderColor = "#fcd34d";
            } else {
                selectElement.style.background = "#f3f4f6";
                selectElement.style.color = "#374151";
                selectElement.style.borderColor = "#d1d5db";
            }
            showToast("User role updated to " + role + "!");

            // Reload page so Delivery Boys list updates
            setTimeout(function () {
                window.location.href = window.location.pathname + "#customers";
                window.location.reload();
            }, 600);
        })
        .catch(function (err) {
            console.error("Error:", err);
            showToast("Failed to change user role.", "error");
        });
}


/* ================= TOGGLE CUSTOMER STATUS (BACKEND) ================= */

function toggleCustomerStatus(button) {
    const row = button.closest("tr");
    const customerId = row.getAttribute("data-customer-id");

    fetch("/admin/api/customers/" + customerId + "/toggle-status/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json"
        }
    })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (data.error) {
                showToast(data.error, "error");
                return;
            }
            const statusCell = row.cells[7];
            const statusClass = data.is_active ? "active-status" : "inactive-status";
            const statusText = data.is_active ? "Active" : "Inactive";
            statusCell.innerHTML = '<span class="' + statusClass + '">' + statusText + '</span>';

            button.innerHTML = data.is_active ? "⛔ Deactivate" : "✅ Activate";
            showToast(data.message);
        })
        .catch(function (err) {
            console.error("Error:", err);
            showToast("Failed to change customer status.", "error");
        });
}


/* ================= DELETE CUSTOMER (BACKEND) ================= */

function deleteCustomer(button) {
    const row = button.closest("tr");
    const customerId = row.getAttribute("data-customer-id");
    const customerName = row.cells[0].innerText.trim();

    const confirmDelete = confirm("Are you sure you want to delete customer '" + customerName + "'?");
    if (!confirmDelete) return;

    fetch("/admin/api/customers/" + customerId + "/delete/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json"
        }
    })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (data.error) {
                showToast(data.error, "error");
                return;
            }
            row.remove();
            showToast(data.message || "Customer deleted!");
        })
        .catch(function (err) {
            console.error("Error:", err);
            showToast("Failed to delete customer.", "error");
        });
}


/* ================= CLOSE MODALS ================= */

const customerModal = document.getElementById("customerModal");
if (customerModal) {
    customerModal.addEventListener("click", function (event) {
        if (event.target === this) {
            closeCustomerModal();
        }
    });
}

document.getElementById("productModal").addEventListener("click", function (event) {
    if (event.target === this) {
        closeAddProduct();
    }
});

document.getElementById("categoryModal").addEventListener("click", function (event) {
    if (event.target === this) {
        closeAddCategory();
    }
});


/* ================= ESC KEY ================= */

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeAddProduct();
        closeAddCategory();
        closeCustomerModal();
    }
});


/* ================= ADMIN PROFILE & DROPDOWN ================= */

function toggleAdminProfileMenu(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById("adminProfileDropdown");
    const profileBtn = document.getElementById("adminProfileBtn");
    if (dropdown) {
        dropdown.classList.toggle("show");
    }
    if (profileBtn) {
        profileBtn.classList.toggle("active");
    }
}

// Close dropdown on outside click
document.addEventListener("click", function (e) {
    const dropdown = document.getElementById("adminProfileDropdown");
    const profileBtn = document.getElementById("adminProfileBtn");
    if (dropdown && !dropdown.contains(e.target) && (!profileBtn || !profileBtn.contains(e.target))) {
        dropdown.classList.remove("show");
        if (profileBtn) profileBtn.classList.remove("active");
    }
});

function uploadAdminAvatar(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append("avatar", file);

    const csrfToken = getCSRFToken();

    showToast("Uploading avatar photo...", "info");

    fetch("/profile/avatar/", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrfToken
        },
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.avatar_url) {
                const avatarCardImg = document.getElementById("adminProfileAvatarImg");
                if (avatarCardImg) avatarCardImg.src = data.avatar_url;

                const headerAvatar = document.getElementById("headerAdminAvatarImg");
                if (headerAvatar) {
                    headerAvatar.src = data.avatar_url;
                } else {
                    const avatarContainer = document.querySelector(".admin-profile .admin-avatar");
                    if (avatarContainer) {
                        avatarContainer.innerHTML = '<img src="' + data.avatar_url + '" alt="Admin Avatar" id="headerAdminAvatarImg" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
                    }
                }
                showToast("Profile avatar updated successfully!");
            } else {
                showToast(data.error || "Failed to update avatar.", "error");
            }
        })
        .catch(err => {
            console.error("Avatar upload error:", err);
            showToast("Error uploading avatar.", "error");
        });
}

function saveAdminProfile(event) {
    if (event) event.preventDefault();

    const firstName = document.getElementById("adminFirstName").value.trim();
    const lastName = document.getElementById("adminLastName").value.trim();
    const email = document.getElementById("adminEmail").value.trim();
    const phone = document.getElementById("adminPhone").value.trim();
    const address = document.getElementById("adminAddress").value.trim();
    const btn = document.getElementById("saveAdminProfileBtn");

    const formData = new FormData();
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("address", address);

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Saving...";
    }

    fetch("/profile/update/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "✓ Save Profile Changes";
            }

            if (data.success) {
                const fullName = (firstName + " " + lastName).trim() || "Administrator";

                const cardName = document.getElementById("adminCardFullName");
                if (cardName) cardName.textContent = fullName;

                const headerName = document.getElementById("headerAdminName");
                if (headerName) headerName.textContent = fullName;

                const dropdownName = document.getElementById("dropdownAdminName");
                if (dropdownName) dropdownName.textContent = fullName;

                showToast("Admin profile updated successfully!");
            } else {
                showToast(data.error || "Failed to update profile.", "error");
            }
        })
        .catch(err => {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "✓ Save Profile Changes";
            }
            console.error("Profile update error:", err);
            showToast("Something went wrong.", "error");
        });
}

function changeAdminPassword(event) {
    if (event) event.preventDefault();

    const currentPassword = document.getElementById("adminCurrentPassword").value;
    const newPassword = document.getElementById("adminNewPassword").value;
    const confirmPassword = document.getElementById("adminConfirmPassword").value;
    const btn = document.getElementById("changeAdminPasswordBtn");

    if (newPassword !== confirmPassword) {
        showToast("New passwords do not match!", "error");
        return;
    }

    if (newPassword.length < 6) {
        showToast("Password must be at least 6 characters long.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("current_password", currentPassword);
    formData.append("new_password", newPassword);
    formData.append("confirm_password", confirmPassword);

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Updating...";
    }

    fetch("/profile/change-password/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "🔑 Update Password";
            }

            if (data.success) {
                document.getElementById("adminPasswordForm").reset();
                showToast("Password changed successfully!");
            } else {
                showToast(data.error || "Failed to change password.", "error");
            }
        })
        .catch(err => {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "🔑 Update Password";
            }
            console.error("Password change error:", err);
            showToast("Something went wrong.", "error");
        });
}

/* =====================================================
   COUPONS MANAGEMENT
===================================================== */

function openAddCouponModal() {
    const modal = document.getElementById("addCouponModal");
    if (modal) modal.classList.add("active");
}

function closeAddCouponModal() {
    const modal = document.getElementById("addCouponModal");
    if (modal) modal.classList.remove("active");
    const form = document.getElementById("addCouponForm");
    if (form) form.reset();
}

function submitAddCoupon(event) {
    event.preventDefault();

    const code = document.getElementById("couponCode").value.trim().toUpperCase();
    const discountType = document.getElementById("couponDiscountType").value;
    const discountValue = document.getElementById("couponDiscountValue").value;
    const minAmount = document.getElementById("couponMinAmount").value || 0;
    const validUntil = document.getElementById("couponValidUntil").value;

    const btn = document.getElementById("couponSubmitBtn");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Creating...";
    }

    const formData = new FormData();
    formData.append("code", code);
    formData.append("discount_type", discountType);
    formData.append("discount_value", discountValue);
    formData.append("min_order_amount", minAmount);
    if (validUntil) {
        formData.append("valid_until", validUntil);
    }

    fetch("/admin/api/coupons/add/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "+ Create Coupon";
            }

            if (data.error) {
                showToast(data.error, "error");
                return;
            }

            if (data.success) {
                closeAddCouponModal();
                showToast(`🎟️ Coupon '${data.coupon.code}' created successfully!`);

                const table = document.getElementById("couponTable");
                const c = data.coupon;
                const discountLabel = c.discount_type === "Percentage (%)"
                    ? `${parseFloat(c.discount_value).toFixed(0)}% OFF`
                    : `₹${c.discount_value} OFF`;

                const row = document.createElement("tr");
                row.setAttribute("data-coupon-id", c.id);
                row.innerHTML = `
                <td>
                    <span class="badge-pill" style="background:#e8f5e9; color:#078046; font-size:14px; font-weight:700; padding:6px 12px; font-family:monospace; border:1px dashed #078046;">
                        🎟️ ${c.code}
                    </span>
                </td>
                <td><strong style="color:#0f172a;">${discountLabel}</strong></td>
                <td>₹${c.min_order_amount}</td>
                <td>${c.valid_until}</td>
                <td>${c.used_count} times</td>
                <td>
                    <button type="button" class="status-toggle-btn btn-available" onclick="toggleCouponStatus(this, ${c.id})" title="Click to toggle status">
                        ● Active
                    </button>
                </td>
                <td>
                    <button class="delete-btn" onclick="deleteCoupon(this, ${c.id})">🗑 Delete</button>
                </td>
            `;

                const emptyRow = table.querySelector('td[colspan="7"]');
                if (emptyRow) emptyRow.closest('tr').remove();

                table.prepend(row);
            }
        })
        .catch(err => {
            if (btn) {
                btn.disabled = false;
                btn.textContent = "+ Create Coupon";
            }
            showToast("Error creating coupon.", "error");
        });
}

function toggleCouponStatus(btn, couponId) {
    fetch(`/admin/api/coupons/${couponId}/toggle-status/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.is_active) {
                    btn.className = "status-toggle-btn btn-available";
                    btn.textContent = "● Active";
                } else {
                    btn.className = "status-toggle-btn btn-unavailable";
                    btn.textContent = "● Inactive";
                }
                showToast("Coupon status updated!");
            } else {
                showToast(data.error || "Failed to update coupon status.", "error");
            }
        })
        .catch(err => {
            showToast("Error toggling coupon status.", "error");
        });
}

function deleteCoupon(btn, couponId) {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    fetch(`/admin/api/coupons/${couponId}/delete/`, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const row = btn.closest("tr");
                if (row) row.remove();
                showToast("Coupon deleted successfully!");
            } else {
                showToast(data.error || "Failed to delete coupon.", "error");
            }
        })
        .catch(err => {
            showToast("Error deleting coupon.", "error");
        });
}

/* =====================================================
   STORE SETTINGS MANAGEMENT
===================================================== */

function saveStoreSettings(event) {
    event.preventDefault();

    const btn = document.getElementById("btnSaveStoreSettings");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "<span>Saving...</span>";
    }

    const formData = new FormData();
    formData.append("store_name", document.getElementById("settingStoreName").value.trim());
    formData.append("contact_phone", document.getElementById("settingContactPhone").value.trim());
    formData.append("contact_email", document.getElementById("settingContactEmail").value.trim());
    formData.append("operating_hours", document.getElementById("settingOperatingHours").value.trim());
    formData.append("store_address", document.getElementById("settingStoreAddress").value.trim());

    formData.append("free_delivery_threshold", document.getElementById("settingFreeDeliveryThreshold").value);
    formData.append("standard_delivery_charge", document.getElementById("settingStandardDelivery").value);
    formData.append("packaging_charge", document.getElementById("settingPackagingCharge").value);

    formData.append("store_open", document.getElementById("settingStoreOpen").checked ? "true" : "false");
    formData.append("enable_cod", document.getElementById("settingEnableCOD").checked ? "true" : "false");
    formData.append("enable_online", document.getElementById("settingEnableOnline").checked ? "true" : "false");
    formData.append("show_announcement", document.getElementById("settingShowAnnouncement").checked ? "true" : "false");
    formData.append("announcement_text", document.getElementById("settingAnnouncementText").value.trim());

    fetch("/admin/api/settings/update/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken()
        },
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = "<span>💾 Save Store Settings</span>";
            }

            if (data.success) {
                showToast("✅ " + (data.message || "Settings saved successfully!"));
            } else {
                showToast(data.error || "Failed to update settings.", "error");
            }
        })
        .catch(err => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = "<span>💾 Save Store Settings</span>";
            }
            showToast("Network error saving settings.", "error");
        });
}


/* ================= DELIVERY BOYS MANAGEMENT ================= */

function openAddDeliveryBoy() {
    const modal = document.getElementById("deliveryBoyModal");
    if (!modal) return;

    document.getElementById("editDeliveryBoyId").value = "";
    document.getElementById("deliveryBoyModalTitle").textContent = "Add New Delivery Boy";
    document.getElementById("deliveryBoyModalSubtitle").textContent = "Create a new delivery partner account";
    document.getElementById("deliveryBoySaveBtn").textContent = "+ Add Delivery Boy";
    document.getElementById("deliveryBoyPasswordHint").textContent = "(Required)";
    document.getElementById("deliveryBoyPassword").required = true;
    document.getElementById("addDeliveryBoyForm").reset();

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeDeliveryBoyModal() {
    const modal = document.getElementById("deliveryBoyModal");
    if (modal) {
        modal.classList.remove("show");
        document.body.style.overflow = "auto";
    }
}

function editDeliveryBoy(button) {
    const row = button.closest("tr");
    const boyId = row.getAttribute("data-boy-id");
    const username = row.getAttribute("data-username") || "";
    const name = row.getAttribute("data-name") || "";
    const email = row.getAttribute("data-email") || "";
    const phone = row.getAttribute("data-phone") || "";
    const address = row.getAttribute("data-address") || "";
    const isActive = row.getAttribute("data-active") === "true";

    document.getElementById("editDeliveryBoyId").value = boyId;
    document.getElementById("deliveryBoyModalTitle").textContent = "Edit Delivery Boy";
    document.getElementById("deliveryBoyModalSubtitle").textContent = "Update delivery partner details";
    document.getElementById("deliveryBoySaveBtn").textContent = "✓ Save Changes";
    document.getElementById("deliveryBoyPasswordHint").textContent = "(Leave blank to keep current)";
    document.getElementById("deliveryBoyPassword").required = false;

    document.getElementById("deliveryBoyName").value = name;
    document.getElementById("deliveryBoyUsername").value = username;
    document.getElementById("deliveryBoyEmail").value = email;
    document.getElementById("deliveryBoyPhone").value = phone;
    document.getElementById("deliveryBoyAddress").value = address;
    document.getElementById("deliveryBoyPassword").value = "";
    document.getElementById("deliveryBoyStatus").value = isActive ? "true" : "false";

    const modal = document.getElementById("deliveryBoyModal");
    if (modal) {
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
    }
}

const addDeliveryBoyForm = document.getElementById("addDeliveryBoyForm");
if (addDeliveryBoyForm) {
    addDeliveryBoyForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const boyId = document.getElementById("editDeliveryBoyId").value;
        const name = document.getElementById("deliveryBoyName").value.trim();
        const username = document.getElementById("deliveryBoyUsername").value.trim();
        const email = document.getElementById("deliveryBoyEmail").value.trim();
        const phone = document.getElementById("deliveryBoyPhone").value.trim();
        const address = document.getElementById("deliveryBoyAddress").value.trim();
        const password = document.getElementById("deliveryBoyPassword").value.trim();
        const isActive = document.getElementById("deliveryBoyStatus").value === "true";

        const url = boyId ? "/admin/api/delivery-boys/" + boyId + "/edit/" : "/admin/api/delivery-boys/add/";

        const payload = {
            name: name,
            username: username,
            email: email,
            phone: phone,
            address: address,
            password: password,
            is_active: isActive
        };

        fetch(url, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCSRFToken(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    showToast(data.error, "error");
                    return;
                }

                closeDeliveryBoyModal();
                showToast(data.message || "Delivery boy saved successfully!");

                setTimeout(() => {
                    window.location.reload();
                }, 500);
            })
            .catch(err => {
                console.error("Error saving delivery boy:", err);
                showToast("Failed to save delivery boy.", "error");
            });
    });
}

function toggleDeliveryBoyStatus(button) {
    const row = button.closest("tr");
    const boyId = row.getAttribute("data-boy-id");

    fetch("/admin/api/delivery-boys/" + boyId + "/toggle-status/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json"
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showToast(data.error, "error");
                return;
            }

            row.setAttribute("data-active", data.is_active ? "true" : "false");
            const statusCell = row.cells[7];
            if (statusCell) {
                const statusClass = data.is_active ? "active-status" : "inactive-status";
                const statusText = data.is_active ? "Active" : "Inactive";
                statusCell.innerHTML = '<span class="' + statusClass + '">' + statusText + '</span>';
            }

            button.innerHTML = data.is_active ? "⛔ Deactivate" : "✅ Activate";
            showToast(data.message);
        })
        .catch(err => {
            console.error("Status toggle error:", err);
            showToast("Failed to change status.", "error");
        });
}

function deleteDeliveryBoy(button) {
    const row = button.closest("tr");
    const boyId = row.getAttribute("data-boy-id");
    const name = row.getAttribute("data-name") || "this delivery boy";

    if (!confirm("Are you sure you want to delete delivery boy '" + name + "'?")) return;

    fetch("/admin/api/delivery-boys/" + boyId + "/delete/", {
        method: "POST",
        headers: {
            "X-CSRFToken": getCSRFToken(),
            "Content-Type": "application/json"
        }
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showToast(data.error, "error");
                return;
            }
            row.remove();
            showToast(data.message || "Delivery boy deleted!");
        })
        .catch(err => {
            console.error("Delete error:", err);
            showToast("Failed to delete delivery boy.", "error");
        });
}

// Delivery Boy Search Filter Listener
const deliveryBoySearch = document.getElementById("deliveryBoySearch");
if (deliveryBoySearch) {
    deliveryBoySearch.addEventListener("input", function () {
        const query = this.value.toLowerCase().trim();
        const rows = document.querySelectorAll("#deliveryBoyTable tr[data-boy-id]");

        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(query) ? "" : "none";
        });
    });
}

// Close Delivery Boy Modal on Backdrop click & ESC key
const deliveryBoyModalEl = document.getElementById("deliveryBoyModal");
if (deliveryBoyModalEl) {
    deliveryBoyModalEl.addEventListener("click", function (event) {
        if (event.target === this) {
            closeDeliveryBoyModal();
        }
    });
}
/* ================= DELIVERY BOY SALES MODAL ================= */

function viewDeliveryBoySales(button) {
    const row = button.closest("tr");
    const boyId = row.getAttribute("data-boy-id");
    const boyName = row.getAttribute("data-name") || "Delivery Partner";

    document.getElementById("salesModalTitle").textContent = "📊 " + boyName + " — Sales Report";
    document.getElementById("salesModalSubtitle").textContent = "Loading data...";
    document.getElementById("salesTotalOrders").textContent = "—";
    document.getElementById("salesGrandTotal").textContent = "—";
    document.getElementById("salesTotalProducts").textContent = "—";
    document.getElementById("salesProductTable").innerHTML =
        '<tr><td colspan="3" style="text-align:center;color:#aaa;padding:1rem;">Loading...</td></tr>';
    document.getElementById("salesOrderTable").innerHTML =
        '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:1rem;">Loading...</td></tr>';

    const modal = document.getElementById("deliveryBoySalesModal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    fetch("/admin/api/delivery-boys/" + boyId + "/sales/", {
        headers: { "X-CSRFToken": getCSRFToken() }
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
        if (data.error) { showToast(data.error, "error"); closeDeliveryBoySalesModal(); return; }

        const s = data.summary;
        document.getElementById("salesModalSubtitle").textContent =
            "@" + data.boy.username + (data.boy.phone ? " · " + data.boy.phone : "");
        document.getElementById("salesTotalOrders").textContent = s.total_orders;
        document.getElementById("salesGrandTotal").textContent = "₹" + s.grand_total.toLocaleString("en-IN");
        document.getElementById("salesTotalProducts").textContent = s.products.length;

        if (s.products.length === 0) {
            document.getElementById("salesProductTable").innerHTML =
                '<tr><td colspan="3" style="text-align:center;color:#aaa;padding:1rem;">No products sold yet.</td></tr>';
        } else {
            document.getElementById("salesProductTable").innerHTML = s.products.map(function (p) {
                return '<tr><td><strong>' + p.name + '</strong></td><td style="text-align:center;">' + p.qty +
                    '</td><td style="text-align:right;font-weight:700;color:#078046;">₹' +
                    p.revenue.toLocaleString("en-IN") + '</td></tr>';
            }).join("");
        }

        if (data.orders.length === 0) {
            document.getElementById("salesOrderTable").innerHTML =
                '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:1rem;">No orders delivered yet.</td></tr>';
        } else {
            document.getElementById("salesOrderTable").innerHTML = data.orders.map(function (o) {
                const itemsList = o.items.map(function (i) { return i.qty + "x " + i.name; }).join(", ");
                return '<tr>' +
                    '<td><code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">#' + o.order_id + '</code></td>' +
                    '<td>' + o.customer + '</td>' +
                    '<td style="font-size:0.82rem;color:#6b7280;">' + itemsList + '</td>' +
                    '<td style="text-align:right;font-weight:700;color:#078046;">₹' + o.total.toLocaleString("en-IN") + '</td>' +
                    '<td><span style="font-size:0.8rem;background:#e0f2fe;color:#0369a1;padding:2px 8px;border-radius:999px;">' + o.payment + '</span></td>' +
                    '<td style="font-size:0.8rem;color:#6b7280;">' + o.delivered_at + '</td></tr>';
            }).join("");
        }
    })
    .catch(function (err) {
        console.error("Sales fetch error:", err);
        showToast("Failed to load sales data.", "error");
        closeDeliveryBoySalesModal();
    });
}

function closeDeliveryBoySalesModal() {
    const modal = document.getElementById("deliveryBoySalesModal");
    if (modal) { modal.classList.remove("show"); document.body.style.overflow = ""; }
}

const salesModalEl = document.getElementById("deliveryBoySalesModal");
if (salesModalEl) {
    salesModalEl.addEventListener("click", function (event) {
        if (event.target === this) { closeDeliveryBoySalesModal(); }
    });
}
