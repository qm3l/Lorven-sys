// main.js
document.addEventListener('DOMContentLoaded', () => {
    // تحميل البيانات من التخزين المحلي
    loadData(); // من data.js

    // تطبيق الإعدادات المحفوظة (اللغة، الوضع الليلي، إلخ)
    applySettings(); // من i18n.js

    // 🔐 التحقق من قفل التطبيق
    checkAppLock();

    // تهيئة واجهة المستخدم (مثل إغلاق الدردشة بالنقر خارجها)
    if (window.initUI) {
        window.initUI();
    }

    // ربط الدوال العامة التي تُستخدم في onclick داخل HTML
    window.clearAllData = clearAllData;
    window.saveGeneral = saveGeneral;
    window.saveCountryCode = saveCountryCode;
    window.saveTemplate = saveTemplate;
    window.saveCustomization = saveCustomization;
    window.saveSecurity = saveSecurity;
    window.sendAds = sendAds;
    window.exportBackup = exportBackup;
    window.importBackup = importBackup;
});

// 🔐 دالة التحقق من القفل
function checkAppLock() {
    // إذا كان القفل مفعل
    if ((settings.appLock === 'pin' && settings.pinCode) || settings.appLock === 'fingerprint') {
        // منع ظهور المحتوى الرئيسي
        document.querySelector('.app-container').style.display = 'none';
        
        // إنشاء شاشة إدخال PIN
        showPinScreen();
    } else {
        // عرض المحتوى الرئيسي
        document.querySelector('.app-container').style.display = 'flex';
        // استمرار التحميل الطبيعي
        switchPage('dashboard');
        if (window.ai && window.ai.init) {
            window.ai.init();
        }
    }
}

