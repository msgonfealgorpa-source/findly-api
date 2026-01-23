import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// حل مشكلة الاتصال (CORS) بشكل نهائي
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Findly API is Running 🚀"));

app.get("/search", async (req, res) => {
    const searchQuery = req.query.q;
    const API_TOKEN = process.env.APIFY_API_TOKEN;
    const ACTOR_ID = process.env.APIFY_ACTOR_ID;

    if (!searchQuery) return res.status(400).json({ error: "اكتب كلمة بحث" });

    try {
        const runRes = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${API_TOKEN}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                "query": searchQuery, 
                "maxItems": "10", 
                "page": "1" 
            })
        });

        const runData = await runRes.json();
        if (!runRes.ok) throw new Error(runData.error?.message || "فشل تشغيل البوت");

        const runId = runData.data.id;
        
        // الانتظار 15 ثانية لجلب البيانات
        await new Promise(resolve => setTimeout(resolve, 15000)); 

        const dataRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${API_TOKEN}`);
        const resultsData = await dataRes.json();

        const finalResults = Array.isArray(resultsData) ? resultsData.map(item => ({
            name: item.title || "منتج علي إكسبريس",
            price: item.price || "غير محدد",
            currency: "USD",
            image: item.imageUrl || item.image || "https://via.placeholder.com/150",
            link: item.url || item.productUrl || "#",
            rating: item.rating || "4.8"
        })) : [];

        res.json({ success: true, top: finalResults });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
