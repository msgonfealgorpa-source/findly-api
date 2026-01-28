const API = "https://findly-api.onrender.com";
let lang = 'ar';
let darkMode = true; // الإضاءة الليلية مفعلة افتراضياً
let attempts = localStorage.getItem('findly_attempts') ? parseInt(localStorage.getItem('findly_attempts')) : 3;

// القاموس العبقري (6 لغات متكاملة)
const dict = {
    ar: { 
        title: "مستشارك الحكيم", sub: "تحليل سيبراني عميق بأحدث تقنيات الذكاء الاصطناعي", 
        status: "الحكيم يحلل البيانات...", modal: "إعدادات الهوية", energy: "طاقة العقل",
        morning: "طاب صباحك، ", evening: "طاب مساؤك، ", voice: "ar-SA", buy: "اقتنِ الآن 🚀", analysis: "تحليل العقل:", sage: "اختيار الحكيم 👑",
        cats: [{n:'هواتف', q:'Smartphone', i:'fa-mobile'}, {n:'لابتوب', q:'Laptop', i:'fa-laptop'}, {n:'سماعات', q:'Audio', i:'fa-headphones'}, {n:'ساعات', q:'Watch', i:'fa-clock'}]
    },
    en: { 
        title: "The Sage Advisor", sub: "Deep cyber analysis with AI technology", 
        status: "The Sage is analyzing...", modal: "Profile Settings", energy: "Sage Energy",
        morning: "Good morning, ", evening: "Good evening, ", voice: "en-US", buy: "Get it Now 🚀", analysis: "AI Analysis:", sage: "Sage Choice 👑",
        cats: [{n:'Phones', q:'Smartphone', i:'fa-mobile'}, {n:'Laptops', q:'Laptop', i:'fa-laptop'}, {n:'Audio', q:'Audio', i:'fa-headphones'}, {n:'Watches', q:'Watch', i:'fa-clock'}]
    },
    fr: { 
        title: "Le Conseiller Sage", sub: "Analyse cybernétique profonde avec l'IA", 
        status: "Le Sage analyse...", modal: "Paramètres", energy: "Énergie Sage",
        morning: "Bonjour, ", evening: "Bonsoir, ", voice: "fr-FR", buy: "Acheter 🚀", analysis: "Analyse IA:", sage: "Choix du Sage 👑",
        cats: [{n:'Mobiles', q:'Smartphone', i:'fa-mobile'}, {n:'Laptops', q:'Ordinateur', i:'fa-laptop'}, {n:'Audio', q:'Audio', i:'fa-headphones'}, {n:'Montres', q:'Montre', i:'fa-clock'}]
    },
    de: { 
        title: "Der Weise Berater", sub: "Tiefe Cyber-Analyse mit KI-Technologie", 
        status: "Der Weise analysiert...", modal: "Einstellungen", energy: "Weise Energie",
        morning: "Guten Morgen, ", evening: "Guten Abend, ", voice: "de-DE", buy: "Jetzt kaufen 🚀", analysis: "KI-Analyse:", sage: "Wahl des Weisen 👑",
        cats: [{n:'Handys', q:'Smartphone', i:'fa-mobile'}, {n:'Laptops', q:'Laptop', i:'fa-laptop'}, {n:'Audio', q:'Audio', i:'fa-headphones'}, {n:'Uhren', q:'Uhr', i:'fa-clock'}]
    },
    es: { 
        title: "El Asesor Sabio", sub: "Análisis cibernético profundo con IA", 
        status: "El Sabio está analizando...", modal: "Ajustes", energy: "Energía Sabia",
        morning: "Buenos días, ", evening: "Buenas noches, ", voice: "es-ES", buy: "Comprar ahora 🚀", analysis: "Análisis de IA:", sage: "Elección del Sabio 👑",
        cats: [{n:'Móviles', q:'Smartphone', i:'fa-mobile'}, {n:'Laptops', q:'Laptop', i:'fa-laptop'}, {n:'Audio', q:'Audio', i:'fa-headphones'}, {n:'Relojes', q:'Reloj', i:'fa-clock'}]
    },
    tr: { 
        title: "Bilge Danışman", sub: "Yapay zeka ile derin siber analiz", 
        status: "Bilge analiz ediyor...", modal: "Ayarlar", energy: "Bilge Enerjisi",
        morning: "Günaydın, ", evening: "İyi akşamlar, ", voice: "tr-TR", buy: "Şimdi Al 🚀", analysis: "AI Analizi:", sage: "Bilge Seçimi 👑",
        cats: [{n:'Telefonlar', q:'Smartphone', i:'fa-mobile'}, {n:'Laptoplar', q:'Laptop', i:'fa-laptop'}, {n:'Ses', q:'Ses', i:'fa-headphones'}, {n:'Saatler', q:'Saat', i:'fa-clock'}]
    }
};

