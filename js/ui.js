// =============== ui.js ================
// نسخة كاملة مع دوال الحفظ والإعدادات والذكاء الاصطناعي
// تم تعديل renderDashboard لإضافة أزرار بحث وفاتورة شهرية ضمن قائمة أفقية قابلة للتمرير
// وإضافة تأثير hover للبطاقات (stat-card, action-item, recent-invoice-item)

// ---------- إدارة الصفحات ----------
const pages = {
    dashboard: { title: 'الرئيسية', showBack: false },
    products: { title: 'المنتجات', showBack: true },
    invoices: { title: 'فاتورة جديدة', showBack: true },
    reports: { title: 'التقارير', showBack: true },
    settings: { title: 'الإعدادات', showBack: true },
    history: { title: 'سجل الفواتير', showBack: true },
    privacy: { title: 'سياسة الخصوصية', showBack: true, parent: 'settings' },   // 👈 جديد
    terms: { title: 'شروط الاستخدام', showBack: true, parent: 'settings' }      // 👈 
};

function switchPage(page) {
    if (currentPage === 'invoices') saveInvoiceState();   // حفظ حالة الفاتورة
    currentPage = page;
    const header = document.getElementById('dynamicHeader');
    const pageInfo = pages[page] || { title: 'لورڤين', showBack: true };
    let titleText = pageInfo.title;
    if (settings.language === 'en') {
        const translations = { 'الرئيسية':'Dashboard', 'المنتجات':'Products', 'فاتورة جديدة':'New Invoice', 'التقارير':'Reports', 'الإعدادات':'Settings', 'سجل الفواتير':'History' };
        titleText = translations[pageInfo.title] || pageInfo.title;
    }
    header.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; height: 48px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                ${pageInfo.showBack ? `<div class="back-btn" onclick="goBack()"><i class="fas fa-chevron-right"></i></div>` : ''}
                <div class="page-title" style="font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${titleText}
                </div>
            </div>
            <div style="flex: 0 1 auto; text-align: center;">
                ${settings.logo ? `<img src="${settings.logo}" alt="logo" style="max-height: 32px; max-width: 80px; object-fit: contain;">` : ''}
            </div>
            <div style="width: 40px; display: flex; justify-content: flex-end;">
                ${page === 'dashboard' ? 
                    `<div class="notification-badge" onclick="switchPage('history')" style="position: relative;">
                        <i class="fas fa-bell"></i>
                        ${getNewInvoicesCount() > 0 ? `<span class="badge-count">${getNewInvoicesCount()}</span>` : ''}
                    </div>` : ''}
            </div>
        </div>
    `;
    
    try {
        renderPage(page);
        if (page === 'invoices') restoreInvoiceState(); 
    } catch (e) {
        document.getElementById('mainContent').innerHTML = 'حدث خطأ: ' + e.message;
    }
    
    applySettings();
    
    const main = document.getElementById('mainContent');
    main.classList.remove('page-slide');
    void main.offsetWidth;
    main.classList.add('page-slide');
    
    const navOrder = ['dashboard','products','invoices','reports','settings'];
    document.querySelectorAll('.nav-btn').forEach((btn, i) => {
        btn.classList.toggle('active', navOrder[i] === page);
    });
}

function goBack() { switchPage('dashboard'); }

function renderPage(page) {
    const container = document.getElementById('mainContent');
    if (!container) return;
    
    container.innerHTML = '';

    if (page === 'dashboard') {
        if (typeof renderDashboard === 'function') {
            renderDashboard(container);
        } else {
            container.innerHTML = 'خطأ: دالة renderDashboard غير موجودة';
        }
    }
    else if (page === 'products') {
        if (typeof renderProductsPage === 'function') {
            renderProductsPage(container);
            applySettings(); // تحديث الترجمة
        } else {
            container.innerHTML = 'خطأ: دالة renderProductsPage غير موجودة';
        }
    }
    else if (page === 'invoices') {
        if (typeof renderInvoicesPage === 'function') {
            renderInvoicesPage(container);
            applySettings();
        } else {
            container.innerHTML = 'خطأ: دالة renderInvoicesPage غير موجودة';
        }
    }
    else if (page === 'reports') {
        if (typeof renderReportsPage === 'function') {
            renderReportsPage(container);
            applySettings();
        } else {
            container.innerHTML = 'خطأ: دالة renderReportsPage غير موجودة';
        }
    }
    else if (page === 'settings') {
        if (typeof renderSettingsPage === 'function') {
            renderSettingsPage(container);
            applySettings(); // تأكد من تطبيق الترجمة بعد عرض الإعدادات
        } else {
            container.innerHTML = 'خطأ: دالة renderSettingsPage غير موجودة';
        }
    }
    else if (page === 'history') {
        if (typeof renderHistoryPage === 'function') {
            renderHistoryPage(container);
            applySettings();
        } else {
            container.innerHTML = 'خطأ: دالة renderHistoryPage غير موجودة';
        }
    }
}

// ---------- الرئيسية ----------
// [تم التعديل هنا: إضافة أزرار بحث وشهرية ضمن قائمة أفقية قابلة للتمرير، وإضافة hover-effect]
function renderDashboard(container) {
    try {
        const today = new Date().toDateString();
        const todayInvoices = invoices.filter(inv => new Date(inv.date).toDateString() === today);
        const salesToday = todayInvoices.reduce((s,i) => s + i.total, 0);
        const profitToday = todayInvoices.reduce((s,i) => s + (i.profit || 0), 0);
        const ordersToday = todayInvoices.length;
        const customersCount = customersDB.length;

        let html = `
            <div style="display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 16px;">
                <div class="stat-card hover-effect"><div class="stat-icon"><i class="fas fa-coins"></i></div><div class="stat-value">${salesToday}</div><div class="stat-label">${i18n[settings.language].todaySales}</div></div>
                <div class="stat-card hover-effect"><div class="stat-icon"><i class="fas fa-chart-line"></i></div><div class="stat-value">${profitToday}</div><div class="stat-label">${i18n[settings.language].netProfit}</div></div>
                <div class="stat-card hover-effect"><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div><div class="stat-value">${ordersToday}</div><div class="stat-label">${i18n[settings.language].todayOrders}</div></div>
                <div class="stat-card hover-effect"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-value">${customersCount}</div><div class="stat-label">${i18n[settings.language].newCustomers}</div></div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="font-size: 16px; font-weight: 700;">${i18n[settings.language].quickActions}</h3>
                </div>
                <!-- قائمة أفقية قابلة للتمرير تحتوي على جميع الإجراءات -->
                <div style="display: flex; overflow-x: auto; gap: 10px; padding-bottom: 5px;" class="actions-grid">
                    <div class="action-item hover-effect" onclick="switchPage('invoices')"><div class="action-icon"><i class="fas fa-plus"></i></div><span class="action-label">${i18n[settings.language].invoice}</span></div>
                    <div class="action-item hover-effect" onclick="openModal('importModal')"><div class="action-icon"><i class="fas fa-file-import"></i></div><span class="action-label">${i18n[settings.language].importAction}</span></div>
                    <div class="action-item hover-effect" onclick="switchPage('products')"><div class="action-icon"><i class="fas fa-box"></i></div><span class="action-label">${i18n[settings.language].products}</span></div>
                    <div class="action-item hover-effect" onclick="switchPage('reports')"><div class="action-icon"><i class="fas fa-chart-pie"></i></div><span class="action-label">${i18n[settings.language].reports}</span></div>
                    <div class="action-item hover-effect" onclick="openModal('searchInvoiceModal')"><div class="action-icon"><i class="fas fa-search"></i></div><span class="action-label">${i18n[settings.language].searchBtn}</span></div>
                    <div class="action-item hover-effect" onclick="openModal('monthlyInvoiceModal')"><div class="action-icon"><i class="fas fa-calendar-alt"></i></div><span class="action-label">${i18n[settings.language].monthlyBtn}</span></div>
                </div>
            </div>
            <div>
                <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 10px;">${i18n[settings.language].recentInvoices}</h3>
                <div style="background: white; border-radius: 22px; border: 1px solid var(--gray-100); overflow: hidden;">
        `;
        const recent = invoices.slice(-5).reverse();
        if (recent.length === 0) html += '<div style="padding: 16px; text-align: center; color: var(--gray-500);">' + i18n[settings.language].noInvoices + '</div>';
        else {
            recent.forEach(inv => {
                html += `<div class="recent-invoice-item hover-effect" style="display: flex; align-items: center; padding: 12px; border-bottom: 1px solid var(--gray-100); cursor: pointer;" onclick="viewInvoiceDetails('${inv.number}')">
                    <div style="width: 36px; height: 36px; background: rgba(255,138,156,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-left: 10px;"><i class="fas fa-receipt" style="color: var(--accent-1);"></i></div>
                    <div style="flex:1;"><div style="font-weight: 700; font-size: 12px;">${inv.number}</div><div style="font-size: 10px; color: var(--gray-500);">${new Date(inv.date).toLocaleDateString(settings.language === 'en' ? 'en-US' : 'ar-SA')} . ${inv.customerName || i18n[settings.language].customer}</div></div>
                    <div style="font-weight: 700; color: var(--accent-1);">${inv.total} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</div>
                </div>`;
            });
        }
        html += `</div></div>`;
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = 'خطأ في renderDashboard: ' + e.message;
    }
}

// حفظ حالة الفاتورة
function saveInvoiceState() {
    const state = {
        customerName: document.getElementById('customerName')?.value || '',
        customerPhone: document.getElementById('customerPhone')?.value || '',
        delivery: document.getElementById('deliveryCost')?.value || 0,
        items: invoiceItems
    };
    sessionStorage.setItem('lorvenInvoicesvoiceState', JSON.stringify(state));
}

// استعادة حالة الفاتورة
function restoreInvoiceState() {
    const saved = sessionStorage.getItem('lorvenInvoicesvoiceState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            document.getElementById('customerName').value = state.customerName || '';
            document.getElementById('customerPhone').value = state.customerPhone || '';
            document.getElementById('deliveryCost').value = state.delivery || '';
            invoiceItems = state.items || [];
            renderInvoiceItems();
            updateInvoiceSummary();
        } catch (e) {}
    }
}

// ========== دوال المودالات ==========
// ========== دوال المودالات ==========
window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    
    // إخفاء أي مودال مفتوح آخر (اختياري)
    document.querySelectorAll('.modal').forEach(m => {
        if (m.id !== id) m.style.display = 'none';
    });
    
    // فتح المودال المطلوب
    modal.style.display = 'flex';
    
    // كود خاص لملء التصنيفات عند فتح مودال إضافة منتج
    if (id === 'addProductModal') {
        const catSelect = document.getElementById('newProductCategory');
        if (catSelect) {
            const categories = i18n[settings.language].categories || i18n['ar'].categories;
            catSelect.innerHTML = categories.map(c => `<option>${c}</option>`).join('');
        }
    }
    
    // كود خاص لمودال الأمان (تحميل القيم المحفوظة)
    if (id === 'settingsSecurity') {
        setTimeout(() => {
            const appLockSelect = document.getElementById('appLock');
            const pinField = document.getElementById('pinField');
            const pinInput = document.getElementById('pinCode');
            
            if (appLockSelect) {
                appLockSelect.value = settings.appLock || 'off';
                if (pinField) {
                    pinField.style.display = settings.appLock === 'pin' ? 'block' : 'none';
                }
                if (pinInput) {
                    pinInput.value = settings.pinCode || '';
                }
            }
        }, 100);
    }
};

window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
    }
};

// إغلاق المودال عند الضغط على الخلفية
window.addEventListener('click', e => {
    document.querySelectorAll('.modal').forEach(m => {
        if (e.target === m) {
            m.style.display = 'none';
        }
    });
});
// ========== دوال حفظ الإعدادات ==========
window.saveGeneral = function() {
    const darkMode = document.getElementById('darkMode').value;
    const language = document.getElementById('appLanguage').value;
    settings.darkMode = darkMode;
    settings.language = language;
    localStorage.setItem('lorvenSettings', JSON.stringify(settings));
    applySettings();
    closeModal('settingsGeneral');
    switchPage(currentPage);   // ← هذا السطر مهم جداً
};

window.saveCountryCode = function() {
    const select = document.getElementById('countryCodeSelect');
    let code = select.value;
    if (code === 'other') {
        code = document.getElementById('customCountryCode').value;
    }
    const behavior = document.querySelector('input[name="codeBehavior"]:checked').value;
    settings.countryCode = code;
    settings.codeBehavior = behavior;
    localStorage.setItem('lorvenSettings', JSON.stringify(settings));
    closeModal('settingsCountryCode');
};

window.saveTemplate = function() {
    const template = document.getElementById('whatsappTemplate').value;
    settings.whatsappTemplate = template;
    localStorage.setItem('lorvenSettings', JSON.stringify(settings));
    closeModal('settingsTemplates');
};

window.exportBackup = function() {
    const data = {
        settings: settings,
        customers: customersDB,
        products: productsDB,
        invoices: invoices
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lorven-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    closeModal('settingsBackup');
};

window.importBackup = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.settings) { settings = data.settings; localStorage.setItem('lorvenSettings', JSON.stringify(settings)); }
            if (data.customers) { customersDB = data.customers; localStorage.setItem('lorvenCustomers', JSON.stringify(customersDB)); }
            if (data.products) { productsDB = data.products; localStorage.setItem('lorvenProducts', JSON.stringify(productsDB)); }
            if (data.invoices) { invoices = data.invoices; localStorage.setItem('lorvenInvoices', JSON.stringify(invoices)); }
            alert('تم الاستيراد بنجاح');
            applySettings();
            renderPage(currentPage);
        } catch (err) {
            alert('خطأ في قراءة الملف');
        }
    };
    reader.readAsText(file);
    closeModal('settingsBackup');
    document.getElementById('importFile').value = '';
};

window.clearAllData = function() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
        localStorage.clear();
        settings = { language: 'ar', darkMode: 'auto', countryCode: '967', codeBehavior: 'prepend', storeName: 'LORVEN', logo: '', whatsappTemplate: '' };
        customersDB = [];
        productsDB = [];
        invoices = [];
        localStorage.setItem('lorvenSettings', JSON.stringify(settings));
        localStorage.setItem('lorvenCustomers', JSON.stringify(customersDB));
        localStorage.setItem('lorvenProducts', JSON.stringify(productsDB));
        localStorage.setItem('lorvenInvoices', JSON.stringify(invoices));
        alert('تم المسح');
        applySettings();
        renderPage(currentPage);
    }
    closeModal('settingsBackup');
};

window.sendAds = function() {
    const adMessage = document.getElementById('adMessage').value;
    if (!adMessage) {
        alert('الرجاء كتابة نص الإعلان');
        return;
    }
    if (!customersDB || customersDB.length === 0) {
        alert('لا يوجد عملاء');
        return;
    }
    let count = 0;
    customersDB.forEach(c => {
        if (c.phone) {
            let phone = c.phone;
            if (settings.codeBehavior === 'prepend' && settings.countryCode && !phone.startsWith('+')) {
                phone = settings.countryCode + phone;
            }
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(adMessage)}`;
            window.open(url, '_blank');
            count++;
            if (count >= 10) {
                alert('تم فتح 10 رسائل، قد يمنع المتصفح فتح المزيد');
                return;
            }
        }
    });
    alert(`تم فتح ${count} محادثة واتساب`);
    closeModal('settingsAds');
};

