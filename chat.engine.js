/* =========================================
SMART CHAT ENGINE v2.0 - NO API REQUIRED
Intelligent Shopping Assistant
========================================= */

// ================= SUPPORTED LANGUAGES =================
const supportedLanguages = {
    ar: { name: "Arabic", native: "العربية", dir: "rtl", flag: "🇸🇦" },
    en: { name: "English", native: "English", dir: "ltr", flag: "🇺🇸" },
    fr: { name: "French", native: "Français", dir: "ltr", flag: "🇫🇷" },
    de: { name: "German", native: "Deutsch", dir: "ltr", flag: "🇩🇪" },
    es: { name: "Spanish", native: "Español", dir: "ltr", flag: "🇪🇸" },
    tr: { name: "Turkish", native: "Türkçe", dir: "ltr", flag: "🇹🇷" }
};

// ================= KNOWLEDGE BASE =================
const KNOWLEDGE_BASE = {
    products: {
        phones: ['iPhone', 'Samsung', 'Xiaomi', 'Huawei', 'OnePlus', 'Oppo', 'Vivo', 'Realme', 'Google Pixel', 'Sony', 'هاتف', 'جوال', 'موبايل', 'phone', 'mobile'],
        laptops: ['MacBook', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Microsoft Surface', 'MSI', 'Razer', 'لابتوب', 'حاسوب', 'laptop', 'computer', 'PC'],
        tablets: ['iPad', 'Galaxy Tab', 'MatePad', 'Surface', 'Lenovo Tab', 'تابلت', 'آيباد', 'tablet'],
        watches: ['Apple Watch', 'Galaxy Watch', 'Garmin', 'Fitbit', 'Huawei Watch', 'Xiaomi Watch', 'ساعة', 'watch', 'ساعة ذكية'],
        gaming: ['PlayStation', 'Xbox', 'Nintendo', 'Gaming PC', 'RTX', 'Ryzen', 'بلايستيشن', 'اكس بوكس', 'ألعاب', 'gaming', 'games'],
        beauty: ['مكياج', 'عناية', 'كريم', 'makeup', 'skincare', 'beauty', 'لوشن', 'عطر'],
        home: ['منزل', 'ذكي', 'home', 'smart home', 'أجهزة', 'مطبخ', 'kitchen']
    },
    
    intents: {
        search: ['ابحث', 'بحث', 'find', 'search', 'lookup', 'أين', 'where', 'أريد', 'want', 'need', 'أحتاج', 'دور', 'look for'],
        compare: ['قارن', 'compare', 'مقارنة', 'أيهم', 'which', 'better', 'أفضل', 'أي أفضل', 'vs', 'أو'],
        price: ['سعر', 'price', 'كم', 'how much', 'تكلفة', 'cost', 'cheap', 'رخيص', 'expensive', 'غالي', 'أسعار'],
        deal: ['عرض', 'deal', 'offer', 'خصم', 'discount', 'sale', 'صفقة', 'تخفيض', 'عروض'],
        advice: ['نصيحة', 'advice', 'توصية', 'recommend', 'أشتري', 'should i buy', 'هل أشتري', 'ماذا تشير'],
        greeting: ['مرحبا', 'اهلا', 'hello', 'hi', 'hey', 'السلام', 'صباح', 'مساء', 'good morning', 'good evening'],
        thanks: ['شكرا', 'thanks', 'thank you', 'شكراً', 'ممتاز', 'great', 'awesome', 'رائع', 'جميل'],
        help: ['مساعدة', 'help', 'كيف', 'how', 'what', 'ماذا', 'ما هي']
    },

    responses: {
        ar: {
            greeting: [
                "مرحباً بك! 👋 أنا Sage، مساعدك الذكي للتسوق. كيف يمكنني مساعدتك اليوم؟",
                "أهلاً وسهلاً! 🔮 أنا هنا لمساعدتك في العثور على أفضل الصفقات!",
                "مرحباً! 🛍️ اسألني عن أي منتج وسأساعدك في العثور على أفضل سعر!"
            ],
            search: [
                "🔍 ممتاز! دعني أبحث لك عن أفضل الأسعار. ما المنتج الذي تبحث عنه؟",
                "سأساعدك في العثور على أفضل عرض! أخبرني اسم المنتج 📦",
                "اكتب اسم المنتج في خانة البحث وستحصل على تحليل شامل للسعر! 🎯"
            ],
            price: [
                "💰 للعثور على أفضل سعر، ابحث عن المنتج وستحصل على تحليل شامل للسعر!",
                "سأقارن الأسعار لك من عدة متاجر للحصول على أفضل صفقة! 📊",
                "أدخل اسم المنتج في البحث وأخبرك إذا كان السعر مناسباً! 💵"
            ],
            deal: [
                "🎉 رائع! أنا متخصص في العثور على أفضل الصفقات! ابحث عن المنتج وستحصل على تحليل ذكي!",
                "سأساعدك في العثور على خصومات حقيقية وليست وهمية! 🔍",
                "لدي نظام ذكي لكشف الصفقات الوهمية! ابحث عن أي منتج وسأحذرك! ⚠️"
            ],
            advice: [
                "💡 أنصحك دائماً بمقارنة الأسعار قبل الشراء! ابحث عن المنتج وستحصل على نصيحة مخصصة!",
                "قبل الشراء، تحقق من تحليل Sage الذكي لمعرفة إذا كان السعر مناسباً! 🧠",
                "سأعطيك توصية بناءً على تحليل السوق! ابحث عن المنتج أولاً 📊"
            ],
            compare: [
                "📊 للمقارنة بين المنتجات، ابحث عن كل منتج وسأعطيك تحليلاً شاملاً!",
                "يمكنني مساعدتك في المقارنة! ابحث عن المنتج الأول ثم الثاني 🔄",
                "قارن الأسعار بناءً على تحليل السوق! 🎯"
            ],
            thanks: [
                "العفو! 😊 سعيد بمساعدتك! لا تتردد في السؤال عن أي شيء آخر!",
                "شكراً لك! 💜 أنا دائماً هنا لمساعدتك في التسوق الذكي!",
                "مرحباً بك! 🌟 اسألني عن أي منتج في أي وقت!"
            ],
            help: [
                "يمكنني مساعدتك في: 🔍 البحث عن المنتجات، 📊 مقارنة الأسعار، 💡 الحصول على نصائح شراء، ⚠️ كشف الصفقات الوهمية!",
                "أنا مساعد ذكي للتسوق! اسألني عن أي منتج وسأعطيك تحليلاً شاملاً! 🛒",
                "خدماتي: البحث عن أفضل سعر، تحليل جودة الصفقة، تقييم الموثوقية، نصائح شراء شخصية! 🎯"
            ],
            phones: "📱 سأساعدك في العثور على أفضل الهواتف بأسعار منافسة! ابحث عن الموديل المحدد!",
            laptops: "💻 رائع! ابحث عن الموديل المحدد وستحصل على مقارنة أسعار من متاجر متعددة!",
            watches: "⌚ سأساعدك في العثور على أفضل الساعات الذكية! ابحث عن الموديل!",
            gaming: "🎮 ممتاز! ابحث عن الجهاز أو اللعبة وستحصل على أفضل العروض!",
            beauty: "💄 جميل! ابحثي عن المنتج وستحصلين على أفضل الأسعار!",
            home: "🏠 رائع! ابحث عن الأجهزة المنزلية وسأجد لك أفضل سعر!",
            default: [
                "أنا هنا لمساعدتك في التسوق! 🛒 اسألني عن أي منتج أو سعر!",
                "كيف يمكنني مساعدتك اليوم؟ ابحث عن منتج أو اسألني عن الأسعار! 💰",
                "مرحباً! 👋 اكتب اسم المنتج الذي تبحث عنه وسأساعدك!"
            ]
        },
        en: {
            greeting: [
                "Hello! 👋 I'm Sage, your smart shopping assistant. How can I help you today?",
                "Hi there! 🔮 I'm here to help you find the best deals!",
                "Welcome! 🛍️ Ask me about any product and I'll help you find the best price!"
            ],
            search: [
                "🔍 Great! Let me search for the best prices. What product are you looking for?",
                "I'll help you find the best offer! Tell me the product name 📦",
                "Type the product name in the search box and get a full price analysis! 🎯"
            ],
            price: [
                "💰 To find the best price, search for the product and you'll get a comprehensive analysis!",
                "I'll compare prices from multiple stores to get you the best deal! 📊",
                "Enter the product name and I'll tell you if the price is right! 💵"
            ],
            deal: [
                "🎉 Awesome! I specialize in finding the best deals! Search for a product for smart analysis!",
                "I'll help you find real discounts, not fake ones! 🔍",
                "I have a smart system to detect fake deals! Search any product and I'll warn you! ⚠️"
            ],
            advice: [
                "💡 I always recommend comparing prices before buying! Search for the product for personalized advice!",
                "Before buying, check Sage's smart analysis to know if the price is right! 🧠",
                "I'll give you a recommendation based on market analysis! Search for the product first 📊"
            ],
            compare: [
                "📊 To compare products, search for each one and I'll give you a comprehensive analysis!",
                "I can help you compare! Search for the first product then the second 🔄",
                "Compare prices based on market analysis! 🎯"
            ],
            thanks: [
                "You're welcome! 😊 Happy to help! Don't hesitate to ask anything else!",
                "Thank you! 💜 I'm always here to help with smart shopping!",
                "You're welcome! 🌟 Ask me about any product anytime!"
            ],
            help: [
                "I can help you with: 🔍 Product search, 📊 Price comparison, 💡 Buying tips, ⚠️ Fake deal detection!",
                "I'm a smart shopping assistant! Ask me about any product for comprehensive analysis! 🛒",
                "My services: Best price search, deal quality analysis, reliability rating, personalized shopping tips! 🎯"
            ],
            phones: "📱 I'll help you find the best phones at competitive prices! Search for a specific model!",
            laptops: "💻 Great! Search for a specific model and get price comparisons from multiple stores!",
            watches: "⌚ I'll help you find the best smartwatches! Search for the model!",
            gaming: "🎮 Excellent! Search for the device or game for the best offers!",
            default: [
                "I'm here to help with shopping! 🛒 Ask me about any product or price!",
                "How can I help you today? Search for a product or ask about prices! 💰",
                "Hello! 👋 Type the product name you're looking for and I'll help!"
            ]
        },
        fr: {
            greeting: ["Bonjour! 👋 Je suis Sage, votre assistant shopping. Comment puis-je vous aider?", "Salut! 🔮 Je suis là pour vous aider à trouver les meilleures offres!"],
            search: ["🔍 Super! Laissez-moi chercher les meilleurs prix. Quel produit cherchez-vous?", "Je vais vous aider à trouver la meilleure offre! 📦"],
            price: ["💰 Pour trouver le meilleur prix, recherchez le produit! 📊", "Je comparerai les prix de plusieurs magasins! 💵"],
            deal: ["🎉 Excellent! Je suis spécialisé dans les meilleures offres! 🔍", "Je vais vous aider à trouver de vraies réductions! ⚠️"],
            thanks: ["De rien! 😊 Heureux de vous aider! 💜", "Merci! Je suis toujours là pour vous aider! 🌟"],
            help: ["Je peux vous aider: 🔍 Recherche, 📊 Comparaison, 💡 Conseils, ⚠️ Détection des faux deals! 🎯"],
            default: ["Je suis là pour vous aider! 🛒 Demandez-moi n'importe quel produit! 💰"]
        },
        de: {
            greeting: ["Hallo! 👋 Ich bin Sage, Ihr Einkaufsassistent.", "Hi! 🔮 Ich helfe Ihnen, die besten Angebote zu finden!"],
            search: ["🔍 Toll! Welches Produkt suchen Sie?", "Ich helfe Ihnen, das beste Angebot zu finden! 📦"],
            price: ["💰 Suchen Sie nach dem Produkt für eine Preisanalyse! 📊", "Ich vergleiche Preise aus mehreren Geschäften! 💵"],
            thanks: ["Gerne! 😊 Froh zu helfen! 💜", "Danke! Ich bin immer hier! 🌟"],
            default: ["Ich bin hier, um zu helfen! 🛒 Fragen Sie mich nach Produkten! 💰"]
        },
        es: {
            greeting: ["¡Hola! 👋 Soy Sage, tu asistente de compras.", "¡Hola! 🔮 ¡Estoy aquí para ayudarte a encontrar las mejores ofertas!"],
            search: ["🔍 ¡Genial! ¿Qué producto buscas?", "¡Te ayudo a encontrar la mejor oferta! 📦"],
            price: ["💰 ¡Busca el producto para un análisis de precios! 📊", "¡Compararé precios de varias tiendas! 💵"],
            thanks: ["¡De nada! 😊 ¡Feliz de ayudar! 💜", "¡Gracias! ¡Siempre estoy aquí! 🌟"],
            default: ["¡Estoy aquí para ayudar! 🛒 ¡Pregúntame sobre productos! 💰"]
        },
        tr: {
            greeting: ["Merhaba! 👋 Ben Sage, alışveriş asistanınız.", "Selam! 🔮 En iyi fırsatları bulmanıza yardımcı oluyorum!"],
            search: ["🔍 Harika! Hangi ürünü arıyorsunuz?", "En iyi teklifi bulmanıza yardımcı olacağım! 📦"],
            price: ["💰 En iyi fiyatı bulmak için ürünü arayın! 📊", "Birden fazla mağazadan fiyatları karşılaştıracağım! 💵"],
            thanks: ["Rica ederim! 😊 Yardımcı olmak mutluluk verici! 💜", "Teşekkürler! Her zaman buradayım! 🌟"],
            default: ["Yardım için buradayım! 🛒 Ürünler hakkında sorun! 💰"]
        }
    }
};

// ================= LANGUAGE DETECTION =================
function detectLanguage(text) {
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
    
    const lowerText = text.toLowerCase();
    if (/\b(le|la|les|bonjour|merci)\b/.test(lowerText)) return 'fr';
    if (/\b(der|die|das|hallo|danke)\b/.test(lowerText)) return 'de';
    if (/\b(hola|gracias|buenos)\b/.test(lowerText)) return 'es';
    if (/\b(merhaba|teşekkür)\b/.test(lowerText)) return 'tr';
    
    return 'en';
}

// ================= INTENT DETECTION =================
function detectIntent(message) {
    const lower = message.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(KNOWLEDGE_BASE.intents)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword.toLowerCase())) {
                return intent;
            }
        }
    }
    
    return 'default';
}

