
const API = "https://findly-api.onrender.com";
let lang = 'ar';
let attempts = localStorage.getItem('findly_attempts') ? parseInt(localStorage.getItem('findly_attempts')) : 3;

const dict = {
    ar: { 
        title: "مستشارك الحكيم", sub: "مرحلة الحكومة: تحليل سيبراني عميق", 
        status: "الحكيم يحلل البيانات العالمية الآن...", modal: "إعدادات المستشار", energy: "طاقة العقل",
        morning: "طاب صباحك، ", evening: "طاب مساؤك، ", voice: "ar-SA",
        cats: [{n:'هواتف', q:'Smartphone', i:'fa-mobile'}, {n:'لابتوب', q:'Laptop', i:'fa-laptop'}, {n:'سماعات', q:'Audio', i:'fa-headphones'}, {n:'ساعات', q:'Watch', i:'fa-clock'}, {n:'ألعاب', q:'Gaming', i:'fa-gamepad'}, {n:'كاميرا', q:'Camera', i:'fa-camera'}, {n:'منزل', q:'Smart Home', i:'fa-microchip'}, {n:'شاشات', q:'TV', i:'fa-tv'}]
    },
    en: { 
        title: "The Sage Advisor", sub: "Government Phase: Deep cyber analysis", 
        status: "The Sage is decrypting global data...", modal: "Advisor Settings", energy: "Sage Energy",
        morning: "Good morning, ", evening: "Good evening, ", voice: "en-US",
        cats: [{n:'Phones', q:'Smartphone', i:'fa-mobile'}, {n:'Laptops', q:'Laptop', i:'fa-laptop'}, {n:'Audio', q:'Audio', i:'fa-headphones'}, {n:'Watches', q:'Watch', i:'fa-clock'}, {n:'Gaming', q:'Gaming', i:'fa-gamepad'}, {n:'Cameras', q:'Camera', i:'fa-camera'}, {n:'Home', q:'Smart Home', i:'fa-microchip'}, {n:'TVs', q:'TV', i:'fa-tv'}]
    }
};

function update() {
    const d = dict[lang] || dict['en'];
    const name = localStorage.getItem('fn') || "User";
    document.getElementById('main-html').dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.getElementById('txt-title').innerText = d.title;
    document.getElementById('txt-sub').innerText = d.sub;
    document.getElementById('txt-modal').innerText = d.modal;
    document.getElementById('txt-energy').innerText = d.energy;
    document.getElementById('remaining-count').innerText = attempts;
    document.getElementById('lang-label').innerText = lang.toUpperCase();
    
    const hr = new Date().getHours();
    document.getElementById('greeting').innerText = (hr < 12 ? d.morning : d.evening) + name;

    document.getElementById('cat-grid').innerHTML = d.cats.map(c => `
        <div class="cat-item" onclick="quickS('${c.q}')">
            <div class="cat-icon"><i class="fa-solid ${c.i}"></i></div>
            <span style="font-size:0.7rem; font-weight:bold;">${c.n}</span>
        </div>`).join('');
}

function toggleLang() { const b = document.getElementById('lang-box'); b.style.display = b.style.display === 'none' ? 'block' : 'none'; }
function setLang(l) { lang = l; toggleLang(); update(); }
function quickS(q) { document.getElementById('s-input').value = q; runSearch(); }

function startVoice() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!Speech) return alert("Browser not supported");
    const rec = new Speech();
    rec.lang = (dict[lang] || dict['en']).voice;
    const btn = document.getElementById('v-btn');
    btn.classList.add('fa-beat');
    rec.start();
    rec.onresult = (e) => {
        document.getElementById('s-input').value = e.results[0][0].transcript;
        btn.classList.remove('fa-beat');
        runSearch();
    };
    rec.onerror = () => btn.classList.remove('fa-beat');
}

async function runSearch() {
    const q = document.getElementById('s-input').value;
    if(!q || attempts <= 0) return;
    document.getElementById('ai-status').style.display = 'block';
    document.getElementById('ai-status').innerText = (dict[lang] || dict['en']).status;
    document.getElementById('results').innerHTML = '';

    try {
        const res = await fetch(`${API}/get-ai-advice`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ query: q, lang: lang, budget: localStorage.getItem('fb') || 0 })
        });
        const data = await res.json();
        attempts--; localStorage.setItem('findly_attempts', attempts);
        update();
        document.getElementById('ai-status').innerHTML = `<strong>رؤية الحكيم:</strong><br>${data.explanation}`;
        
        data.products.forEach((p, index) => {
            const isSage = index === 0;
            document.getElementById('results').innerHTML += `
                <div class="product-card">
                    ${isSage ? '<div class="sage-badge">اختيار الحكيم 👑</div>' : ''}
                    <div style="display:flex; justify-content:space-between;">
                        <div>
                            <h4>${p.name}</h4>
                            <div style="color:#6366F1; font-weight:900;">${p.price}</div>
                        </div>
                        <img src="${p.thumbnail}" style="width:65px; background:white; padding:5px; border-radius:10px;">
                    </div>
                    <div class="analysis-box"><strong>تحليل:</strong> ${p.reason}</div>
                    <a href="${p.link}" target="_blank" style="display:block; text-align:center; background:var(--primary-gradient); color:white; padding:12px; border-radius:15px; margin-top:15px; text-decoration:none;">اقتنِ الآن</a>
                </div>`;
        });
    } catch (e) { document.getElementById('ai-status').innerText = "خطأ سيبراني!"; }
}

function openProfile() { document.getElementById('profile-modal').style.display = 'flex'; }
function saveSet() {
    localStorage.setItem('fn', document.getElementById('in-name').value);
    localStorage.setItem('fb', document.getElementById('in-budget').value);
    document.getElementById('profile-modal').style.display = 'none';
    update();
}
// تشغيل الأولي
update();
