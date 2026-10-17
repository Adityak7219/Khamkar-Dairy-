/**
 * Orders.js - Interactive Order Management for Khamkar Dairy
 */

/* =====================================================
   STATE & DOM ELEMENTS
===================================================== */
const tabs = document.querySelectorAll(".order-tab");
const searchInput = document.getElementById("orderSearch");
const searchClearBtn = document.getElementById("searchClearBtn");
const noOrders = document.getElementById("noOrders");
const emptySearchPlaceholder = document.getElementById("emptySearchPlaceholder");
const filterDropdownBtn = document.getElementById("filterDropdownBtn");
const filterDropdownMenu = document.getElementById("filterDropdownMenu");
const invoiceModalBackdrop = document.getElementById("invoiceModalBackdrop");
const invoicePrintArea = document.getElementById("invoicePrintArea");
const toastNotification = document.getElementById("toastNotification");

let currentStatus = "all";
let currentPaymentFilter = "all";
let toastTimeout = null;

/* CSRF Cookie Helper */
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
const csrftoken = getCookie('csrftoken') || (document.querySelector('[name=csrfmiddlewaretoken]') ? document.querySelector('[name=csrfmiddlewaretoken]').value : '');

/* =====================================================
   TAB FILTER
===================================================== */
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(item => item.classList.remove("active"));
        tab.classList.add("active");
        currentStatus = tab.dataset.status;
        filterOrders();
    });
});

/* =====================================================
   SEARCH & FILTER LOGIC
===================================================== */
if (searchInput) {
    searchInput.addEventListener("input", () => {
        if (searchClearBtn) {
            searchClearBtn.style.display = searchInput.value.trim().length > 0 ? "block" : "none";
        }
        filterOrders();
    });
}

function clearSearch() {
    if (searchInput) {
        searchInput.value = "";
        if (searchClearBtn) searchClearBtn.style.display = "none";
        currentPaymentFilter = "all";
        // Reset payment filter menu active states
        document.querySelectorAll("#filterDropdownMenu .filter-menu-item").forEach(item => {
            if (item.textContent.includes("All Payments")) item.classList.add("active");
            else if (item.textContent.includes("Online") || item.textContent.includes("Cash on Delivery")) {
                item.classList.remove("active");
            }
        });
        filterOrders();
    }
}

function filterOrders() {
    const orders = document.querySelectorAll(".order-card");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";
    let visibleOrders = 0;

    orders.forEach(order => {
        const status = order.dataset.status;
        const payment = order.dataset.payment;
        const searchData = (order.dataset.search || "").toLowerCase();

        const statusMatch = currentStatus === "all" || status === currentStatus;
        const paymentMatch = currentPaymentFilter === "all" || payment === currentPaymentFilter;
        const searchMatch = !searchText || searchData.includes(searchText);

        if (statusMatch && paymentMatch && searchMatch) {
            order.style.display = "block";
            visibleOrders++;
        } else {
            order.style.display = "none";
        }
    });

    // Update empty states
    if (orders.length === 0) {
        if (noOrders) noOrders.style.display = "block";
        if (emptySearchPlaceholder) emptySearchPlaceholder.style.display = "none";
    } else if (visibleOrders === 0) {
        if (noOrders) noOrders.style.display = "none";
        if (emptySearchPlaceholder) emptySearchPlaceholder.style.display = "block";
    } else {
        if (noOrders) noOrders.style.display = "none";
        if (emptySearchPlaceholder) emptySearchPlaceholder.style.display = "none";
    }
}

/* =====================================================
   FILTER & SORT DROPDOWN
===================================================== */
function toggleFilterMenu() {
    if (filterDropdownMenu) {
        filterDropdownMenu.classList.toggle("show");
    }
}

// Close filter menu when clicked outside
document.addEventListener("click", (e) => {
    if (filterDropdownBtn && filterDropdownMenu && 
        !filterDropdownBtn.contains(e.target) && 
        !filterDropdownMenu.contains(e.target)) {
        filterDropdownMenu.classList.remove("show");
    }
});

