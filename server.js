const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// استيراد الأدوات المحدثة (تأكد أن هذه الملفات موجودة في مجلد utils)
const { analyzeSmartQuery } = require('./utils/smartBrain');
const { smartRank } = require('./utils/smartRank');
const { generateSmartExplanation } = require('./utils/aiReasoning');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// رسالة ترحيبية للتأكد من عمل السيرفر
app.get('/', (req, res) => {
  res.send('Findly AI Engine v3.5 - Global Mode Active! 🚀');
});
app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query, lang } = req.body;
        const currentLang = lang || "ar";

        // 1. تحليل الاستعلام ذكياً
        const brain = analyzeSmartQuery(query);
        const SERPAPI_KEY = process.env.SERPAPI_KEY;

        // 2. جلب البيانات
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: "google_shopping",
                q: brain.searchQuery,
                api_key: SERPAPI_KEY,
                hl: currentLang,
                gl: currentLang === "ar" ? "sa" : "us"
            }
        });

        const shoppingResults = response.data.shopping_results || [];

        // 3. تحويل النتائج
        const rawProducts = shoppingResults.map(item => ({
            name: item.title,
            thumbnail: item.thumbnail,
            link: item.product_link || item.link,
            price: item.price || (currentLang === "ar" ? "اتصل للسعر" : "Check Price"),
            rating: item.rating || 4.2,
            source: item.source
        }));

        // 4. الترتيب الذكي
        let rankedData = smartRank(rawProducts, brain);

        // ==========================================
        // 🟢 الكود الجديد المطور (الذكاء الحسابي والوصفي المدمج)
        // ==========================================
        const prices = rankedData.slice(0, 3).map(p => {
            const priceMatch = p.price.replace(/[^\d.]/g, ''); 
            return priceMatch ? parseFloat(priceMatch) : null;
        });

        const validPrices = prices.filter(p => p !== null && p > 0);
        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

        const finalProducts = rankedData.slice(0, 3).map((p, index) => {
            let reasonText = "";
            const currentPrice = prices[index];
            let savingsNote = "";

            if (currentPrice && minPrice && currentPrice > minPrice) {
                const diffPercent = (((currentPrice - minPrice) / currentPrice) * 100).toFixed(0);
                savingsNote = currentLang === "ar" 
                    ? ` (علماً أن الخيار الأرخص يوفر لك حوالي ${diffPercent}%)` 
                    : ` (Note: The budget option saves you about ${diffPercent}%)`;
            }

            if (currentLang === "ar") {
                if (currentPrice === minPrice && p.rating >= 4.3) {
                    reasonText = `هذه هي "الصفقة الذهبية"! يجمع هذا المنتج بين أفضل سعر متاح وتقييم ممتاز (${p.rating} نجوم). هو الخيار الأكثر توازناً لطلبك.`;
                } else if (currentPrice === minPrice) {
                    reasonText = `نرشحه كأفضل خيار اقتصادي. يوفر لك ميزانية جيدة جداً مع أداء موثوق مقارنة بالمنافسين في ${p.source}.`;
                } else if (p.rating >= 4.6) {
                    reasonText = `خيار الـ "Premium"؛ يتفوق بجودة التصنيع العالية ونسبة رضا استثنائية. استثمار طويل الأمد رغم فارق السعر.${savingsNote}`;
                } else {
                    reasonText = `يتميز هذا المنتج بموثوقية عالية من ${p.source} ومواصفات تلبي طلبك بدقة.${savingsNote}`;
                }
            } else {
                reasonText = currentPrice === minPrice 
                    ? `Top value pick! Best price found for your search.` 
                    : `High-end choice with superior build quality from ${p.source}.${savingsNote}`;
            }

            return { ...p, reason: reasonText, isCheapest: currentPrice === minPrice && validPrices.length > 1 };
        });

        const explanation = currentLang === "ar" 
            ? `حللت لك ${rankedData.length} منتجاً واخترت أفضل 3 صفقات تناسب احتياجك.`
            : `I analyzed ${rankedData.length} products and picked the top 3 deals for you.`;

        res.json({ explanation, products: finalProducts });

    } catch (error) {
        console.error("🚨 Server Error:", error.message);
        res.status(500).json({ explanation: "Error processing request", products: [] });
    }
});

app.listen(PORT, () => {
  console.log(`Findly Server v3.5 running on port ${PORT}`);
});