// ================= PRODUCT DETECTION =================
function detectProduct(message) {
    const lower = message.toLowerCase();
    
    for (const [category, products] of Object.entries(KNOWLEDGE_BASE.products)) {
        for (const product of products) {
            if (lower.includes(product.toLowerCase())) {
                return { category, product, found: true };
            }
        }
    }
    
    return { found: false };
}

// ================= SENTIMENT ANALYSIS =================
function analyzeSentiment(message) {
    const positive = ['جيد', 'ممتاز', 'رائع', 'good', 'great', 'excellent', 'awesome', 'شكرا', 'thanks', 'جميل', 'nice', 'perfect', 'ممتاز'];
    const negative = ['سيء', 'غالي', 'bad', 'expensive', 'مشكلة', 'problem', 'ضعيف', 'poor', 'terrible'];
    
    const lower = message.toLowerCase();
    
    for (const word of positive) {
        if (lower.includes(word)) return 'positive';
    }
    for (const word of negative) {
        if (lower.includes(word)) return 'negative';
    }
    
    return 'neutral';
}

// ================= GET RESPONSE =================
function getResponse(intent, lang = 'ar', productMention = null) {
    const responses = KNOWLEDGE_BASE.responses[lang] || KNOWLEDGE_BASE.responses.en;
    
    let responseArray = responses[intent] || responses.default;
    
    // If product mentioned, add product-specific response
    if (productMention && productMention.found) {
        const productResponse = responses[productMention.category];
        if (productResponse) {
            if (Array.isArray(responseArray)) {
                responseArray = [...responseArray];
            } else {
                responseArray = [responseArray];
            }
            responseArray.push(productResponse);
        }
    }
    
    // Pick random response
    const response = Array.isArray(responseArray) 
        ? responseArray[Math.floor(Math.random() * responseArray.length)]
        : responseArray;
    
    return response;
}

