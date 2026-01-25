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

// معرفات المهام (التي ظهرت في صورك)
const AMAZON_TASK_ID = 'PDwMikqRqTrY4tAcW'; 
const ALI_ID = 'hDVdezzZja9dcf9dY'; 

app.get("/", (req, res) => res.send("Findly Multi-Search is Ready! 🚀"));

app.all(['/search', '/api/search'], async (req, res) => {
    const query = req.query.q || req.body.query;
    if (!query) return res.status(400).json({ error: "اكتب كلمة بحث" });

    try {
        console.log(`🔎 جاري البحث المزدوج عن: ${query}...`);

        // 1. تشغيل أمازون (كـ Task)
        const amazonRun = client.task(AMAZON_TASK_ID).call({
            "queries": [query],
            "maxResultsPerQuery": 5
        });

        // 2. تشغيل علي إكسبريس (محاولة ذكية: Task ثم Actor)
        const runAliEx = async () => {
            try {
                return await client.task(ALI_ID).call({ "query": [query], "maxItems": 5 });
            } catch (e) {
                return await client.actor(ALI_ID).call({ "query": [query], "maxItems": 5 });
            }
        };

        // تشغيل الاثنين معاً لتوفير الوقت
        const [amzResult, aliResult] = await Promise.all([amazonRun, runAliEx()]);

        // جلب البيانات
        const [amzItems, aliItems] = await Promise.all([
            client.dataset(amzResult.defaultDatasetId).listItems(),
            client.dataset(aliResult.defaultDatasetId).listItems()
        ]);

        // تنسيق النتائج
        const finalResults = [
            ...amzItems.items.map(i => ({
                name: i.title || "Amazon Product",
                price: i.price?.value || i.price || "N/A",
                img: i.thumbnail || i.imageUrl || "https://via.placeholder.com/150",
                link: i.url || "#",
                source: "Amazon"
            })),
            ...aliItems.items.map(i => ({
                name: i.title || "AliExpress Product",
                price: i.price || "N/A",
                img: i.imageUrl || i.image || "https://via.placeholder.com/150",
                link: i.url || "#",
                source: "AliExpress"
            }))
        ];

        res.json({ success: true, results: finalResults, top: finalResults });

    } catch (error) {
        console.error('Search Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
