const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Findly API is running");
});

app.get("/search", async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.json({ top: [] });
  }

  try {
    const response = await axios.get(
      "https://real-time-amazon-data.p.rapidapi.com/search",
      {
        params: {
          query: q,
          page: "1",
          country: "US",
          category_id: "aps"
        },
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
        }
      }
    );

    const products = response.data?.data?.products || [];

    const results = products.slice(0, 6).map(p => ({
  name: p.product_title,
  price: p.product_price || "—",
  rating: p.product_star_rating || 0,
  image: p.product_photo || "",
  link: p.product_url   // ⭐ هذا أهم سطر
}));

    res.json({ top: results });

  } catch (error) {
    console.error("Amazon API error:", error.message);
    res.json({ top: [] });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
