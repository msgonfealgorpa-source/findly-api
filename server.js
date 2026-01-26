const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query, lang } = req.body; 
        const SERPAPI_KEY = process.env.SERPAPI_KEY;
        
        // توحيد اسم المتغير المستخدم للغة
        const currentLang = lang || "ar"; 

        // 1. طلب البيانات من جوجل
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: "google_shopping",
                q: query,
                api_key: SERPAPI_KEY,
                hl: currentLang, // لغة الواجهة
                gl: currentLang === "ar" ? "sa" : "us" // الدولة
            }
        });

        const shoppingResults = response.data.shopping_results || [];

        // 2. معالجة أفضل 3 منتجات
        const topProducts = shoppingResults.slice(0, 3).map((item) => {
            let cleanLink = item.product_link || item.link;
            if (cleanLink && !cleanLink.startsWith('http')) {
                cleanLink = 'https://www.google.com' + cleanLink;
            }

            // تحديد سبب الترشيح بناءً على اللغة المرسلة
            let reason = "";
            if (currentLang === "ar") {
                reason = item.rating >= 4 ? "تقييم مرتفع من المستخدمين" : "سعر ممتاز مقارنة بالمواصفات";
            } else if (currentLang === "fr") {
                reason = item.rating >= 4 ? "Très bien noté par les utilisateurs" : "Excellent rapport qualité-prix";
            } else if (currentLang === "tr") {
                reason = item.rating >= 4 ? "Kullanıcılar tarafından yüksek puan aldı" : "Fiyatına göre mükemmel değer";
            } else if (currentLang === "es") {
                reason = item.rating >= 4 ? "Muy valorado por los usuarios" : "Excelente relación calidad-precio";
            } else {
                reason = item.rating >= 4 ? "Highly rated by users" : "Great value for the price";
            }

            return {
                name: item.title,
                thumbnail: item.thumbnail,
                link: cleanLink,
                recommendation_reason: reason,
                features: item.price,
                rating: item.rating || 0
            };
        });

        // 3. صياغة رسالة التحليل الذكي حسب اللغة
        let analysisMsg = "";
        const messages = {
            ar: `بناءً على بحثك عن "${query}"، قمت بتحليل الخيارات المتاحة. وجدت أن هذه المنتجات هي الأفضل حالياً.`,
            en: `Based on your search for "${query}", I analyzed the options. These products are currently the best.`,
            fr: `Basé sur votre recherche pour "${query}", j'ai analysé les options. Ces produits sont les meilleurs.`,
            tr: `"${query}" aramanıza dayanarak seçenekleri analiz ettim. Bu ürünler şu an en iyileri.`,
            es: `Basado en tu búsqueda de "${query}", analicé las opciones. Estos productos son los mejores.`
        };

        analysisMsg = messages[currentLang] || messages['en'];

        // إرسال الاستجابة مرة واحدة فقط في نهاية العملية
        res.json({
            analysis: { why: analysisMsg },
            products: topProducts
        });

    } catch (error) {
        console.error("Error fetching data:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "حدث خطأ أثناء معالجة البيانات" });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
