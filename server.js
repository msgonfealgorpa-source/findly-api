app.post('/get-ai-advice', async (req, res) => {
    // السطر الذي حددته أنت لاستلام البيانات
    const { query, products, lang } = req.body; 
    const apiKey = process.env.OPENAI_API_KEY;

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    // هنا نضع الكود الذي يدعم جميع اللغات عالمياً
                    content: `You are a universal shopping assistant. Your response MUST be in this language: ${lang}. 
                    Provide a detailed price analysis and a final recommendation.` 
                },
                { 
                    role: "user", 
                    content: `Analyze these products for: "${query}". Products: ${JSON.stringify(products)}` 
                }
            ],
            temperature: 0.7
        }, {
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" }
        });

        res.json({ advice: response.data.choices[0].message.content });
    } catch (error) {
        res.json({ advice: "Error analyzing data." });
    }
});
