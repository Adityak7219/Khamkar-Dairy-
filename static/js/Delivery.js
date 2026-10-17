/* =============================================
   DELIVERY BOY PANEL — JavaScript
   Khamkar Dairy © 2026
   ============================================= */

// Global references
let currentModalOrderId = null;
let currentActiveSlot = 'all';

// ── 🌙 DARK THEME CONTROLLER ──
function initDarkTheme() {
    const savedTheme = localStorage.getItem('deliveryTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        updateDarkThemeButtons(true);
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('deliveryTheme', isDark ? 'dark' : 'light');
    updateDarkThemeButtons(isDark);
    showToast(isDark ? '🌙 Night Delivery Theme Enabled' : '☀️ Light Theme Enabled', 'info');
}

function updateDarkThemeButtons(isDark) {
    const btn = document.getElementById('darkModeBtn');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
    const miniBtn = document.querySelector('.theme-toggle-btn-mini');
    if (miniBtn) miniBtn.textContent = isDark ? '☀️' : '🌙';
}


// ── 🥛 EMPTY BOTTLE & CRATE RETURN TRACKER ──
function initBottleTracker() {
    const count = parseInt(localStorage.getItem('collectedBottles') || '0', 10);
    const display = document.getElementById('bottleCountDisplay');
    if (display) display.textContent = count;
}

function adjustBottles(delta) {
    let count = parseInt(localStorage.getItem('collectedBottles') || '0', 10);
    count = Math.max(0, count + delta);
    localStorage.setItem('collectedBottles', count);

    const display = document.getElementById('bottleCountDisplay');
    if (display) display.textContent = count;

    if (delta > 0) {
        showToast(`🥛 Bottle recorded! Total today: ${count}`, 'success');
    }
}

function resetBottleCounter() {
    if (confirm('Reset today’s collected bottle count to 0?')) {
        localStorage.setItem('collectedBottles', '0');
        const display = document.getElementById('bottleCountDisplay');
        if (display) display.textContent = '0';
        showToast('Bottle counter reset to 0.', 'info');
    }
}


// ── 📲 DYNAMIC DOORSTEP UPI QR CODE GENERATOR ──
function generateUPIQRUrl(orderId, amount) {
    const upiPayload = `upi://pay?pa=khamkardairy@upi&pn=Khamkar%20Dairy&am=${amount}&tr=${orderId}&cu=INR&tn=Khamkar%20Dairy%20Order%20${orderId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiPayload)}`;
}

function showDoorstepQR(orderId, customerName, amount) {
    openOrderModal(orderId);
    setTimeout(() => {
        toggleModalDoorstepQR(true);
    }, 150);
}

function toggleModalDoorstepQR(forceShow = null) {
    const qrBox = document.getElementById('modalDoorstepQRBox');
    if (!qrBox) return;

    const shouldShow = forceShow !== null ? forceShow : qrBox.style.display === 'none';
    
    if (shouldShow) {
        if (!currentModalOrderId) return;
        const row = document.querySelector(`.order-row[data-order-id="${currentModalOrderId}"]`);
        if (!row) return;

        const amount = row.dataset.amount || '0';
        const img = document.getElementById('modalQrCodeImg');
        const amountText = document.getElementById('modalQrAmountText');

        if (img) img.src = generateUPIQRUrl(currentModalOrderId, amount);
        if (amountText) amountText.textContent = `Amount: ₹${amount}`;

        qrBox.style.display = 'block';
    } else {
        qrBox.style.display = 'none';
    }
}

function hideModalQR() {
    const qrBox = document.getElementById('modalDoorstepQRBox');
    if (qrBox) qrBox.style.display = 'none';
}


// ── 🛵 SMART "START NEXT DELIVERY" FINDER ──
function startNextDelivery() {
    const isDutyOn = localStorage.getItem('deliveryDuty') !== 'off';
    if (!isDutyOn) {
        showToast('⚠️ तुमची ड्युटी बंद (Off Duty) आहे! डिलिव्हरी सुरू करण्यासाठी ऑन ड्युटी करा.', 'error');
        return;
    }

    const allRows = Array.from(document.querySelectorAll('.order-row'));
    const nextOrderRow = allRows.find(
        r => r.dataset.status === 'pending' || r.dataset.status === 'confirmed' || r.dataset.status === 'out_for_delivery'
    );

    if (!nextOrderRow) {
        showToast('🎉 All orders delivered for today! Great job!', 'success');
        return;
    }

    const orderId = nextOrderRow.dataset.orderId;
    const customerName = nextOrderRow.dataset.name;
    const mapsUrl = nextOrderRow.dataset.mapsUrl;

    showToast(`🛵 Starting delivery for ${customerName} (#${orderId})!`, 'success');

    // Launch navigation in Google Maps
    if (mapsUrl) {
        window.open(mapsUrl, '_blank');
    }

    // Open order modal for quick reference
    openOrderModal(orderId);
}


// ── 🚨 STORE MANAGER SOS HELPLINE ──
function openSOSModal() {
    const backdrop = document.getElementById('sosModalBackdrop');
    if (backdrop) {
        backdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeSOSModal() {
    const backdrop = document.getElementById('sosModalBackdrop');
    if (backdrop) {
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
    }
}


// ── AUDIO CHIME FEEDBACK (Web Audio API) ──
function playDeliveryChime() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        // Note 1 (E5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain1.gain.setValueAtTime(0.2, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.3);

        // Note 2 (A5 - cheerful higher tone)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.55);
    } catch (e) {
        // AudioContext ignore
    }
}


// ── WHATSAPP ALERT GENERATOR ──
function sendWhatsAppAlert(phone, name, orderId, amount) {
    if (!phone || phone === 'N/A' || phone === 'Not Provided') {
        showToast('Customer phone number not available.', 'error');
        return;
    }

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }

    const customerName = name || 'Customer';
    const message = `नमस्ते ${customerName}! 🥛\n\nखामकर डेअरीकडून तुमची ऑर्डर #${orderId} डिलिव्हरीसाठी निघाली आहे.\nरक्कम: ₹${amount}\n\nडिलिव्हरी पार्टनर लवकरच तुमच्या पत्त्यावर पोहोचेल. धन्यवाद! - खामकर डेअरी`;
    
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
}