window.saveCustomization = function() {
    const storeName = document.getElementById('storeName').value;
    const logoUrl = document.getElementById('logoUrl').value;
    settings.storeName = storeName;
    settings.logo = logoUrl;
    localStorage.setItem('lorvenSettings', JSON.stringify(settings));
    applySettings();
    closeModal('settingsCustomize');
};

// ========== دوال مساعدة ==========

window.getNewInvoicesCount = function() {
    return 0;  // يمكن تحديثها لتعود بعدد الفواتير الجديدة
};

window.viewInvoiceDetails = function(invoiceNumber) {
    alert('عرض تفاصيل الفاتورة: ' + invoiceNumber);
};

// ========== دوال الذكاء الاصطناعي (من الملف الأول) ==========

window.toggleAIChat = function() {
    const chatWindow = document.getElementById('aiChatWindow');
    if (chatWindow) {
        chatWindow.classList.toggle('open');
    }
};

function appendMessage(sender, text) {
    const messagesDiv = document.getElementById('aiChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${sender === 'user' ? 'ai-user-message' : 'ai-bot-message'}`;
    messageDiv.innerHTML = `
        <div class="ai-avatar"><i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i></div>
        <div class="ai-bubble">${text.replace(/\n/g, '<br>')}</div>
    `;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function appendFileMessage(sender, fileData) {
    const messagesDiv = document.getElementById('aiChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${sender === 'user' ? 'ai-user-message' : 'ai-bot-message'}`;
    
    let filePreview = '';
    if (fileData.type.startsWith('image/')) {
        filePreview = `<img src="${fileData.content}" style="max-width: 200px; max-height: 150px; border-radius: 12px; margin-top: 5px;">`;
    } else {
        filePreview = `<div class="file-preview"><i class="fas fa-file-alt"></i> ${fileData.name}</div>`;
    }

    const fileAttachedText = i18n[settings.language].fileAttached || 'ملف مرفوع';

    messageDiv.innerHTML = `
        <div class="ai-avatar"><i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i></div>
        <div class="ai-bubble">
            ${filePreview}
            <div style="margin-top: 5px; font-style: italic; opacity:0.8;">${fileAttachedText}</div>
        </div>
    `;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

window.handleFileUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const fileData = {
            name: file.name,
            type: file.type,
            content: e.target.result // base64 للصور، نص للملفات النصية
        };
        
        // عرض معاينة للملف في الدردشة
        appendFileMessage('user', fileData);
        
        // تخزين الملف مؤقتاً لإرفاقه مع الرسالة القادمة
        window.pendingFile = fileData;
        
        // تغيير لون الزر للدلالة على وجود ملف معلق
        const attachBtn = document.querySelector('.ai-attach-btn');
        if (attachBtn) attachBtn.style.color = '#FF6B8B';
    };

    if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file); // يقرأ الصورة كـ base64
    } else {
        reader.readAsText(file, 'UTF-8'); // للملفات النصية
    }
    
    // إعادة تعيين input لتمكين رفع نفس الملف مرة أخرى
    event.target.value = '';
};

