const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// هذا السطر للتأكد أن السيرفر يعمل
app.get('/', (req, res) => res.send("Findly is ALIVE! 🚀"));

app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: `أجب بصيغة JSON فقط: {"analysis": {"intent": "...", "priorities": "...", "budget_status": "...", "use_case": "...", "why": "..."}, "products": [{"name": "...", "recommendation_reason": "...", "features": "..."}]}. السؤال: ${query}` }] }]
        });

        const rawText = response.data.candidates[0].content.parts[0].text;
        // تنظيف وحماية الـ JSON
        const cleanJson = JSON.parse(rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1));
        
        res.status(200).json(cleanJson);
    } catch (error) {
        res.status(500).json({ error: "فشل السيرفر في الرد", details: error.message });
    }
});

app.listen(process.env.PORT || 3000);
