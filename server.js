const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => res.send("Findly API is LIVE! 🚀"));

app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{
                parts: [{
                    text: `You are a shopping assistant. Return ONLY a valid JSON object for the query: "${query}". 
                    Keep the response very short.
                    Format:
                    {
                      "analysis": { "intent": "Buying", "priorities": "Quality", "budget_status": "Fits", "use_case": "Daily", "why": "Good choice" },
                      "products": [ { "name": "Product Name", "recommendation_reason": "Price", "features": "Great" } ]
                    }`
                }]
            }],
            generationConfig: { response_mime_type: "application/json" }
        });

        // استلام الرد الصافي
        const rawText = response.data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(rawText));

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "السيرفر واجه مشكلة بسيطة، حاول مرة أخرى" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running!`));
