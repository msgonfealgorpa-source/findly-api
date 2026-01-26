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
        
        // جلب المفاتيح من بيئة العمل (Render)
        const SERPAPI_KEY = process.env.SERPAPI_KEY;
        const GEMINI_KEY = process.env.GEMINI_KEY;

        if (!SERPAPI_KEY || !GEMINI_KEY) {
            return res.status(500).json({ error: "المفاتيح غير معرفة في ريندر" });
        }

        // 1. "العين" تجلب البيانات
        const searchRes = await axios.get(`https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`);
        const rawProducts = searchRes.data.shopping_results ? searchRes.data.shopping_results.slice(0, 10) : [];

        // 2. "العقل" يحلل
        const aiResponse = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            contents: [{
                parts: [{
                    text: `أنت خبير تسوق ذكي. إليك هذه المنتجات الحقيقية: ${JSON.stringify(rawProducts)}. 
                    حللها واختر أفضل 3 تناسب طلب المستخدم "${query}" ونسقها كـ JSON.`
                }]
            }]
        });

        const aiText = aiResponse.data.candidates[0].content.parts[0].text;
        const cleanJson = aiText.substring(aiText.indexOf('{'), aiText.lastIndexOf('}') + 1);
        res.json(JSON.parse(cleanJson));

    } catch (error) {
        res.status(500).json({ error: "فشل النظام المتكامل", details: error.message });
    }
});

app.listen(process.env.PORT || 3000);