function applySort(sortType, element) {
    // Update active class in menu
    const sortItems = document.querySelectorAll("#filterDropdownMenu .filter-menu-item");
    sortItems.forEach(item => {
        if (item.textContent.includes("First") || item.textContent.includes("Amount:")) {
            item.classList.remove("active");
        }
    });
    if (element) element.classList.add("active");

    const ordersList = document.getElementById("ordersList");
    const orderCards = Array.from(document.querySelectorAll(".order-card"));

    orderCards.sort((a, b) => {
        const dateA = parseInt(a.dataset.date || "0", 10);
        const dateB = parseInt(b.dataset.date || "0", 10);
        const amountA = parseFloat(a.dataset.amount || "0");
        const amountB = parseFloat(b.dataset.amount || "0");

        if (sortType === "newest") return dateB - dateA;
        if (sortType === "oldest") return dateA - dateB;
        if (sortType === "amount-high") return amountB - amountA;
        if (sortType === "amount-low") return amountA - amountB;
        return 0;
    });

    orderCards.forEach(card => ordersList.appendChild(card));
    if (filterDropdownMenu) filterDropdownMenu.classList.remove("show");
}

function applyPaymentFilter(paymentType, element) {
    currentPaymentFilter = paymentType;

    const paymentItems = document.querySelectorAll("#filterDropdownMenu .filter-menu-item");
    paymentItems.forEach(item => {
        if (item.textContent.includes("Payments") || item.textContent.includes("Online") || item.textContent.includes("Cash on Delivery")) {
            item.classList.remove("active");
        }
    });
    if (element) element.classList.add("active");

    filterOrders();
    if (filterDropdownMenu) filterDropdownMenu.classList.remove("show");
}

/* =====================================================
   TOGGLE ORDER DETAILS (ACCORDION)
===================================================== */
function toggleOrderDetails(orderId) {
    const card = document.getElementById(`order-card-${orderId}`);
    if (!card) return;

    const isExpanded = card.classList.contains("expanded");
    const header = card.querySelector(".order-card-header");

    if (isExpanded) {
        card.classList.remove("expanded");
        if (header) header.setAttribute("aria-expanded", "false");
    } else {
        card.classList.add("expanded");
        if (header) header.setAttribute("aria-expanded", "true");
    }
}

// Keydown accessibility on order header
document.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("order-card-header")) {
        e.preventDefault();
        e.target.click();
    }
});

/* =====================================================
   BUY AGAIN / REORDER
===================================================== */
function updateCartBadges(count) {
    const badges = document.querySelectorAll(".cart-count, #topCartBadge, #bottomCartCount");
    badges.forEach(b => {
        if (count > 0) {
            b.textContent = count;
            b.style.display = "flex";
        } else {
            b.textContent = "";
            b.style.display = "none";
        }
    });
}

function showToast(message, isError = false) {
    if (!toastNotification) return;
    if (toastTimeout) clearTimeout(toastTimeout);

    toastNotification.textContent = message;
    toastNotification.style.background = isError ? "#b91c1c" : "#075c38";
    toastNotification.classList.add("show");

    toastTimeout = setTimeout(() => {
        toastNotification.classList.remove("show");
    }, 3500);
}

function buyAgainItem(event, productId, productName) {
    if (event) event.stopPropagation();
    if (!productId) return;

    const btn = event ? event.currentTarget : null;
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Adding...";
    }

    fetch(`/cart/add/${productId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken
        },
        body: JSON.stringify({ quantity: 1 })
    })
    .then(res => res.json())
    .then(data => {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "+ Buy Again";
        }
        if (data.success) {
            if (data.total_cart_count !== undefined) {
                updateCartBadges(data.total_cart_count);
            }
            showToast(`🛒 Added "${productName}" to cart!`);
        } else {
            showToast(data.error || "Could not add item to cart.", true);
        }
    })
    .catch(err => {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "+ Buy Again";
        }
        showToast("Failed to connect. Please try again.", true);
    });
}

function reorderAllItems(event, orderId) {
    if (event) event.stopPropagation();
    if (!orderId) return;

    const btn = event ? event.currentTarget : null;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "<span>⏳ Reordering...</span>";
    }

    fetch(`/orders/reorder/${orderId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken
        }
    })
    .then(res => res.json())
    .then(data => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = "<span>🔁 Reorder All Items</span>";
        }
        if (data.success) {
            if (data.total_cart_count !== undefined) {
                updateCartBadges(data.total_cart_count);
            }
            showToast(`🛒 ${data.message}`);
        } else {
            showToast(data.error || "Failed to reorder items.", true);
        }
    })
    .catch(err => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = "<span>🔁 Reorder All Items</span>";
        }
        showToast("Error processing reorder. Please try again.", true);
    });
}

