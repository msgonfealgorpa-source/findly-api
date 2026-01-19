const express = require("express");
const app = express();

const PORT = process.env.PORT || 10000;

/* الصفحة الرئيسية */
app.get("/", (req, res) => {
  res.send("✅ Findly API is running");
});

/* البحث */
app.get("/search", (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.json({ top: [] });
  }

  // بيانات تجريبية ذكية (نفس الفكرة لكل بحث)
  const products = [
    {
      name: `${query} - Premium Model`,
      price: "$799",
      rating: "4.7",
      image: "https://via.placeholder.com/150",
      link: "#"
    },
    {
      name: `${query} - Pro Edition`,
      price: "$899",
      rating: "4.8",
      image: "https://via.placeholder.com/150",
      link: "#"
    },
    {
      name: `${query} - Standard`,
      price: "$599",
      rating: "4.5",
      image: "https://via.placeholder.com/150",
      link: "#"
    },
    {
      name: `${query} - Lite`,
      price: "$399",
      rating: "4.3",
      image: "https://via.placeholder.com/150",
      link: "#"
    }
  ];

  res.json({ top: products });
});

/* تشغيل السيرفر */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