// ================= GENERATE SUGGESTIONS =================
function generateSuggestions(intent, lang = 'ar') {
    const suggestions = {
        ar: {
            search: ['ابحث عن iPhone 15', 'أريد لابتوب رخيص', 'أفضل ساعات ذكية'],
            price: ['كم سعر PlayStation 5؟', 'أرخص لابتوب للجامعة', 'مقارنة أسعار الهواتف'],
            deal: ['أفضل العروض الحالية', 'خصومات أمازون', 'صفقات اليوم'],
            compare: ['قارن iPhone وSamsung', 'أي لابتوب أفضل؟', 'أي ساعة أشتري؟'],
            default: ['ابحث عن منتج', 'قارن الأسعار', 'نصيحة للشراء', 'ما هي خدماتك؟']
        },
        en: {
            search: ['Search for iPhone 15', 'I want a cheap laptop', 'Best smartwatches'],
            price: ['How much is PlayStation 5?', 'Cheapest laptop for college', 'Compare phone prices'],
            deal: ['Current best deals', 'Amazon discounts', 'Today\'s deals'],
            compare: ['Compare iPhone vs Samsung', 'Which laptop is better?', 'Which watch should I buy?'],
            default: ['Search for product', 'Compare prices', 'Buying advice', 'What are your services?']
        }
    };
    
    const langSuggestions = suggestions[lang] || suggestions.en;
    return (langSuggestions[intent] || langSuggestions.default).slice(0, 4);
}

