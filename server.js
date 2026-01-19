const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.get("/search", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
