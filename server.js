const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// المنفذ الذي سيعمل عليه السيرفر
const PORT = process.env.PORT || 3000;

app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query, lang } = req.body;

        // إعدادات البحث بناءً على اللغة المختارة من الواجهة
        const searchLanguage = lang || "ar";
        const countryCode = (searchLanguage === "ar") ? "sa" : "us";

        // 1. جلب البيانات من Google Shopping عبر SerpApi
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: "google_shopping",
                q: query,
                api_key: process.env.SERPAPI_KEY, // تأكد من وجود المفتاح في Environment Variables
                hl: searchLanguage,
                gl: countryCode
            }
        });

        const shoppingResults = response.data.shopping_results || [];

        // 2. معالجة وتجهيز أفضل 3 منتجات فقط كما تطلب الواجهة
        const topProducts = shoppingResults.slice(0, 3).map((item, index) => {
            // معالجة الرابط لمنع أخطاء التوجيه
            let cleanLink = item.product_link || item.link;
            if (cleanLink && !cleanLink.startsWith('http')) {
                cleanLink = 'https://www.google.com' + cleanLink;
            }

            // إنشاء تبرير ذكي بناءً على اللغة
            let reason = "";
            if (searchLanguage === "ar") {
                reason = item.rating >= 4 ? "تقييم مرتفع من المستخدمين" : "سعر ممتاز مقارنة بالمواصفات";
            } else {
                reason = item.rating >= 4 ? "Highly rated by users" : "Great value for the price";
            }

            return {
                name: item.title,
                thumbnail: item.thumbnail,
                link: cleanLink,
                recommendation_reason: reason,
                features: item.price, // عرض السعر في خانة الميزات
                rating: item.rating || 0
            };
        });

        // 3. صياغة تحليل "العقل الخارق"
        let analysisMsg = "";
        if (searchLanguage === "ar") {
            analysisMsg = `بناءً على بحثك عن "${query}"، قمت بتحليل الخيارات المتاحة. وجدت أن هذه المنتجات هي الأفضل من حيث القيمة مقابل السعر والتقييمات الحالية في السوق.`;
        } else {
            analysisMsg = `Based on your search for "${query}", I analyzed the available options. These products offer the best balance between price, performance, and user ratings.`;
        }

        // إرسال البيانات النهائية للواجهة
        res.json({
            analysis: { why: analysisMsg },
            products: topProducts
        });

    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "حدث خطأ أثناء معالجة البيانات" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