function requestCustomerLiveLocation(phone, name, orderId) {
    if (!phone || phone === 'N/A' || phone === 'Not Provided') {
        showToast('Customer phone number not available.', 'error');
        return;
    }

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }

    const customerName = name || 'Customer';
    const message = `नमस्ते ${customerName}! 🥛\n\nमी खामकर डेअरीमधून तुमचा डिलिव्हरी पार्टनर बोलत आहे. तुमची ऑर्डर #${orderId} अचूक पत्त्यावर वेळेत पोहोचवण्यासाठी कृपया तुमचे Live GPS Location पाठवा:\n1. खालील 📎 Attach आयकॉनवर क्लिक करा.\n2. 'Location' निवडून 'Share Live Location' वर टॅप करा.\n\nकिंवा वेबसाईटवरून तुमचे लोकेशन अपडेट करा:\n${window.location.origin}/orders/\n\nधन्यवाद! - खामकर डेअरी, सांगली`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
}

function modalAskCustomerLocation() {
    if (!currentModalOrderId) return;
    const phone = document.getElementById('modalCustomerPhone').textContent;
    const name = document.getElementById('modalCustomerName').textContent;
    requestCustomerLiveLocation(phone, name, currentModalOrderId);
}

function modalSendWhatsApp() {
    if (!currentModalOrderId) return;
    const row = document.querySelector(`.order-row[data-order-id="${currentModalOrderId}"]`) || document.getElementById(`dash-order-${currentModalOrderId}`);
    if (!row) return;

    const phone = row.dataset.phone || document.getElementById('modalCustomerPhone').textContent;
    const name = row.dataset.name || document.getElementById('modalCustomerName').textContent;
    const amount = row.dataset.amount || document.getElementById('modalTotalAmount').textContent.replace('₹', '').trim();

    sendWhatsAppAlert(
        phone,
        name,
        currentModalOrderId,
        amount
    );
}

function quickWhatsAppCustomer() {
    const firstPendingRow = Array.from(document.querySelectorAll('.order-row')).find(
        r => r.dataset.status === 'pending' || r.dataset.status === 'confirmed' || r.dataset.status === 'out_for_delivery'
    );

    if (firstPendingRow) {
        sendWhatsAppAlert(
            firstPendingRow.dataset.phone,
            firstPendingRow.dataset.name,
            firstPendingRow.dataset.orderId,
            firstPendingRow.dataset.amount
        );
    } else {
        showToast('No pending deliveries right now!', 'info');
    }
}


// ── DUTY TOGGLE (ON / OFF DUTY) ──
function setDutyStatus(isOn) {
    localStorage.setItem('deliveryDuty', isOn ? 'on' : 'off');

    const checkbox = document.getElementById('dutyToggleCheckbox');
    const label = document.getElementById('dutySwitchLabel');
    const banner = document.getElementById('offDutyBanner');
    const indicator = document.getElementById('sidebarDutyIndicator');
    const sidebarTitle = document.getElementById('sidebarDutyTitle');
    const sidebarSub = document.getElementById('sidebarDutySub');

    if (checkbox) checkbox.checked = isOn;

    if (isOn) {
        if (label) label.textContent = '🟢 On Duty';
        if (banner) banner.style.display = 'none';
        if (indicator) indicator.classList.remove('off');
        if (sidebarTitle) sidebarTitle.textContent = 'On Delivery Duty';
        if (sidebarSub) sidebarSub.textContent = 'Ready for orders';
        showToast('You are now ON DUTY. Have a great shift!', 'success');
    } else {
        if (label) label.textContent = '⚪ Off Duty';
        if (banner) banner.style.display = 'flex';
        if (indicator) indicator.classList.add('off');
        if (sidebarTitle) sidebarTitle.textContent = 'Off Duty (Break)';
        if (sidebarSub) sidebarSub.textContent = 'Deliveries paused';
        showToast('You are now OFF DUTY (Break mode).', 'info');
    }
}


// ── PRINT DELIVERY SHEET ──
function printDeliverySheet() {
    const slot = (typeof currentActiveSlot !== 'undefined' && currentActiveSlot) ? currentActiveSlot : 'all';
    window.open(`/delivery/run-sheet/?slot=${slot}`, '_blank');
}


