const express = require('express');
const { analyzeSmartQuery } = require('./utils/smartBrain');
const { smartRank } = require('./utils/smartRank');
const { generateSmartExplanation } = require('./utils/aiReasoning');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

function smartTextMatch(text, keywords) {
  if (!text || !Array.isArray(keywords)) return false;
  const t = text.toLowerCase();
  return keywords.every(word => t.includes(word));
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Findly AI Server is Running Successfully! 🚀');
});

app.post('/get-ai-advice', async (req, res) => {
  try {
    const { query, lang } = req.body;
    const brain = analyzeSmartQuery(query);

    console.log("🧠 Smart Brain:", brain);

    const SERPAPI_KEY = process.env.SERPAPI_KEY;
    const currentLang = lang || "ar";

    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: "google_shopping",
        q: brain.searchQuery || query,
        api_key: SERPAPI_KEY,
        hl: currentLang,
