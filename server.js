const express = require("express");
const cors = require("cors");   
const app = express();

const PORT = process.env.PORT || 3000;

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

app.get("/", (req, res) => {
  res.send("Findly API is running");
});

app.get("/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase();

  const results = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q)
  ).slice(0, 4);

  res.json({ top: results });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
