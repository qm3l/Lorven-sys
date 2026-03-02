// reports.js
// ---------- التقارير ----------
function renderReportsPage(container) {
    container.innerHTML = `
        <div style="padding:4px 0;">
            <h3 style="font-size:18px; font-weight:700; margin-bottom:16px;">📊 ${i18n[settings.language].salesReports}</h3>
            <div style="border-radius:24px; padding:16px; margin-bottom:16px; box-shadow:var(--shadow-sm);">
                <canvas id="salesChart" style="width:100%; height:160px;"></canvas>
            </div>
            <div style="border-radius:24px; padding:16px; margin-bottom:16px; box-shadow:var(--shadow-sm);">
                <canvas id="categoryChart" style="width:100%; height:160px;"></canvas>
            </div>
            <div style="border-radius:24px; padding:16px; box-shadow:var(--shadow-sm);">
                <h4 style="font-size:14px; margin-bottom:12px;">📋 ${i18n[settings.language].detailedReport}</h4>
                <div id="detailedReport" style="line-height:1.8; font-size:12px;"></div>
            </div>
        </div>
    `;
    generateSalesChart();
    generateCategoryChart();
    generateDetailedReport();
}

function generateSalesChart() {
    if (charts.sales) charts.sales.destroy();
    const last7Days = [...Array(7)].map((_,i) => { let d = new Date(); d.setDate(d.getDate()-i); return d.toDateString(); }).reverse();
    const salesData = last7Days.map(day => invoices.filter(inv => new Date(inv.date).toDateString() === day).reduce((s,inv) => s + inv.total, 0));
    charts.sales = new Chart(document.getElementById('salesChart'), {
        type: 'line',
        data: { labels: settings.language === 'en' ? ['6d','5d','4d','3d','2d','Yesterday','Today'] : ['قبل 6','قبل 5','قبل 4','قبل 3','قبل 2','أمس','اليوم'], 
                datasets: [{ label: i18n[settings.language].salesReports, data: salesData, borderColor: '#FF8A9C', backgroundColor: 'rgba(255,138,156,0.1)', tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function generateCategoryChart() {
    if (charts.category) charts.category.destroy();
    const catMap = {};
    invoices.forEach(inv => inv.items.forEach(it => { catMap[it.category] = (catMap[it.category] || 0) + it.quantity; }));
    
    // ترجمة أسماء الفئات إذا كانت اللغة إنجليزية
    let labels = Object.keys(catMap);
    if (settings.language === 'en') {
        labels = labels.map(cat => i18n.en.categoryTranslations[cat] || cat);
    }
    
    charts.category = new Chart(document.getElementById('categoryChart'), {
        type: 'doughnut',
        options: { cutout: '80%' },
        data: { 
            labels: labels.length ? labels : [i18n[settings.language].noProducts], 
            datasets: [{ data: Object.keys(catMap).length ? Object.values(catMap) : [1], backgroundColor: ['#FF8A9C','#A7C7E7','#FFD3B5','#A3D9A5','#D4B8D4'] }] 
        }
    });
}
function generateDetailedReport() {
    const totalSales = invoices.reduce((s,i) => s + i.total, 0);
    const totalProfit = invoices.reduce((s,i) => s + (i.profit || 0), 0);
    const totalInvoicesCount = invoices.length;
    const avgOrder = totalInvoicesCount ? (totalSales / totalInvoicesCount).toFixed(2) : 0;
    document.getElementById('detailedReport').innerHTML = `
        <p><strong>💰 ${i18n[settings.language].totalSales}:</strong> ${totalSales} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</p>
        <p><strong>📈 ${i18n[settings.language].netProfit}:</strong> ${totalProfit} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</p>
        <p><strong>🧾 ${i18n[settings.language].totalInvoices}:</strong> ${totalInvoicesCount}</p>
        <p><strong>📊 ${i18n[settings.language].averageOrder}:</strong> ${avgOrder} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</p>
    `;
}