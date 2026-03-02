// invoices.js
// ---------- صفحة الفاتورة ----------
// متغير لتخزين العملية المعلقة
let pendingAction = null; // 'whatsapp', 'save', 'print'

// دالة للتحقق من بيانات العميل
function checkCustomerInfo(action) {
    const name = document.getElementById('customerName')?.value.trim();
    const phone = document.getElementById('customerPhone')?.value.trim();
    
    if (!name || !phone) {
        pendingAction = action;
        document.getElementById('modalCustomerName').value = name || '';
        document.getElementById('modalCustomerPhone').value = phone || '';
        openModal('customerInfoModal');
        return false;
    }
    return true;
}

// دالة تأكيد بيانات العميل
window.confirmCustomerInfo = function() {
    const modalName = document.getElementById('modalCustomerName').value.trim();
    const modalPhone = document.getElementById('modalCustomerPhone').value.trim();
    
    if (!modalName || !modalPhone) {
        alert('الرجاء إدخال الاسم ورقم الجوال');
        return;
    }
    
    document.getElementById('customerName').value = modalName;
    document.getElementById('customerPhone').value = modalPhone;
    
    closeModal('customerInfoModal');
    
    if (pendingAction === 'whatsapp') {
        proceedWhatsApp();
    } else if (pendingAction === 'save') {
        proceedSaveInvoice();
    } else if (pendingAction === 'print') {
        proceedPrintInvoice();
    }
    
    pendingAction = null;
};

// دوال المتابعة
function proceedWhatsApp() {
    if (invoiceItems.length === 0) { alert(i18n[settings.language].emptyInvoice); return; }
    document.getElementById('whatsappPhoneNumber').value = document.getElementById('customerPhone').value;
    document.getElementById('whatsappPreview').innerText = buildWhatsAppMessage();
    openModal('whatsappModal');
}

function proceedSaveInvoice() {
    if (invoiceItems.length === 0) { alert(i18n[settings.language].emptyInvoice); return; }
    const invoice = {
        number: document.getElementById('invoiceNumber').innerText,
        date: new Date().toISOString(),
        customerName: document.getElementById('customerName').value,
        customerPhone: document.getElementById('customerPhone').value,
        items: invoiceItems.map(i => ({ ...i })),
        subtotal: parseFloat(document.getElementById('subtotal').innerText.replace(/[^\d]/g, '')),
        delivery: parseFloat(document.getElementById('deliveryCost').value || 0),
        profit: parseFloat(document.getElementById('profit').innerText.replace(/[^\d]/g, '')),
        total: parseFloat(document.getElementById('total').innerText.replace(/[^\d]/g, ''))
    };
    invoices.push(invoice);
    saveInvoices();
    updateCustomersDB();
    showToast(i18n[settings.language].invoiceSaved, '💾');
    invoiceItems = [];
    renderInvoiceItems();
    updateInvoiceSummary();
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('deliveryCost').value = 0;
    generateInvoiceNumber();
    sessionStorage.removeItem('lorvenInvoicesvoiceState');
}

function proceedPrintInvoice() {
    printInvoice(); // نفس الدالة الأصلية
}

// دالة استعادة حالة الفاتورة (كانت مفقودة)
function restoreInvoiceState() {
    console.log('استعادة حالة الفاتورة');
    // يمكن إضافة منطق استعادة الحالة المحفوظة من sessionStorage
    try {
        const savedState = sessionStorage.getItem('lorvenInvoiceState');
        if (savedState) {
            const state = JSON.parse(savedState);
            // استعادة البيانات إذا كانت موجودة
            if (state.items) invoiceItems = state.items;
            if (state.customerName) document.getElementById('customerName').value = state.customerName;
            if (state.customerPhone) document.getElementById('customerPhone').value = state.customerPhone;
            if (state.delivery) document.getElementById('deliveryCost').value = state.delivery;
            renderInvoiceItems();
            updateInvoiceSummary();
        }
    } catch (e) {
        console.warn('فشل استعادة حالة الفاتورة', e);
    }
}