/* =====================================================
   INVOICE / BILL PREVIEW MODAL
===================================================== */
function openInvoiceModal(orderId) {
    const card = document.getElementById(`order-card-${orderId}`);
    if (!card || !invoicePrintArea) return;

    const orderDate = card.querySelector(".info-value") ? card.querySelector(".info-value").textContent.trim() : "";
    const totalAmount = card.querySelector(".amount") ? card.querySelector(".amount").textContent.trim() : "";
    const paymentMethod = card.querySelector(".payment-badge") ? card.querySelector(".payment-badge").textContent.trim() : "";
    const statusText = card.querySelector(".status-badge") ? card.querySelector(".status-badge").textContent.trim() : "";

    // Items
    const items = card.querySelectorAll(".item-detail-row");
    let itemsRowsHTML = "";
    items.forEach((it, idx) => {
        const name = it.querySelector(".item-name") ? it.querySelector(".item-name").textContent.trim() : "Item";
        const pack = it.querySelector(".item-quantity-label") ? it.querySelector(".item-quantity-label strong").textContent.trim() : "";
        const rate = it.querySelector(".item-rate-calc") ? it.querySelector(".item-rate-calc").textContent.trim() : "";
        const qty = it.querySelector(".item-qty-badge") ? it.querySelector(".item-qty-badge").textContent.replace("Qty:", "").trim() : "1";
        const price = it.querySelector(".item-total-price") ? it.querySelector(".item-total-price").textContent.trim() : "";

        itemsRowsHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td>
                    <strong>${name}</strong>
                    ${pack ? `<div style="font-size:11px;color:#64748b;">Pack: ${pack}</div>` : ""}
                </td>
                <td>${rate}</td>
                <td style="text-align:center;">${qty}</td>
                <td class="text-right"><strong>${price}</strong></td>
            </tr>
        `;
    });

    // Subtotal, packaging, delivery
    const subtotalEl = card.querySelector(".summary-row:nth-child(2) span:last-child");
    const subtotal = subtotalEl ? subtotalEl.textContent.trim() : "";
    const packagingEl = card.querySelector(".summary-row:nth-child(3) span:last-child");
    const packaging = packagingEl ? packagingEl.textContent.trim() : "₹10.00";
    const deliveryEl = card.querySelector(".summary-row:nth-child(4) span:last-child");
    const delivery = deliveryEl ? deliveryEl.textContent.trim() : "FREE";

    // Customer
    const customerEl = card.querySelector(".summary-box:last-child .detail-row:nth-child(2) .detail-val");
    const customerName = customerEl ? customerEl.textContent.trim() : "Customer";
    const phoneEl = card.querySelector(".summary-box:last-child .detail-row:nth-child(3) .detail-val");
    const customerPhone = phoneEl ? phoneEl.textContent.trim() : "-";
    const addressEl = card.querySelector(".address-val");
    const customerAddress = addressEl ? addressEl.textContent.trim() : "Standard Delivery";

    invoicePrintArea.innerHTML = `
        <div class="invoice-paper">
            <div class="invoice-top-bar">
                <div>
                    <div class="company-name">🥛 KHAMKAR DAIRY</div>
                    <div class="company-sub">Pure & Fresh Farm Dairy Products</div>
                    <div class="company-sub">Ph: +91 72196 21129 | Email: khamkardairy72@gmail.com</div>
                </div>
                <div class="invoice-meta-right">
                    <div class="invoice-num">#${orderId}</div>
                    <div class="invoice-date">${orderDate}</div>
                    <div style="margin-top:6px;font-size:12px;font-weight:700;color:#087143;">Status: ${statusText}</div>
                </div>
            </div>

            <div class="invoice-addresses">
                <div>
                    <div class="addr-block-title">Billed & Delivered To:</div>
                    <div style="font-weight:700;font-size:13px;">${customerName}</div>
                    <div>Phone: ${customerPhone}</div>
                    <div style="color:#475569;margin-top:2px;">${customerAddress}</div>
                </div>
                <div>
                    <div class="addr-block-title">Payment Info:</div>
                    <div>Payment Mode: <strong>${paymentMethod}</strong></div>
                    <div>Payment Status: <span style="color:#087143;font-weight:700;">Completed</span></div>
                </div>
            </div>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th style="width:30px;">#</th>
                        <th>Item Description</th>
                        <th>Rate Calculation</th>
                        <th style="text-align:center;">Qty</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRowsHTML}
                </tbody>
            </table>

            <div class="invoice-totals">
                <div class="invoice-total-row">
                    <span>Items Subtotal:</span>
                    <span>${subtotal}</span>
                </div>
                <div class="invoice-total-row">
                    <span>Packaging Charges:</span>
                    <span>${packaging}</span>
                </div>
                <div class="invoice-total-row">
                    <span>Delivery Charges:</span>
                    <span>${delivery}</span>
                </div>
                <div class="invoice-total-row grand-total">
                    <span>Grand Total:</span>
                    <span>${totalAmount}</span>
                </div>
            </div>

            <div class="invoice-footer-note">
                Thank you for ordering with Khamkar Dairy! For queries contact khamkardairy72@gmail.com | +91 72196 21129
            </div>
        </div>
    `;

    if (invoiceModalBackdrop) {
        invoiceModalBackdrop.classList.add("show");
    }
}

function closeInvoiceModal() {
    if (invoiceModalBackdrop) {
        invoiceModalBackdrop.classList.remove("show");
    }
}

function closeInvoiceModalOnBackdrop(event) {
    if (event.target === invoiceModalBackdrop) {
        closeInvoiceModal();
    }
}

/* =====================================================
   CANCEL ORDER MODAL & ACTION
===================================================== */
let orderIdToCancel = null;

function openCancelModal(event, orderId) {
    if (event) event.stopPropagation();
    orderIdToCancel = orderId;
    const numText = document.getElementById("cancelOrderNumberText");
    if (numText) numText.textContent = `#${orderId}`;
    const modal = document.getElementById("cancelModalBackdrop");
    if (modal) modal.classList.add("show");
}

function closeCancelModal() {
    orderIdToCancel = null;
    const modal = document.getElementById("cancelModalBackdrop");
    if (modal) modal.classList.remove("show");
}

function closeCancelModalOnBackdrop(event) {
    const modal = document.getElementById("cancelModalBackdrop");
    if (event.target === modal) {
        closeCancelModal();
    }
}

function confirmCancelOrderAction() {
    if (!orderIdToCancel) return;
    const btn = document.getElementById("confirmCancelBtn");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Cancelling...";
    }

    const targetOrderId = orderIdToCancel;
    fetch(`/orders/cancel/${targetOrderId}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken
        }
    })
    .then(res => res.json())
    .then(data => {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Yes, Cancel Order";
        }
        closeCancelModal();

        if (data.success) {
            const card = document.getElementById(`order-card-${targetOrderId}`);
            if (card) {
                // 1. Update dataset status so tab filtering works
                card.dataset.status = "cancelled";

                // 2. Update Status Badge in Card Header
                const statusBadge = card.querySelector(".status-badge");
                if (statusBadge) {
                    statusBadge.className = "status-badge status-cancelled";
                    statusBadge.innerHTML = '<span class="status-dot"></span>Cancelled';
                }

                // 3. Update Status Info label and value in header
                const metaCols = card.querySelectorAll(".order-card-header .order-meta-col");
                if (metaCols.length >= 3) {
                    const statusCol = metaCols[2];
                    const infoLabels = statusCol.querySelectorAll(".info-label");
                    const infoValues = statusCol.querySelectorAll(".info-value");
                    if (infoLabels.length >= 2 && infoValues.length >= 1) {
                        infoLabels[1].textContent = "Status Info";
                        infoValues[0].className = "info-value text-muted";
                        infoValues[0].textContent = "Order was cancelled";
                    }
                }

                // 4. Update Status Tracker Timeline
                const timelineSteps = card.querySelectorAll(".timeline-steps .timeline-step");
                const timelineLines = card.querySelectorAll(".timeline-steps .timeline-line");
                if (timelineSteps.length >= 3) {
                    // Step 1: Order Placed (remains completed)
                    timelineSteps[0].className = "timeline-step completed";

                    // Line 1
                    if (timelineLines.length >= 1) {
                        timelineLines[0].className = "timeline-line";
                    }

                    // Step 2: Processing (no longer active)
                    timelineSteps[1].className = "timeline-step";
                    const stepTime2 = timelineSteps[1].querySelector(".step-time");
                    if (stepTime2) stepTime2.textContent = "Cancelled";

                    // Line 2
                    if (timelineLines.length >= 2) {
                        timelineLines[1].className = "timeline-line";
                    }

                    // Step 3: Delivered / Cancelled
                    timelineSteps[2].className = "timeline-step cancelled";
                    const stepIcon3 = timelineSteps[2].querySelector(".step-icon");
                    if (stepIcon3) stepIcon3.textContent = "✕";
                    const stepLabel3 = timelineSteps[2].querySelector(".step-label");
                    if (stepLabel3) stepLabel3.textContent = "Order Cancelled";
                    const stepTime3 = timelineSteps[2].querySelector(".step-time");
                    if (stepTime3) stepTime3.textContent = "Cancelled";
                }

                // 5. Remove the Cancel Order button from drawer actions
                const cancelBtn = card.querySelector(".btn-cancel-order");
                if (cancelBtn) cancelBtn.remove();

                // 6. Refresh filters according to current tab
                filterOrders();
            }
            showToast(`✕ ${data.message}`);
        } else {
            showToast(data.error || "Failed to cancel order.", true);
        }
    })
    .catch(err => {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Yes, Cancel Order";
        }
        closeCancelModal();
        showToast("Error cancelling order. Please try again.", true);
    });
}

/* =====================================================
   PRINT INVOICE
===================================================== */
function printInvoice() {
    window.print();
}

/* =====================================================
   INITIALIZATION
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    filterOrders();
});

/* =====================================================
   PRODUCT REVIEW MODAL & ACTIONS
===================================================== */
let currentActiveReviewBtn = null;

function openReviewModal(event, productId, productName, currentRating = 0, currentComment = '') {
    if (event) event.stopPropagation();
    
    currentActiveReviewBtn = event ? event.currentTarget : null;
    
    document.getElementById("reviewProductId").value = productId;
    document.getElementById("reviewProductName").textContent = productName;
    document.getElementById("reviewComment").value = currentComment;
    
    setReviewRating(currentRating);
    
    const backdrop = document.getElementById("reviewModalBackdrop");
    if (backdrop) backdrop.classList.add("show");
}

function closeReviewModal() {
    const backdrop = document.getElementById("reviewModalBackdrop");
    if (backdrop) backdrop.classList.remove("show");
    currentActiveReviewBtn = null;
}

function closeReviewModalOnBackdrop(event) {
    const backdrop = document.getElementById("reviewModalBackdrop");
    if (event.target === backdrop) {
        closeReviewModal();
    }
}

function setReviewRating(rating) {
    document.getElementById("reviewRatingInput").value = rating;
    const stars = document.querySelectorAll("#starRatingPicker .star");
    const labels = ["", "1★ Poor", "2★ Fair", "3★ Good", "4★ Very Good", "5★ Excellent!"];
    
    stars.forEach((star, idx) => {
        if (idx < rating) {
            star.classList.add("selected");
        } else {
            star.classList.remove("selected");
        }
    });
    
    const labelText = document.getElementById("ratingLabelText");
    if (labelText) {
        labelText.textContent = labels[rating] || "Tap a star to rate";
        labelText.style.color = rating > 0 ? "#078046" : "#666";
    }
}

function submitProductReview(event) {
    event.preventDefault();
    
    const productId = document.getElementById("reviewProductId").value;
    const rating = document.getElementById("reviewRatingInput").value;
    const comment = document.getElementById("reviewComment").value.trim();
    
    if (!rating || parseInt(rating) === 0) {
        showToast("Please select a star rating (1-5).", true);
        return;
    }
    
    const submitBtn = document.getElementById("btnSubmitReview");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
    }
    
    const formData = new FormData();
    formData.append("product_id", productId);
    formData.append("rating", rating);
    formData.append("comment", comment);
    
    fetch("/api/review/submit/", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Review";
        }
        
        if (data.success) {
            closeReviewModal();
            showToast(`⭐ ${data.message}`);
            
            // Update button text in the UI
            if (currentActiveReviewBtn) {
                currentActiveReviewBtn.className = "review-btn has-review";
                currentActiveReviewBtn.textContent = `⭐ Edit Review (${data.rating}★)`;
                const pName = document.getElementById("reviewProductName").textContent;
                currentActiveReviewBtn.setAttribute("onclick", `openReviewModal(event, ${productId}, '${pName.replace(/'/g, "\\'")}', ${data.rating}, '${comment.replace(/'/g, "\\'")}')`);
            } else {
                setTimeout(() => window.location.reload(), 800);
            }
        } else {
            showToast(data.error || "Failed to submit review.", true);
        }
    })
    .catch(err => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Review";
        }
        showToast("Network error submitting review.", true);
    });
}

