import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Findly API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