// ================= MAIN PROCESSOR =================
async function processChatMessage(message, userId = 'guest', lang = 'ar', history = []) {
    try {
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return {
                response: lang === 'ar' ? '👋 مرحباً! كيف يمكنني مساعدتك؟' : '👋 Hello! How can I help you?',
                reply: lang === 'ar' ? '👋 مرحباً! كيف يمكنني مساعدتك؟' : '👋 Hello! How can I help you?',
                intent: 'empty',
                sentiment: 'neutral',
                language: lang
            };
        }

        const cleanMessage = message.trim();
        
        // Detect language if not provided
        const detectedLang = detectLanguage(cleanMessage);
        if (detectedLang !== lang && !['ar', 'en'].includes(lang)) {
            lang = detectedLang;
        }
        
        // Analyze message
        const intent = detectIntent(cleanMessage);
        const productMention = detectProduct(cleanMessage);
        const sentiment = analyzeSentiment(cleanMessage);
        
        // Get response
        let response = getResponse(intent, lang, productMention);
        
        // Add search suggestion if product mentioned
        if (productMention.found) {
            const searchPrompt = lang === 'ar' 
                ? `\n\n🔍 **اضغط على زر البحث للعثور على أفضل أسعار "${productMention.product}"!**`
                : `\n\n🔍 **Click the search button to find the best prices for "${productMention.product}"!**`;
            response += searchPrompt;
        }
        
        // Generate suggestions
        const suggestions = generateSuggestions(intent, lang);
        
        console.log(`💬 Chat [${userId}]: "${cleanMessage.substring(0, 30)}..." -> Intent: ${intent}, Lang: ${lang}`);
        
        return {
            response,
            reply: response,
            intent,
            sentiment,
            language: lang,
            suggestions,
            productMention: productMention.found ? productMention : null
        };
        
    } catch (error) {
        console.error('❌ Chat Engine Error:', error.message);
        
        return {
            response: lang === 'ar' 
                ? '🤔 عذراً، حدث خطأ. حاول مرة أخرى!' 
                : '🤔 Sorry, an error occurred. Please try again!',
            reply: lang === 'ar' 
                ? '🤔 عذراً، حدث خطأ. حاول مرة أخرى!' 
                : '🤔 Sorry, an error occurred. Please try again!',
            intent: 'error',
            sentiment: 'neutral',
            language: lang
        };
    }
}

// ================= EXPORTS =================
module.exports = {
    processChatMessage,
    supportedLanguages,
    detectLanguage,
    detectIntent,
    detectProduct,
    analyzeSentiment,
    KNOWLEDGE_BASE
};
