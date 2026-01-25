const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json({ success: false, message: "Query is required" });

    try {
        // 1. إعداد "هوية" للمتصفح لكي لا يعرف أمازون أننا "بوت"
        const config = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
            }
        };

        // 2. طلب صفحة البحث من أمازون (سنبحث في النسخة العالمية كمثال)
        const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
        const response = await axios.get(amazonUrl, config);
        
        // 3. تحليل كود الـ HTML
        const $ = cheerio.load(response.data);
        const products = [];

        // 4. استخراج البيانات من الكود (نبحث عن عناصر المنتجات)
        $('div[data-component-type="s-search-result"]').each((i, el) => {
            if (i < 5) { // نجلب أول 5 نتائج فقط لضمان السرعة
                const name = $(el).find('h2 span').text().trim();
                const priceWhole = $(el).find('.a-price-whole').text().trim();
                const priceFraction = $(el).find('.a-price-fraction').text().trim();
                const image = $(el).find('.s-image').attr('src');
                const link = "https://www.amazon.com" + $(el).find('a.a-link-normal').attr('href');

                if (name && priceWhole) {
                    products.push({
                        name: name,
                        price: `${priceWhole}.${priceFraction}`,
                        currency: "$",
                        image: image,
                        link: link,
                        source: "Amazon"
                    });
                }
            }
        });

        // 5. إرسال النتائج الحقيقية للـ HTML الخاص بك
        res.json({
            success: true,
            top: products
        });

    } catch (error) {
        console.error("Scraping Error:", error.message);
        res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب البيانات الحقيقية" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Findly Engine is running on port ${PORT}`));
