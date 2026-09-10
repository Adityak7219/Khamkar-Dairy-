/* ================= CSRF HELPER ================= */

function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

/* ================= TOAST ================= */

function showHomeToast(message) {
    const old = document.querySelector('.home-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'home-toast';
    toast.textContent = message;
    toast.style.cssText = [
        'position:fixed',
        'bottom:90px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:#064e34',
        'color:#fff',
        'padding:12px 22px',
        'border-radius:25px',
        'font-size:14px',
        'z-index:9999',
        'box-shadow:0 5px 20px rgba(0,0,0,0.2)',
        'animation:toastIn 0.25s ease'
    ].join(';');

    const style = document.getElementById('home-toast-style');
    if (!style) {
        const s = document.createElement('style');
        s.id = 'home-toast-style';
        s.textContent = '@keyframes toastIn{from{opacity:0;transform:translate(-50%,15px)}to{opacity:1;transform:translate(-50%,0)}}';
        document.head.appendChild(s);
    }

    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 1800);
}

/* ================= QUANTITY ================= */

function changeQty(button, change){
    const quantityBox = button.parentElement;
    const number = quantityBox.querySelector("span");
    let quantity = parseInt(number.textContent);
    quantity += change;
    if(quantity < 1){ quantity = 1; }
    number.textContent = quantity;
}

/* ================= ADD TO CART ================= */

function addCart(productId, buttonElem) {
    const csrfToken = getCsrfToken();

    if (!csrfToken) {
        window.location.href = '/login/';
        return;
    }

    // Walk up the DOM to find quantity span
    // Structure: button > .product-info > (search for .quantity span)
    var container = buttonElem.closest('.product') || buttonElem.closest('.product-info') || buttonElem.parentElement;
    var qtySpan = container ? container.querySelector('.quantity span') : null;
    var quantity = qtySpan ? (parseInt(qtySpan.textContent) || 1) : 1;

    // Visual feedback
    buttonElem.disabled = true;
    buttonElem.innerHTML = '⏳ Adding...';

    fetch('/cart/add/' + productId + '/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ quantity: quantity })
    })
    .then(function(res) {
        if (res.status === 403 || res.status === 401 || res.redirected) {
            window.location.href = '/login/';
            return null;
        }
        return res.json();
    })
    .then(function(data) {
        buttonElem.disabled = false;
        if (!data) return;

        if (data.success) {
            buttonElem.innerHTML = '✓ Added';
            buttonElem.style.background = '#087443';

            // Update all cart count badges on page
            if (data.total_cart_count !== undefined) {
                document.querySelectorAll('.cart-count, #bottomCartCount, #cartBadge, .badge').forEach(function(b) {
                    if (data.total_cart_count > 0) {
                        b.textContent = data.total_cart_count;
                        b.style.display = 'flex';
                    } else {
                        b.textContent = '';
                        b.style.display = 'none';
                    }
                });
            }

            showHomeToast(quantity + ' item(s) added to cart 🛒');

            setTimeout(function() {
                buttonElem.innerHTML = '🛒 Add to Cart';
                buttonElem.style.background = '';
            }, 1200);

        } else {
            buttonElem.innerHTML = '🛒 Add to Cart';
            var msg = data.error || 'Could not add to cart.';
            showHomeToast(msg);
        }
    })
    .catch(function(err) {
        buttonElem.disabled = false;
        buttonElem.innerHTML = '🛒 Add to Cart';
        console.error('Add to cart error:', err);
        showHomeToast('Something went wrong. Please try again.');
    });
}

/* ================= TOGGLE FAVORITE ================= */

function toggleHomeFavorite(productId, buttonElem, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const meta = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = meta ? meta.getAttribute('content') : '';

    if (!csrfToken) {
        window.location.href = '/login/';
        return;
    }

    buttonElem.style.transform = 'scale(1.3)';
    buttonElem.disabled = true;

    fetch('/favourite/toggle/' + productId + '/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(function(res) {
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
    .then(function(data) {
        buttonElem.style.transform = 'scale(1)';
        buttonElem.disabled = false;
        if (!data) return;

        if (data.error) {
            console.error(data.error);
            return;
        }

        if (data.is_favorite) {
            buttonElem.classList.add('active');
            buttonElem.innerHTML = '❤️';
        } else {
            buttonElem.classList.remove('active');
            buttonElem.innerHTML = '♡';
        }
    })
    .catch(function(err) {
        buttonElem.style.transform = 'scale(1)';
        buttonElem.disabled = false;
        console.error('Favorite toggle error:', err);
    });
}

/* ================= HERO CAROUSEL CONTROLLER ================= */

(function initHeroCarousel() {
    const carousel = document.getElementById('heroCarousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.hero-slide');
    const dots = carousel.querySelectorAll('.carousel-dots .dot');
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');

    if (!slides.length) return;

    let currentIndex = 0;
    const TOTAL_SLIDES = slides.length;
    const ROTATION_INTERVAL = 5000; // 5 seconds per slide for smooth experience
    let timer = null;

    function goToSlide(index) {
        if (index < 0) index = TOTAL_SLIDES - 1;
        if (index >= TOTAL_SLIDES) index = 0;

        currentIndex = index;

        slides.forEach(function(slide, i) {
            if (i === currentIndex) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        dots.forEach(function(dot, i) {
            if (i === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    function startAutoRotate() {
        stopAutoRotate();
        timer = setInterval(nextSlide, ROTATION_INTERVAL);
    }

    function stopAutoRotate() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    // Dot click events
    dots.forEach(function(dot) {
        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            const slideIdx = parseInt(dot.getAttribute('data-slide'), 10);
            goToSlide(slideIdx);
            startAutoRotate();
        });
    });

    // Prev / Next button events
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            prevSlide();
            startAutoRotate();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            nextSlide();
            startAutoRotate();
        });
    }

    // Pause on hover, resume on mouse leave
    carousel.addEventListener('mouseenter', stopAutoRotate);
    carousel.addEventListener('mouseleave', startAutoRotate);

    // Touch Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoRotate();
    }, { passive: true });

    carousel.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoRotate();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 40; // minimum distance for swipe
        if (touchEndX < touchStartX - threshold) {
            // Swiped left -> next
            nextSlide();
        } else if (touchEndX > touchStartX + threshold) {
            // Swiped right -> prev
            prevSlide();
        }
    }

    // Start carousel
    startAutoRotate();
})();