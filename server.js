const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// مسار إضافي للتأكد أن السيرفر يعمل عند فتحه في المتصفح
app.get('/', (req, res) => res.send("Findly API is Running! 🚀"));

app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query } = req.body;
        
        const SERPAPI_KEY = process.env.SERPAPI_KEY;
        const GEMINI_KEY = process.env.GEMINI_KEY;

        if (!SERPAPI_KEY || !GEMINI_KEY) {
            return res.status(500).json({ error: "المفاتيح غير معرفة في إعدادات ريندر (Environment Variables)" });
        }

        // 1. "العين": جلب بيانات حقيقية
        const searchRes = await axios.get(`https://serpapi.com/search.json`, {
            params: {
                engine: "google_shopping",
                q: query,
                api_key: SERPAPI_KEY,
                hl: "ar",
                gl: "sa"
            }
        });
        const rawProducts = searchRes.data.shopping_results ? searchRes.data.shopping_results.slice(0, 8) : [];

        // 2. "العقل": تحليل البيانات
        const aiResponse = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            contents: [{
                parts: [{
                    text: `أنت خبير تسوق ذكي. إليك هذه المنتجات: ${JSON.stringify(rawProducts)}. 
                    بناءً على طلب المستخدم "${query}"، اختر أفضل 3 منتجات.
                    يجب أن يكون ردك عبارة عن كود JSON فقط بهذا الهيكل:
                    {"analysis": {"why": ".."}, "products": [{"name": "..", "recommendation_reason": "..", "features": ".."}]}`
                }]
            }]
        });

        // 3. تنظيف الرد (لأنه أحياناً يضع علامات ```json)
        let aiText = aiResponse.data.candidates[0].content.parts[0].text;
        const startIndex = aiText.indexOf('{');
        const endIndex = aiText.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1) {
            throw new Error("الذكاء الاصطناعي لم يرسل تنسيق JSON صحيح");
        }

        const cleanJson = aiText.substring(startIndex, endIndex + 1);
        res.json(JSON.parse(cleanJson));

    } catch (error) {
        console.error("Error details:", error.message);
        res.status(500).json({ 
            error: "فشل النظام المتكامل", 
            details: error.response ? error.response.data : error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
