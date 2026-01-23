import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Findly API is Running with Amazon & AliExpress 🚀"));

app.get("/search", async (req, res) => {
    const searchQuery = req.query.q;
    const API_TOKEN = process.env.APIFY_API_TOKEN;
    const ALI_ACTOR_ID = process.env.APIFY_ACTOR_ID; // علي إكسبريس
    const AMZ_ACTOR_ID = process.env.APIFY_AMAZON_ACTOR_ID; // أمازون

    if (!searchQuery) return res.status(400).json({ error: "اكتب كلمة بحث" });

    try {
        // دالة لتشغيل أي Actor وجلب بياناته
        async function getResultsFromActor(actorId, sourceName) {
            try {
                const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${API_TOKEN}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        "query": searchQuery, 
                        "maxItems": 5 // نجلب 5 من كل موقع لسرعة الاستجابة
                    })
                });

                const runData = await runRes.json();
                if (!runRes.ok) return [];

                const runId = runData.data.id;
                
                // انتظار المعالجة (تقليل الوقت قليلاً لتحسين التجربة)
                await new Promise(resolve => setTimeout(resolve, 12000)); 

                const dataRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${API_TOKEN}`);
                const items = await dataRes.json();

                return Array.isArray(items) ? items.map(item => ({
                    name: item.title || item.name || `منتج من ${sourceName}`,
                    price: item.price || item.currentPrice || "غير محدد",
                    image: item.imageUrl || item.image || item.thumbnail || "https://via.placeholder.com/150",
                    link: item.url || item.productUrl || "#",
                    rating: item.rating || "4.5",
                    source: sourceName // لنعرف مصدر المنتج
                })) : [];
            } catch (err) {
                console.error(`Error fetching from ${sourceName}:`, err);
                return [];
            }
        }

        // تشغيل البحث في الموقعين معاً في نفس الوقت
        const [aliResults, amzResults] = await Promise.all([
            getResultsFromActor(ALI_ACTOR_ID, "AliExpress"),
            getResultsFromActor(AMZ_ACTOR_ID, "Amazon")
        ]);

        // دمج النتائج
        // --- استبدل الكود القديم بهذا الجزء لدمج الموقعين ---
const [aliResults, amzResults] = await Promise.all([
    getResultsFromActor(process.env.APIFY_ACTOR_ID, "AliExpress"),
    getResultsFromActor(process.env.APIFY_AMAZON_ACTOR_ID, "Amazon")
]);

const finalResults = [...aliResults, ...amzResults];

res.json({ success: true, top: finalResults });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