function renderInvoicesPage(container) {
    container.innerHTML = `
        <div style="margin-bottom: 14px;">
            <div class="customer-card">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                    <i class="fas fa-user" style="width:36px; height:36px; background:rgba(255,138,156,0.1); border-radius:12px; display:flex; align-items:center; justify-content:center; color:var(--accent-1); font-size:16px;"></i>
                    <span style="font-weight:700; font-size:14px;">${i18n[settings.language].customerInfo}</span>
                </div>
                <div class="form-group" style="position:relative;">
                    <label class="form-label">${i18n[settings.language].name}</label>
                    <input type="text" class="form-control" id="customerName" placeholder="${i18n[settings.language].name}" autocomplete="off">
                    <div id="customerDatalist" class="datalist-customers"></div>
                </div>
                <div class="form-group">
                    <label class="form-label">${i18n[settings.language].phone}</label>
                    <input type="tel" inputmode="numeric" class="form-control" id="customerPhone" placeholder="771234567">
                </div>
            </div>
            <div class="products-card">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                    <i class="fas fa-box" style="width:36px; height:36px; background:rgba(255,138,156,0.1); border-radius:12px; display:flex; align-items:center; justify-content:center; color:var(--accent-1); font-size:16px;"></i>
                    <span style="font-weight:700; font-size:14px;">${i18n[settings.language].products}</span>
                </div>
                <div style="position:relative; margin-bottom:12px;">
                    <input type="text" class="form-control" id="invoiceProductSearch" placeholder="${i18n[settings.language].search}..." style="padding-left:36px;">
                    <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--gray-500);"></i>
                    <div class="search-results" id="invoiceSearchResults"></div>
                </div>
                <div id="invoiceItemsList" style="max-height:180px; overflow-y:auto;"></div>
            </div>
            <div class="summary-card">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                    <i class="fas fa-calculator" style="width:36px; height:36px; background:rgba(255,138,156,0.1); border-radius:12px; display:flex; align-items:center; justify-content:center; color:var(--accent-1); font-size:16px;"></i>
                    <span style="font-weight:700; font-size:14px;">${i18n[settings.language].invoiceSummary}</span>
                </div>
                <div style="display:flex; justify-content:space-between; padding:6px 0;"><span>${i18n[settings.language].subtotal}</span><span id="subtotal" style="font-weight:600;">0 ${settings.language === 'en' ? 'SAR' : 'ر.س'}</span></div>
                <div style="display:flex; justify-content:space-between; padding:6px 0;"><span>${i18n[settings.language].delivery}</span><span><input type="number" inputmode="numeric" id="deliveryCost" value="" min="0" placeholder="0" style="width:60px; padding:6px; border:1px solid var(--gray-200); border-radius:16px; text-align:center;">${settings.language === 'en' ? 'SAR' : 'ر.س'}</span></div>
                <div style="display:flex; justify-content:space-between; padding:6px 0;"><span>${i18n[settings.language].netProfit}</span><span id="profit" style="color:var(--success); font-weight:700;">0 ${settings.language === 'en' ? 'SAR' : 'ر.س'}</span></div>
                <div style="border-top:1px solid var(--gray-100); margin:10px 0;"></div>
                <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:700;"><span>${i18n[settings.language].total}</span><span id="total" style="color:var(--accent-1);">0 ${settings.language === 'en' ? 'SAR' : 'ر.س'}</span></div>
            </div>
            <div style="display:flex; gap:6px; margin-bottom:4px;">
                <button class="btn btn-wa" style="flex:1;" onclick="openWhatsAppModal()"><i class="fab fa-whatsapp"></i> ${i18n[settings.language].whatsapp}</button>
                <button class="btn btn-primary" style="flex:1;" onclick="saveInvoice()"><i class="fas fa-save"></i> ${i18n[settings.language].save}</button>
                <button class="btn btn-outline" style="flex:1;" onclick="printInvoice()"><i class="fas fa-print"></i> ${i18n[settings.language].print}</button>
            </div>
            <div style="text-align:center; font-size:11px; color:var(--gray-500);">${i18n[settings.language].invoiceNo}: <span id="invoiceNumber" style="font-weight:700; color:var(--accent-1);">LVN-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-001</span></div>
        </div>
    `;
    generateInvoiceNumber();
    updateInvoiceSummary();
    setupInvoiceSearch();
    setupCustomerAutocomplete();
    // استعادة الحالة بعد بناء الصفحة
    restoreInvoiceState();

    // إضافة مستمع لتغيير حقل التوصيل
    document.getElementById('deliveryCost')?.addEventListener('input', function() {
        updateInvoiceSummary();
        saveInvoiceState();
    });
}