// ── SLOT / SHIFT FILTERING ──
function filterBySlot(slotName) {
    currentActiveSlot = slotName;

    document.querySelectorAll('.shift-pill').forEach(pill => {
        if (pill.dataset.slot === slotName) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    const activeTab = document.querySelector('.filter-tab.active');
    const statusFilter = activeTab ? activeTab.dataset.filter : 'all';
    const searchInput = document.getElementById('orderSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    applyFilters(statusFilter, query, currentActiveSlot);
}


// ── VIEW ROUTING ──
function switchView(viewName, filterName = null) {
    const validViews = ['dashboard', 'orders', 'earnings', 'location'];
    if (!validViews.includes(viewName)) {
        viewName = 'dashboard';
    }

    document.querySelectorAll('.delivery-view-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    document.querySelectorAll('.sidebar-nav .nav-item[data-view]').forEach(item => {
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    document.querySelectorAll('.topbar-nav-btn').forEach(btn => {
        if (btn.dataset.view === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const heading = document.getElementById('topbarHeading');
    const subtitle = document.getElementById('topbarSubtitle');
    if (heading && subtitle) {
        if (viewName === 'dashboard') {
            heading.textContent = 'Delivery Boy Panel';
            subtitle.textContent = 'Delivering Freshness to Your Home';
        } else if (viewName === 'orders') {
            heading.textContent = 'My Orders';
            subtitle.textContent = 'Track and view customer delivery orders';
        } else if (viewName === 'earnings') {
            heading.textContent = 'My Earnings & Collections';
            subtitle.textContent = "Track today's collections and daily payout";
        } else if (viewName === 'location') {
            heading.textContent = 'Customer Location & Route';
            subtitle.textContent = 'GPS route and stops navigation';
        }
    }

    if (window.location.hash !== `#${viewName}`) {
        history.replaceState(null, null, `#${viewName}`);
    }

    if (viewName === 'orders' && filterName) {
        const filterTab = document.querySelector(`.filter-tab[data-filter="${filterName}"]`);
        if (filterTab) {
            filterTab.click();
        }
    }

    if (viewName === 'location') {
        setTimeout(renderDeliveryRouteMap, 200);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const sidebar = document.getElementById('deliverySidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ── LEAFLET ROUTE MAP ENGINE ──
let routeMap = null;
let routeMarkers = [];

function renderDeliveryRouteMap() {
    const mapContainer = document.getElementById('deliveryRouteMap');
    if (!mapContainer) return;
    if (typeof L === 'undefined') {
        console.warn('Leaflet library is loading or unavailable.');
        return;
    }

    // Initialize or resize map
    if (!routeMap) {
        // Center around Sangli City: 16.8524, 74.5815
        routeMap = L.map('deliveryRouteMap', {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView([16.8524, 74.5815], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(routeMap);
    } else {
        routeMap.invalidateSize();
    }

    // Clear old markers
    routeMarkers.forEach(m => routeMap.removeLayer(m));
    routeMarkers = [];

    // Store Hub Marker: Khamkar Dairy Sangli
    const storeLatLng = [16.8540, 74.5830];
    const storeIcon = L.divIcon({
        className: 'custom-map-marker store-marker',
        html: '<div style="background:#075334; color:white; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-size:17px; border:2.5px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.35); cursor:pointer;">🏪</div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
    });
    const storeMarker = L.marker(storeLatLng, { icon: storeIcon })
        .addTo(routeMap)
        .bindPopup('<div style="font-family:system-ui; font-size:13px;"><b style="color:#075334;">🏪 Khamkar Dairy Store</b><br>Dispatch Hub (Market Yard, Sangli)</div>');
    routeMarkers.push(storeMarker);

    const bounds = L.latLngBounds([storeLatLng]);
    const stopElements = document.querySelectorAll('.stops-items .stop-item');
    let hasValidStops = false;

    stopElements.forEach((stop, index) => {
        const lat = parseFloat(stop.dataset.lat);
        const lng = parseFloat(stop.dataset.lng);
        const name = stop.dataset.name || `Customer #${index + 1}`;
        const orderId = stop.dataset.orderId || '';
        const addr = stop.dataset.addr || 'Sangli';
        const navUrl = stop.dataset.nav || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
        const phone = stop.dataset.phone || '';

        let stopLatLng = null;
        let isExactGps = false;

        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            stopLatLng = [lat, lng];
            isExactGps = true;
        } else {
            // Visual spread around Sangli center
            const offsetLat = 16.8524 + ((index % 5) - 2) * 0.007;
            const offsetLng = 74.5815 + (Math.floor(index / 5) - 1) * 0.008;
            stopLatLng = [offsetLat, offsetLng];
        }

        const pinBg = isExactGps ? '#15803d' : '#d97706';
        const pinIcon = L.divIcon({
            className: 'custom-map-marker',
            html: `<div style="background:${pinBg}; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:800; border:2px solid white; box-shadow:0 3px 8px rgba(0,0,0,0.25); cursor:pointer;">${index + 1}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const popupHtml = `
            <div style="font-family:system-ui, sans-serif; font-size:12.5px; line-height:1.45; min-width:180px;">
                <div style="font-weight:800; color:#1e293b; font-size:14px; margin-bottom:2px;">
                    ${name} <span style="color:#059669; font-size:12px;">#${orderId}</span>
                </div>
                <div style="color:#64748b; font-size:11.5px; margin-bottom:5px;">📍 ${addr}</div>
                <div style="margin-bottom:8px;">
                    ${isExactGps ? '<span style="color:#15803d; font-weight:700; font-size:11px; background:#dcfce7; padding:2px 6px; border-radius:4px;">🎯 Exact GPS Navigation</span>' : '<span style="color:#b45309; font-weight:700; font-size:11px; background:#fef3c7; padding:2px 6px; border-radius:4px;">⚠️ Address Only</span>'}
                </div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <a href="${navUrl}" target="_blank" style="background:#15803d; color:white; padding:6px 12px; border-radius:6px; text-decoration:none; font-weight:700; font-size:11px; display:inline-block;">Navigate 🚀</a>
                    <button onclick="requestCustomerLiveLocation('${phone}', '${name}', '${orderId}')" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a; padding:6px 9px; border-radius:6px; cursor:pointer; font-weight:700; font-size:11px;">📲 Ask Loc</button>
                </div>
            </div>
        `;

        const marker = L.marker(stopLatLng, { icon: pinIcon })
            .addTo(routeMap)
            .bindPopup(popupHtml);

        routeMarkers.push(marker);
        bounds.extend(stopLatLng);
        hasValidStops = true;
    });

    if (hasValidStops) {
        routeMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
}


// ── FILTER APPLICATION ENGINE ──
function applyFilters(statusFilter, searchQuery, slotFilter = 'all') {
    let visibleCount = 0;
    const orderRows = document.querySelectorAll('.order-row');

    orderRows.forEach(function (row) {
        const rowStatus = row.dataset.status;
        const rowSlot = (row.dataset.slotVal || '').toLowerCase();
        const rowName = (row.dataset.name || '').toLowerCase();
        const rowOrderId = (row.dataset.orderId || '').toLowerCase();
        const rowAddress = (row.dataset.address || '').toLowerCase();
        const rowPhone = (row.dataset.phone || '').toLowerCase();

        let statusMatch = false;
        if (statusFilter === 'all') {
            statusMatch = true;
        } else if (statusFilter === 'pending') {
            statusMatch = rowStatus === 'pending' || rowStatus === 'confirmed';
        } else if (statusFilter === 'out_for_delivery') {
            statusMatch = rowStatus === 'out_for_delivery';
        } else if (statusFilter === 'delivered') {
            statusMatch = rowStatus === 'delivered';
        } else if (statusFilter === 'cancelled') {
            statusMatch = rowStatus === 'cancelled';
        }

        let slotMatch = true;
        if (slotFilter !== 'all') {
            slotMatch = rowSlot === slotFilter;
        }

        let searchMatch = true;
        if (searchQuery) {
            searchMatch = rowName.includes(searchQuery) ||
                          rowOrderId.includes(searchQuery) ||
                          rowAddress.includes(searchQuery) ||
                          rowPhone.includes(searchQuery);
        }

        if (statusMatch && slotMatch && searchMatch) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    document.querySelectorAll('.active-order-item').forEach(card => {
        const cardSlot = (card.dataset.slot || '').toLowerCase();
        if (slotFilter === 'all' || cardSlot === slotFilter) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });

    const emptyRow = document.getElementById('emptyStateRow');
    if (emptyRow) {
        emptyRow.style.display = visibleCount === 0 ? '' : 'none';
    }
}


// ── DOM CONTENT LOADED ──
document.addEventListener('DOMContentLoaded', function () {

    // 1. Dark Mode & Bottle Tracker Init
    initDarkTheme();
    initBottleTracker();

    // 2. Offline Mode Network Listeners
    const offlineBanner = document.getElementById('offlineBanner');
    function updateOnlineStatus() {
        if (!navigator.onLine) {
            if (offlineBanner) offlineBanner.style.display = 'block';
            showToast('⚡ Offline Mode: Customer list cached.', 'info');
        } else {
            if (offlineBanner) offlineBanner.style.display = 'none';
        }
    }
    window.addEventListener('online', () => {
        updateOnlineStatus();
        showToast('Online connection restored!', 'success');
    });
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // 3. Duty Toggle Init from LocalStorage
    const savedDuty = localStorage.getItem('deliveryDuty');
    if (savedDuty === 'off') {
        setDutyStatus(false);
    }

    const dutyCheckbox = document.getElementById('dutyToggleCheckbox');
    if (dutyCheckbox) {
        dutyCheckbox.addEventListener('change', function () {
            setDutyStatus(this.checked);
        });
    }

    // 4. View Init from URL Hash
    const hash = window.location.hash.replace('#', '');
    if (hash && ['dashboard', 'orders', 'earnings', 'location'].includes(hash)) {
        switchView(hash);
    } else {
        switchView('dashboard');
    }

    window.addEventListener('hashchange', function () {
        const h = window.location.hash.replace('#', '') || 'dashboard';
        switchView(h);
    });

    // 5. Nav Click Handlers
    document.querySelectorAll('.sidebar-nav .nav-item[data-view]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            switchView(this.dataset.view);
        });
    });

    document.querySelectorAll('.topbar-nav-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            switchView(this.dataset.view);
        });
    });

    // 6. Sidebar Toggle
    const sidebar = document.getElementById('deliverySidebar');
    const mainContent = document.getElementById('deliveryMain');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
        if (window.innerWidth <= 1024) {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('show');
            document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
        } else {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', toggleSidebar);
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
            document.body.style.overflow = '';
        });
    }

    window.addEventListener('resize', function () {
        if (window.innerWidth > 1024 && sidebar) {
            sidebar.classList.remove('open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // 7. Orders Tab Filtering
    const filterTabs = document.querySelectorAll('.filter-tab');
    const searchInput = document.getElementById('orderSearchInput');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;
            applyFilters(filter, searchInput ? searchInput.value.trim().toLowerCase() : '', currentActiveSlot);
        });
    });

    // 8. Search Filtering
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const activeTab = document.querySelector('.filter-tab.active');
            const filter = activeTab ? activeTab.dataset.filter : 'all';
            applyFilters(filter, this.value.trim().toLowerCase(), currentActiveSlot);
        });
    }

    // 9. Modal Backdrop Click
    const modalBackdrop = document.getElementById('orderModalBackdrop');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', function (e) {
            if (e.target === modalBackdrop) closeOrderModal();
        });
    }

    const sosBackdrop = document.getElementById('sosModalBackdrop');
    if (sosBackdrop) {
        sosBackdrop.addEventListener('click', function (e) {
            if (e.target === sosBackdrop) closeSOSModal();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeOrderModal();
            closeSOSModal();
        }
    });
});


// =============================================
// MODAL CONTROLLER
// =============================================

function openOrderModal(orderId) {
    const row = document.querySelector(`.order-row[data-order-id="${orderId}"]`) || document.getElementById(`dash-order-${orderId}`);
    if (!row) return;

    currentModalOrderId = orderId;
    hideModalQR();

    const name = row.dataset.name || (row.querySelector('.active-order-customer strong') ? row.querySelector('.active-order-customer strong').textContent.trim() : '');
    const phone = row.dataset.phone || (row.querySelector('.active-order-customer span') ? row.querySelector('.active-order-customer span').textContent.replace('📞', '').trim() : 'N/A');
    const slot = row.dataset.slot || 'Standard';
    const address = row.dataset.address || (row.querySelector('.active-order-address') ? row.querySelector('.active-order-address').textContent.replace('📍', '').replace('🎯 GPS Ready', '').replace('📝 Address Only', '').trim() : 'Address not provided');
    const amount = row.dataset.amount || (row.querySelector('.meta-tag.amount') ? row.querySelector('.meta-tag.amount').textContent.replace('₹', '').split('(')[0].trim() : '0');
    const mapsUrl = row.dataset.mapsUrl || (row.querySelector('.action-icon-btn.map') ? row.querySelector('.action-icon-btn.map').href : 'https://www.google.com/maps');
    const hasLiveLocation = row.dataset.hasLiveLocation === 'true' || (row.querySelector && row.querySelector('.live-gps-badge') !== null);

    // Populate modal fields
    document.getElementById('modalOrderId').textContent = `Order #${orderId}`;
    document.getElementById('modalCustomerName').textContent = name;
    document.getElementById('modalCustomerPhone').textContent = phone;
    document.getElementById('modalDeliverySlot').textContent = slot;
    document.getElementById('modalCustomerAddress').textContent = address;
    document.getElementById('modalTotalAmount').textContent = `₹ ${amount}`;

    const locBadge = document.getElementById('modalLocationStatusBadge');
    if (locBadge) {
        if (hasLiveLocation) {
            locBadge.innerHTML = '<span style="color:#15803d; font-weight:700;">🎯 Live GPS Coordinates Ready (Turn-by-turn navigation active)</span>';
        } else {
            locBadge.innerHTML = '<span style="color:#b45309; font-weight:700;">⚠️ Text Address Only — Click "Ask Live Location" below to receive customer GPS on WhatsApp</span>';
        }
    }

    const askLocBtn = document.getElementById('modalAskLocationBtn');
    if (askLocBtn) {
        askLocBtn.style.display = hasLiveLocation ? 'none' : 'inline-flex';
    }

    // Payment display
    const isPrepaid = row.dataset.prepaid === 'true';
    const payMethod = row.dataset.paymentDisplay || (isPrepaid ? 'Online / Wallet' : 'Cash on Delivery (COD)');
    document.getElementById('modalPaymentDisplay').innerHTML = `
        <strong>Payment:</strong> ${payMethod} 
        <span class="payment-badge ${isPrepaid ? 'prepaid' : 'cod'}">
            ${isPrepaid ? 'Prepaid (Collect ₹0)' : 'Collect Cash: ₹' + amount}
        </span>
    `;

    // QR Button visibility in modal
    const qrBtn = document.getElementById('modalDoorstepQRBtn');
    if (qrBtn) {
        qrBtn.style.display = isPrepaid ? 'none' : 'flex';
    }

    // Action links
    const callBtn = document.getElementById('modalCallBtn');
    if (callBtn) {
        callBtn.href = phone && phone !== 'N/A' && phone !== 'Not Provided' ? `tel:${phone}` : '#';
    }

    const mapsBtn = document.getElementById('modalMapsBtn');
    if (mapsBtn) {
        mapsBtn.href = mapsUrl || 'https://www.google.com/maps';
    }

    // Parse and render items
    const itemsList = document.getElementById('modalItemsList');
    itemsList.innerHTML = '';
    try {
        const items = JSON.parse(row.dataset.items || '[]');
        if (items.length > 0) {
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'modal-item-row';
                itemDiv.innerHTML = `
                    <span>${item.qty}x ${item.name}</span>
                    <span>₹${item.total}</span>
                `;
                itemsList.appendChild(itemDiv);
            });
        } else {
            itemsList.innerHTML = '<div class="modal-item-row"><span>Standard Items Pack</span><span>-</span></div>';
        }
    } catch (e) {
        itemsList.innerHTML = '<div class="modal-item-row"><span>1x Dairy Items</span><span>-</span></div>';
    }

    // Display order status badge in modal header
    const currentStatus = row.dataset.status || 'out_for_delivery';
    const statusBadgeEl = document.getElementById('modalOrderStatusBadge');
    if (statusBadgeEl) {
        statusBadgeEl.className = `status-badge ${currentStatus}`;
        statusBadgeEl.textContent = formatStatusDisplay(currentStatus);
    }
    highlightModalStatusButton(currentStatus);

    // Show modal
    const backdrop = document.getElementById('orderModalBackdrop');
    if (backdrop) {
        backdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function formatStatusDisplay(status) {
    if (status === 'out_for_delivery') return '🛵 Out for Delivery';
    if (status === 'delivered') return '✅ Delivered';
    if (status === 'cancelled') return '❌ Cancelled';
    if (status === 'pending' || status === 'confirmed') return '⏳ Pending';
    return status;
}

function highlightModalStatusButton(status) {
    document.querySelectorAll('.modal-status-btn').forEach(btn => btn.classList.remove('active'));
    if (status === 'out_for_delivery') {
        const btn = document.getElementById('modalBtnOut');
        if (btn) btn.classList.add('active');
    } else if (status === 'delivered') {
        const btn = document.getElementById('modalBtnDelivered');
        if (btn) btn.classList.add('active');
    } else if (status === 'cancelled') {
        const btn = document.getElementById('modalBtnCancelled');
        if (btn) btn.classList.add('active');
    }
}

function modalChangeStatus(newStatus) {
    if (!currentModalOrderId) return;
    updateDeliveryStatus(currentModalOrderId, newStatus);
}

function closeOrderModal() {
    const backdrop = document.getElementById('orderModalBackdrop');
    if (backdrop) {
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
    }
    hideModalQR();
    currentModalOrderId = null;
}


// =============================================
// ORDER STATUS UPDATES (AJAX)
// =============================================

function updateDeliveryStatus(orderId, newStatus, selectEl = null) {
    const csrfTokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
    const csrfToken = csrfTokenEl ? csrfTokenEl.value : '';

    showToast(`Updating Order #${orderId} to ${formatStatusDisplay(newStatus)}...`, 'info');

    fetch(`/delivery/update-status/${orderId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (newStatus === 'delivered') {
                playDeliveryChime();
            }
            showToast(`✅ ${data.message}`, 'success');

            // 1. Update row in table
            const row = document.querySelector(`.order-row[data-order-id="${orderId}"]`);
            if (row) {
                row.dataset.status = newStatus;
                const sel = row.querySelector('.status-select-dropdown');
                if (sel) {
                    sel.value = newStatus;
                    sel.className = `status-select-dropdown status-${newStatus}`;
                }

                // Quick deliver button in action cell
                const actionCell = row.querySelector('.action-cell');
                if (actionCell) {
                    const quickBtn = actionCell.querySelector('.quick-deliver-btn');
                    if (newStatus === 'delivered' && quickBtn) {
                        quickBtn.remove();
                    } else if (newStatus === 'out_for_delivery' && !quickBtn) {
                        const newBtn = document.createElement('button');
                        newBtn.className = 'quick-deliver-btn';
                        newBtn.title = 'Mark as Delivered';
                        newBtn.innerHTML = '✅ Deliver';
                        newBtn.onclick = () => updateDeliveryStatus(orderId, 'delivered');
                        actionCell.insertBefore(newBtn, actionCell.firstChild);
                    }
                }
            }

            // 2. Update modal if open
            if (currentModalOrderId === orderId) {
                const modalBadge = document.getElementById('modalOrderStatusBadge');
                if (modalBadge) {
                    modalBadge.className = `status-badge ${newStatus}`;
                    modalBadge.textContent = data.status_display || formatStatusDisplay(newStatus);
                }
                highlightModalStatusButton(newStatus);
            }

            // 3. Update KPI counters
            refreshKPICounters();
        } else {
            showToast(data.error || 'Failed to update order status.', 'error');
            const row = document.querySelector(`.order-row[data-order-id="${orderId}"]`);
            if (selectEl && row) {
                selectEl.value = row.dataset.status || 'out_for_delivery';
            }
        }
    })
    .catch(err => {
        showToast('Network error while updating status.', 'error');
    });
}

function refreshKPICounters() {
    let pending = 0;
    let out = 0;
    let delivered = 0;
    let cancelled = 0;
    let total = 0;

    document.querySelectorAll('.order-row').forEach(row => {
        const st = row.dataset.status;
        if (st !== 'cancelled') total++;
        if (st === 'pending' || st === 'confirmed') pending++;
        else if (st === 'out_for_delivery') out++;
        else if (st === 'delivered') delivered++;
        else if (st === 'cancelled') cancelled++;
    });

    const kpiTotal = document.getElementById('kpiTotalOrders');
    const kpiPending = document.getElementById('kpiPending');
    const kpiDelivered = document.getElementById('kpiDelivered');
    const kpiCancelled = document.getElementById('kpiCancelled');
    const notifBadge = document.getElementById('headerNotificationBadge');

    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiPending) kpiPending.textContent = pending;
    if (kpiDelivered) kpiDelivered.textContent = delivered;
    if (kpiCancelled) kpiCancelled.textContent = cancelled;
    if (notifBadge) notifBadge.textContent = pending;

    document.querySelectorAll('.filter-tab').forEach(tab => {
        const countSpan = tab.querySelector('.count');
        if (!countSpan) return;
        const f = tab.dataset.filter;
        if (f === 'all') countSpan.textContent = total;
        else if (f === 'pending') countSpan.textContent = pending;
        else if (f === 'out_for_delivery') countSpan.textContent = out;
        else if (f === 'delivered') countSpan.textContent = delivered;
        else if (f === 'cancelled') countSpan.textContent = cancelled;
    });
}


// =============================================
// QUICK CALL
// =============================================

function quickCallCustomer() {
    const firstPendingRow = Array.from(document.querySelectorAll('.order-row')).find(
        r => r.dataset.status === 'pending' || r.dataset.status === 'confirmed' || r.dataset.status === 'out_for_delivery'
    );

    if (firstPendingRow && firstPendingRow.dataset.phone && firstPendingRow.dataset.phone !== 'N/A' && firstPendingRow.dataset.phone !== 'Not Provided') {
        window.location.href = `tel:${firstPendingRow.dataset.phone}`;
    } else {
        showToast('No active customer phone found.', 'info');
    }
}


// =============================================
// TOAST NOTIFICATIONS
// =============================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}


// =============================================
// PRIORITY DELIVERIES: TAKE ORDER & LIVE POLLING
// =============================================

function takeOrder(orderId) {
    const csrfTokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
    const csrfToken = csrfTokenEl ? csrfTokenEl.value : '';

    showToast(`Accepting order #${orderId}...`, 'info');

    fetch(`/delivery/take-order/${orderId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            playDeliveryChime();
            showToast(`🛵 ${data.message}`, 'success');

            // 1. Immediately remove from Dashboard Priority Deliveries
            const cardEl = document.getElementById(`dash-order-${orderId}`);
            if (cardEl) {
                cardEl.style.transition = 'all 0.3s ease';
                cardEl.style.opacity = '0';
                cardEl.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    cardEl.remove();
                    const listEl = document.getElementById('priorityOrdersList');
                    if (listEl && listEl.querySelectorAll('.active-order-item').length === 0) {
                        listEl.innerHTML = `
                            <div class="empty-state-small" id="priorityOrdersEmpty">
                                <span>🎉 No pending orders right now. New orders will appear here automatically!</span>
                            </div>
                        `;
                    }
                }, 300);
            }

            // 2. Decrement Priority Deliveries badge count on Dashboard
            const badgeEl = document.getElementById('priorityOrdersBadge');
            if (badgeEl) {
                const currentVal = parseInt(badgeEl.textContent) || 0;
                const newVal = Math.max(0, currentVal - 1);
                badgeEl.textContent = `${newVal} Available`;
            }

            // 3. Add order to "My Orders" table
            if (data.order) {
                addOrderToMyOrdersTable(data.order);
            }
        } else {
            showToast(data.error || 'Failed to accept order.', 'error');
            // If already taken by someone else, remove it immediately from screen
            if (data.error && data.error.includes('already taken')) {
                const cardEl = document.getElementById(`dash-order-${orderId}`);
                if (cardEl) {
                    cardEl.style.transition = 'all 0.3s ease';
                    cardEl.style.opacity = '0';
                    cardEl.style.transform = 'scale(0.95)';
                    setTimeout(() => cardEl.remove(), 300);
                }
            }
        }
    })
    .catch(err => {
        showToast('Network error while accepting order.', 'error');
    });
}

function addOrderToMyOrdersTable(order) {
    if (!order) return;
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    // Remove empty state row if present
    const emptyRow = document.getElementById('noOrdersTakenRow');
    if (emptyRow) emptyRow.remove();

    // Check if row already exists
    let existingRow = document.querySelector(`.order-row[data-order-id="${order.order_id}"]`);
    if (existingRow) {
        existingRow.dataset.status = order.status;
        const sel = existingRow.querySelector('.status-select-dropdown');
        if (sel) {
            sel.value = order.status;
            sel.className = `status-select-dropdown status-${order.status}`;
        }
        return;
    }

    const rowCount = tbody.querySelectorAll('.order-row').length + 1;
    const tr = document.createElement('tr');
    tr.className = 'order-row';
    tr.dataset.orderId = order.order_id;
    tr.dataset.status = order.status;
    tr.dataset.slotVal = order.delivery_slot || 'anytime';
    tr.dataset.name = order.customer_name || '';
    tr.dataset.phone = order.customer_phone || '';
    tr.dataset.address = order.customer_address || '';
    tr.dataset.amount = order.total_amount || '0';
    tr.dataset.time = order.created_time || '';
    tr.dataset.slot = order.slot_display || 'Standard';
    tr.dataset.prepaid = order.is_prepaid ? 'true' : 'false';
    tr.dataset.paymentDisplay = order.payment_display || (order.is_prepaid ? 'Paid Online' : 'Cash on Delivery');
    tr.dataset.mapsUrl = order.maps_navigation_url || '';
    tr.dataset.hasLiveLocation = order.has_live_location ? 'true' : 'false';
    tr.dataset.lat = order.latitude || '';
    tr.dataset.lng = order.longitude || '';
    tr.dataset.items = JSON.stringify(order.items || []);

    tr.innerHTML = `
        <td class="counter-cell">${rowCount}</td>
        <td class="order-id-cell"><strong>#${order.order_id}</strong></td>
        <td class="customer-name-cell">${order.customer_name}</td>
        <td class="phone-cell"><a href="tel:${order.customer_phone}" class="phone-link">📞 ${order.customer_phone}</a></td>
        <td class="address-cell" title="${order.customer_address}">
            ${order.customer_address}
            ${order.has_live_location ? '<span style="font-size:10px; background:#dcfce7; color:#15803d; padding:1px 5px; border-radius:4px; font-weight:700; margin-left:4px;" title="Live GPS Navigation Available">🎯 GPS</span>' : ''}
        </td>
        <td class="items-cell">${order.items_summary || '1 Order Pack'}</td>
        <td class="order-amount">
            ₹ ${order.total_amount}
            <span class="payment-badge ${order.is_prepaid ? 'prepaid' : 'cod'}">
                ${order.is_prepaid ? 'Paid' : 'COD'}
            </span>
        </td>
        <td class="order-slot">${order.slot_display || 'Standard'}</td>
        <td class="status-cell">
            <div class="status-select-wrap">
                <select class="status-select-dropdown status-${order.status}" onchange="updateDeliveryStatus('${order.order_id}', this.value, this)" title="Change Order Status">
                    <option value="out_for_delivery" selected>🛵 Out for Delivery</option>
                    <option value="delivered">✅ Delivered</option>
                    <option value="cancelled">❌ Cancelled</option>
                </select>
            </div>
        </td>
        <td class="action-cell">
            <button class="quick-deliver-btn" onclick="updateDeliveryStatus('${order.order_id}', 'delivered')" title="Mark as Delivered">✅ Deliver</button>
            <button class="view-btn" onclick="openOrderModal('${order.order_id}')">View</button>
            ${!order.is_prepaid ? `<button class="nav-icon-btn qr" title="Doorstep UPI QR" onclick="showDoorstepQR('${order.order_id}', '${order.customer_name}', '${order.total_amount}')">📲</button>` : ''}
            ${!order.has_live_location ? `<button class="nav-icon-btn" title="Request Live GPS on WhatsApp" onclick="requestCustomerLiveLocation('${order.customer_phone}', '${order.customer_name}', '${order.order_id}')" style="background:#fef3c7; color:#b45309;">📍</button>` : ''}
            <button class="nav-icon-btn whatsapp" title="WhatsApp Message" onclick="sendWhatsAppAlert('${order.customer_phone}', '${order.customer_name}', '${order.order_id}', '${order.total_amount}')">💬</button>
            <a href="${order.maps_navigation_url}" target="_blank" class="nav-icon-btn" title="Maps Navigation">🚀</a>
        </td>
    `;

    tbody.insertBefore(tr, tbody.firstChild);

    // Update KPI counters
    refreshKPICounters();
}

function completeOrder(orderId) {
    if (!confirm(`Are you sure you delivered Order #${orderId} to the customer?`)) {
        return;
    }
    updateDeliveryStatus(orderId, 'delivered');
}

function fetchPriorityOrders(isManual = false) {
    const listEl = document.getElementById('priorityOrdersList');
    const badgeEl = document.getElementById('priorityOrdersBadge');
    if (!listEl) return;

    if (isManual) {
        showToast('Checking for new orders...', 'info');
    }

    fetch('/delivery/api/priority-orders/')
    .then(res => res.json())
    .then(data => {
        if (data.success && data.orders) {
            if (badgeEl) {
                badgeEl.textContent = `${data.pending_count} Available`;
            }

            // Check if there are new orders that arrived
            const existingOrderIds = Array.from(listEl.querySelectorAll('.active-order-item')).map(el => el.id.replace('dash-order-', ''));
            const newOrdersFound = data.orders.filter(o => !existingOrderIds.includes(o.order_id) && o.can_take);

            if (newOrdersFound.length > 0) {
                showToast(`🔔 ${newOrdersFound.length} new order(s) arrived!`, 'success');
                playDeliveryChime();
            } else if (isManual) {
                showToast('Orders are up to date.', 'success');
            }

            // Re-render list
            if (data.orders.length === 0) {
                listEl.innerHTML = `
                    <div class="empty-state-small" id="priorityOrdersEmpty">
                        <span>🎉 No pending orders right now. New orders will appear here automatically!</span>
                    </div>
                `;
                return;
            }

            let html = '';
            data.orders.forEach(order => {
                let statusBadgeHtml = '';
                if (order.status === 'pending' || order.status === 'confirmed') {
                    statusBadgeHtml = '<span class="status-badge pending pulse">🔔 New Order</span>';
                } else if (order.status === 'out_for_delivery') {
                    statusBadgeHtml = '<span class="status-badge out_for_delivery">🛵 Out for Delivery</span>';
                } else {
                    statusBadgeHtml = `<span class="status-badge ${order.status}">${order.status_display}</span>`;
                }

                let actionBtnHtml = '';
                if (order.can_take) {
                    actionBtnHtml = `<button class="take-order-btn" onclick="takeOrder('${order.order_id}')">🛵 Take Order</button>`;
                } else if (order.is_my_order && order.status === 'out_for_delivery') {
                    actionBtnHtml = `<button class="complete-order-btn" onclick="completeOrder('${order.order_id}')">✅ Delivered</button>`;
                } else if (order.status === 'delivered') {
                    actionBtnHtml = `<span class="delivered-pill-badge">✅ Delivered</span>`;
                }

                html += `
                <div class="active-order-item" id="dash-order-${order.order_id}" data-slot="${order.delivery_slot || 'anytime'}">
                    <div class="active-order-main">
                        <div class="active-order-top">
                            <span class="active-order-id">#${order.order_id}</span>
                            ${statusBadgeHtml}
                            <span class="slot-badge-mini ${order.delivery_slot}">${order.slot_display}</span>
                            <span class="order-time-mini" style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">🕒 ${order.created_time}</span>
                        </div>
                        <div class="active-order-customer">
                            <strong>${order.customer_name}</strong>
                            <span>📞 ${order.customer_phone}</span>
                        </div>
                        <div class="active-order-address">
                            📍 ${order.customer_address}
                            ${order.has_live_location ? '<span class="live-gps-badge" style="background:#dcfce7; color:#15803d; font-size:10.5px; font-weight:700; padding:2px 6px; border-radius:5px; margin-left:6px; display:inline-flex; align-items:center; gap:2px;">🎯 GPS Ready</span>' : '<span class="addr-only-badge" style="background:#fef3c7; color:#b45309; font-size:10.5px; font-weight:700; padding:2px 6px; border-radius:5px; margin-left:6px; display:inline-flex; align-items:center; gap:2px;">📝 Address Only</span>'}
                        </div>
                        <div class="active-order-meta">
                            <span class="meta-tag amount">₹ ${order.total_amount} (${order.is_prepaid ? 'Prepaid' : 'COD'})</span>
                            <span class="meta-tag items" style="font-size: 12px; color: var(--text-secondary);">
                                📦 ${order.items_summary}
                            </span>
                        </div>
                    </div>
                    <div class="active-order-actions" id="dash-actions-${order.order_id}">
                        <button class="action-icon-btn view" title="View details" onclick="openOrderModal('${order.order_id}')">👁️</button>
                        <a href="tel:${order.customer_phone}" class="action-icon-btn call" title="Call customer">📞</a>
                        ${!order.has_live_location ? `<button class="action-icon-btn loc-ask" title="Request Live GPS Location on WhatsApp" onclick="requestCustomerLiveLocation('${order.customer_phone}', '${order.customer_name}', '${order.order_id}')" style="background:#fef3c7; color:#b45309;">📲</button>` : ''}
                        <button class="action-icon-btn whatsapp" title="Send WhatsApp message" onclick="sendWhatsAppAlert('${order.customer_phone}', '${order.customer_name}', '${order.order_id}', '${order.total_amount}')">💬</button>
                        ${!order.is_prepaid ? `<button class="action-icon-btn qr" title="Doorstep UPI QR Code" onclick="showDoorstepQR('${order.order_id}', '${order.customer_name}', '${order.total_amount}')">📲</button>` : ''}
                        <a href="${order.maps_navigation_url}" target="_blank" class="action-icon-btn map" title="Navigate on Google Maps">📍</a>
                        ${actionBtnHtml}
                    </div>
                </div>
                `;
            });

            listEl.innerHTML = html;
        }
    })
    .catch(err => {
        if (isManual) showToast('Could not refresh orders.', 'error');
    });
}

// Auto-poll priority orders every 12 seconds so accepted orders immediately disappear from others
setInterval(() => {
    if (!document.hidden) {
        fetchPriorityOrders(false);
    }
}, 12000);

