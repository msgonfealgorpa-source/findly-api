import express from "express";
import cors from "cors";
import { ApifyClient } from 'apify-client';
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

app.get("/", (req, res) => res.send("Findly Multi-Source API is Live! 🚀"));

app.all(['/search', '/api/search'], async (req, res) => {
    const query = req.query.q || req.body.query;
    if (!query) return res.status(400).json({ error: "الرجاء كتابة كلمة بحث" });

    try {
        console.log(`🔎 جاري البحث المزدوج عن: ${query}...`);

        // معرفات المهام الخاصة بك
        const AMAZON_TASK_ID = 'PDwMikqRqTrY4tAcW'; 
        const ALIEXPRESS_TASK_ID = 'hDVdezzZja9dcf9dY'; // المعرف الذي ظهر في صورك سابقاً

        // تشغيل المهمتين في وقت واحد للسرعة
        const [amazonRun, aliRun] = await Promise.all([
            client.task(AMAZON_TASK_ID).call({ "queries": [query], "maxResultsPerQuery": 5 }),
            client.task(ALIEXPRESS_TASK_ID).call({ "query": [query], "maxItems": 5 })
        ]);

        // جلب البيانات من كلاهما
        const [amazonItems, aliItems] = await Promise.all([
            client.dataset(amazonRun.defaultDatasetId).listItems(),
            client.dataset(aliRun.defaultDatasetId).listItems()
        ]);

        // تنسيق نتائج أمازون
        const formattedAmazon = amazonItems.items.map((item, index) => ({
            id: `amz-${index}`,
            name: item.title || "منتج أمازون",
            price: item.price?.value || item.price || "Check Price",
            currency: item.currency || "$",
            img: item.thumbnail || item.imageUrl || "https://via.placeholder.com/300",
            link: item.url || "#",
            source: "Amazon",
            score: 95
        }));

        // تنسيق نتائج علي إكسبريس
        const formattedAli = aliItems.items.map((item, index) => ({
            id: `ali-${index}`,
            name: item.title || "منتج علي إكسبريس",
            price: item.price || "Check Price",
            currency: "USD",
            img: item.imageUrl || item.image || "https://via.placeholder.com/300",
            link: item.url || "#",
            source: "AliExpress",
            score: 88
        }));

        // دمج النتائج معاً (واحدة من هنا وواحدة من هناك)
        const combinedResults = [...formattedAmazon, ...formattedAli].sort(() => Math.random() - 0.5);

        res.json({ 
            success: true, 
            results: combinedResults, 
            top: combinedResults,
            advisorMessage: `لقد جمعت لك أفضل العروض من أمازون وعلي إكسبريس لـ "${query}":` 
        });

    } catch (error) {
        console.error('❌ خطأ في البحث المزدوج:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
