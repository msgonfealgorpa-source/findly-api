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

app.get("/", (req, res) => res.send("Findly API is Active! 🚀"));

// دعم المسار القديم والجديد لضمان عمل البحث
app.all(['/search', '/api/search'], async (req, res) => {
    const query = req.query.q || req.body.query;
    if (!query) return res.status(400).json({ error: "اكتب كلمة بحث" });

    try {
        console.log(`🔎 جاري البحث عن: ${query}...`);

        // استخدام المعرف المباشر كخطة بديلة لضمان التشغيل
        const actorId = process.env.APIFY_AMAZON_ACTOR_ID || 'kjXDz27ttCGmMCu9S';

        const run = await client.actor(actorId).call({
            "query": query,
            "maxItems": 10
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        const results = items.map((item, index) => ({
            id: index,
            name: item.title || item.name || "منتج رائع",
            price: item.price?.value || item.price || "Check Price",
            currency: item.currency || "$",
            img: item.thumbnail || item.imageUrl || item.image || "https://via.placeholder.com/300",
            link: item.url || item.productUrl || "#",
            score: item.stars ? Math.round(item.stars * 20) : 92
        }));

        res.json({ 
            success: true, 
            results: results,
            top: results, // للتوافق مع الكود القديم
            advisorMessage: `إليك أفضل الترشيحات لـ "${query}":`
        });

    } catch (error) {
        console.error('❌ Error Details:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
