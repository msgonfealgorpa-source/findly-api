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
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "اكتب كلمة بحث" });

    const API = process.env.APIFY_API_TOKEN;
    const AMAZON = process.env.APIFY_AMAZON_ACTOR_ID;
    const ALI = process.env.APIFY_ALIEXPRESS_ACTOR_ID;

    async function run(actorId, input) {
        const r = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${API}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input)
        });
        const d = await r.json();
        return d.data.id;
    }

    async function getData(runId) {
        await new Promise(r => setTimeout(r, 15000));
        const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${API}`);
        return await res.json();
    }

    try {
        const [amazonRun, aliRun] = await Promise.all([
            run(AMAZON, { search: q, maxItems: 10 }),
            run(ALI, { query: q, maxItems: 10 })
        ]);

        const [amazonData, aliData] = await Promise.all([
            getData(amazonRun),
            getData(aliRun)
        ]);

        const normalize = (item, source) => ({
            source,
            name: item.title || item.name || "Product",
            price: parseFloat(item.price) || 0,
            image: item.image || item.imageUrl || "",
            link: item.url || item.productUrl || "#",
            rating: item.rating || 4.5
        });

        const all = [
            ...amazonData.map(p => normalize(p, "amazon")),
            ...aliData.map(p => normalize(p, "aliexpress"))
        ];

        all.sort((a, b) =>
            (b.rating * 2 - b.price / 100) -
            (a.rating * 2 - a.price / 100)
        );

        res.json({
            success: true,
            count: all.length,
            top: all.slice(0, 5),
            all
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

    const runData = await runRes.json();
    if (!runRes.ok) throw new Error(runData.error?.message || "Task run failed");

    const runId = runData.data.id;

    await new Promise(resolve => setTimeout(resolve, 15000));

    const dataRes = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${token}`
    );

    return await dataRes.json();
}

app.get("/search", async (req, res) => {
    const q = req.query.q;

    if (!q) return res.status(400).json({ error: "اكتب كلمة بحث" });

    const token = process.env.APIFY_API_TOKEN;
    const amazonTask = process.env.APIFY_AMAZON_TASK;
    const aliTask = process.env.APIFY_ALIEXPRESS_TASK;

    try {
        const [amazonResults, aliResults] = await Promise.all([
            runApifyTask(amazonTask, q, token),
            runApifyTask(aliTask, q, token)
        ]);

        const normalize = (items, source) =>
            (Array.isArray(items) ? items : []).map(item => ({
                source,
                name: item.title || item.name || "Product",
                price: item.price?.value || item.price || "غير محدد",
                currency: item.price?.currency || "USD",
                image: item.imageUrl || item.image || "",
                link: item.url || item.productUrl || "#",
                rating: item.rating || item.stars || "4.5"
            }));

        const results = [
            ...normalize(amazonResults, "amazon"),
            ...normalize(aliResults, "aliexpress")
        ];

        res.json({ success: true, count: results.length, results });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Findly API running on ${PORT}`));
