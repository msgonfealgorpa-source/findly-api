const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            contents: [{ parts: [{ text: `Respond ONLY with JSON. Query: ${query}. Structure: {"analysis":{...}, "products":[...]}` }] }]
        });

        const rawText = response.data.candidates[0].content.parts[0].text;
        
        // --- عملية الجراحة العاجلة ---
        const firstBracket = rawText.indexOf('{');
        const lastBracket = rawText.lastIndexOf('}') + 1;
        
        if (firstBracket === -1 || lastBracket === 0) {
            return res.status(500).json({ error: "الذكاء الاصطناعي لم يرسل صيغة JSON" });
        }

        const cleanJson = JSON.parse(rawText.substring(firstBracket, lastBracket));
        res.status(200).json(cleanJson);

    } catch (error) {
        res.status(500).json({ error: "خطأ في السيرفر", details: error.message });
    }
});

app.listen(process.env.PORT || 3000);
