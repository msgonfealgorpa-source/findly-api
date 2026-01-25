const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send("Findly Gemini is Online! 🚀"));

app.post('/get-ai-advice', async (req, res) => {
    const { query } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{
                parts: [{
                    text: `Return ONLY a valid JSON object. No intro text. 
                    Query: "${query}"
                    JSON Structure:
                    {
                      "analysis": { "intent": "string", "priorities": "string", "budget_status": "string", "use_case": "string", "why": "string" },
                      "products": [ { "name": "string", "recommendation_reason": "string", "features": "string" } ]
                    }`
                }]
            }]
        });

        let rawText = response.data.candidates[0].content.parts[0].text;

        // --- الفلتر السحري لاستخراج الـ JSON حصراً ---
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("لم يتم العثور على بيانات JSON صحيحة");
        
        const cleanJson = JSON.parse(jsonMatch[0]);
        res.json(cleanJson);

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "فشل في معالجة البيانات", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running!`));
