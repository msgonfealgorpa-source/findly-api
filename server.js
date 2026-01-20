const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

/* بيانات منتجات تجريبية */
const PRODUCTS = [
  {
    name: "Samsung Galaxy S23",
    brand: "samsung",
    price: "$799",
    rating: 4.7,
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Samsung Galaxy A54",
    brand: "samsung",
    price: "$399",
    rating: 4.5,
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Xiaomi 13 Pro",
    brand: "xiaomi",
    price: "$699",
    rating: 4.6,
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Honor Magic 5",
    brand: "honor",
    price: "$649",
    rating: 4.4,
    image: "https://via.placeholder.com/150"
  },
  {
    name: "Wireless Headphones",
    brand: "سماعات",
    price: "$129",
    rating: 4.3,
    image: "https://via.placeholder.com/150"
  }
];

const axios = require("axios");

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

    const products = response.data.data.products || [];

    const results = products.slice(0, 6).map(p => ({
      name: p.product_title,
      price: p.product_price || "—",
      rating: p.product_star_rating || 0,
      image: p.product_photo
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
