const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Route اختبار
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Findly API is running"
  });
});

// Route البحث
app.get("/ask", (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({
      error: "يرجى إرسال q في الرابط"
    });
  }

  res.json({
    intent: "shopping_or_service_search",
    query: query,
    results: [
      "اقتراح 1 (تجريبي)",
      "اقتراح 2 (تجريبي)"
    ]
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