// 🔐 دالة عرض شاشة PIN
function showPinScreen() {
    // إزالة أي شاشة PIN قديمة
    const oldScreen = document.getElementById('pinScreen');
    if (oldScreen) oldScreen.remove();
    
    // إنشاء شاشة PIN
    const pinScreen = document.createElement('div');
    pinScreen.id = 'pinScreen';
    pinScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(145deg, #FF8A9C, #A7C7E7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    // زر البصمة (يظهر فقط إذا كان الخيار بصمة)
    const fingerprintButton = settings.appLock === 'fingerprint' ? `
        <button onclick="useFingerprint()" style="width: 50px; height: 50px; background: #243048; border: none; border-radius: 25px; color: white; cursor: pointer; box-shadow: 0 5px 15px rgba(36,48,72,0.3);">
            <i class="fas fa-fingerprint" style="font-size: 20px;"></i>
        </button>
    ` : '';
    
    pinScreen.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 30px; width: 280px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative; overflow: hidden;">
            <div style="position: absolute; top: -20px; left: -20px; width: 100px; height: 100px; background: rgba(255,138,156,0.1); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -30px; right: -30px; width: 150px; height: 150px; background: rgba(167,199,231,0.1); border-radius: 50%;"></div>
            
            <div style="width: 80px; height: 80px; background: linear-gradient(145deg, #FF8A9C, #A7C7E7); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; box-shadow: 0 10px 20px rgba(255,138,156,0.3);">
                <i class="fas fa-lock" style="font-size: 35px; color: white;"></i>
            </div>
            
            <h3 style="margin-bottom: 5px; color: #243048; font-weight: 700;">${i18n[settings.language]?.appLocked || 'التطبيق مقفل 🔒'}</h3>
            <p style="color: #8F8A88; margin-bottom: 20px; font-size: 13px;">${i18n[settings.language]?.enterPin || 'أدخل رمز PIN للمتابعة'}</p>
            
            <div style="background: #F8F4F0; border-radius: 20px; padding: 10px; margin-bottom: 20px;">
                <input type="password" id="pinInput" maxlength="4" inputmode="numeric" style="width: 100%; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 8px; border: none; background: transparent; outline: none; color: #243048;" placeholder="••••">
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button onclick="unlockApp()" style="flex: 1; padding: 14px; background: linear-gradient(145deg, #FF8A9C, #A7C7E7); border: none; border-radius: 30px; font-weight: 600; color: white; cursor: pointer; box-shadow: 0 5px 15px rgba(255,138,156,0.3);">
                    <i class="fas fa-unlock-alt" style="margin-left: 5px;"></i> ${i18n[settings.language]?.unlock || 'فتح'}
                </button>
                ${fingerprintButton}
            </div>
            
            <button onclick="forgotPin()" style="background: none; border: none; color: #FF8A9C; font-size: 12px; cursor: pointer; text-decoration: underline; margin-top: 5px;">
                ${i18n[settings.language]?.forgotPin || 'نسيت كلمة المرور؟'}
            </button>
            
            <div id="pinError" style="color: #FF6B6B; font-size: 12px; margin-top: 10px; display: none; background: #FFE5E5; padding: 8px; border-radius: 15px;">
                <i class="fas fa-exclamation-circle"></i> ${i18n[settings.language]?.pinError || 'رمز PIN خطأ، حاول مرة أخرى'}
            </div>
        </div>
    `;
    
    document.body.appendChild(pinScreen);
    
    // تركيز على حقل الإدخال
    setTimeout(() => document.getElementById('pinInput').focus(), 100);
    
    // إضافة مستمع لدخول Enter
    document.getElementById('pinInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') unlockApp();
    });
}

// 🔐 دالة فتح التطبيق
window.unlockApp = function() {
    const enteredPin = document.getElementById('pinInput').value;
    
    if (enteredPin === settings.pinCode.toString()) {
        // إخفاء شاشة PIN
        document.getElementById('pinScreen').remove();
        
        // إظهار المحتوى الرئيسي
        document.querySelector('.app-container').style.display = 'flex';
        
        // استمرار التحميل
        switchPage('dashboard');
        if (window.ai && window.ai.init) {
            window.ai.init();
        }
    } else {
        // إظهار رسالة خطأ
        const errorDiv = document.getElementById('pinError');
        errorDiv.style.display = 'block';
        document.getElementById('pinInput').value = '';
        document.getElementById('pinInput').focus();
    }
};

// 🔐 دالة إغلاق التطبيق
window.closeApp = function() {
    document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: #666;">التطبيق مغلق</div>';
};

// دالة نسيت كلمة المرور - نسخة آمنة ضد السرقة
window.forgotPin = function() {
    // إنشاء مودال استعادة PIN
    const forgotModal = document.createElement('div');
    forgotModal.id = 'forgotPinModal';
    forgotModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;
    
    forgotModal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 30px; width: 320px; text-align: center; animation: slideIn 0.3s;">
            <i class="fas fa-shield-alt" style="font-size: 50px; color: #FF8A9C; margin-bottom: 15px;"></i>
            <h3 style="margin-bottom: 10px; color: #243048;">${i18n[settings.language]?.securityQuestion || 'التحقق الأمني'}</h3>
            <p style="color: #8F8A88; font-size: 13px; margin-bottom: 20px;">
                ${i18n[settings.language]?.securityQuestionDesc || 'للإثبات أنك صاحب الجهاز، أجب على السؤال التالي:'}
            </p>
            
            <div style="background: #F8F4F0; border-radius: 20px; padding: 15px; margin-bottom: 20px; text-align: right;">
                <div style="font-weight: 600; margin-bottom: 10px; color: #243048;">🔐 ${i18n[settings.language]?.securityQuestion || 'السؤال السري'}:</div>
                <div style="color: #FF8A9C; margin-bottom: 10px;">"${settings.securityQuestion || 'ما هو اسم أول متجر تسوقت منه؟'}"</div>
                <input type="text" id="forgotSecurityAnswer" placeholder="${i18n[settings.language]?.securityAnswer || 'أدخل الإجابة'}" style="width: 100%; padding: 12px; border: 2px solid #FF8A9C; border-radius: 20px; outline: none;">
            </div>
            
            <button onclick="checkSecurityAnswer()" style="width: 100%; padding: 15px; background: linear-gradient(145deg, #FF8A9C, #A7C7E7); border: none; border-radius: 30px; font-weight: 600; color: white; cursor: pointer; margin-bottom: 10px;">
                <i class="fas fa-check-circle"></i> ${i18n[settings.language]?.verify || 'تحقق'}
            </button>
            
            <button onclick="document.getElementById('forgotPinModal').remove()" 
                    style="width: 100%; padding: 12px; background: none; border: 1px solid #8F8A88; border-radius: 30px; color: #8F8A88; cursor: pointer;">
                ${i18n[settings.language]?.cancel || 'إلغاء'}
            </button>
            
            <div id="securityError" style="color: red; font-size: 12px; margin-top: 10px; display: none;"></div>
        </div>
    `;
    
    document.body.appendChild(forgotModal);
};

// دالة التحقق من الإجابة
window.checkSecurityAnswer = function() {
    const answer = document.getElementById('forgotSecurityAnswer').value.trim().toLowerCase();
    
    // جلب الإجابة الصحيحة من الإعدادات
    const correctAnswer = settings.securityAnswer || "لورڤين";
    
    if (answer === correctAnswer.toLowerCase()) {
        // إزالة المودال الحالي
        const modal = document.getElementById('forgotPinModal');
        if (modal) modal.remove();
        
        // فتح مودال الرمز المؤقت
        showTempPinModal();
    } else {
        const errorDiv = document.getElementById('securityError');
        errorDiv.style.display = 'block';
        errorDiv.innerText = i18n[settings.language]?.incorrectAnswer || '❌ إجابة خاطئة';
    }
};

// دالة عرض الرمز المؤقت
function showTempPinModal() {
    const tempPin = Math.floor(1000 + Math.random() * 9000).toString();
    
    const tempModal = document.createElement('div');
    tempModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
    `;
    
    tempModal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 30px; width: 320px; text-align: center;">
            <i class="fas fa-key" style="font-size: 50px; color: #FF8A9C; margin-bottom: 15px;"></i>
            <h3 style="margin-bottom: 10px; color: #243048;">${i18n[settings.language]?.tempPin || 'رمز الدخول المؤقت'}</h3>
            
            <div style="background: #F8F4F0; border-radius: 20px; padding: 20px; margin-bottom: 20px;">
                <div style="font-size: 12px; color: #8F8A88; margin-bottom: 5px;">${i18n[settings.language]?.tempPinDesc || 'استخدم هذا الرمز لمرة واحدة'}:</div>
                <div style="font-weight: 700; color: #243048; font-size: 40px; letter-spacing: 8px;">${tempPin}</div>
                <div style="font-size: 11px; color: #FF8A9C; margin-top: 10px;">⏰ ${i18n[settings.language]?.tempPinExpires || 'ينتهي بعد 5 دقائق'}</div>
            </div>
            
            <button onclick="useTempPin('${tempPin}')" style="width: 100%; padding: 15px; background: linear-gradient(145deg, #FF8A9C, #A7C7E7); border: none; border-radius: 30px; font-weight: 600; color: white; cursor: pointer; margin-bottom: 10px;">
                ${i18n[settings.language]?.useTempPin || 'استخدام الرمز'}
            </button>
            
            <button onclick="cancelTempPinModal(this)" 
                    style="width: 100%; padding: 12px; background: none; border: 1px solid #8F8A88; border-radius: 30px; color: #8F8A88; cursor: pointer;">
                ${i18n[settings.language]?.cancel || 'إلغاء'}
            </button>
        </div>
    `;
    
    document.body.appendChild(tempModal);
    
    // تخزين الرمز المؤقت
    window.tempPin = tempPin;
    
    // انتهاء الصلاحية بعد 5 دقائق
    setTimeout(() => {
        if (window.tempPin === tempPin) {
            window.tempPin = null;
            tempModal.remove();
            showToast(i18n[settings.language]?.tempPinExpired || '⚠️ انتهت صلاحية الرمز', 2000);
        }
    }, 5 * 60 * 1000);
}

// دالة استخدام الرمز المؤقت
window.useTempPin = function(pin) {
    if (window.tempPin === pin) {
        // فتح التطبيق
        const pinScreen = document.getElementById('pinScreen');
        if (pinScreen) pinScreen.remove();
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) appContainer.style.display = 'flex';
        
        switchPage('dashboard');
        
        // إغلاق جميع المودالات
        document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
            if (el && el.remove) el.remove();
        });
        
        showToast(i18n[settings.language]?.tempPinUsed || '🔐 تم الدخول برمز مؤقت - غير الرمز فوراً', 3000);
        
        // إلغاء المؤقت
        if (window.tempPinTimer) {
            clearInterval(window.tempPinTimer);
            window.tempPinTimer = null;
        }
    }
};

