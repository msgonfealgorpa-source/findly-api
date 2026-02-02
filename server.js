const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ==============================
// 🧠 وظائف العقل الذكي (Internal Brain)
// ==============================

// 1. تحليل نية البحث
function analyzeIntent(query) {
    const q = query.toLowerCase();
    if (/gaming|game|fps|play|ألعاب|لعب/.test(q)) return { type: "gaming", label: "الألعاب" };
    if (/camera|photo|تصوير|كاميرا|صور/.test(q)) return { type: "camera", label: "التصوير" };
    if (/battery|بطارية|شحن/.test(q)) return { type: "battery", label: "البطارية" };
    if (/cheap|budget|رخيص|اقتصادي|توفير/.test(q)) return { type: "budget", label: "التوفير" };
    if (/best|luxury|افضل|اقوى|ممتاز|فاخر/.test(q)) return { type: "premium", label: "الأداء العالي" };
    return { type: "balanced", label: "الاستخدام المتوازن" };
}

// 2. تحديد الفئة
function detectCategory(query, lang) {
    const q = query.toLowerCase();
    const isAr = lang === "ar";
    if (/phone|iphone|samsung|هاتف|جوال|موبايل/.test(q)) return isAr ? "هاتف" : "phone";
    if (/laptop|macbook|pc|لابتوب|كمبيوتر/.test(q)) return isAr ? "لابتوب" : "laptop";
    if (/watch|ساعة/.test(q)) return isAr ? "ساعة ذكية" : "smart watch";
    if (/tablet|ipad|تابلت|آيباد/.test(q)) return isAr ? "تابلت" : "tablet";
    return isAr ? "منتج" : "product";
}

// 3. نظام النقاط الذكي (Scoring)
function calculateSmartScore(p, intent) {
    const price = parseFloat((p.price || "").replace(/[^\d.]/g, "")) || 99999;
    const rating = p.rating || 4.0;
    let score = rating * 100; // القاعدة الأساسية هي التقييم

    if (intent.type === "budget") score += (5000 - price) / 10; // السعر الأقل يحصل على نقاط أعلى
    if (intent.type === "premium") score += rating * 150;
    if (intent.type === "gaming") score += rating * 120;
    
    return score;
}

// 4. محرك توليد التبرير (Reasoning)
function generateReason(p, intent, category, rank, lang, isCheapest) {
    const isAr = lang === "ar";
    const rating = p.rating || "ممتاز";

    if (isAr) {
        if (rank === 0) { // الخيار الأول
            if (isCheapest) return `هذا هو "الخيار الذهبي"! يجمع بين أقل سعر متاح وأفضل تقييم لـ ${category}. مثالي لـ ${intent.label}.`;
            if (intent.type === "premium") return `الخيار الأقوى بلا منازع؛ يتميز بجودة تصنيع فائقة وتقييم (${rating}) مما يجعله استثماراً ذكياً.`;
            return `لقد اخترت لك هذا الـ ${category} كأفضل ترشيح بناءً على توازن الأداء والسعر وتقييمات المستخدمين.`;
        }
        if (isCheapest) return `أفضل صفقة اقتصادية حالياً. يوفر لك الكثير من المال مع الحفاظ على جودة جيدة.`;
        return `بديل قوي وموثوق من ${p.source}، يتميز بمواصفات تلبي احتياجك بدقة.`;
    } else {
        if (rank === 0) return `Top Recommendation: Best balance for ${intent.label} with a ${rating} rating.`;
        return `Reliable alternative from ${p.source} with competitive pricing.`;
    }
}

// ==============================
// 🚀 نقطة الاتصال (API Route)
// ==============================

app.post('/smart-search', async (req, res) => {
    try {
        const { query, lang } = req.body;
        const currentLang = lang || "ar";

        if (!query) return res.status(400).json({ error: "Query is required" });

        const intent = analyzeIntent(query);
        const category = detectCategory(query, currentLang);

        // جلب البيانات من SerpApi
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: "google_shopping",
                q: query,
                api_key: process.env.SERPAPI_KEY,
                hl: currentLang,
                gl: currentLang === "ar" ? "sa" : "us"
            }
        });

        const rawResults = response.data.shopping_results || [];

        // تحويل وتجهيز البيانات
        let products = rawResults.map(p => ({
            name: p.title,
            thumbnail: p.thumbnail,
            link: p.product_link || p.link,
            price: p.price || (currentLang === "ar" ? "اتصل للسعر" : "Check price"),
            rating: p.rating || 4.2,
            source: p.source,
            extractedPrice: parseFloat((p.price || "").replace(/[^\d.]/g, "")) || 0
        }));

        // حساب النقاط والترتيب
        products = products.map(p => ({
            ...p,
            score: calculateSmartScore(p, intent)
        })).sort((a, b) => b.score - a.score);

        // تحديد السعر الأرخص في النتائج
        const validPrices = products.map(p => p.extractedPrice).filter(p => p > 0);
        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

        // صياغة النتائج النهائية (أفضل 3)
        const finalProducts = products.slice(0, 3).map((p, i) => {
            const isCheapest = p.extractedPrice === minPrice && minPrice > 0;
            return {
                name: p.name,
                thumbnail: p.thumbnail,
                link: p.link,
                price: p.price,
                rating: p.rating,
                source: p.source,
                reason: generateReason(p, intent, category, i, currentLang, isCheapest)
            };
        });

        const explanation = currentLang === "ar" 
            ? `حللت لك ${rawResults.length} منتجاً، ووجدت أن هذه الخيارات هي الأنسب لـ ${intent.label}.`
            : `I analyzed ${rawResults.length} products. These 3 matches your ${intent.label} needs best.`;

        res.json({ explanation, products: finalProducts });

    } catch (err) {
        console.error("🚨 Server Error:", err.message);
        res.status(500).json({ explanation: "Error", products: [] });
    }
});

app.get('/', (req, res) => res.send('Findly Smart Engine v4.0 is Online! 🚀'));

app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
