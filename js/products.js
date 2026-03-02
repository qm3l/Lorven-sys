// products.js
// ---------- صفحة المنتجات ----------
function renderProductsPage(container) {
    // استخراج قائمة الفئات الفريدة من المنتجات
    const categories = [i18n[settings.language].all, ...new Set(products.map(p => p.category).filter(c => c))];
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
    let html = `
        <div class="products-header">
            <div class="products-title">
                ${i18n[settings.language].products}
                <span class="product-count">${products.length}</span>
            </div>
            <div class="products-actions">
                <button onclick="toggleSelectionMode()" title="${selectionMode ? 'إلغاء التحديد' : 'تحديد'}"><i class="fas ${selectionMode ? 'fa-times' : 'fa-check-double'}"></i></button>
                <button onclick="openBarcodeScanner()" title="${i18n[settings.language].edit}"><i class="fas fa-camera"></i></button>
                <button onclick="openModal('addProductModal')"><i class="fas fa-plus"></i></button>
            </div>
        </div>
        ${selectionMode ? `
     <div class="bulk-actions">
    <button class="btn btn-outline" onclick="selectAllProducts()"><i class="fas fa-check-double"></i> ${i18n[settings.language].selectAll}</button>
    <button class="btn btn-outline" onclick="deselectAllProducts()"><i class="fas fa-times"></i> ${i18n[settings.language].deselectAll}</button>
    <button class="btn btn-outline" onclick="deleteSelectedProducts()"><i class="fas fa-trash"></i> ${i18n[settings.language].delete}</button>
    <button class="btn btn-primary" onclick="addSelectedToInvoice()"><i class="fas fa-cart-plus"></i> ${i18n[settings.language].forInvoice}</button>
    <button class="btn btn-outline" onclick="toggleSelectionMode()"><i class="fas fa-times"></i> ${i18n[settings.language].complete}</button>
</div>
        ` : ''}
        <div style="position: relative; margin-bottom: 14px;">
            <input type="text" class="form-control" id="productSearchInput" placeholder="${i18n[settings.language].search}..." style="padding-left: 36px;" autocomplete="off">
            <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--gray-500);"></i>
            <div class="search-results" id="searchResults"></div>
        </div>
        <!-- شريط الفئات القابل للتمرير -->
        <div class="categories-bar">
            ${['الكل', ...new Set(products.map(p => p.category).filter(c => c))].map(cat => {
            const displayCat = (cat === 'الكل') 
    ? i18n[settings.language].all 
    : (settings.language === 'en' ? (i18n.en.categoryTranslations[cat] || cat) : cat);
        return `
                <button class="btn ${selectedCategory.trim() === cat.trim() ? 'btn-primary' : 'btn-outline'}" style="padding: 4px 12px; font-size: 11px; border-radius: 20px; white-space: nowrap;" onclick="selectCategory('${displayCat}')">${displayCat}</button>
            `}).join('')}
        </div>
        <div class="products-grid-container" id="productsGridContainer">
            <div class="products-grid" id="productsGrid"></div>
        </div>
        <!-- أزرار الترقيم -->
        <div class="pagination-controls" style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 16px;">
            <button class="btn btn-outline" style="padding: 4px 12px;" onclick="changePage(-1)" id="prevPageBtn" ${currentPageNum === 1 ? 'disabled' : ''}>${i18n[settings.language].prev}</button>
            <span style="font-size: 12px;">${i18n[settings.language].page} <span id="currentPageDisplay">${currentPageNum}</span> / <span id="totalPagesDisplay">${totalPages}</span></span>
            <button class="btn btn-outline" style="padding: 4px 12px;" onclick="changePage(1)" id="nextPageBtn" ${currentPageNum >= Math.ceil(filteredProducts.length / itemsPerPage) ? 'disabled' : ''}>${i18n[settings.language].next}</button>
        </div>
    `;
    container.innerHTML = html;
    renderProductsGrid();
    setupProductsSearch();
}

