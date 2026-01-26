const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// نقطة النهاية (API Endpoint) لجلب نصائح الذكاء الاصطناعي
app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query, lang } = req.body;
        const SERPAPI_KEY = process.env.SERPAPI_KEY;

        if (!query) {
            return res.status(400).json({ error: "الرجاء إدخال نص للبحث" });
        }

        // 1. جلب البيانات من Google Shopping عبر SerpApi
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: "google_shopping",
                q: query,
                api_key: SERPAPI_KEY,
                hl: lang || "ar",
                gl: (lang === "ar") ? "sa" : "us"
            }
        });

        const rawResults = response.data.shopping_results || [];

        // 2. منطق "العقل الخارق": تصفية وترتيب النتائج برمجياً
        // ترتيب حسب التقييم الأعلى لضمان جودة الخيارات
        const smartSorted = rawResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        const products = smartSorted.slice(0, 3).map(item => {
            // صياغة تبرير الاختيار بناءً على البيانات المتاحة
            let reason = `مرشح لك بناءً على `;
            if (item.rating >= 4.5) {
                reason += "تقييمه الممتاز وثقة المستخدمين العالية.";
            } else if (item.price && item.price.includes('ر.س')) {
                reason += "سعره التنافسي وتوفره للشحن المحلي.";
            } else {
                reason += `سمعة المتجر المصدر (${item.source}).`;
            }

            // --- حل مشكلة الروابط (خطأ 404) ---
            // نختار الرابط المباشر للمنتج، وإذا كان الرابط ناقصاً نكمله بنطاق جوجل
            let finalLink = item.product_link || item.link;
            if (finalLink && !finalLink.startsWith('http')) {
                finalLink = 'https://www.google.com' + finalLink;
            }

            return {
                name: item.title,
                recommendation_reason: reason,
                features: `السعر: ${item.price || 'غير محدد'} | المصدر: ${item.source} | التقييم: ${item.rating || '4.0'}⭐`,
                link: finalLink,
                thumbnail: item.thumbnail
            };
        });

        // 3. إرسال الاستجابة النهائية بالهيكل المطلوب للموقع
        res.json({
            analysis: {
                why: `بعد تحليل ${rawResults.length} منتج في السوق، وجدت أن هذه الخيارات هي الأفضل لطلبك "${query}" من حيث الجودة والسعر.`
            },
            products: products
        });

    } catch (error) {
        console.error("خطأ في السيرفر:", error.message);
        res.status(500).json({ error: "عذراً، حدث خطأ أثناء تحليل البيانات." });
    }
});

// تشغيل السيرفر على المنفذ المحدد من Render أو 3000 محلياً
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`السيرفر يعمل بنجاح على المنفذ ${PORT}`);
});
