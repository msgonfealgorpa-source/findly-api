import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Findly API is Running 🚀"));

async function runApifyTask(taskId, query, token) {
    const runRes = await fetch(
        `https://api.apify.com/v2/actor-tasks/${taskId}/runs?token=${token}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                q: query,
                maxResults: 10
            })
        }
    );

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