function renderProductsGrid(filter = '') {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // تطبيق الفلتر (نص البحث + الفئة)
    let filtered = products;
    if (filter) {
        filtered = filtered.filter(p => p.name.includes(filter) || p.barcode.includes(filter));
    }
    if (selectedCategory !== 'الكل') {
        filtered = filtered.filter(p => p.category === selectedCategory);
    }
    filteredProducts = filtered; // تحديث المتغير العام

    // حساب عدد الصفحات
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
    if (currentPageNum < 1) currentPageNum = 1;
    if (currentPageNum > totalPages) currentPageNum = totalPages;

    // تحديث عرض الصفحات
    const currentSpan = document.getElementById('currentPageDisplay');
    const totalSpan = document.getElementById('totalPagesDisplay');
    if (currentSpan) currentSpan.innerText = currentPageNum;
    if (totalSpan) totalSpan.innerText = totalPages;

    // تفعيل/تعطيل الأزرار
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    if (prevBtn) prevBtn.disabled = (currentPageNum === 1);
    if (nextBtn) nextBtn.disabled = (currentPageNum >= totalPages);

    // استخراج منتجات الصفحة الحالية
    const start = (currentPageNum - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = filteredProducts.slice(start, end);

    // عرض المنتجات
    grid.innerHTML = '';
    if (pageProducts.length === 0) {
        grid.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 24px;">' + i18n[settings.language].noProducts + '</div>';
        return;
    }
    pageProducts.forEach(p => {
        const card = document.createElement('div');
        card.className = `product-card ${selectionMode ? 'selectable' : ''} ${selectedProducts.includes(p.id) ? 'selected' : ''}`;
        card.setAttribute('data-id', p.id);

        if (selectionMode) {
            card.onclick = (e) => {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                toggleSelectProduct(p.id);
            };
        } else {
            card.onclick = null;
        }

        card.innerHTML = `
            <div class="product-checkbox"></div>
            <div class="product-icon">     ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">` : `<i class="fas ${p.icon || 'fa-box'}"></i>`} </div>
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 3px;">${escapeHTML(p.name)}</div>
            <div style="font-size: 14px; font-weight: 700; color: var(--accent-1); margin-bottom: 4px;">${p.price} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--gray-500); margin-bottom: 10px;">
                <span>${p.barcode.slice(-6)}</span><span>${i18n[settings.language].stockLabel}: ${p.stock}</span>
            </div>
            <div style="display: flex; gap: 6px;" onclick="event.stopPropagation()">
                <button class="btn btn-outline" style="flex:1; padding: 6px;" onclick="editProduct(${p.id}); return false;" title="${i18n[settings.language].edit}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-primary" style="flex:1; padding: 6px;" onclick="addToInvoice(${p.id}); return false;"><i class="fas fa-cart-plus"></i></button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function changePage(delta) {
    currentPageNum += delta;
    renderProductsGrid(document.getElementById('productSearchInput')?.value || '');
}

function selectCategory(category) {
    // تحديث المتغير العام
    selectedCategory = category;
    currentPageNum = 1;
    
    // تحديث ألوان أزرار الفئات
    const categoryButtons = document.querySelectorAll('.categories-bar .btn');
    categoryButtons.forEach(btn => {
        if (btn.textContent.trim() === category) {
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-primary');
        } else {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline');
        }
    });
    
    // تحديث قائمة المنتجات
    renderProductsGrid(document.getElementById('productSearchInput')?.value || '');
    
    // إخفاء القائمة المنسدلة إن وجدت
    const dropdown = document.getElementById('hiddenCategoriesDropdown');
    if (dropdown) dropdown.style.display = 'none';
}

function toggleHiddenCategories() {
    const dropdown = document.getElementById('hiddenCategoriesDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

function openDocumentModal(title, url) {
    document.getElementById('documentModalTitle').innerText = title;
    document.getElementById('documentIframe').src = url;
    openModal('documentModal');
}

function toggleSelectionMode() {
    selectionMode = !selectionMode;
    if (!selectionMode) selectedProducts = [];
    renderProductsPage(document.getElementById('mainContent'));
}

function toggleSelectProduct(id) {
    const index = selectedProducts.indexOf(id);
    if (index === -1) selectedProducts.push(id);
    else selectedProducts.splice(index, 1);
    renderProductsGrid(document.getElementById('productSearchInput')?.value || '');
}

function selectAllProducts() {
    selectedProducts = products.map(p => p.id);
    renderProductsGrid(document.getElementById('productSearchInput')?.value || '');
}

function deselectAllProducts() {
    selectedProducts = [];
    renderProductsGrid(document.getElementById('productSearchInput')?.value || '');
}

function deleteSelectedProducts() {
    if (selectedProducts.length === 0) { alert('لم تختار أي منتج'); return; }
    if (!confirm(`حذف ${selectedProducts.length} منتج؟`)) return;
    products = products.filter(p => !selectedProducts.includes(p.id));
    saveProducts();
    selectedProducts = [];
    selectionMode = false;
    renderProductsPage(document.getElementById('mainContent'));
    showToast('تم حذف المنتجات المحددة', '🗑︄');
}

function addSelectedToInvoice() {
    if (selectedProducts.length === 0) { alert('لم تختار أي منتج'); return; }
    if (currentPage !== 'invoices') {
        switchPage('invoices');
        setTimeout(() => {
            selectedProducts.forEach(id => {
                const p = products.find(p => p.id === id);
                if (p) {
                    const existing = invoiceItems.find(i => i.id === id);
                    if (existing) existing.quantity += 1;
                    else invoiceItems.push({ ...p, quantity: 1 });
                }
            });
            renderInvoiceItems();
            updateInvoiceSummary();
        }, 200);
    } else {
        selectedProducts.forEach(id => {
            const p = products.find(p => p.id === id);
            if (p) {
                const existing = invoiceItems.find(i => i.id === id);
                if (existing) existing.quantity += 1;
                else invoiceItems.push({ ...p, quantity: 1 });
            }
        });
        renderInvoiceItems();
        updateInvoiceSummary();
    }
    showToast(`تمت إضافة ${selectedProducts.length} منتجات`, '🛍');
    selectedProducts = [];
    selectionMode = false;
}

function setupProductsSearch() {
    const input = document.getElementById('productSearchInput');
    const resultsDiv = document.getElementById('searchResults');
    let timeout;

    // دالة لتحديث نتائج البحث المقترح (الاقتراحات)
    function updateSearchResults() {
        const q = input.value.trim();
        if (q.length < 2) {
            resultsDiv.style.display = 'none';
            return;
        }
        const filtered = products.filter(p => p.name.includes(q) || p.barcode.includes(q)).slice(0,5);
        resultsDiv.innerHTML = '';
        if (filtered.length === 0) {
            resultsDiv.innerHTML = '<div style="padding:12px; text-align:center;">' + i18n[settings.language].noResults + '</div>';
        } else {
            filtered.forEach(p => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `<div style="width:28px; height:28px; background:var(--gradient); border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; margin-left:10px;"><i class="fas ${p.icon || 'fa-box'}"></i></div>
                                  <div style="flex:1;"><div style="font-weight:600;">${p.name}</div><div style="font-size:9px;">${p.barcode}</div></div>
                                  <div style="font-weight:700; color:var(--accent-1);">${p.price} ${settings.language === 'en' ? 'SAR' : 'ر.س'}</div>`;
                // عند النقر على الاقتراح: أضف المنتج للفاتورة وأخفي القائمة
                item.onclick = () => {
                    addToInvoice(p.id);
                    input.value = '';
                    resultsDiv.style.display = 'none';
                };
                resultsDiv.appendChild(item);
            });
        }
        resultsDiv.style.display = 'block';
    }

    // حدث الإدخال: يحدث الاقتراحات فقط (بدون تغيير القائمة الرئيسية)
    input.addEventListener('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(updateSearchResults, 400);
    });

    // حدث الضغط على Enter: يصفّي القائمة الرئيسية
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // منع أي سلوك افتراضي (مثل تحديث الصفحة)
            const q = this.value.trim();
            // إعادة تعيين الصفحة إلى 1 وتصفية القائمة
            currentPageNum = 1;
            renderProductsGrid(q);
            // إخفاء قائمة الاقتراحات
            resultsDiv.style.display = 'none';
        }
    });

    // إخفاء الاقتراحات عند النقر خارج حقل البحث
    document.addEventListener('click', e => {
        if (!input.contains(e.target) && !resultsDiv.contains(e.target)) {
            resultsDiv.style.display = 'none';
        }
    });
}

