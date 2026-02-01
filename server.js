async function runSearch() {
    let q = document.getElementById('s-input').value;
    const status = document.getElementById('status');
    const resCon = document.getElementById('results');
    const d = dict[lang] || dict['ar'];
    const userBudget = parseFloat(localStorage.getItem('fb')) || 0;

    if (attempts <= 0) { 
        status.style.display = "block";
        status.innerHTML = d.noAttempts;
        return; 
    }
    if (!q) return;

    status.style.display = "block";
    status.innerHTML = '<i class="fa-solid fa-microchip fa-spin"></i> Finding Best Deals...';
    resCon.innerHTML = "";

    // Generate or Retrieve UID for history
    let uid = localStorage.getItem('findly_uid');
    if(!uid) {
        uid = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('findly_uid', uid);
    }

    try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&uid=${uid}&lang=${lang}`, { method: 'GET' });
        const data = await res.json();
        status.style.display = "none";

        if (data.results && data.results.length > 0) {

            // حساب متوسط وأدنى سعر للسوق داخل النتائج
            const prices = data.results.map(i => parseFloat(i.price?.toString().replace(/[^0-9.]/g, '')) || 0).filter(p => p>0);
            const avgPrice = prices.reduce((a,b)=>a+b,0)/(prices.length||1);
            const minPrice = Math.min(...prices);

            data.results.forEach((p, index) => {
                let cleanPrice = p.price ? p.price.toString().replace(/[^\d.]/g, '') : "0"; 
                let priceVal = parseFloat(cleanPrice);
                let budgetAlert = (userBudget > 0 && priceVal > userBudget) ? `<div class="budget-error">⚠️ ${d.over} (${userBudget}$)</div>` : "";

                // تحليلات إضافية
                let analysisHTML = `
                    <div class="analysis-engine">
                        <span class="analysis-label"><i class="fa-solid fa-brain"></i> ${d.why}</span>
                        ${p.smartReason || 'Best match found based on your search.'}
                        <ul style="margin-top:5px; padding-left: 18px; font-size:0.8rem;">
                            <li>السعر الحالي: ${p.price || 'N/A'}</li>
                            <li>متوسط سعر السوق: ${avgPrice.toFixed(2)}</li>
                            <li>أقل سعر متاح: ${minPrice}</li>
                            <li>المصدر: ${p.source || 'N/A'}</li>
                            <li>التقييم: ${p.rating || 'N/A'} (${p.reviews || 0} مراجعات)</li>
                        </ul>
                    </div>
                `;

                setTimeout(() => {
                    resCon.innerHTML += `
                        <div class="product-card">
                            ${budgetAlert}
                            <img src="${p.thumbnail || ''}" onerror="this.src='https://via.placeholder.com/150'">
                            <h3>${p.name}</h3>
                            <div class="price">${p.price || 'N/A'}</div>
                            ${analysisHTML}
                            <div class="btn-group">
                                <a href="${p.link}" target="_blank" class="action-btn buy-now">${d.buy}</a>
                                <button class="action-btn watch-later" onclick="addToWatch('${p.name.replace(/'/g, "\\'")}', '${p.price}', '${p.link}')">${d.watch}</button>
                            </div>
                        </div>`;
                }, index * 100);
            });

            attempts--;
            localStorage.setItem('findly_attempts', attempts);
            update();
        } else {
            status.style.display = "block";
            status.innerHTML = "No results found / لا توجد نتائج";
        }
    } catch (e) {
        console.error(e);
        status.style.display = "block";
        status.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> ${d.slow}`;
    }
}