function setupInvoiceSearch() {
    const input = document.getElementById('invoiceProductSearch');
    const results = document.getElementById('invoiceSearchResults');
    let timeout;
    input.addEventListener('input', function() {
        clearTimeout(timeout);
        const q = this.value.trim();
        if (q.length < 2) { results.style.display = 'none'; return; }
        timeout = setTimeout(() => {
            const filtered = products.filter(p => p.name.includes(q) || p.barcode.includes(q)).slice(0,5);
            results.innerHTML = '';
            if (filtered.length === 0) results.innerHTML = '<div style="padding:12px; text-align:center;">' + i18n[settings.language].noResults + '</div>';
            else {
                filtered.forEach(p => {
                    const item = document.createElement('div');
                    item.className = 'search-result-item';
                    item.innerHTML = `<div style="width:28px; height:28px; background:var(--gradient); border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; margin-left:10px;"><i class="fas ${p.icon || 'fa-box'}"></i></div>
                                      <div style="flex:1;"><div style="font-weight:600;">${p.name}</div><div style="font-size:9px;">${p.price} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</div></div>`;
                    item.onclick = () => { addToInvoice(p.id); input.value = ''; results.style.display = 'none'; };
                    results.appendChild(item);
                });
            }
            results.style.display = 'block';
        }, 400);
    });
    document.addEventListener('click', e => { if (!input.contains(e.target) && !results.contains(e.target)) results.style.display = 'none'; });
}

function setupCustomerAutocomplete() {
    const input = document.getElementById('customerName');
    const list = document.getElementById('customerDatalist');
    input.addEventListener('input', function() {
        const val = this.value.trim();
        if (val.length < 1) { list.style.display = 'none'; return; }
        const matches = customersDB.filter(c => c.name && c.name.includes(val)).slice(0,5);
        if (matches.length) {
            list.innerHTML = matches.map(c => `<div class="datalist-item" data-phone="${c.phone}">${c.name} - ${c.phone}</div>`).join('');
            list.style.display = 'block';
            list.querySelectorAll('.datalist-item').forEach(el => {
                el.onclick = () => {
                    input.value = el.textContent.split(' - ')[0];
                    document.getElementById('customerPhone').value = el.dataset.phone;
                    list.style.display = 'none';
                };
            });
        } else list.style.display = 'none';
    });
    document.addEventListener('click', e => { if (!input.contains(e.target) && !list.contains(e.target)) list.style.display = 'none'; });
}

function addToInvoice(productId) {
    const p = products.find(p => p.id === productId);
    if (!p) return;
    if (currentPage !== 'invoices') {
        switchPage('invoices');
        setTimeout(() => addToInvoice(productId), 200);
        return;
    }
    const existing = invoiceItems.find(i => i.id === productId);
    if (existing) existing.quantity += 1;
    else invoiceItems.push({ ...p, quantity: 1 });
    renderInvoiceItems();
    updateInvoiceSummary();
    showToast(i18n[settings.language].addedToCart, '🛍︄');
}

function renderInvoiceItems() {
    const container = document.getElementById('invoiceItemsList');
    if (!container) return;
    if (invoiceItems.length === 0) { container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--gray-500);"><i class="fas fa-shopping-cart" style="font-size:28px; margin-bottom:6px;"></i><p>' + i18n[settings.language].noProducts + '</p></div>'; return; }
    container.innerHTML = '';
    invoiceItems.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'invoice-item';
        div.innerHTML = `
            <div style="flex:1;"><div style="font-weight:700; font-size:12px;">${escapeHTML(item.name)}</div><div style="font-size:10px; color:var(--gray-500);">${item.price} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</div></div>
            <div style="display:flex; align-items:center; gap:6px; background:white; padding:4px 10px; border-radius:26px; box-shadow:var(--shadow-sm);">
                <button onclick="changeQuantity(${idx}, -1); return false;" style="width:24px; height:24px; border-radius:50%; border:none; background:var(--gradient); color:white; font-weight:700; cursor:pointer;">-</button>
                <span style="min-width:20px; text-align:center; font-weight:600; font-size:12px;">${item.quantity}</span>
                <button onclick="changeQuantity(${idx}, 1); return false;" style="width:24px; height:24px; border-radius:50%; border:none; background:var(--gradient); color:white; font-weight:700; cursor:pointer;">+</button>
            </div>
            <div style="font-weight:700; color:var(--accent-1); margin-right:10px;">${item.price * item.quantity} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</div>
            <div onclick="removeInvoiceItem(${idx}); return false;" style="color:var(--danger); margin-right:4px; font-size:16px; cursor:pointer;"><i class="fas fa-trash"></i></div>
        `;
        container.appendChild(div);
    });
}