// وظيفة تحديث الواجهة الكاملة باللغات
function update() {
    const d = dict[lang] || dict['ar'];
    const name = localStorage.getItem('fn') || "User";
    
    // تغيير اتجاه الصفحة حسب اللغة
    const isRTL = lang === 'ar';
    document.getElementById('main-html').dir = isRTL ? 'rtl' : 'ltr';
    document.body.style.textAlign = isRTL ? 'right' : 'left';
    
    document.getElementById('txt-title').innerText = d.title;
    document.getElementById('txt-sub').innerText = d.sub;
    document.getElementById('txt-modal').innerText = d.modal;
    document.getElementById('txt-energy').innerText = d.energy;
    document.getElementById('remaining-count').innerText = attempts;
    document.getElementById('lang-label').innerText = lang.toUpperCase();
    
    const hr = new Date().getHours();
    document.getElementById('greeting').innerText = (hr < 12 ? d.morning : d.evening) + name;

    // تحديث التصنيفات باللغة الجديدة
    document.getElementById('cat-grid').innerHTML = d.cats.map(c => `
        <div class="cat-item" onclick="quickS('${c.q}')">
            <div class="cat-icon"><i class="fa-solid ${c.i}"></i></div>
            <span style="font-size:0.7rem; font-weight:bold;">${c.n}</span>
        </div>`).join('');
}

// نظام الإضاءة الليلية (Toggle Dark Mode)
function toggleLight() {
    darkMode = !darkMode;
    document.body.style.filter = darkMode ? "brightness(1)" : "brightness(1.1) invert(0.05)";
    document.body.style.background = darkMode ? "#030712" : "#f1f5f9";
    document.body.style.color = darkMode ? "#f1f5f9" : "#030712";
}

function toggleLang() { 
    const b = document.getElementById('lang-box'); 
    b.style.display = b.style.display === 'none' ? 'block' : 'none'; 
}

function setLang(l) { 
    lang = l; 
    toggleLang(); 
    update(); 
}

function startVoice() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!Speech) return alert("Browser not supported");
    const rec = new Speech();
    rec.lang = dict[lang].voice;
    const btn = document.getElementById('v-btn');
    btn.classList.add('fa-beat');
    rec.start();
    rec.onresult = (e) => {
        document.getElementById('s-input').value = e.results[0][0].transcript;
        btn.classList.remove('fa-beat');
        runSearch();
    };
}

async function runSearch() {
    const q = document.getElementById('s-input').value;
    const d = dict[lang];
    if(!q || attempts <= 0) return;
    
    document.getElementById('ai-status').style.display = 'block';
    document.getElementById('ai-status').innerText = d.status;
    document.getElementById('results').innerHTML = '';

    try {
        const res = await fetch(`${API}/get-ai-advice`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ query: q, lang: lang, budget: localStorage.getItem('fb') || 0 })
        });
        const data = await res.json();
        attempts--; 
        localStorage.setItem('findly_attempts', attempts);
        update();

        document.getElementById('ai-status').innerHTML = `<strong>${d.analysis}</strong><br>${data.explanation}`;
        
        data.products.forEach((p, index) => {
            const isSage = index === 0;
            document.getElementById('results').innerHTML += `
                <div class="product-card">
                    ${isSage ? `<div class="sage-badge">${d.sage}</div>` : ''}
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="flex:1;">
                            <h4 style="margin:0;">${p.name}</h4>
                            <div style="color:#6366F1; font-weight:900; font-size:1.2rem; margin:5px 0;">${p.price}</div>
                        </div>
                        <img src="${p.thumbnail}" style="width:70px; height:70px; background:white; padding:5px; border-radius:12px; object-fit:contain;">
                    </div>
                    <div class="analysis-box"><strong>${d.analysis}</strong> ${p.reason}</div>
                    <a href="${p.link}" target="_blank" style="display:block; text-align:center; background:var(--primary-gradient); color:white; padding:15px; border-radius:15px; margin-top:15px; text-decoration:none; font-weight:bold;">${d.buy}</a>
                </div>`;
        });
    } catch (e) { 
        document.getElementById('ai-status').innerText = "Error Connection!"; 
    }
}

// لتفعيل زر الإضاءة، تأكد من وجود زر في الـ HTML ينادي toggleLight()
update();