// دالة showToast
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}
// دالة البصمة الحقيقية
window.useFingerprint = async function() {
    // التحقق إذا المتصفح يدعم WebAuthn
    if (!window.PublicKeyCredential) {
        showToast('❌ المتصفح لا يدعم البصمة', 2000);
        return;
    }

    try {
        // إنشاء خيارات المصادقة
        const publicKey = {
            challenge: new Uint8Array(32), // يجب أن تكون عشوائية من السيرفر
            rp: {
                name: "LORVEN SYS",
                id: window.location.hostname
            },
            user: {
                id: new Uint8Array(16), // معرف المستخدم
                name: "user@lorven.com",
                displayName: "LORVEN User"
            },
            pubKeyCredParams: [
                { type: "public-key", alg: -7 },      // ES256
                { type: "public-key", alg: -257 }      // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform",  // البصمة المدمجة
                userVerification: "required",
                residentKey: "preferred"
            },
            timeout: 60000,
            attestation: "none"
        };

        // طلب البصمة
        const credential = await navigator.credentials.create({ publicKey });
        
    //إذثا نجحت البصمة
        if (credential) {
            showToast('✅ تم التحقق بالبصمة', 1500);
            
            // فتح التطبيق
            setTimeout(() => {
                document.getElementById('pinScreen').remove();
                document.querySelector('.app-container').style.display = 'flex';
                switchPage('dashboard');
            }, 1500);
        }

    } catch (error) {
        console.error('Fingerprint error:', error);
        showToast('❌ فشل التحقق بالبصمة', 2000);
    }
};

// دالة تسجيل الخروج
window.logoutApp = function() {
    // إخفاء المحتوى الرئيسي
    document.querySelector('.app-container').style.display = 'none';
    
    // إغلاق أي مودالات مفتوحة
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    
    // عرض شاشة القفل
    showPinScreen();
    
    // رسالة تأكيد
    showToast(i18n[settings.language]?.logoutMsg || '👋 تم تسجيل الخروج', 2000);
};

// دالة إلغاء المودال المؤقت
window.cancelTempPinModal = function(button) {
    // إزالة المودال
    const modal = button.closest('div[style*="position: fixed"]');
    if (modal) modal.remove();
    
    // إلغاء المؤقت
    if (window.tempPinTimer) {
        clearInterval(window.tempPinTimer);
        window.tempPinTimer = null;
    }
    
    // مسح الرمز المؤقت
    window.tempPin = null;
};