function changeQuantity(idx, delta) { if (invoiceItems[idx]) { invoiceItems[idx].quantity = Math.max(1, invoiceItems[idx].quantity + delta); renderInvoiceItems(); updateInvoiceSummary(); } }
function removeInvoiceItem(idx) { invoiceItems.splice(idx, 1); renderInvoiceItems(); updateInvoiceSummary(); showToast(i18n[settings.language].deleted, '🗑'); }

function updateInvoiceSummary() {
    const subtotal = invoiceItems.reduce((s,i) => s + i.price * i.quantity, 0);
    const delivery = parseFloat(document.getElementById('deliveryCost')?.value || 0);
    const profit = invoiceItems.reduce((s,i) => s + (i.price - i.cost) * i.quantity, 0) - delivery;
    const total = subtotal + delivery;
    if (document.getElementById('subtotal')) document.getElementById('subtotal').innerText = subtotal + ' ' + (settings.language === 'en' ? 'SAR' : 'ر.س');
    if (document.getElementById('profit')) document.getElementById('profit').innerText = profit + ' ' + (settings.language === 'en' ? 'SAR' : 'ر.س');
    if (document.getElementById('total')) document.getElementById('total').innerText = total + ' ' + (settings.language === 'en' ? 'SAR' : 'ر.س');
}

