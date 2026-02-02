const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// --- وظائف التحليل الذكي ---

function analyzeIntent(query) {
    const q = query.toLowerCase();
    if (/gaming|game|ألعاب/.test(q)) return { type: "gaming", label: "الألعاب" };
    if (/cheap|budget|رخيص|توفير/.test(q)) return { type: "budget", label: "التوفير" };
    if (/best|luxury|افضل|فاخر/.test(q)) return { type: "premium", label: "الأداء العالي" };
    return { type: "balanced", label: "الاستخدام المتوازن" };
}

function detectCategory(query, lang) {
    const q = query.toLowerCase();
    const isAr = lang === "ar";
    if (/phone|هاتف|جوال/.test(q)) return isAr ? "هاتف" : "phone";
    if (/laptop|لابتوب/.test(q)) return isAr ? "لابتوب" : "laptop";
    return isAr ? "منتج" : "product";
}

function calculateSmartScore(p, intent) {
    const price = parseFloat((p.price || "").replace(/[^\d.]/g, "")) || 99999;
    const rating = p.rating || 4.0;
    let score = rating * 100;
    if (intent.type === "budget") score += (5000 - price) / 10;
    return score;
}

function generateReason(p, intent, category, rank, lang) {
    const isAr = lang === "ar";
    if (isAr) {
        if (rank === 0) return `لقد اخترت لك هذا الـ ${category} كأفضل ترشيح بناءً على توازن الأداء والسعر وتقييمات المستخدمين لـ ${intent.label}.`;
        return `بديل ذكي وموثوق من ${p.source}، يتميز بمواصفات تلبي احتياجك بدقة.`;
    }
    return `Top Recommendation for ${intent.label} based on ratings and price.`;
}

// --- المسار المطلوب من الواجهة ---

// 1. تغيير المسار إلى /search ليتوافق مع index.html
// 2. تغيير النوع إلى GET
app.get('/search', async (req, res) => {
    try {
        // استلام البيانات من req.query بدلاً من req.body
        const { q, lang, uid } = req.query; 
        const currentLang = lang || "ar";

        if (!q) return res.status(400).json({ error: "Query is required" });

        const intent = analyzeIntent(q);
        const category = detectCategory(q, currentLang);

        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: "google_shopping",
                q: q,
                api_key: process.env.SERPAPI_KEY,
                hl: currentLang,
                gl: currentLang === "ar" ? "sa" : "us"
            }
        });

        const rawResults = response.data.shopping_results || [];

        let products = rawResults.map(p => ({
            name: p.title,
            thumbnail: p.thumbnail,
            link: p.product_link || p.link,
            price: p.price || (currentLang === "ar" ? "اتصل للسعر" : "Check price"),
            rating: p.rating || 4.2,
            source: p.source
        }));

        // حساب الترتيب الذكي
        products = products.map(p => ({
            ...p,
            score: calculateSmartScore(p, intent)
        })).sort((a, b) => b.score - a.score);

        // صياغة النتائج بالأسماء التي تتوقعها الواجهة (results و smartReason)
        const finalResults = products.slice(0, 3).map((p, i) => {
            return {
                name: p.name,
                thumbnail: p.thumbnail,
                link: p.link,
                price: p.price,
                source: p.source,
                // الواجهة تتوقع smartReason
                smartReason: generateReason(p, intent, category, i, currentLang)
            };
        });

        // إرجاع النتيجة في حقل 'results' كما تطلب الواجهة
        res.json({ results: finalResults });

    } catch (err) {
        console.error("🚨 Server Error:", err.message);
        res.status(500).json({ results: [] });
    }
});

// إضافة مسار Watchlist الذي تحاول الواجهة الاتصال به
app.post('/watchlist', (req, res) => {
    // هنا يمكنك إضافة منطق حفظ البيانات في قاعدة البيانات
    console.log("Item added to watchlist:", req.body);
    res.status(200).json({ message: "Added" });
});

app.get('/', (req, res) => res.send('Findly Smart Engine is Online! 🚀'));

app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
