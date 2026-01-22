import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint للبحث
app.get("/api/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    // ⚠️ مهم: /items
    const url = `${process.env.APIFY_DATASET_URL}/items?token=${process.env.APIFY_API_TOKEN}&clean=true`;

    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(500).json({ error: "Invalid dataset response" });
    }

    const results = data
      .filter(item =>
        item.title?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 20)
      .map(item => ({
        title: item.title,
        price: item.price?.value || item.price || "—",
        currency: item.price?.currency || "USD",
        image: item.imageUrl || item.thumbnail || "",
        link: item.productUrl || item.url || "#",
        rating: item.rating || null,
        orders: item.orders || 0,
        source: "AliExpress"
      }));

    res.json({
      success: true,
      count: results.length,
      products: results
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Findly API running on http://localhost:${PORT}`);
});