function generateInvoiceNumber() {
    const now = new Date();
    const num = `LVN-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
    const el = document.getElementById('invoiceNumber');
    if (el) el.innerText = num;
}

window.openWhatsAppModal = function() {
    if (invoiceItems.length === 0) { alert(i18n[settings.language].emptyInvoice); return; }
    const name = document.getElementById('customerName')?.value.trim();
    const phone = document.getElementById('customerPhone')?.value.trim();
    
    if (!name || !phone) {
        pendingAction = 'whatsapp';
        document.getElementById('modalCustomerName').value = name || '';
        document.getElementById('modalCustomerPhone').value = phone || '';
        openModal('customerInfoModal');
        return;
    }
    
    document.getElementById('whatsappPhoneNumber').value = phone;
    document.getElementById('whatsappPreview').innerText = buildWhatsAppMessage();
    openModal('whatsappModal');
};

function buildWhatsAppMessage() {
    const firstName = document.getElementById('customerName').value || i18n[settings.language].customer;
    const orderId = document.getElementById('invoiceNumber').innerText.replace('LVN-', '');
    const now = new Date();
    const formattedDate = now.toLocaleDateString(settings.language === 'en' ? 'en-US' : 'ar-SA') + ' ' + now.toLocaleTimeString(settings.language === 'en' ? 'en-US' : 'ar-SA', { hour: '2-digit', minute: '2-digit' });
    let itemsText = '';
    invoiceItems.forEach(i => { itemsText += `   • ${i.name} (${i.quantity} × ${i.price}) = ${i.quantity * i.price} ${settings.language === 'en' ? 'SAR' : 'ريال'}\n`; });
    const subtotal = invoiceItems.reduce((s,i) => s + i.price * i.quantity, 0);
    const delivery = parseFloat(document.getElementById('deliveryCost')?.value || 0);
    const total = subtotal + delivery;
    
    // تحويل قيمة التوصيل إلى نص (مجاني إذا كان 0)
    const deliveryText = delivery === 0 
        ? (settings.language === 'en' ? 'Free' : 'مجاني')
        : delivery + ' ' + (settings.language === 'en' ? 'SAR' : 'ريال');
    
    return settings.whatsappTemplate
        .replace(/{firstName}/g, firstName)
        .replace(/{orderId}/g, orderId)
        .replace(/{formattedDate}/g, formattedDate)
        .replace(/{items}/g, itemsText)
        .replace(/{delivery}/g, delivery)    // 👈 إضافة هذا السطر
        .replace(/{total}/g, total);
}

function sendWhatsApp() {
    let phone = document.getElementById('whatsappPhoneNumber').value.replace(/\D/g, '');
    if (!phone) { alert(i18n[settings.language].enterPhone); return; }
    if (settings.codeBehavior === 'prepend') {
        if (phone.startsWith('0')) phone = phone.substring(1);
        phone = settings.countryCode + phone;
    }
    if (invoiceItems.length > 0) autoSaveInvoice();
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
    window.open(url, '_blank');
    closeModal('whatsappModal');
    showToast(i18n[settings.language].whatsappOpened, '📨');
}

function sendSavedInvoiceWhatsApp(number) {
    const inv = invoices.find(i => i.number === number);
    if (!inv) return;

    const firstName = inv.customerName || i18n[settings.language].customer;
    const orderId = inv.number.replace('LVN-', '');
    const date = new Date(inv.date);
    const formattedDate = date.toLocaleDateString(settings.language === 'en' ? 'en-US' : 'ar-SA') + ' ' + 
                          date.toLocaleTimeString(settings.language === 'en' ? 'en-US' : 'ar-SA', { hour: '2-digit', minute: '2-digit' });

    let itemsText = '';
    inv.items.forEach(i => {
        itemsText += `   • ${i.name} (${i.quantity} × ${i.price}) = ${i.quantity * i.price} ${settings.language === 'en' ? 'SAR' : 'ريال'}\n`;
    });

    const total = inv.total;
    
        // تحويل قيمة التوصيل إلى نص
    const deliveryText = inv.delivery === 0 
        ? (settings.language === 'en' ? 'Free' : 'مجاني')
        : inv.delivery + ' ' + (settings.language === 'en' ? 'SAR' : 'ريال');

    const message = settings.whatsappTemplate
        .replace(/{firstName}/g, firstName)
        .replace(/{orderId}/g, orderId)
        .replace(/{formattedDate}/g, formattedDate)
        .replace(/{items}/g, itemsText)
        .replace(/{total}/g, total);

    let phone = inv.customerPhone.replace(/\D/g, '');
    if (!phone) {
        alert(i18n[settings.language].enterPhone);
        return;
    }
    if (settings.codeBehavior === 'prepend') {
        if (phone.startsWith('0')) phone = phone.substring(1);
        phone = settings.countryCode + phone;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    closeModal('invoiceDetailsModal');
    showToast(i18n[settings.language].whatsappOpened, '📨');
}

function autoSaveInvoice() {
    if (invoiceItems.length === 0) return;
    const invoice = {
        number: document.getElementById('invoiceNumber').innerText,
        date: new Date().toISOString(),
        customerName: document.getElementById('customerName').value || i18n[settings.language].customer,
        customerPhone: document.getElementById('customerPhone').value,
        items: invoiceItems.map(i => ({ ...i })),
        subtotal: parseFloat(document.getElementById('subtotal').innerText.replace(/[^\d]/g, '')),
        delivery: parseFloat(document.getElementById('deliveryCost').value || 0),
        profit: parseFloat(document.getElementById('profit').innerText.replace(/[^\d]/g, '')),
        total: parseFloat(document.getElementById('total').innerText.replace(/[^\d]/g, ''))
    };
    invoices.push(invoice);
    saveInvoices();
    updateCustomersDB();
}

window.saveInvoice = function() {
    if (invoiceItems.length === 0) { alert(i18n[settings.language].emptyInvoice); return; }
    const name = document.getElementById('customerName')?.value.trim();
    const phone = document.getElementById('customerPhone')?.value.trim();
    
    if (!name || !phone) {
        pendingAction = 'save';
        document.getElementById('modalCustomerName').value = name || '';
        document.getElementById('modalCustomerPhone').value = phone || '';
        openModal('customerInfoModal');
        return;
    }
    
    const invoice = {
        number: document.getElementById('invoiceNumber').innerText,
        date: new Date().toISOString(),
        customerName: name,
        customerPhone: phone,
        items: invoiceItems.map(i => ({ ...i })),
        subtotal: parseFloat(document.getElementById('subtotal').innerText.replace(/[^\d]/g, '')),
        delivery: parseFloat(document.getElementById('deliveryCost').value || 0),
        profit: parseFloat(document.getElementById('profit').innerText.replace(/[^\d]/g, '')),
        total: parseFloat(document.getElementById('total').innerText.replace(/[^\d]/g, ''))
    };
    invoices.push(invoice);
    saveInvoices();
    updateCustomersDB();
    showToast(i18n[settings.language].invoiceSaved, '💾');
    invoiceItems = [];
    renderInvoiceItems();
    updateInvoiceSummary();
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('deliveryCost').value = 0;
    generateInvoiceNumber();
    if (currentPage === 'dashboard') renderDashboard(document.getElementById('mainContent'));
    sessionStorage.removeItem('lorvenInvoicesvoiceState');
};
window.printInvoice = function() {
    const name = document.getElementById('customerName')?.value.trim();
    const phone = document.getElementById('customerPhone')?.value.trim();
    
    if (!name || !phone) {
        pendingAction = 'print';
        document.getElementById('modalCustomerName').value = name || '';
        document.getElementById('modalCustomerPhone').value = phone || '';
        openModal('customerInfoModal');
        return;
    }
    
    const win = window.open('', '_blank');
    if (!win) {
        alert("الرجاء السماح بالنوافذ المنبثقة للموقع.");
        return;
    }

    const customerName = name;
    const customerPhone = phone;
    const invoiceNumber = document.getElementById('invoiceNumber')?.innerText || '';
    const deliveryCost = Number(document.getElementById('deliveryCost')?.value || 0);
    const subtotal = invoiceItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = subtotal + deliveryCost;

    const itemsHtml = invoiceItems.map(item => `
        <tr>
            <td>${escapeHTML(item.name)}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toFixed(2)}</td>
            <td>${(item.quantity * item.price).toFixed(2)}</td>
        </tr>
    `).join('');

    const storePhone = '+967 778 051 888';

    const contactHtml = `
        <div class="phone-item">
            <i class="fas fa-phone-alt"></i>
            <span dir="ltr">${storePhone}</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; margin-top: 28px; padding-top: 16px; border-top: 2px dashed #243048;">
            <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 8px;">
                <div style="width:40px; height:40px; background:#F8F4F0; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#243048; font-size:20px;"><i class="fab fa-tiktok"></i></div>
                <div style="width:40px; height:40px; background:#F8F4F0; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#243048; font-size:20px;"><i class="fab fa-instagram"></i></div>
                <div style="width:40px; height:40px; background:#F8F4F0; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#243048; font-size:20px;"><i class="fab fa-telegram"></i></div>
                <div style="width:40px; height:40px; background:#F8F4F0; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#243048; font-size:20px;"><i class="fab fa-snapchat"></i></div>
            </div>
            <div style="color:#243048; font-size:14px; font-weight:500;">@LORVEN_26</div>
        </div>
    `;

    win.document.write(`
        <!DOCTYPE html>
        <html dir="${settings.language === 'en' ? 'ltr' : 'rtl'}">
        <head>
            <meta charset="UTF-8">
            <title>${settings.storeName} - فاتورة</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body {
                    background: #F8F4F0;
                    font-family: 'Tahoma', 'Arial', sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    padding: 16px;
                    color: #243048;
                }
                .invoice-card {
                    max-width: 400px;
                    width: 100%;
                    background: white;
                    border-radius: 28px;
                    box-shadow: 0 12px 30px -8px rgba(36,48,72,0.2);
                    overflow: hidden;
                }
                .invoice-header {
                    background: linear-gradient(145deg, #243048, #2e3b5c);
                    padding: 18px 22px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 3px solid #FFD8B5;
                }
                .logo {
                    font-size: 24px;
                    font-weight: 700;
                    font-family: 'Segoe UI', 'Poppins', sans-serif;
                    background: linear-gradient(145deg, #FF8A9C, #A7C7E7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .invoice-title {
                    background: rgba(255,255,255,0.12);
                    color: white;
                    padding: 6px 18px;
                    border-radius: 40px;
                    font-weight: 600;
                    font-size: 16px;
                    border: 1px solid rgba(255,216,181,0.25);
                }
                .invoice-body { padding: 22px 18px; }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    background: #F8F4F0;
                    border-radius: 22px;
                    padding: 16px 14px;
                    margin-bottom: 22px;
                    border: 1px solid #E4D9D2;
                }
                .info-item { display: flex; flex-direction: column; }
                .info-label { font-size: 11px; color: #8F8A88; text-transform: uppercase; margin-bottom: 4px; }
                .info-value { font-weight: 700; font-size: 15px; color: #243048; }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 18px 0;
                    font-size: 13px;
                }
                .items-table th {
                    color: #243048;
                    font-weight: 700;
                    padding: 10px 0 8px;
                    border-bottom: 2px solid #243048;
                    text-align: ${settings.language === 'en' ? 'left' : 'right'};
                }
                .items-table td {
                    padding: 12px 0;
                    border-bottom: 1px solid #F0E8E4;
                    color: #243048;
                }
                .items-table th:last-child,
                .items-table td:last-child { text-align: left; }
                .summary {
                    background: #FCF8F5;
                    border-radius: 18px;
                    padding: 14px 16px;
                    margin: 18px 0 14px;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    font-size: 14px;
                    border-bottom: 1px dashed #243048;
                }
                .summary-row:last-child { border-bottom: none; }
                .summary-label { font-weight: 500; color: #5f5a58; }
                .summary-value { font-weight: 600; color: #243048; }
                .grand-total {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #243048;
                    color: white;
                    padding: 14px 22px;
                    border-radius: 50px;
                    margin: 20px 0 16px;
                    box-shadow: 0 6px 14px -4px rgba(36,48,72,0.4);
                }
                .grand-total-label { font-size: 18px; font-weight: 700; }
                .grand-total-value { font-size: 24px; font-weight: 800; }
                .footer-note {
                    margin-top: 24px;
                    text-align: center;
                    font-size: 14px;
                    font-weight: 600;
                    color: #A48F89;
                    background: #F8F4F0;
                    padding: 14px;
                    border-radius: 50px;
                    border: 1px solid #FFD8B5;
                }
                @media print { body { background: white; } .invoice-card { box-shadow: none; border: 1px solid #E0D6D0; } }
            </style>
        </head>
        <body>
            <div class="invoice-card">
                <div class="invoice-header">
                    <div class="logo">LORVEN</div>
                    <div class="invoice-title">فاتورة</div>
                </div>
                <div class="invoice-body">
                    <div class="info-grid">
                        <div><div class="info-label">العميل</div><div class="info-value">${escapeHTML(customerName)}</div></div>
                        <div><div class="info-label">الجوال</div><div class="info-value" dir="ltr">${escapeHTML(customerPhone)}</div></div>
                        <div><div class="info-label">رقم الفاتورة</div><div class="info-value">${invoiceNumber}</div></div>
                        <div><div class="info-label">التاريخ</div><div class="info-value">${new Date().toLocaleDateString('ar-SA')}</div></div>
                    </div>

                    <table class="items-table">
                        <thead><tr><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>

                    <div class="summary">
                        <div class="summary-row"><span class="summary-label">التوصيل</span><span class="summary-value">${deliveryCost === 0 ? (settings.language === 'en' ? 'Free' : 'مجاني') : deliveryCost.toFixed(2) + ' ر.س'}</span></div>
                    </div>

                    <div class="grand-total">
                        <span class="grand-total-label">الإجمالي</span>
                        <span class="grand-total-value">${total.toFixed(2)} ر.س</span>
                    </div>

                    ${contactHtml}

                    <div class="footer-note">🤍 ممتنين لاختياركِ لورڤين 🤍</div>
                </div>
            </div>
            <script>
                window.print();
                window.onafterprint = function() { window.close(); };
            <\/script>
        </body>
        </html>
    `);
    win.document.close();
};