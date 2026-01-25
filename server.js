const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send("Findly Gemini Server is Live! 🚀"));

app.post('/get-ai-advice', async (req, res) => {
    const { query } = req.body;
    // سنستخدم اسم المتغير هذا في ريندر
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
        return res.status(500).json({ error: "API Key is missing in Render settings" });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{
                parts: [{
                    text: `أنت خبير تسوق محترف. حلل طلب المستخدم وقدم رداً بصيغة JSON حصراً بالهيكل التالي:
                    {
                      "analysis": { "intent": "...", "priorities": "...", "budget_status": "...", "use_case": "...", "why": "..." },
                      "products": [
                        { "name": "...", "recommendation_reason": "...", "features": "..." },
                        { "name": "...", "recommendation_reason": "...", "features": "..." },
                        { "name": "...", "recommendation_reason": "...", "features": "..." }
                      ]
                    }
                    المستخدم يبحث عن: ${query}`
                }]
            }],
            generationConfig: { 
                response_mime_type: "application/json",
                temperature: 0.7
            }
        });

        // استخراج البيانات من رد جوجل
        const aiResponse = JSON.parse(response.data.candidates[0].content.parts[0].text);
        res.json(aiResponse);

    } catch (error) {
        console.error("Gemini Error:", error.message);
        res.status(500).json({ error: "فشل المحرك في تحليل البيانات، يرجى المحاولة ثانية" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gemini Server running on port ${PORT}`));
