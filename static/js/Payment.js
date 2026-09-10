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

document.addEventListener("DOMContentLoaded", function () {
    const options = document.querySelectorAll(".payment-option");

    const upiBox = document.getElementById("upiBox");
    const cardBox = document.getElementById("cardBox");
    const bankBox = document.getElementById("bankBox");
    const walletBox = document.getElementById("walletBox");
    const codBox = document.getElementById("codBox");

    const payText = document.getElementById("payText");
    const total = window.ORDER_TOTAL || 0;

    function hideAllBoxes() {
        if (upiBox) upiBox.style.display = "none";
        if (cardBox) cardBox.classList.remove("active");
        if (bankBox) bankBox.classList.remove("active");
        if (walletBox) walletBox.classList.remove("active");
        if (codBox) codBox.classList.remove("active");
        clearPaymentError();
    }

    options.forEach(option => {
        option.addEventListener("click", function () {
            options.forEach(item => {
                item.classList.remove("selected");
                const radio = item.querySelector('input[type="radio"]');
                if (radio) radio.checked = false;
            });

            this.classList.add("selected");
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;

            const method = this.dataset.method;
            hideAllBoxes();

            if (method === "upi") {
                if (upiBox) upiBox.style.display = "block";
                if (payText) payText.textContent = `Pay ₹${total}`;
            } else if (method === "card") {
                if (cardBox) cardBox.classList.add("active");
                if (payText) payText.textContent = `Pay ₹${total}`;
            } else if (method === "bank") {
                if (bankBox) bankBox.classList.add("active");
                if (payText) payText.textContent = `Pay ₹${total}`;
            } else if (method === "wallet") {
                if (walletBox) walletBox.classList.add("active");
                if (payText) payText.textContent = `Pay ₹${total}`;
            } else if (method === "cod") {
                if (codBox) codBox.classList.add("active");
                if (payText) payText.textContent = `Place Order ₹${total} (COD)`;
            }
        });
    });

    // --- Card Input Formatting & Badges ---
    const cardNumberInput = document.getElementById("cardNumber");
    const cardTypeBadge = document.getElementById("cardTypeBadge");
    if (cardNumberInput) {
        cardNumberInput.addEventListener("input", function (e) {
            clearInputError(this);
            let val = this.value.replace(/\D/g, "").substring(0, 16);
            let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
            this.value = formatted;

            // Detect card brand
            if (val.startsWith("4")) {
                if (cardTypeBadge) cardTypeBadge.textContent = "💳 Visa";
            } else if (/^5[1-5]/.test(val) || /^2[2-7]/.test(val)) {
                if (cardTypeBadge) cardTypeBadge.textContent = "💳 MC";
            } else if (/^60|^65|^8[1-2]/.test(val) || /^508/.test(val)) {
                if (cardTypeBadge) cardTypeBadge.textContent = "💳 RuPay";
            } else {
                if (cardTypeBadge) cardTypeBadge.textContent = "💳";
            }
        });
    }

    const cardExpiryInput = document.getElementById("cardExpiry");
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener("input", function (e) {
            clearInputError(this);
            let val = this.value.replace(/\D/g, "").substring(0, 4);
            if (val.length >= 3) {
                this.value = val.substring(0, 2) + " / " + val.substring(2, 4);
            } else if (val.length === 2 && e.inputType !== "deleteContentBackward") {
                this.value = val + " / ";
            } else {
                this.value = val;
            }
        });
    }

    const cardCvvInput = document.getElementById("cardCvv");
    if (cardCvvInput) {
        cardCvvInput.addEventListener("input", function () {
            clearInputError(this);
            this.value = this.value.replace(/\D/g, "").substring(0, 4);
        });
    }

    const cardHolderInput = document.getElementById("cardHolder");
    if (cardHolderInput) {
        cardHolderInput.addEventListener("input", function () {
            clearInputError(this);
        });
    }

    const bankUserIdInput = document.getElementById("bankUserId");
    if (bankUserIdInput) {
        bankUserIdInput.addEventListener("input", function () {
            clearInputError(this);
        });
    }

    const walletMobileInput = document.getElementById("walletMobile");
    if (walletMobileInput) {
        walletMobileInput.addEventListener("input", function () {
            clearInputError(this);
            this.value = this.value.replace(/\D/g, "").substring(0, 10);
        });
    }
});

