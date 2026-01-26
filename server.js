const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query, lang } = req.body;
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: "google_shopping",
                q: query,
                api_key: process.env.SERPAPI_KEY,
                hl: lang || "ar",
                gl: (lang === "ar") ? "sa" : "us"
            }
        });

        const products = (response.data.shopping_results || []).slice(0, 3).map(item => {
            // معالجة الرابط لمنع خطأ 404
            let finalLink = item.product_link || item.link;
            if (finalLink && !finalLink.startsWith('http')) finalLink = 'https://www.google.com' + finalLink;

            return {
                name: item.title,
                recommendation_reason: item.rating > 4 ? "تقييم عالي جداً" : "سعر منافس",
                link: finalLink,
                thumbnail: item.thumbnail
            };
        });

        res.json({
            analysis: { why: `تم تحليل أفضل الخيارات لـ ${query}` },
            products: products
        });
    } catch (error) { res.status(500).json({ error: "خطأ" }); }
});

app.listen(process.env.PORT || 3000);
