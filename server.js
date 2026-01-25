import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Findly API: Amazon Actor & AliTask Live! 🚀"));

app.get("/search", async (req, res) => {
    const searchQuery = req.query.q;
    const API_TOKEN = process.env.APIFY_API_TOKEN;
    
    // المفتاح الذي طلبته (Amazon Actor)
    const AMAZON_ACTOR_ID = "kjXDz27ttCGmMCu9S";
    // مفتاح علي إكسبريس (Task)
    const ALI_TASK_ID = "hDVdezzZja9dcf9dY";

    if (!searchQuery) return res.status(400).json({ error: "اكتب كلمة بحث" });

    try {
        console.log(`🔎 جاري البحث باستخدام المفتاح المحدد: ${searchQuery}`);

        // 1. طلب تشغيل أمازون (كـ Actor)
        const runAmazon = fetch(`https://api.apify.com/v2/acts/${AMAZON_ACTOR_ID}/runs?token=${API_TOKEN}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "query": searchQuery, "maxItems": 5 })
        }).then(res => res.json());

        // 2. طلب تشغيل علي إكسبريس (كـ Task)
        const runAli = fetch(`https://api.apify.com/v2/actor-tasks/${ALI_TASK_ID}/runs?token=${API_TOKEN}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "query": [searchQuery] })
        }).then(res => res.json());

        // تشغيل الاثنين معاً
        const [amzData, aliData] = await Promise.all([runAmazon, runAli]);

        // انتظار 10 ثوانٍ لتجميع البيانات (بسبب تقليل الذاكرة)
        await new Promise(resolve => setTimeout(resolve, 10000));

        // جلب النتائج من الداتاسيت
        const fetchItems = (runId) => 
            fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${API_TOKEN}`).then(res => res.json());

        const [amzItems, aliItems] = await Promise.all([
            fetchItems(amzData.data.id),
            fetchItems(aliData.data.id)
        ]);

        // تنسيق النتائج النهائية
        const finalResults = [
            ...(Array.isArray(amzItems) ? amzItems.map(i => ({
                name: i.title || "Amazon Product",
                price: i.price?.value || i.price || "Check Link",
                image: i.thumbnail || i.imageUrl || "https://via.placeholder.com/150",
                link: i.url || "#",
                source: "Amazon"
            })) : []),
            ...(Array.isArray(aliItems) ? aliItems.map(i => ({
                name: i.title || "AliExpress Product",
                price: i.price || "Check Link",
                image: i.imageUrl || i.image || "https://via.placeholder.com/150",
                link: i.url || "#",
                source: "AliExpress"
            })) : [])
        ];

        res.json({ success: true, top: finalResults });

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
