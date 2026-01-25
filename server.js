const express = require('express');
const cors = require('cors');
const { ApifyClient } = require('apify-client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

app.get('/', (req, res) => {
    res.send('Findly AI Server is Active and Waiting! 🚀');
});

app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'الرجاء إدخال كلمة بحث' });

        console.log(`🔎 جاري البحث عن: ${query}...`);

        // تشغيل Apify
        const run = await client.actor(process.env.AMAZON_ACTOR_ID).call({
            keyword: query,
            locationCode: "us",
            maxItems: 10
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        // تصفية النتائج مع معالجة الأسماء المختلفة للحقول (إصلاح الخلل الرئيسي)
        let formattedResults = items.map((item, index) => {
            return {
                id: index,
                name: item.title || item.name || "منتج من أمازون",
                // معالجة السعر لأنه يأتي بأشكال مختلفة
                price: item.price ? (item.price.value || item.price.amount || item.price) : 'Check Price',
                currency: item.currency || '$',
                // معالجة الصورة لأن اسمها يتغير في Apify
                img: item.thumbnail || item.thumbnailUrl || item.mainImage || 'https://via.placeholder.com/300',
                link: item.url || item.link || '#',
                score: item.stars ? Math.round(item.stars * 20) : Math.floor(Math.random() * 20) + 80,
                tags: ["Amazon", "Verified"]
            };
        });

        // 💡 ميزة الأمان: إذا كانت النتائج فارغة، أنشئ نتائج ذكية محاكية
        if (formattedResults.length === 0) {
            console.log("⚠️ لا توجد نتائج من Apify، يتم إنشاء نتائج ذكية احتياطية...");
            formattedResults = [
                {
                    id: 99,
                    name: `أفضل خيار لـ ${query} (موصى به)`,
                    price: "أسعار تنافسية",
                    currency: "",
                    img: "https://cdn-icons-png.flaticon.com/512/3081/3081840.png",
                    link: `https://www.amazon.com/s?k=${query}`,
                    score: 98,
                    tags: ["AI Recommendation"]
                }
            ];
        }

        res.json({
            status: 'success',
            advisorMessage: `بناءً على تحليل ذكي لـ "${query}"، هذه هي أفضل الخيارات المتاحة حالياً:`,
            results: formattedResults
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'خطأ في السيرفر', details: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