// Quick bank select
function selectQuickBank(bankVal, btn) {
    const bankSelect = document.getElementById("bankSelect");
    if (bankSelect) {
        bankSelect.value = bankVal;
        clearInputError(bankSelect);
    }
    document.querySelectorAll("#bankBox .quick-bank-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
}

function onBankSelectChange(selectElem) {
    clearInputError(selectElem);
    const val = selectElem.value;
    document.querySelectorAll("#bankBox .quick-bank-btn").forEach(btn => {
        if (btn.dataset.bank === val) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

// Quick wallet select
function selectQuickWallet(walletVal, btn) {
    const walletSelect = document.getElementById("walletSelect");
    if (walletSelect) {
        walletSelect.value = walletVal;
        clearInputError(walletSelect);
    }
    document.querySelectorAll("#walletBox .quick-bank-btn").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");
}

function onWalletSelectChange(selectElem) {
    clearInputError(selectElem);
    const val = selectElem.value;
    document.querySelectorAll("#walletBox .quick-bank-btn").forEach(btn => {
        if (btn.dataset.wallet === val) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function showPaymentError(msg, targetInput) {
    const errBox = document.getElementById("paymentErrorBox");
    const errMsg = document.getElementById("paymentErrorMsg");
    if (errBox && errMsg) {
        errMsg.textContent = msg;
        errBox.style.display = "flex";
        errBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    if (targetInput) {
        targetInput.classList.add("has-error");
        targetInput.focus();
    }
}

function clearPaymentError() {
    const errBox = document.getElementById("paymentErrorBox");
    if (errBox) errBox.style.display = "none";
    document.querySelectorAll(".pay-input, .pay-select").forEach(el => el.classList.remove("has-error"));
}

function clearInputError(inputElem) {
    if (inputElem) inputElem.classList.remove("has-error");
    const errBox = document.getElementById("paymentErrorBox");
    if (errBox) errBox.style.display = "none";
}

function copyUPI() {
    const upi = "dairyshop@upi";
    navigator.clipboard.writeText(upi)
        .then(() => {
            alert("Official UPI ID copied to clipboard!");
        })
        .catch(() => {
            alert("UPI ID: " + upi);
        });
}

function makePayment() {
    clearPaymentError();

    const selected = document.querySelector('input[name="payment"]:checked');
    if (!selected) {
        showPaymentError("Please select a payment method.");
        return;
    }

    const method = selected.value;
    const payload = { method: method };

    // --- Method-specific Strict Validations ---
    if (method === "card") {
        const cardNumberInput = document.getElementById("cardNumber");
        const cardExpiryInput = document.getElementById("cardExpiry");
        const cardCvvInput = document.getElementById("cardCvv");
        const cardHolderInput = document.getElementById("cardHolder");

        const rawCardNum = cardNumberInput ? cardNumberInput.value.replace(/\s+/g, "").trim() : "";
        const expiry = cardExpiryInput ? cardExpiryInput.value.trim() : "";
        const cvv = cardCvvInput ? cardCvvInput.value.trim() : "";
        const holder = cardHolderInput ? cardHolderInput.value.trim() : "";

        // 1. Validate Card Number
        if (!rawCardNum || rawCardNum.length < 15 || !/^\d+$/.test(rawCardNum)) {
            showPaymentError("Please enter a valid 16-digit Card Number.", cardNumberInput);
            return;
        }

        // 2. Validate Expiry Date (MM/YY)
        const expiryClean = expiry.replace(/\s+/g, "");
        if (!expiryClean || !expiryClean.includes("/") || expiryClean.length < 5) {
            showPaymentError("Please enter a valid Expiry Date in MM / YY format.", cardExpiryInput);
            return;
        }
        const parts = expiryClean.split("/");
        const expMonth = parseInt(parts[0], 10);
        const expYear = parseInt("20" + parts[1], 10);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
            showPaymentError("Invalid expiry month. Month must be between 01 and 12.", cardExpiryInput);
            return;
        }
        if (isNaN(expYear) || expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
            showPaymentError("The card has expired. Please enter a valid expiry date.", cardExpiryInput);
            return;
        }

        // 3. Validate CVV
        if (!cvv || cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) {
            showPaymentError("Please enter a valid 3 or 4-digit CVV number.", cardCvvInput);
            return;
        }

        // 4. Validate Cardholder Name
        if (!holder || holder.length < 3) {
            showPaymentError("Please enter the full Cardholder's Name.", cardHolderInput);
            return;
        }

        payload.card_number = rawCardNum;
        payload.card_expiry = expiry;
        payload.card_cvv = cvv;
        payload.card_holder = holder;

    } else if (method === "bank") {
        const bankSelect = document.getElementById("bankSelect");
        const bankUserIdInput = document.getElementById("bankUserId");

        const bank = bankSelect ? bankSelect.value.trim() : "";
        const userId = bankUserIdInput ? bankUserIdInput.value.trim() : "";

        if (!bank) {
            showPaymentError("Please select your bank for Net Banking.", bankSelect);
            return;
        }

        if (!userId || userId.length < 3) {
            showPaymentError("Please enter your Net Banking User ID / Customer ID.", bankUserIdInput);
            return;
        }

        payload.bank_name = bank;
        payload.bank_user_id = userId;

    } else if (method === "wallet") {
        const walletSelect = document.getElementById("walletSelect");
        const walletMobileInput = document.getElementById("walletMobile");

        const wallet = walletSelect ? walletSelect.value.trim() : "";
        const mobile = walletMobileInput ? walletMobileInput.value.trim() : "";

        if (!wallet) {
            showPaymentError("Please select a digital wallet.", walletSelect);
            return;
        }

        if (!mobile || mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
            showPaymentError("Please enter a valid 10-digit mobile number registered with the wallet.", walletMobileInput);
            return;
        }

        payload.wallet_name = wallet;
        payload.wallet_mobile = mobile;

    } else if (method === "upi") {
        const userUpiInput = document.getElementById("userUpiId");
        const userUpi = userUpiInput ? userUpiInput.value.trim() : "";

        if (userUpi) {
            if (!userUpi.includes("@") || userUpi.length < 5) {
                showPaymentError("Please enter a valid UPI ID (e.g. yourname@okhdfcbank).", userUpiInput);
                return;
            }
            payload.upi_id = userUpi;
        }
    }

    const orderButton = document.getElementById("orderButton");
    const originalText = orderButton ? orderButton.innerHTML : "";
    if (orderButton) {
        orderButton.disabled = true;
        orderButton.style.opacity = "0.7";
        orderButton.innerHTML = "<span>⏳</span> Processing Payment...";
    }

    fetch("/payment/process/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken
        },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.location.href = data.redirect_url;
        } else {
            showPaymentError(data.error || "Failed to process payment. Please verify your details.");
            if (orderButton) {
                orderButton.disabled = false;
                orderButton.style.opacity = "1";
                orderButton.innerHTML = originalText;
            }
        }
    })
    .catch(err => {
        showPaymentError("Network error. Please check your connection and try again.");
        if (orderButton) {
            orderButton.disabled = false;
            orderButton.style.opacity = "1";
            orderButton.innerHTML = originalText;
        }
    });
}