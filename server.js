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

        if (!SERPAPI_KEY) {
            return res.status(500).json({ error: "مفتاح SerpApi مفقود في ريندر" });
        }

        // 1. جلب البيانات الخام من جوجل
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: "google_shopping",
                q: query,
                api_key: SERPAPI_KEY,
                hl: "ar",
                gl: "sa"
            }
        });

        const rawResults = response.data.shopping_results || [];

        // 2. تنسيق البيانات يدوياً (بدون ذكاء اصطناعي) لتناسب واجهة الموقع
        const formattedProducts = rawResults.slice(0, 6).map(item => ({
            name: item.title,
            recommendation_reason: `السعر: ${item.price} - متوفر في ${item.source}`,
            features: item.delivery || "شحن سريع متوفر",
            link: item.link,
            thumbnail: item.thumbnail
        }));

        // 3. إرسال النتيجة بنفس الهيكل الذي يتوقعه ملف الـ HTML
        res.json({
            analysis: {
                why: `نتائج مباشرة وموثوقة من بحث جوجل لـ "${query}"`
            },
            products: formattedProducts
        });

    } catch (error) {
        res.status(500).json({ error: "فشل جلب البيانات من جوجل" });
    }
});

app.listen(process.env.PORT || 3000);
