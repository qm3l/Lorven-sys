// ==================== importExport.js ====================
// استيراد المنتجات والفواتير من ملفات Excel/CSV/TSV
// ترتيب الأعمدة للمنتجات:
// A: الباركود
// B: الاسم
// C: التكلفة
// D: المخزون (كمية الطلب)
// E: رابط الصورة (اختياري)
// F: السعر

let importFileData = null;

// دالة معالجة اختيار الملف
function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // التحقق من امتداد الملف (يمنع رفع الصور ومقاطع الفيديو)
    const allowedExtensions = /\.(csv|xlsx?|tsv)$/i;
    if (!allowedExtensions.test(file.name)) {
        alert('نوع الملف غير مدعوم. الرجاء رفع ملف CSV أو Excel أو TSV فقط.');
        event.target.value = ''; // تفريغ حقل الإدخال
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            // قراءة الملف كـ ArrayBuffer (الأفضل للتعامل مع الترميز)
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const sheet = workbook.Sheets[firstSheet];
            // تحويل الورقة إلى مصفوفة ثنائية الأبعاد (الصف الأول قد يكون رؤوس أعمدة)
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            importFileData = json; // تخزين البيانات الخام

            // عرض رسالة بعدد الصفوف التي تم تحميلها
            document.getElementById('importPreview').innerHTML = 
                `<p style="font-weight:600; font-size:10px;">✔️ تم تحميل ${importFileData.length} صف</p>`;
        } catch (error) {
            console.error(error);
            document.getElementById('importPreview').innerHTML = 
                '<p style="color:red; font-size:10px;">❌ فشل قراءة الملف. تأكد من أنه بصيغة صحيحة.</p>';
        }
    };
    reader.readAsArrayBuffer(file);
}

// دالة تأكيد الاستيراد (تُستدعى عند الضغط على زر "استيراد")
function confirmImport() {
    if (!importFileData || importFileData.length < 2) {
        alert(i18n[settings.language].emptyFile || 'الملف فارغ أو غير صحيح');
        return;
    }

    const type = document.getElementById('importType').value; // 'products' أو 'invoices'
    // نتجاهل الصف الأول (الرؤوس) ونأخذ الصفوف التي تحتوي على بيانات
    const rows = importFileData.slice(1).filter(r => r.length > 0 && r.some(c => c));

    if (type === 'products') {
        let added = 0;
        rows.forEach(row => {
            // ترتيب الأعمدة حسب الطلب:
            const barcode = row[0] ? row[0].toString() : generateBarcode(); // العمود A
            const name = row[1] || i18n[settings.language].productName;      // العمود B
            const cost = parseFloat(row[2]) || 0;                             // العمود C (التكلفة)
            const stock = parseInt(row[3]) || 0;                              // العمود D (المخزون)
            const image = row[4] ? row[4].toString() : '';                    // العمود E (رابط الصورة - اختياري)
            const price = parseFloat(row[5]) || 0;                            // العمود F (السعر)

            // تخمين الفئة بناءً على الاسم (اختياري)
            const category = guessCategory(name);

            const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 + added : 1 + added;
            products.push({
                id: newId,
                name,
                barcode,
                price,
                cost,
                stock,
                category,
                icon: 'fa-box',
                image // حفظ رابط الصورة
            });
            added++;
        });
        saveProducts(); // حفظ المنتجات في localStorage
        showToast(settings.language === 'en' ? `${added} products imported` : `تم استيراد ${added} منتج`, '📦');
    } 
    else if (type === 'invoices') {
        let added = 0;
        rows.forEach(row => {
            if (row.length < 4) return;
            const number = row[0] || `IMP-${Date.now()}-${added}`;               // العمود A
            const date = row[1] ? new Date(row[1]).toISOString() : new Date().toISOString(); // العمود B
            const customerName = row[2] || i18n[settings.language].customer;     // العمود C
            const customerPhone = row[3] ? row[3].toString() : '';               // العمود D
            const total = parseFloat(row[4]) || 0;                                // العمود E (الإجمالي)
            const invoice = {
                number,
                date,
                customerName,
                customerPhone,
                items: [],
                subtotal: total,
                delivery: 0,
                profit: 0,
                total
            };
            invoices.push(invoice);
            added++;
        });
        saveInvoices();
        updateCustomersDB();
        showToast(settings.language === 'en' ? `${added} invoices imported` : `تم استيراد ${added} فاتورة`, '📄');
    }

    // إغلاق المودال وإعادة تعيين المتغيرات
    closeModal('importModal');
    importFileData = null;
    document.getElementById('importPreview').innerHTML = '';

    // إعادة رسم الصفحة الحالية إن لزم
    if (currentPage === 'products') renderProductsPage(document.getElementById('mainContent'));
    else if (currentPage === 'history') renderHistoryPage(document.getElementById('mainContent'));
}