// ── LIVE GPS LOCATION SHARING FOR ORDERS ──
function shareLiveGpsForOrder(orderId) {
    const btn = document.getElementById(`btnShareGps-${orderId}`);
    const msg = document.getElementById(`gpsSyncMsg-${orderId}`);
    const badge = document.getElementById(`orderGpsBadge-${orderId}`);

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    if (btn) btn.innerHTML = "<span>⏳</span> Pinning GPS...";
    if (msg) {
        msg.style.display = "block";
        msg.style.color = "#166534";
        msg.style.background = "#dcfce7";
        msg.innerText = "📡 Connecting to device GPS & network location...";
    }

    const onLocationFound = (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        fetch(`/orders/update-location/${orderId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": typeof csrftoken !== "undefined" ? csrftoken : ""
            },
            body: JSON.stringify({ latitude: lat, longitude: lng })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (btn) {
                    btn.style.background = "#059669";
                    btn.innerHTML = "<span>✓</span> Location Shared";
                }
                if (msg) {
                    msg.innerText = `✓ Exact GPS coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) successfully shared with delivery partner!`;
                }
                if (badge) {
                    badge.innerHTML = `<span style="color:#15803d; font-weight:700; display:inline-flex; align-items:center; gap:4px;"><span>🎯</span> Live GPS Pinned (${lat.toFixed(4)}, ${lng.toFixed(4)})</span>`;
                }
                if (typeof showToast === "function") {
                    showToast("🎯 Live GPS location shared with delivery partner!");
                }
            } else {
                if (btn) btn.innerHTML = "<span>🎯</span> Try Again";
                if (msg) {
                    msg.style.color = "#b91c1c";
                    msg.style.background = "#fee2e2";
                    msg.innerText = data.error || "Failed to update location.";
                }
            }
        })
        .catch(err => {
            console.error(err);
            if (btn) btn.innerHTML = "<span>🎯</span> Try Again";
            if (msg) {
                msg.style.color = "#b91c1c";
                msg.style.background = "#fee2e2";
                msg.innerText = "Network error updating location.";
            }
        });
    };

    const tryStandardAccuracy = () => {
        navigator.geolocation.getCurrentPosition(
            onLocationFound,
            (err) => {
                if (btn) btn.innerHTML = "<span>🎯</span> Try Again";
                if (msg) {
                    msg.style.color = "#b91c1c";
                    msg.style.background = "#fee2e2";
                    msg.innerText = "⚠️ Location permission was denied or unavailable. Please allow location permissions in your browser.";
                }
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
    };

    navigator.geolocation.getCurrentPosition(
        onLocationFound,
        (err) => {
            console.warn("High accuracy GPS failed, falling back to standard...", err);
            tryStandardAccuracy();
        },
        { enableHighAccuracy: true, timeout: 7000 }
    );
}

function shareLocationWhatsApp(orderId, amount) {
    const msg = `नमस्ते खामकर डेअरी! 🥛\n\nमाझी ऑर्डर #${orderId} (रक्कम: ₹${amount || ''}) डिलिव्हरीसाठी मी माझे लोकेशन पाठवत आहे.\n(खालील 📎 Attach -> Location निवडून पाठवा)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}