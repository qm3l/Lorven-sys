// history.js
// ---------- سجل الفواتير والبحث المتقدم ---------
function renderHistoryPage(container) {
    let html = '<h3 style="font-size:20px; font-weight:700; margin-bottom:16px;">📑 ' + i18n[settings.language].invoiceHistory + '</h3>';
    if (invoices.length === 0) html += '<div style="background:white; border-radius:22px; padding:24px; text-align:center; color:var(--gray-500);">' + i18n[settings.language].noSavedInvoices + '</div>';
    else {
        invoices.slice().reverse().forEach(inv => {
            html += `<div class="history-item" style="background:white; border-radius:18px; padding:14px; margin-bottom:10px; border:1px solid var(--gray-100); cursor:pointer;" onclick="viewInvoiceDetails('${inv.number}')">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:700; font-size:13px;">${inv.number}</span>
                            <span style="color:var(--accent-1); font-weight:700;">${inv.total} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:4px; font-size:11px; color:var(--gray-500);">
                            <span>${new Date(inv.date).toLocaleDateString(settings.language === 'en' ? 'en-US' : 'ar-SA')}</span>
                            <span>${inv.customerName || i18n[settings.language].customer}</span>
                        </div>
                    </div>`;
        });
    }
    container.innerHTML = html;
}

function viewInvoiceDetails(number) {
    const inv = invoices.find(i => i.number === number);
    if (!inv) { alert(i18n[settings.language].invoiceNotFound); return; }
    const itemsHtml = inv.items.map(i => `<div style="display:flex; justify-content:space-between; padding:4px 0; font-size:11px;"><span>${i.name} (${i.quantity} × ${i.price})</span><span style="font-weight:600;">${i.quantity * i.price} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</span></div>`).join('');
    document.getElementById('invoiceDetailsContent').innerHTML = `
        <h4 style="margin-bottom:10px; font-size:14px;">${inv.number}</h4>
        <p style="font-size:11px;"><strong>${i18n[settings.language].customer}:</strong> ${inv.customerName || i18n[settings.language].noCustomer}</p>
        <p style="font-size:11px;"><strong>${i18n[settings.language].date}:</strong> ${new Date(inv.date).toLocaleString(settings.language === 'en' ? 'en-US' : 'ar-SA')}</p>
        <div style="border-top:1px solid var(--gray-100); margin:10px 0;"></div>
        ${itemsHtml}
        <div style="border-top:1px solid var(--gray-100); margin:10px 0;"></div>
        <div style="display:flex; justify-content:space-between; font-size:11px;"><span>${i18n[settings.language].delivery}</span><span>${inv.delivery} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</span></div>
        <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:700; margin-top:8px;"><span>${i18n[settings.language].total}</span><span style="color:var(--accent-1);">${inv.total} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</span></div>
        <button class="btn btn-outline" style="width:100%; margin-top:12px;" onclick="sendSavedInvoiceWhatsApp('${inv.number}')"><i class="fab fa-whatsapp"></i> ${i18n[settings.language].sendInvoice}</button>
        <button class="btn btn-outline" style="width:100%; margin-top:8px;" onclick="closeModal('invoiceDetailsModal')">${i18n[settings.language].close}</button>
        <button class="btn btn-outline" style="width:100%; margin-top:6px; color:var(--danger); border-color:var(--danger);" onclick="deleteInvoice('${inv.number}'); closeModal('invoiceDetailsModal');">${i18n[settings.language].deleteInvoice}</button>
    `;
    openModal('invoiceDetailsModal');
}

function deleteInvoice(number) {
    if (!confirm(i18n[settings.language].confirmDeleteInvoice)) return;
    invoices = invoices.filter(inv => inv.number !== number);
    saveInvoices();
    updateCustomersDB();
    if (currentPage === 'history') renderHistoryPage(document.getElementById('mainContent'));
    else if (currentPage === 'dashboard') renderDashboard(document.getElementById('mainContent'));
    showToast(i18n[settings.language].invoiceDeleted, '🗑');
}

