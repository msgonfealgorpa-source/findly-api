import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/search", async (req, res) => {
    const searchQuery = req.query.q;
    const API_TOKEN = process.env.APIFY_API_TOKEN;
    const ALI_ACTOR_ID = process.env.APIFY_ACTOR_ID;
    const AMZ_ACTOR_ID = process.env.APIFY_AMAZON_ACTOR_ID;

    if (!searchQuery) return res.status(400).json({ error: "اكتب كلمة بحث" });

    try {
        async function getResultsFromActor(actorId, sourceName) {
            try {
                const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${API_TOKEN}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ "query": searchQuery, "maxItems": 5 })
                });

                const runData = await runRes.json();
                if (!runRes.ok) return [];

                const runId = runData.data.id;
                
                // انتظار المعالجة (يمكنك تقليلها لـ 10 ثواني إذا كان الـ Actor سريعاً)
                await new Promise(resolve => setTimeout(resolve, 12000)); 

                const dataRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${API_TOKEN}`);
                const items = await dataRes.json();

                return Array.isArray(items) ? items.map(item => ({
                    name: item.title || item.name || item.productName || `منتج من ${sourceName}`,
                    price: item.price || item.currentPrice || item.priceValue || "عرض السعر",
                    // إصلاح جلب الصورة لضمان عدم ظهور مربع أبيض
                    image: item.imageUrl || item.image || item.thumbnail || item.mainImage || "https://via.placeholder.com/150",
                    link: item.url || item.productUrl || item.link || "#",
                    rating: item.rating || item.stars || "4.5",
                    source: sourceName
                })) : [];
            } catch (err) {
                console.error(`Error from ${sourceName}:`, err);
                return [];
            }
        }

        const [aliResults, amzResults] = await Promise.all([
            getResultsFromActor(ALI_ACTOR_ID, "AliExpress"),
            getResultsFromActor(AMZ_ACTOR_ID, "Amazon")
        ]);

        res.json({ success: true, top: [...aliResults, ...amzResults] });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`Findly Server Running on ${PORT}`));
