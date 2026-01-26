const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// رسالة بسيطة للتأكد أن السيرفر يعمل عند فتح الرابط المباشر
app.get('/', (req, res) => res.send("DeepSeek API is Live! 🚀"));

app.post('/get-ai-advice', async (req, res) => {
    try {
        const { query } = req.body;
        
        // ملاحظة: يفضل وضع المفتاح في Environment Variables في Render باسم DEEPSEEK_KEY
        // ولكن سأضعه لك هنا مباشرة ليعمل فوراً
        const apiKey = "sk-687d0950a7404517bfdc06cc916951a3";

        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: [
                { 
                    role: "system", 
                    content: "You are a shopping assistant. Respond ONLY with a valid JSON object. Structure: {\"analysis\": {\"intent\": \"..\", \"priorities\": \"..\", \"budget_status\": \"..\", \"use_case\": \"..\", \"why\": \"..\"}, \"products\": [{\"name\": \"..\", \"recommendation_reason\": \"..\", \"features\": \"..\"}]}" 
                },
                { role: "user", content: query }
            ],
            response_format: {
                type: 'json_object'
            },
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // إرسال النتيجة للمتصفح
        const aiContent = JSON.parse(response.data.choices[0].message.content);
        res.json(aiContent);

    } catch (error) {
        console.error("DeepSeek Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            error: "فشل في الاتصال بمحرك DeepSeek",
            details: error.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