async function openBarcodeScanner() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        stream.getTracks().forEach(t => t.stop());
        const codeReader = new ZXing.BrowserMultiFormatReader();
        codeReader.decodeOnceFromVideoDevice(undefined, 'video').then(result => {
            const barcode = result.text;
            showToast(i18n[settings.language].search + ': ' + barcode, '📷');
            const product = products.find(p => p.barcode === barcode);
            if (product) addToInvoice(product.id);
            else if (confirm(i18n[settings.language].productNotFound)) {
                openModal('addProductModal');
                document.getElementById('newProductBarcode').value = barcode;
            }
            codeReader.reset();
        }).catch(() => { alert(i18n[settings.language].noResults); codeReader.reset(); });
    } catch { alert(i18n[settings.language].cameraDenied); }
}

function addNewProduct() {
    const name = document.getElementById('newProductName').value;
    let barcode = document.getElementById('newProductBarcode').value;
    if (!barcode) barcode = generateBarcode();
    const price = parseFloat(document.getElementById('newProductPrice').value);
    const cost = parseFloat(document.getElementById('newProductCost').value) || 0;
    const stock = parseInt(document.getElementById('newProductStock').value) || 0;
    const category = document.getElementById('newProductCategory').value;
    if (!name || !barcode || isNaN(price)) { alert(i18n[settings.language].fillFields); return; }
    const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    products.unshift({ id: newId, name, barcode, price, cost, stock, category, icon: 'fa-box' });
    saveProducts();
    closeModal('addProductModal');
    renderProductsGrid();
    showToast(i18n[settings.language].productAdded, '✔️');
    ['newProductName','newProductBarcode','newProductCost','newProductPrice','newProductStock'].forEach(id => document.getElementById(id).value = '');
}

