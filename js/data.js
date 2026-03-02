// data.js
// دوال التخزين والتحميل من localStorage
function saveProducts() { localStorage.setItem('lorven_products', JSON.stringify(products)); }
function loadProducts() { products = JSON.parse(localStorage.getItem('lorven_products')) || []; }

function saveInvoices() { localStorage.setItem('lorvenInvoices', JSON.stringify(invoices)); }
function loadInvoices() { invoices = JSON.parse(localStorage.getItem('lorvenInvoices')) || []; }

function saveSettings() { localStorage.setItem('lorvenSettings', JSON.stringify(settings)); }
function loadSettings() { 
    const saved = localStorage.getItem('lorvenSettings');
    if (saved) settings = { ...settings, ...JSON.parse(saved) };
}

function updateCustomersDB() {
    customersDB = [...new Map(invoices.map(inv => [inv.customerPhone, { name: inv.customerName, phone: inv.customerPhone }])).values()];
}

// دالة تحميل كل البيانات (تُستدعى في main.js)
function loadData() {
    loadProducts();
    loadInvoices();
    loadSettings();
    updateCustomersDB();
}

// دالة تخمين الفئة (اختياري)
function guessCategory(productName) {
    const name = productName.toLowerCase();
    const categories = [
        { name: 'واقي شمس', keywords: ['واقي شمس', 'sunscreen', 'spf', 'صن بلوك', 'حماية من الشمس'] },
        { name: 'واقي شعر', keywords: ['واقي شعر', 'heat protect', 'حماية من الحرارة', 'spray heat'] },
        { name: 'شامبو', keywords: ['شامبو', 'شامپو', 'shampoo'] },
        { name: 'بلسم', keywords: ['بلسم', 'conditioner'] },
        { name: 'غسول', keywords: ['غسول', 'wash', 'cleanser', 'منظف'] },
        { name: 'كريم', keywords: ['كريم', 'cream'] },
        { name: 'زيت', keywords: ['زيت', 'oil'] },
        { name: 'مقشر', keywords: ['مقشر', 'scrub', 'exfoliat'] },
        { name: 'سيروم', keywords: ['سيروم', 'serum'] },
        { name: 'ماسك', keywords: ['ماسك', 'mask', 'قناع'] },
        { name: 'صابون', keywords: ['صابون', 'soap'] },
        { name: 'معطر', keywords: ['معطر', 'freshener', 'mist', 'body spray'] },
        { name: 'لوشن', keywords: ['لوشن', 'lotion', 'مرطب'] },
        { name: 'مكياج', keywords: ['مكياج', 'makeup', 'كونسيلر', 'اساس', 'فاونديشن', 'بودرة', 'روج', 'احمر شفاه', 'lipstick', 'ماسكرا'] },
        { name: 'عناية بالبشرة', keywords: ['عناية بالبشرة', 'skincare', 'بشرة'] },
        { name: 'عناية بالشعر', keywords: ['عناية بالشعر', 'hair care', 'شعر'] },
        { name: 'عطور', keywords: ['عطر', 'perfume', 'عطور'] },
        { name: 'أطفال', keywords: ['اطفال', 'baby', 'kids', 'رضع'] }
    ];
    for (const cat of categories) {
        for (const kw of cat.keywords) {
            if (name.includes(kw)) return cat.name;
        }
    }
    return 'منتجات عامة';
}

// دالة حساب عدد الفواتير الجديدة
function getNewInvoicesCount() {
    const lastSeen = localStorage.getItem('lorven_last_seen');
    if (!lastSeen) return invoices.length;
    const lastSeenTime = new Date(lastSeen).getTime();
    return invoices.filter(inv => new Date(inv.date).getTime() > lastSeenTime).length;
}