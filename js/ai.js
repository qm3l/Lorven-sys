// ==================== ai.js (الإصدار النهائي مع دعم اللغة) ====================

const AI_CONFIG = {
    apiKey: (localStorage.getItem('gemini_api_key') || '').trim(),
    model: (localStorage.getItem('gemini_model') || 'gemini-2.5-flash').trim(),
    temperature: parseFloat(localStorage.getItem('gemini_temperature')) || 0.7,
    maxTokens: 800
};

let aiConversationHistory = []; // سيتم ملؤه في initAIContext

// دالة تنظيف الردود من الرموز المزعجة (مشتركة)
function cleanAIResponse(text) {
    return text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/`/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// دالة ملخص البيانات (بدون تغيير)
function getDataSummary() {
    const totalSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    return `📊 **ملخص البيانات الحالي:**  
- عدد المنتجات: ${products.length}  
- عدد الفواتير: ${invoices.length}  
- إجمالي المبيعات: ${totalSales} ريال  
- العملاء المسجلون: ${customersDB.length}`;
}

// دالة البحث عن المنتجات (بدون تغيير)
function findProduct(query) {
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0);
    if (keywords.length === 0) return [];

    return products
        .map(p => {
            let score = 0;
            const name = p.name.toLowerCase();
            const barcode = (p.barcode || '').toLowerCase();
            const category = (p.category || '').toLowerCase();

            keywords.forEach(kw => {
                if (name.includes(kw)) score += 3;
                if (barcode.includes(kw)) score += 2;
                if (category.includes(kw)) score += 1;
            });

            return { product: p, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.product);
}

// ========== دالة تهيئة السياق مع دعم اللغة ==========
function initAIContext() {
    const lang = settings?.language || 'ar'; // اللغة الحالية من الإعدادات
    let systemPrompt = '';

    if (lang === 'ar') {
        systemPrompt = `أنت مساعد متجر لورفين (LORVEN) للمنتجات التجميلية والعناية.
مهمتك الأساسية: مساعدة المستخدم في اختيار المنتجات المناسبة بناءً على مشكلته أو احتياجه.

**قواعد مهمة جداً:**
1. استخدم فقط بيانات المنتجات المتوفرة في المتجر (قائمة products).
2. إذا سأل المستخدم عن مشكلة (مثل "حبوب الوجه")، اقترح منتجاً واحداً أو اثنين من المتجر مناسبين لهذه المشكلة.
3. **لا تقدم معلومات طبية أو أسباب عامة**، فقط ركز على المنتجات المتاحة.
4. كن مختصراً جداً، لا تكتب فقرات طويلة. 3-4 أسطر كافية.
5. لا تستخدم رموز كثيرة مثل "*" أو "-"، استخدم لغة عربية بسيطة.
6. إذا لم تجد منتجاً مناسباً، قل ببساطة "لا يوجد منتج مناسب لهذا الاستفسار حالياً".

أمثلة على ردود جيدة:
- "لحبوب الوجه، فيتامين سي سيروم (٨٩ ريال) يساعد في تفتيح البقع. متوفر منه ١٢ قطعة."
- "للبشرة الجافة، كريم مرطب (١٢٠ ريال) ينصح به. متوفر منه ٨ قطع."`;
    } else {
        systemPrompt = `You are the assistant for LORVEN store for cosmetic and skincare products.
Your main task: Help the user choose suitable products based on their problem or need.

**Very important rules:**
1. Only use the product data available in the store (products array).
2. If the user asks about a problem (like "acne"), suggest one or two products from the store that are suitable.
3. **Do not provide medical information or general causes**, only focus on available products.
4. Be very concise, don't write long paragraphs. 3-4 lines are enough.
5. Don't use many symbols like "*" or "-", use simple English.
6. If no suitable product is found, simply say "No suitable product found for this query at the moment."

Examples of good responses:
- "For acne, Vitamin C Serum (89 SAR) helps lighten spots. 12 pieces in stock."
- "For dry skin, Moisturizing Cream (120 SAR) is recommended. 8 pieces in stock."`;
    }

    aiConversationHistory = [
        { role: 'user', parts: [{ text: systemPrompt }] }
    ];

    // إضافة ملخص البيانات إذا كانت الدالة موجودة
    if (typeof getDataSummary === 'function') {
        aiConversationHistory.push({ role: 'user', parts: [{ text: getDataSummary() }] });
    }
}

// ========== دالة معالجة طلبات البوكسات مع دعم اللغة ==========
async function handleBundleRequest(userMessage) {
    const lang = settings?.language || 'ar';
    const productList = products.slice(0, 50).map(p => 
        `- ${p.name} (${p.category}) - ${lang === 'ar' ? 'السعر' : 'Price'}: ${p.price} ${lang === 'ar' ? 'ر.س' : 'SAR'} - ${lang === 'ar' ? 'المخزون' : 'Stock'}: ${p.stock}`
    ).join('\n');

    const productNote = products.length > 50 
        ? (lang === 'ar' ? `\n(هذه قائمة جزئية، إجمالي المنتجات ${products.length})` : `\n(This is a partial list, total products: ${products.length})`)
        : '';

    const systemPrompt = lang === 'ar' 
        ? `أنت مساعد متجر لورفين (LORVEN) للتجميل والعناية الشخصية. لدينا المنتجات التالية:\n${productList}${productNote}\n\nالمستخدم يطلب منك اقتراح "بوكس" أو مجموعة منتجات مناسبة. مهمتك:
1. اسأل سؤالاً أو سؤالين لتحديد احتياج المستخدم بشكل أفضل (مثلاً: ما نوع بشرتك؟ ما المناسبة؟ ما الميزانية التقريبية؟).
2. بعد أن يجيب، اقترح 2-4 منتجات محددة من القائمة أعلاه فقط تشكل بوكساً متناسقاً (مثلاً: روتين يومي، هدية، عناية لمشكلة معينة).
3. اشرح باختصار لماذا اخترت هذه المنتجات معاً.
4. كن ودوداً ومختصراً، واستخدم لغة عربية بسيطة بدون رموز كثيرة (* أو -).
5. إذا لم تكن المنتجات مناسبة تماماً، قل ذلك واقترح أفضل ما هو متاح.`
        : `You are the assistant for LORVEN store for cosmetic and skincare products. We have the following products:\n${productList}${productNote}\n\nThe user asks you to suggest a "box" or a suitable set of products. Your task:
1. Ask one or two questions to better determine the user's need (e.g., skin type, occasion, budget).
2. After they answer, suggest 2-4 specific products from the above list that form a coherent box (e.g., daily routine, gift, care for a specific problem).
3. Briefly explain why you chose these products together.
4. Be friendly and concise, use simple English without many symbols (* or -).
5. If the products are not perfectly suitable, say so and suggest the best available.`;

    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: userMessage }] }
    ];

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${AI_CONFIG.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: AI_CONFIG.maxTokens,
                }
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'Error');

        let reply = data.candidates[0].content.parts[0].text;
        reply = cleanAIResponse(reply);
        return reply;
    } catch (error) {
        console.error('Bundle error:', error);
        return lang === 'ar' 
            ? '❌ حدث خطأ أثناء توليد الاقتراحات. حاول مرة أخرى أو استخدم خيارات أخرى.'
            : '❌ An error occurred while generating suggestions. Please try again or use other options.';
    }
}

// ========== الدالة الرئيسية لإرسال الرسائل مع دعم اللغة ==========
async function sendToGemini(userMessage, file = null) {
    const lang = settings?.language || 'ar';

    if (!AI_CONFIG.apiKey) {
        return lang === 'ar' 
            ? '❌ لم يتم تعيين مفتاح API. الرجاء إدخاله في الإعدادات.'
            : '❌ API key not set. Please enter it in settings.';
    }

    // البحث المحلي عن منتج (إذا بدأت الرسالة بـ "منتج" أو "product")
    if (userMessage && (userMessage.startsWith('منتج') || userMessage.startsWith('product'))) {
        const query = userMessage.replace(/^(منتج|product)\s*/i, '').trim();
        if (query) {
            const results = findProduct(query);
            if (results.length > 0) {
                let reply = lang === 'ar' ? '🔍 **نتائج البحث:**\n' : '🔍 **Search results:**\n';
                results.slice(0, 5).forEach((p, i) => {
                    reply += `\n${i+1}. **${p.name}**\n- ${lang === 'ar' ? 'السعر' : 'Price'}: ${p.price} ${lang === 'ar' ? 'ر.س' : 'SAR'}\n- ${lang === 'ar' ? 'المخزون' : 'Stock'}: ${p.stock}\n- ${lang === 'ar' ? 'الفئة' : 'Category'}: ${p.category}\n- ${lang === 'ar' ? 'الباركود' : 'Barcode'}: ${p.barcode || (lang === 'ar' ? 'لا يوجد' : 'N/A')}\n`;
                });
                if (results.length > 5) {
                    reply += `\n...${lang === 'ar' ? `و ${results.length-5} نتائج أخرى.` : `and ${results.length-5} more results.`}`;
                }
                return cleanAIResponse(reply);
            } else {
                return lang === 'ar' 
                    ? `لم أجد منتجاً يطابق "${query}".`
                    : `No product found matching "${query}".`;
            }
        }
    }

    // التحقق من وجود طلب بوكس أو اقتراح
    if (userMessage) {
        const bundleKeywords = lang === 'ar' 
            ? ['بوكس', 'اقتراح', 'روتين', 'مجموعة']
            : ['box', 'suggest', 'bundle', 'package', 'routine'];
        const isBundleRequest = bundleKeywords.some(keyword => userMessage.includes(keyword));
        if (isBundleRequest) {
            return await handleBundleRequest(userMessage);
        }
    }

    // تجهيز الأجزاء (parts) للطلب
    const parts = [];

    if (file) {
        if (file.type.startsWith('image/')) {
            const base64Data = file.content.split(',')[1];
            parts.push({
                inlineData: {
                    mimeType: file.type,
                    data: base64Data
                }
            });
        } else {
            parts.push({ text: `${lang === 'ar' ? 'محتوى الملف' : 'File content'} (${file.name}):\n${file.content}` });
        }
    }

    if (userMessage) {
        parts.push({ text: userMessage });
    } else if (!file) {
        return lang === 'ar' 
            ? '❌ لم تكتب رسالة أو ترفع ملف.'
            : '❌ You did not write a message or upload a file.';
    }

    // تجهيز السياق
    if (aiConversationHistory.length === 0) {
        initAIContext(); // نضمن وجود السياق باللغة الصحيحة
    }
    const recentHistory = aiConversationHistory.slice(-6);
    const contents = [
        ...recentHistory,
        { role: 'user', parts: parts }
    ];

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${AI_CONFIG.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: AI_CONFIG.temperature,
                    maxOutputTokens: AI_CONFIG.maxTokens,
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error?.message || 'Unknown error';
            
            // محاولة التبديل إلى نموذج احتياطي
            if (errorMsg.includes('not found')) {
                const fallbackModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-pro-latest'];
                const currentIndex = fallbackModels.indexOf(AI_CONFIG.model);
                if (currentIndex !== -1 && currentIndex < fallbackModels.length - 1) {
                    AI_CONFIG.model = fallbackModels[currentIndex + 1];
                    localStorage.setItem('gemini_model', AI_CONFIG.model);
                    return sendToGemini(userMessage, file); // إعادة المحاولة
                } else {
                    return lang === 'ar'
                        ? '❌ عذراً، النموذج المطلوب غير متوفر ولا توجد نماذج بديلة.'
                        : '❌ Sorry, the requested model is not available and no fallback models exist.';
                }
            }

            // رسائل خطأ ودية
            if (errorMsg.includes('API key')) {
                return lang === 'ar'
                    ? '🔑 مفتاح API غير صالح. تحقق من المفتاح في الإعدادات.'
                    : '🔑 Invalid API key. Please check your key in settings.';
            } else if (errorMsg.includes('quota')) {
                return lang === 'ar'
                    ? '💰 لقد تجاوزت الحد المسموح من الطلبات. حاول لاحقاً.'
                    : '💰 You have exceeded your quota. Please try again later.';
            } else {
                return lang === 'ar'
                    ? `❌ حدث خطأ: ${errorMsg}`
                    : `❌ An error occurred: ${errorMsg}`;
            }
        }

        const aiReply = cleanAIResponse(data.candidates[0].content.parts[0].text);

        // تحديث التاريخ
        aiConversationHistory.push({ role: 'user', parts: parts });
        aiConversationHistory.push({ role: 'model', parts: [{ text: aiReply }] });

        if (aiConversationHistory.length > 30) {
            aiConversationHistory = aiConversationHistory.slice(-20);
        }

        return aiReply;
    } catch (error) {
        console.error('AI Error:', error);
        return lang === 'ar'
            ? '❌ حدث خطأ في الاتصال. تحقق من اتصالك بالإنترنت.'
            : '❌ Connection error. Please check your internet connection.';
    }
}

// ========== دوال التهيئة والتحديث ==========
window.ai = {
    send: sendToGemini,
    init: initAIContext,
    findProduct,
    updateLanguage: function(lang) {
        // إعادة تهيئة السياق باللغة الجديدة
        initAIContext();
        // يمكن إعادة إضافة ملخص البيانات إذا أردت
        if (typeof getDataSummary === 'function') {
            aiConversationHistory.push({ role: 'user', parts: [{ text: getDataSummary() }] });
        }
    },
    setApiKey: (key) => {
        AI_CONFIG.apiKey = key.trim();
        localStorage.setItem('gemini_api_key', key.trim());
    },
    setModel: (model) => {
        AI_CONFIG.model = model;
        localStorage.setItem('gemini_model', model);
    }
};