function editProduct(id) {
    const p = products.find(p => p.id === id);
    if (!p) return;
    document.getElementById('editProductId').value = p.id;
    document.getElementById('editProductName').value = p.name;
    document.getElementById('editProductBarcode').value = p.barcode;
    document.getElementById('editProductPrice').value = p.price;
    document.getElementById('editProductCost').value = p.cost;
    document.getElementById('editProductStock').value = p.stock;
    // 👇 أضف هذا الكود
    const catSelect = document.getElementById('editProductCategory');
    const categories = i18n[settings.language].categories || i18n['ar'].categories;
    catSelect.innerHTML = categories.map(c => `<option ${c === p.category ? 'selected' : ''}>${c}</option>`).join('');
    // 👆 نهاية الإضافة
    openModal('editProductModal');
}

function updateProduct() {
    const id = parseInt(document.getElementById('editProductId').value);
    const p = products.find(p => p.id === id);
    if (p) {
        p.name = document.getElementById('editProductName').value;
        p.barcode = document.getElementById('editProductBarcode').value;
        p.price = parseFloat(document.getElementById('editProductPrice').value);
        p.cost = parseFloat(document.getElementById('editProductCost').value);
        p.stock = parseInt(document.getElementById('editProductStock').value);
        p.category = document.getElementById('editProductCategory').value;
        saveProducts();
        closeModal('editProductModal');
        renderProductsGrid();
        showToast(i18n[settings.language].productUpdated, '🔄');
    }
}

function deleteProduct() {
    if (!confirm(i18n[settings.language].confirmDeleteProduct)) return;
    const id = parseInt(document.getElementById('editProductId').value);
    products = products.filter(p => p.id !== id);
    saveProducts();
    closeModal('editProductModal');
    renderProductsGrid();
    showToast(i18n[settings.language].productDeleted, '🗑︄');
}