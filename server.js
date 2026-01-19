const express = require("express");
const app = express();
const PORT = process.env.PORT || 10000;

// مسار رئيسي للتأكد أن السيرفر يعمل
app.get("/", (req, res) => {
  res.send("✅ Findly API is running");
});

// 🔍 مسار البحث
app.get("/search", (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.json({ top: [] });
  }

  res.json({
    top: [
      {
        name: "Samsung Galaxy S23 Ultra",
        price: "$899",
        rating: "4.7",
        image: "https://via.placeholder.com/150",
        link: "#"
      },
      {
        name: "Samsung Galaxy S23",
        price: "$799",
        rating: "4.6",
        image: "https://via.placeholder.com/150",
        link: "#"
      },
      {
        name: "Samsung Galaxy S22",
        price: "$699",
        rating: "4.5",
        image: "https://via.placeholder.com/150",
        link: "#"
      },
      {
        name: "Samsung Galaxy A54",
        price: "$399",
        rating: "4.4",
        image: "https://via.placeholder.com/150",
        link: "#"
      }
    ]
  });
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
