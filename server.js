const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send("Findly Gemini is Ready! 🚀"));

app.post('/get-ai-advice', async (req, res) => {
    const { query } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{
                parts: [{
                    text: `Return ONLY a JSON object for this query: "${query}". 
                    Structure:
                    {
                      "analysis": { "intent": "string", "priorities": "string", "budget_status": "string", "use_case": "string", "why": "string" },
                      "products": [ { "name": "string", "recommendation_reason": "string", "features": "string" } ]
                    }`
                }]
            }],
            generationConfig: { temperature: 0.7 }
        });

        // --- تصحيح الرد لضمان عدم وجود أخطاء في الـ JSON ---
        let rawText = response.data.candidates[0].content.parts[0].text;
        
        // إزالة أي علامات ماركداون قد يضيفها الذكاء الاصطناعي
        const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const aiData = JSON.parse(cleanJson);
        res.json(aiData);

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ 
            error: "فشل في معالجة البيانات", 
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
