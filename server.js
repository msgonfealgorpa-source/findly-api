const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query } = req.body;
        const SERPAPI_KEY = process.env.SERPAPI_KEY;
        const GEMINI_KEY = process.env.GEMINI_KEY;

        // 1. جلب بيانات حقيقية من جوجل
        const searchRes = await axios.get(`https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&hl=ar`);
        const rawProducts = searchRes.data.shopping_results ? searchRes.data.shopping_results.slice(0, 5) : [];

        // 2. إرسال البيانات لجيمناي مع "إجبار" تنسيق JSON
        const aiResponse = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            contents: [{
                parts: [{
                    text: `أنت مساعد تسوق. حلل هذه المنتجات: ${JSON.stringify(rawProducts)}. 
                    اختر أفضل 3 لطلب المستخدم: "${query}".
                    يجب أن يكون الرد JSON فقط بهذا الهيكل:
                    {"analysis": {"why": ".."}, "products": [{"name": "..", "recommendation_reason": "..", "features": ".."}]}`
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json" // هذه الخاصية تضمن لك عدم وجود أخطاء في البيانات
            }
        });

        // إرسال النتيجة مباشرة لأنها ستكون JSON نظيف
        const result = JSON.parse(aiResponse.data.candidates[0].content.parts[0].text);
        res.json(result);

    } catch (error) {
        res.status(500).json({ error: "فشل النظام المتكامل", details: error.message });
    }
});

app.listen(process.env.PORT || 3000);
