const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. دالة البحث (Scraping)
app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ success: false, message: "Query is required" });

    try {
        const config = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
        };

        const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
        const response = await axios.get(amazonUrl, config);
        const $ = cheerio.load(response.data);
        const products = [];

        $('div[data-component-type="s-search-result"]').each((i, el) => {
            if (i < 5) {
                const name = $(el).find('h2 span').text().trim();
                const priceWhole = $(el).find('.a-price-whole').first().text().trim();
                const image = $(el).find('.s-image').attr('src');
                const link = "https://www.amazon.com" + $(el).find('a.a-link-normal').attr('href');

                if (name && priceWhole) {
                    products.push({ name, price: priceWhole, currency: "$", image, link, source: "Amazon" });
                }
            }
        });

        res.json({ success: true, top: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. دالة المستشار الذكي (OpenAI) - الآن في السيرفر!
app.post('/get-ai-advice', async (req, res) => {
    const { query, products } = req.body;
    const apiKey = process.env.OPENAI_API_KEY; // سيتم جلبه من إعدادات Render

    try {
        const aiResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "أنت خبير مشتريات ذكي. حلل المنتجات وأعطِ نصيحة قصيرة جداً (30 كلمة) باللغة العربية عن الأفضل." },
                { role: "user", content: `البحث: ${query}. المنتجات: ${JSON.stringify(products)}` }
            ],
            temperature: 0.3
        }, {
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
        });

        res.json({ advice: aiResponse.data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ advice: "استعن بخبرتك في الاختيار حالياً!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
