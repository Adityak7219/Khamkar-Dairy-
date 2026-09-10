/* ================= CSRF & TOAST UTILS ================= */

function getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

function showToast(message, type = 'success') {
    let toast = document.getElementById('profileToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'profileToast';
        toast.className = 'profile-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'profile-toast show ' + type;
    
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

/* ================= MODAL CONTROL ================= */

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside content box
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('profile-modal-overlay')) {
        event.target.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
});

/* ================= NAVIGATION & HEADER ================= */

function goBack() {
    history.back();
}

function openCart() {
    window.location.href = "/cart/";
}

function openAdminPanel() {
    window.location.href = "/admin-panel/";
}

/* ================= AVATAR PHOTO UPLOAD ================= */

function changePhoto() {
    const input = document.getElementById('avatarFileInput');
    if (input) input.click();
}

function handleAvatarUpload(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('avatar', file);

    // Show instant local preview while uploading
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.getElementById('userAvatarImg');
        if (img) img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    showToast('Uploading photo...', 'info');

    fetch('/profile/avatar/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken()
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const img = document.getElementById('userAvatarImg');
            if (img && data.avatar_url) img.src = data.avatar_url;
            showToast('Profile photo updated successfully! 📸');
        } else {
            showToast(data.error || 'Failed to upload photo', 'error');
        }
    })
    .catch(err => {
        console.error('Avatar upload error:', err);
        showToast('Error uploading photo. Please try again.', 'error');
    });
}

/* ================= SETTINGS CLICK HANDLERS ================= */

function personalInfo() {
    openModal('personalInfoModal');
}

function deliveryAddress() {
    openModal('addressModal');
}

function paymentMethods() {
    openModal('paymentMethodsModal');
}

function notifications() {
    openModal('notificationsModal');
}

function openNotifications() {
    openModal('notificationsModal');
}

function privacySecurity() {
    openModal('privacyModal');
}

function helpSupport() {
    openModal('helpSupportModal');
}

function inviteFriends() {
    openModal('inviteModal');
}

function changePhoto() {
    showToast("Profile avatar automatically updated from your user name!", "info");
}

function editProfile() {
    personalInfo();
}

/* ================= FORM SUBMISSIONS ================= */

function savePersonalInfo(event) {
    event.preventDefault();

    const firstName = document.getElementById('piFirstName').value.trim();
    const lastName = document.getElementById('piLastName').value.trim();
    const email = document.getElementById('piEmail').value.trim();
    const phone = document.getElementById('piPhone').value.trim();

    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('email', email);
    formData.append('phone', phone);

    fetch('/profile/update/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken()
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeModal('personalInfoModal');
            showToast("Personal information updated successfully!");
            
            // Update UI elements instantly
            const nameElem = document.getElementById('displayFullName');
            if (nameElem) nameElem.textContent = data.full_name;

            const phoneElem = document.getElementById('displayPhone');
            if (phoneElem) phoneElem.textContent = data.phone ? '+91 ' + data.phone : 'Not Provided';

            const emailElem = document.getElementById('displayEmail');
            if (emailElem) emailElem.textContent = data.email || 'Not Provided';

            const avatarImg = document.getElementById('userAvatarImg');
            if (avatarImg) {
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=064e34&color=fff&size=400`;
            }
        } else {
            showToast(data.error || "Failed to update profile.", "error");
        }
    })
    .catch(err => {
        console.error(err);
        showToast("Something went wrong. Please try again.", "error");
    });
}

function saveAddress(event) {
    event.preventDefault();
    const address = document.getElementById('deliveryAddressInput').value.trim();

    const formData = new FormData();
    formData.append('address', address);

    fetch('/profile/update/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken()
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeModal('addressModal');
            showToast("Delivery address saved successfully!");
        } else {
            showToast(data.error || "Failed to save address.", "error");
        }
    })
    .catch(err => {
        console.error(err);
        showToast("Something went wrong. Please try again.", "error");
    });
}

function savePassword(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showToast("New passwords do not match.", "error");
        return;
    }

    const formData = new FormData();
    formData.append('current_password', currentPassword);
    formData.append('new_password', newPassword);
    formData.append('confirm_password', confirmPassword);

    fetch('/profile/change-password/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken()
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeModal('privacyModal');
            document.getElementById('privacyForm').reset();
            showToast("Password updated successfully!");
        } else {
            showToast(data.error || "Failed to update password.", "error");
        }
    })
    .catch(err => {
        console.error(err);
        showToast("Something went wrong. Please try again.", "error");
    });
}

function copyReferralCode() {
    const code = document.getElementById('referralCode').innerText;
    navigator.clipboard.writeText(code).then(() => {
        showToast("Referral code copied to clipboard!");
    }).catch(() => {
        showToast("Referral code: " + code);
    });
}