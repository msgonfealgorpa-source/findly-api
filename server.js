const express = require('express');
const cors = require('cors');
const { getJson } = require("serpapi");
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();

// السماح للواجهة بالاتصال
app.use(cors({ origin: '*' }));
app.use(express.json());

// ==========================================
// الإعدادات والمفاتيح
// ==========================================
const MONGO_URI = process.env.MONGO_URI; 
const SERP_API_KEY = process.env.SERPAPI_KEY; // مفتاحك الأساسي للبحث
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // ضروري فقط للتحليل (AI)

// الاتصال بقاعدة البيانات
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ DB Connected"))
    .catch(err => console.error("❌ DB Error:", err.message));

// تعريف الجداول (Schema)
const Watchlist = mongoose.model('Watchlist', new mongoose.Schema({
    uid: { type: String, required: true },
    name: String,
    price: String,
    image: String,
    link: String,
    merchant: String, // تمت الإضافة: اسم المتجر
    rating: Number,   // تمت الإضافة: التقييم
    addedAt: { type: Date, default: Date.now }
}));

// دالة مساعدة لتحديد الدولة واللغة
const getGeoParams = (lang) => {
    switch(lang) {
        case 'ar': return { gl: 'sa', hl: 'ar' }; // السعودية - عربي
        case 'en': return { gl: 'us', hl: 'en' }; // أمريكا - إنجليزي
        case 'fr': return { gl: 'fr', hl: 'fr' }; // فرنسا - فرنسي
        case 'tr': return { gl: 'tr', hl: 'tr' }; // تركيا - تركي
        case 'zh': return { gl: 'cn', hl: 'zh-cn' }; // الصين
        default: return { gl: 'sa', hl: 'ar' };
    }
};

// ==========================================
// 1. نقطة البحث (SerpApi)
// ==========================================
app.get('/search', (req, res) => {
    const { q, lang } = req.query;
    if (!q) return res.status(400).json({ error: "No query" });

    const geo = getGeoParams(lang);

    try {
        getJson({
            engine: "google_shopping",
            q: q,
            api_key: SERP_API_KEY,
            gl: geo.gl, // الدولة
            hl: geo.hl, // اللغة
            num: 12
        }, (json) => {
            if (!json["shopping_results"]) {
                return res.json({ results: [] });
            }
            
            // استخراج البيانات الغنية التي طلبتها
            const products = json["shopping_results"].map(item => ({
                title: item.title,
                price: item.price,
                link: item.link,
                image: item.thumbnail,
                source: item.source, // اسم المتجر (نون، أمازون...)
                rating: item.rating, // التقييم (مثلا 4.5)
                reviews: item.reviews // عدد المراجعات
            }));

            res.json({ results: products });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Search failed" });
    }
});

// ==========================================
// 2. نقطة التحليل (Shopping Advisor)
// ==========================================
app.post('/analyze-product', async (req, res) => {
    // إذا لم يتوفر مفتاح جيمناي، نرسل رداً وهمياً لكي لا يتعطل التطبيق
    if (!GEMINI_API_KEY) {
        return res.json({
            verdict: "بيانات غير متاحة",
            score: 0,
            pros: ["يرجى تفعيل مفتاح AI"],
            cons: ["التحليل غير مفعل"],
            reasoning: "تحتاج لإضافة GEMINI_API_KEY في السيرفر لعمل المستشار الذكي."
        });
    }

    const { product, userQuery, lang } = req.body;
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Analyze this product for a shopper looking for "${userQuery}".
    Product: ${product.title}, Price: ${product.price}, Rating: ${product.rating}, Store: ${product.source}.
    Return JSON only:
    {
        "verdict": "Short advice in ${lang} language (Buy/Avoid)",
        "score": number 1-10,
        "pros": ["3 short points in ${lang}"],
        "cons": ["3 short points in ${lang}"],
        "reasoning": "One sentence summary in ${lang}"
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '');
        res.json(JSON.parse(text));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Analysis failed" });
    }
});

// ==========================================
// 3. المراقبة (تم الإصلاح)
// ==========================================
app.post('/watchlist/add', async (req, res) => {
    const { uid, product } = req.body;
    if (!uid || !product) return res.status(400).json({ success: false });

    try {
        // التحقق من التكرار
        const exists = await Watchlist.findOne({ uid, link: product.link });
        if (exists) return res.json({ success: false, message: "موجود مسبقاً" });

        await Watchlist.create({
            uid,
            name: product.title,
            price: product.price,
            image: product.image,
            link: product.link,
            merchant: product.source,
            rating: product.rating
        });
        res.json({ success: true, message: "تم الحفظ" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/watchlist/:uid', async (req, res) => {
    try {
        const list = await Watchlist.find({ uid: req.params.uid }).sort({ addedAt: -1 });
        res.json({ watchlist: list });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/watchlist/:id', async (req, res) => {
    try {
        await Watchlist.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
