const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const { Configuration, OpenAIApi } = require("openai"); // اختياري لتعزيز الاستشارة

const app = express();
app.use(express.json());

// --- الطبقة 1: طبقة الفهم والإدراك (Intent Analysis) ---
// وظيفتها: فهم هل يبحث المستخدم عن منتج للشراء أم معلومة تقنية أم نصيحة طبية.
function analyzeIntent(query) {
    const keywords = {
        shopping: ['سعر', 'شراء', 'افضل', 'ارخص', 'buy', 'price'],
        advice: ['كيف', 'لماذا', 'نصيحة', 'طريقة', 'how', 'why']
    };
    if (keywords.shopping.some(k => query.includes(k))) return 'CONSULTANT_SHOPPER';
    return 'KNOWLEDGE_SAGE';
}

// --- الطبقة 2: طبقة استقاء البيانات (Multi-Source Fetching) ---
async function fetchRichData(query, lang) {
    // جلب بيانات من SerpApi (نتائج جوجل)
    const googleResults = await axios.get('https://serpapi.com/search', {
        params: { q: query, api_key: "YOUR_SERPAPI_KEY", hl: lang }
    });
    return googleResults.data;
}

// --- الطبقة 3: طبقة التصفية والمنطق (Logic & Filtering) ---
function refineResults(rawItems) {
    return rawItems.map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        isVerified: item.displayed_link.includes('.gov') || item.displayed_link.includes('.edu'),
        richSnippet: item.rich_snippet || null
    }));
}

// --- الطبقة 4: طبقة الاستشارة الذكية (Consultancy Layer) ---
// وظيفتها: صياغة "رأي" السيرفر بناءً على النتائج
function generateAdvice(results, intent, lang) {
    if (intent === 'CONSULTANT_SHOPPER') {
        return lang === 'ar' 
            ? "بناءً على مراجعات السوق، هذا المنتج يعتبر خياراً ممتازاً للفئة المتوسطة. أنصحك بالتركيز على ضمان الوكيل."
            : "Based on market reviews, this is a top-tier choice for mid-range budgets. Focus on warranty.";
    }
    return lang === 'ar' ? "إليك ملخص شامل للأبحاث حول موضوعك..." : "Here is a summary of the latest research...";
}

// --- الطبقة 5: طبقة الذاكرة (Persistence Layer - MongoDB) ---
const SearchSchema = new mongoose.Schema({
    query: String,
    advice: String,
    intent: String,
    date: { type: Date, default: Date.now }
});
const Insight = mongoose.model('Insight', SearchSchema);

// --- نقطة النهاية الرئيسية (The Master Endpoint) ---
app.post('/api/consult', async (req, res) => {
    const { query, lang } = req.body;
    
    try {
        // 1. تحليل النية
        const intent = analyzeIntent(query);
        
        // 2. جلب البيانات
        const rawData = await fetchRichData(query, lang);
        
        // 3. تكرير البيانات
        const refined = refineResults(rawData.organic_results || []);
        
        // 4. توليد الاستشارة
        const advice = generateAdvice(refined, intent, lang);
        
        // 5. الحفظ في MongoDB
        const entry = new Insight({ query, advice, intent });
        await entry.save();

        res.json({
            success: true,
            intent: intent,
            advisor_message: advice, // هذا ما سيجعل تطبيقك "مستشاراً"
            results: refined
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("Advisor Server Running..."));
