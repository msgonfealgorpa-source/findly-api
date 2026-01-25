const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/get-ai-advice', async (req, res) => {
    const { query } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: `Return ONLY JSON: {"analysis": {"intent": "...", "priorities": "...", "budget_status": "...", "use_case": "...", "why": "..."}, "products": [{"name": "...", "recommendation_reason": "...", "features": "..."}]}. Query: ${query}` }] }]
        });

        let text = response.data.candidates[0].content.parts[0].text;
        const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        res.json(JSON.parse(cleanJson));
    } catch (e) {
        res.status(500).json({ error: "خطأ في الاتصال بجوجل" });
    }
});

app.listen(process.env.PORT || 3000);