window.sendAIMessage = async function() {
    const input = document.getElementById('aiUserInput');
    const message = input.value.trim();
    const file = window.pendingFile;

    if (!message && !file) return;

    if (message) {
        appendMessage('user', message);
        input.value = '';
    }
    
    if (file) {
        delete window.pendingFile;
        const attachBtn = document.querySelector('.ai-attach-btn');
        if (attachBtn) attachBtn.style.color = '';
    }

    try {
        const reply = await window.ai.send(message, file || null);
        appendMessage('bot', reply);
    } catch (error) {
        console.error('AI Error:', error);
        appendMessage('bot', '❌ حدث خطأ في الاتصال بالذكاء الاصطناعي.');
    }
};

// ========== دالة عرض التوست ==========
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ========== تهيئة الصفحة ==========
window.initUI = function() {
    // إضافة مستمع لإغلاق الدردشة عند النقر خارجها
    document.addEventListener('click', function(e) {
        const chat = document.getElementById('aiChatWindow');
        const icon = document.querySelector('.ai-floating-icon');
        if (chat && chat.classList.contains('open') && 
            !chat.contains(e.target) && 
            !icon.contains(e.target)) {
            chat.classList.remove('open');
        }
    });
};

// تعيين قيمة الشهر الحالي لحقل الشهر
document.addEventListener('DOMContentLoaded', function() {
    const monthInput = document.getElementById('monthInput');
    if (monthInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        monthInput.value = `${year}-${month}`;
    }
});