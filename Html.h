

async function runSearch() {
const loaderInterval = startAnalysisLoader();
const q = document.getElementById('s-input').value.trim();
const status = document.getElementById('status');
const resultsBox = document.getElementById('results');

if (!q) return;  

    const T = dict[lang]?.search || dict.en.search;  
    const UI = dict[lang]?.ui || dict.en.ui;  

    status.style.display = 'block';  
    status.innerText = '🔍 ...';  
    resultsBox.innerHTML = '';  
      
    const userBudget = parseFloat(localStorage.getItem('user_budget')) || 0;  

    try {  
        const res = await fetch(  
            `${API}/search?q=${encodeURIComponent(q)}&lang=${lang}&uid=${localStorage.getItem('findly_uid')}`  
        );  
        const data = await res.json();  
        status.style.display = 'none';  

        stopAnalysisLoader(loaderInterval);  
        if (data.error === 'ENERGY_EMPTY') {

const currentLang = localStorage.getItem('findly_lang') || 'ar';
const t = i18n[currentLang] || i18n.ar;

status.style.display = 'block';

status.innerHTML = `
<div style="background:#1b1b2f; border:1px solid #ff4d4d; padding:12px; border-radius:8px">
<h3 style="color:#ff4d4d; margin-bottom:8px">${t.title}</h3>
<p style="font-size:0.95rem; opacity:0.9">${t.message}</p>

<button  
    id="upgradeBtn"  
    class="upgrade-btn"  
    onclick="openUpgrade()"  
    style="margin-top:10px"  
  >  
    ${t.upgrade}  
  </button>  
</div>

`;

handleUpgradeButton();
return; // ⬅️ مهم جداً
}
if (!data.results) {
status.style.display = 'block';
status.innerText = lang === 'ar' ? 'لا توجد نتائج' : 'No results found';
return;
}

if (data.results && data.results.length > 0) {  
const firstProduct = data.results[0];  

updateAffiliateCard(firstProduct);

}

data.results.forEach(p => {  
            const intel = p.intelligence || {};  
            const verdict = intel.finalVerdict || {};  
            const priceIntel = intel.priceIntel || {};  
            const valueIntel = intel.valueIntel || {};  
            const forecast = intel.forecastIntel || {};  
             
const trust = intel.trustIntel || {};  
            // ===== STRATEGIC VERDICT (NEW ADDITION) =====

let strategicBadge = '';
let strategicColor = '#3b82f6';

if (verdict.decision === 'BUY_NOW') {
strategicBadge = '🟢 قرار ذكي: اشترِ الآن';
strategicColor = '#10b981';
}
else if (verdict.decision === 'WAIT') {
strategicBadge = '⏳ يفضل الانتظار';
strategicColor = '#f59e0b';
}
else if (verdict.decision === 'WAIT_PRICE_DROP') {
strategicBadge = '📉 انتظر انخفاض السعر';
strategicColor = '#6366f1';
}
else if (verdict.decision === 'OVERPRICED') {
strategicBadge = '🔴 السعر مرتفع';
strategicColor = '#ef4444';
}

const bestLink =
p.intelligence?.finalVerdict?.bestLink ||
p.link;

const safeLink =
typeof bestLink === "string" && bestLink.startsWith("http")
? bestLink
: null;

console.log(

'DECISION KEY:',
p.intelligence?.priceIntel?.decision
);

console.log(
'PERSONALITY KEY:',
p.intelligence?.personalityIntel?.type
);
// Budget Logic
let budgetClass = '';
let budgetBadge = '';
const priceVal = parseFloat(String(p.price).replace(/[^\d.]/g, '')) || 0;

if (userBudget > 0 && priceVal > userBudget) {  
                budgetClass = 'over-budget';  
                budgetBadge = `<div class="budget-alert">⚠️ ${UI.over || 'Over Budget!'}</div>`;  
              
              
                }  
              
          
            const card = document.createElement('div');  
            card.className = `product-card ${budgetClass}`;  

            // Coupon Logic  
            const coupons = p.coupons || [];  
            const numericPrice = priceVal;  
            const bestCoupon = (numericPrice && coupons.length) ? pickBestCoupon(numericPrice, coupons) : null;  
            const discountedPrice = (numericPrice && bestCoupon) ? applyCoupon(numericPrice, bestCoupon) : null;  

            card.innerHTML = `  
            ${budgetBadge}   
            <img src="${p.thumbnail || ''}" onerror="this.src='https://via.placeholder.com/200'">  
            <h3>${p.title || '—'}</h3>  

            <div class="price">  
                ${bestCoupon && discountedPrice  
                    ? `<span class="old-price">$${numericPrice}</span><span class="new-price">$${discountedPrice}</span>`  
                    : `$${numericPrice || '-'}`  
                }  
            </div>  

            <div class="sage-quick-brains">  
                <div class="brain-item good">  
                    💰 السعر <span>${priceIntel.score >= 70 ? 'ممتاز' : priceIntel.score >= 50 ? 'جيد' : 'ضعيف'}</span>  
                </div>  
                <div class="brain-item ${forecast.trend === 'down' ? 'wait' : forecast.trend === 'up' ? 'buy' : 'neutral'}">  
                    📈 التوقيت <span>${forecast.trend === 'down' ? 'انتظر' : forecast.trend === 'up' ? 'قد يرتفع' : 'مستقر'}</span>  
                </div>  
                <div class="brain-item ${trust.riskScore > 50 ? 'risk' : 'safe'}">  
                    🛡️ الثقة <span>${trust.riskScore > 50 ? 'مخاطرة' : 'آمن'}</span>  
                </div>  
                <div class="brain-item learn">  
                    🧠 السلوك <span>${valueIntel.learningBoost > 0 ? 'مناسب لك' : 'عام'}</span>  
                </div>  
            </div>  

            <div class="analysis-engine">  
                <span class="analysis-label">${verdict.emoji || '🤖'} ${verdict.title || ''}</span>  
                <div>${verdict.reason || ''}</div>  
            </div>

${verdict.decision ? `

<div style="  
    margin-top:10px;  
    padding:10px;  
    border-radius:10px;  
    background:rgba(255,255,255,0.05);  
    border:1px solid ${strategicColor};  
">  
    <div style="font-weight:bold; color:${strategicColor}; margin-bottom:6px;">  
        ${strategicBadge}  
    </div>  <div style="font-size:0.9rem; opacity:0.9;">  
    ${verdict.reason || ''}  
</div>  

${verdict.savingPercent ? `  
<div style="margin-top:5px;">  
    💰 التوفير: <strong>${verdict.savingPercent}%</strong>  
</div>` : ''}  

${verdict.bestStore ? `  
<div style="margin-top:5px;">  
    🏪 أفضل متجر: <strong>${verdict.bestStore}</strong>  
    ${verdict.bestPrice ? ` - $${verdict.bestPrice}` : ''}  
</div>` : ''}  

<div style="margin-top:5px;">  
    🎯 الثقة: <strong>${verdict.confidence || 0}%</strong>  
</div>

</div>  
` : ''}  ${bestCoupon ? `  
            <div class="coupon-box" style="margin:10px 0; padding:10px; background:rgba(16,185,129,0.1); border-radius:10px; border:1px dashed #10b981;">  
                🎟️ <strong>${bestCoupon.code}</strong> (${bestCoupon.type === 'percent' ? `-${bestCoupon.discount}%` : `-$${bestCoupon.discount}`})  
                <div class="discounted-price" style="font-size:0.9rem; margin-top:5px;">  
                    ${T.after_discount}: <strong>$${discountedPrice}</strong>  
                </div>  
                <button class="action-btn" onclick="navigator.clipboard.writeText('${bestCoupon.code}')" style="background:#10b981; color:white; padding:5px 10px; font-size:0.8rem; margin-top:5px;">${T.copy_coupon}</button>  
            </div>` : ''}  

            <div class="intel-section">  
                <h4>📊 ${T.market}</h4>  
                <p>${T.avg_price}: <strong>${priceIntel.average ? `$${priceIntel.average}` : '—'}</strong></p>  
                <p>${T.competitors}: <strong>${valueIntel.competitors || 0}</strong></p>  
            </div>  

            <div class="intel-section">  
                <h4>💎 ${T.value}</h4>  
                <p>${T.deal_score}: <strong>${valueIntel.score || 0}%</strong></p>  
                <p>${valueIntel.learningBoost > 0 ? T.learning_on : T.learning_later}</p>  
            </div>  

            <div class="intel-section">  
                <h4>🔮 ${T.forecast}</h4>  
                <p>${T.trend[forecast.trend] || T.trend.stable}</p>  
                <p>${T.expected_price}: <strong>$${forecast.expectedPrice || '—'}</strong></p>  
                <p>${T.confidence}: <strong>${Math.round((forecast.confidence || 0) * 100)}%</strong></p>  
            </div>  

            <div class="intel-section">  
                <h4>⚠️ ${T.trust}</h4>  
                ${trust.warnings && trust.warnings.length ? `<ul>${trust.warnings.map(w => `<li>${w}</li>`).join('')}</ul>` : `<p>✅ ${T.no_risks}</p>`}  
            </div>

<button class="action-btn watch"
onclick="addToWatch(
'${p.title.replace(/'/g,"\'")}',
'${numericPrice}',
'${safeLink || ""}'
)"
style="width:100%; margin-top:10px; background:#f59e0b; color:white;">
🔔 ${lang === 'ar' ? 'مراقبة السعر' : 'Watch Price'}
</button>

${safeLink ? `

<a class="action-btn buy"  
href="https://findly-api.onrender.com/go?url=${encodeURIComponent(safeLink)}"  
target="_blank"  
rel="noopener noreferrer">
${T.buy}
</a>
:
<button class="action-btn buy disabled" disabled>
${T.no_link || 'الرابط غير متوفر'}
</button>
`}

<button class="action-btn analyze-btn" style="width:100%; margin-top:10px;"  
                data-verdict="${encodeURIComponent(JSON.stringify(verdict))}"  
                data-price="${encodeURIComponent(JSON.stringify(priceIntel))}"  
                data-value="${encodeURIComponent(JSON.stringify(valueIntel))}"  
                data-forecast="${encodeURIComponent(JSON.stringify(forecast))}"  
                data-trust="${encodeURIComponent(JSON.stringify(trust))}"  
                onclick="openAnalysisFromBtn(this)">  
                ${T.analyze}  
            </button>  
            `;  
            resultsBox.appendChild(card);  
        });  

    } catch (e) {  
        console.error(e);  
        status.style.display = 'block';  
        status.innerText = '❌ Error fetching results';  
    }  
}