function findInvoiceAdvanced() {
    const num = document.getElementById('invoiceSearchNumber').value.trim();
    const name = document.getElementById('invoiceSearchCustomer').value.trim();
    const resultDiv = document.getElementById('invoiceSearchResult');
    
    if (!num && !name) {
        resultDiv.innerHTML = `<p style="color:var(--accent-1); text-align:center; padding: 8px;">${i18n[settings.language].enterSearchCriteria}</p>`;
        return;
    }
    
    let filtered = invoices.filter(inv => {
        let matchNum = true, matchName = true;
        if (num) {
            matchNum = inv.number.toLowerCase().includes(num.toLowerCase());
        }
        if (name) {
            matchName = inv.customerName && inv.customerName.toLowerCase().includes(name.toLowerCase());
        }
        return matchNum && matchName;
    });
    
    if (filtered.length === 0) {
        resultDiv.innerHTML = `<p style="color:var(--danger); text-align:center; padding: 8px;">${i18n[settings.language].noResults}</p>`;
    } else {
        resultDiv.innerHTML = filtered.slice(0, 10).map(inv => `
            <div class="invoice-search-item" onclick="viewInvoiceDetails('${inv.number}'); closeModal('searchInvoiceModal');">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 32px; height: 32px; background: var(--gradient); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 12px;">${inv.number}</div>
                        <div style="font-size: 10px; color: var(--gray-500);">
                            ${inv.customerName || i18n[settings.language].noCustomer} · ${new Date(inv.date).toLocaleDateString(settings.language === 'ar' ? 'ar-SA' : 'en-US')}
                        </div>
                    </div>
                    <div style="font-weight: 700; color: var(--accent-1);">${inv.total} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</div>
                </div>
            </div>
        `).join('');
    }
}

function generateMonthlyInvoice() {
    const customerSelect = document.getElementById('monthlyCustomerSelect');
    const customerPhone = customerSelect.value;
    const customerName = customerSelect.selectedOptions[0]?.text.split(' - ')[0] || '';
    const month = document.getElementById('monthlyMonth').value;
    if (!month || !customerPhone) { alert(i18n[settings.language].selectCustomerMonth); return; }
    const [year, monthNum] = month.split('-');
    const monthlyInvoices = invoices.filter(inv => 
        inv.customerPhone === customerPhone && 
        new Date(inv.date).getFullYear() == year && 
        (new Date(inv.date).getMonth() + 1) == parseInt(monthNum)
    );
    if (monthlyInvoices.length === 0) { document.getElementById('monthlyInvoiceResult').innerHTML = '<p style="color:red;">' + i18n[settings.language].noMonthlyInvoices + '</p>'; return; }
    let items = [];
    monthlyInvoices.forEach(inv => inv.items.forEach(it => {
        const found = items.find(i => i.id === it.id);
        if (found) found.quantity += it.quantity;
        else items.push({ ...it });
    }));
    const subtotal = items.reduce((s,i) => s + i.price * i.quantity, 0);
    const totalProfit = items.reduce((s,i) => s + (i.price - i.cost) * i.quantity, 0);
    const total = subtotal;
    const itemsHtml = items.map(i => `<div style="display:flex; justify-content:space-between; font-size:11px;"><span>${i.name} (${i.quantity} × ${i.price})</span><span>${i.quantity * i.price} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</span></div>`).join('');
    document.getElementById('monthlyInvoiceResult').innerHTML = `
        <div style="background:var(--gray-50); border-radius:18px; padding:14px; margin-top:12px;">
            <h4 style="margin-bottom:8px; font-size:13px;">${i18n[settings.language].monthlyInvoice} ${month} ${i18n[settings.language].for || 'لـ'} ${customerName}</h4>
            ${itemsHtml}
            <div style="border-top:1px solid var(--gray-200); margin:8px 0;"></div>
            <div style="display:flex; justify-content:space-between; font-weight:700; font-size:13px;"><span>${i18n[settings.language].total}</span><span style="color:var(--accent-1);">${total} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</span></div>
            <div style="display:flex; justify-content:space-between; font-size:11px;"><span>${i18n[settings.language].netProfit}</span><span style="color:var(--success);">${totalProfit} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</span></div>
        </div>
    `;
}