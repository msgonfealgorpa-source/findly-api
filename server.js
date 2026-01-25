app.post('/get-ai-advice', async (req, res) => {
    const { query, products, lang } = req.body; // استلام اللغة المختار من المتصفح
    const apiKey = process.env.OPENAI_API_KEY; 

    try {
        const response = await axios.post("https://api.openai.com/v1/chat/completions", {
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: `You are a global shopping expert. 
                    Analyze the products and provide professional advice.
                    CRITICAL: You must respond in the following language: ${lang === 'ar' ? 'Arabic' : 'English'}.
                    Include: Price analysis, a Pro/Con for the top pick, and a 'Buy or Wait' recommendation.` 
                },
                { 
                    role: "user", 
                    content: `User is searching for: "${query}". Here are the products: ${JSON.stringify(products)}` 
                }
            ],
            temperature: 0.7 
        }, {
            headers: { 
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });

        res.json({ advice: response.data.choices[0].message.content });
    } catch (error) {
        res.json({ advice: lang === 'ar' ? "فشل في تحليل البيانات." : "Failed to analyze data." });
    }
});
