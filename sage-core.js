const API = "https://findly-api.onrender.com";
let lang = 'ar';
let attempts = localStorage.getItem('findly_attempts') || 3;

const dict = {
    ar: { title: "مستشارك الحكيم", sub: "تحليل سيبراني عميق", modal: "إعدادات الهوية", energy: "طاقة العقل", morning: "صباح الخير، ", evening: "مساء الخير، ", voice: "ar-SA" },
    en: { title: "The Sage Advisor", sub: "Deep cyber analysis", modal: "Profile Settings", energy: "Sage Energy", morning: "Good morning, ", evening: "Good evening, ", voice: "en-US" },
    fr: { title: "Le Conseiller Sage", sub: "Analyse profonde", modal: "Paramètres", energy: "Énergie Sage", morning: "Bonjour, ", evening: "Bonsoir, ", voice: "fr-FR" },
    de: { title: "Der Weise Berater", sub: "Tiefe Analyse", modal: "Einstellungen", energy: "Weise Energie", morning: "Guten Morgen, ", evening: "Guten Abend, ", voice: "de-DE" },
    es: { title: "El Asesor Sabio", sub: "Análisis profundo", modal: "Ajustes", energy: "Energía Sabia", morning: "Buenos días, ", evening: "Buenas noches, ", voice: "es-ES" },
    tr: { title: "Bilge Danışman", sub: "Derin analiz", modal: "Ayarlar", energy: "Bilge Enerjisi", morning: "Günaydın, ", evening: "İyi akşamlar, ", voice: "tr-TR" }
};

function update() {
    const d = dict[lang];
    const name = localStorage.getItem('fn') || "User";
    document.getElementById('main-html').dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('txt-title').innerText = d.title;
    document.getElementById('txt-sub').innerText = d.sub;
    document.getElementById('txt-modal').innerText = d.modal;
    document.getElementById('txt-energy').innerText = d.energy;
    document.getElementById('lang-label').innerText = lang.toUpperCase();
    document.getElementById('remaining-count').innerText = attempts;
    
    const hr = new Date().getHours();
    document.getElementById('greeting').innerText = (hr < 12 ? d.morning : d.evening) + name;
}

function toggleLang() { 
    const box = document.getElementById('lang-box');
    box.style.display = box.style.display === 'block' ? 'none' : 'block';
}

function setLang(l) { lang = l; toggleLang(); update(); }

function openProfile() { 
    document.getElementById('profile-modal').style.display = 'flex'; 
}

function saveSet() {
    localStorage.setItem('fn', document.getElementById('in-name').value);
    localStorage.setItem('fb', document.getElementById('in-budget').value);
    document.getElementById('profile-modal').style.display = 'none';
    update();
}

function runSearch() {
    const q = document.getElementById('s-input').value;
    if(!q) return alert("اكتب شيئاً أولاً!");
    document.getElementById('ai-status').style.display = 'block';
    document.getElementById('ai-status').innerText = "جاري جلب الحكمة...";
    // هنا يتم الاتصال بـ API كما في الكود السابق
}

update();
