// helpers.js
// ---------- دوال مساعدة --------
function showToast(msg, icon = '🌸') {
    const t = document.getElementById('toast');
    t.innerHTML = `${icon} ${msg}`;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

function generateBarcode() {
    let max = 6291100000000;
    products.forEach(p => { if (parseInt(p.barcode) > max) max = parseInt(p.barcode); });
    return (max + 1).toString();
}

function escapeHTML(str) { return String(str).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]); }