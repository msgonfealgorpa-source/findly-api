// ================= SMART CHAT ENGINE v4.0 - MULTILINGUAL ULTRA =================
// تم تصحيح الكود ليعمل بشكل صحيح

const NaturalLanguageUnderstanding = {
    // قاموس المشاعر الموسع - 15 لغة
    sentimentLexicon: {
        positive: {
            ar: ["ممتاز", "رائع", "جميل", "حلو", "مذهل", "افضل", "احسنت", "شكرا", "سعيد", "محبوب", "نجاح", "ممتازة", "مبارك", "تهانينا", "سررت", "اعجبني", "واقعي", "صادق", "امين", "كويس", "حلوة", "عجبني", "روعة", "سلس", "مفيد", "رهيب"],
            en: ["awesome", "great", "love", "amazing", "excellent", "good", "nice", "perfect", "wonderful", "fantastic", "brilliant", "superb", "happy", "thanks", "thank", "best", "cool", "love it", "super", "incredible"],
            fr: ["excellent", "superbe", "magnifique", "génial", "merci", "parfait", "incroyable", "merveilleux", "fantastique", "super", "j'aime", "brillant"],
            de: ["ausgezeichnet", "wunderbar", "großartig", "perfekt", "danke", "toll", "fantastisch", "brilliant", "super", "herrlich", "prima", "spitze"],
            es: ["excelente", "maravilloso", "genial", "perfecto", "gracias", "increíble", "fantástico", "brillante", "super", "magnífico", "buenísimo"],
            tr: ["mükemmel", "harika", "süper", "teşekkürler", "inanılmaz", "fantastik", "çok güzel", "pekala", "muhteşem"],
            it: ["eccellente", "meraviglioso", "fantastico", "perfetto", "grazie", "incredibile", "brillante", "super", "bellissimo", "ottimo"],
            pt: ["excelente", "maravilhoso", "fantástico", "perfeito", "obrigado", "incrível", "brilhante", "super", "lindo", "ótimo"],
            ru: ["отлично", "прекрасно", "замечательно", "идеально", "спасибо", "потрясающе", "блестяще", "супер", "великолепно"],
            zh: ["很好", "太棒了", "完美", "谢谢", "精彩", "极好", "优秀", "出色"],
            ja: ["素晴らしい", "完璧", "ありがとう", "最高", "優秀", "素敵"],
            ko: ["훌륭한", "완벽한", "감사합니다", "놀라운", "최고", "멋진"],
            hi: ["बहुत अच्छा", "शानदार", "परफेक्ट", "धन्यवाद", "कमाल", "उत्कृष्ट"],
            fa: ["عالی", "مرسی", "فوق‌العاده", "بی‌نظیر", "محشر"]
        },
        negative: {
            ar: ["سيء", "مشكله", "غلط", "غبي", "احبط", "فشل", "خسارة", "مخيف", "محبط", "كره", "لا", "لايعجبني", "سيئة", "صعبة", "معقد", "مربك", "خاطئ", "ضعيف", "سخيف", "مقرف"],
            en: ["bad", "hate", "poor", "terrible", "awful", "worst", "horrible", "disappointing", "sad", "angry", "frustrated", "wrong", "problem", "issue", "error", "ugly", "stupid", "useless"],
            fr: ["mauvais", "nul", "terrible", "horrible", "décevant", "problème", "erreur", "ennuyeux", "échec"],
            de: ["schlecht", "schrecklich", "enttäuschend", "problem", "fehler", "furchtbar", "miserabel"],
            es: ["malo", "terrible", "horrible", "decepcionante", "problema", "error", "pésimo", "negativo"],
            tr: ["kötü", "berbat", "sorun", "hata", "hayal kırıklığı", "mükemmel değil"],
            it: ["cattivo", "terribile", "horribile", "deludente", "problema", "errore", "pessimo"],
            pt: ["ruim", "terrível", "horrível", "decepcionante", "problema", "erro", "péssimo"],
            ru: ["плохо", "ужасно", "проблема", "ошибка", "разочаровывающий", "отвратительно"],
            zh: ["不好", "糟糕", "问题", "错误", "差", "坏"],
            ja: ["悪い", "ひどい", "問題", "エラー", "失望"],
            ko: ["나쁜", "끔찍한", "문제", "오류", "실망스러운"],
            hi: ["बुरा", "भयानक", "समस्या", "त्रुटि", "निराशाजनक"],
            fa: ["بد", "وحشتناک", "مشکل", "خطا", "ناامیدکننده"]
        },
        urgent: {
            ar: ["عاجل", "سريع", "الان", "فورا", "ضروري", "مهم جدا", "بسرعة"],
            en: ["urgent", "asap", "now", "immediately", "important", "quickly", "fast", "hurry"],
            fr: ["urgent", "vite", "maintenant", "immédiatement", "important"],
            de: ["dringend", "schnell", "jetzt", "sofort", "wichtig"],
            es: ["urgente", "rápido", "ahora", "inmediatamente", "importante"],
            tr: ["acil", "hemen", "şimdi", "önemli", "çabuk"],
            it: ["urgente", "veloce", "ora", "immediatamente", "importante"],
            pt: ["urgente", "rápido", "agora", "imediatamente", "importante"],
            ru: ["срочно", "быстро", "сейчас", "немедленно", "важно"],
            zh: ["紧急", "快速", "现在", "立即", "重要"],
            ja: ["緊急", "速く", "今すぐ", "重要"],
            ko: ["긴급", "빨리", "지금", "즉시", "중요한"],
            hi: ["आपातकालीन", "जल्दी", "अभी", "तुरंत", "महत्वपूर्ण"],
            fa: ["فوری", "سریع", "الان", "فورا", "مهم"]
        }
    },

    // كيانات قابلة للاكتشاف
    entityPatterns: {
        price: /\b(\d+[\.,]?\d*)\s*(دولار|ريال|درهم|يورو|ليرة|دينار|جنيه|ر\.س|ر\.ق|د\.ج|د\.ت|د\.إ|\$|USD|EUR|SAR|AED|TL|EGP|€|£|¥)\b/gi,
        product: /\b(ايفون|آيفون|iphone|سامسونج|samsung|لابتوب|laptop|هاتف|phone|ساعة|watch|سماعات|headphones|كاميرا|camera|جوال|موبايل|mobile|tablet|ipad|شاشة|monitor|تلفزيون|tv|كمبيوتر|computer|earbuds|airpods|شاحن|charger|كيبورد|keyboard|ماوس|mouse)\b/gi,
        brand: /\b(apple|سوني|sony|lg|شاومي|xiaomi|هواوي|huawei|ابل|nike|نايك|adidas|اديديس|zara|زارا|samsung|سامسونج|google|جوجل|microsoft|مايكروسوفت|amazon|أمازون|lenovo|لينوفو|hp|asus|ديل|dell)\b/gi,
        number: /\b\d+\.?\d*\b/g,
        url: /https?:\/\/[^\s]+/gi,
        email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
        phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4,6}/g,
        date: /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g,
        emoji: /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu
    }
};

// ================= نظام الذاكرة المتقدم =================

class ConversationMemory {
    constructor() {
        this.shortTerm = {
            lastIntents: [],
            lastMood: "neutral",
            lastEntities: {},
            conversationFlow: [],
            userPreferences: {},
            mentionedProducts: [],
            askedQuestions: [],
            detectedLanguage: null
        };
        
        this.longTerm = {
            userProfile: {
                interests: [],
                budget: null,
                preferredLanguage: null,
                interactionCount: 0,
                name: null,
                lastVisit: null
            },
            learnedPatterns: new Map(),
            successfulResponses: []
        };
    }

    addInteraction(intent, entities, mood, message, lang) {
        this.shortTerm.conversationFlow.push({
            timestamp: Date.now(),
            intent: intent?.name,
            entities,
            mood,
            messageLength: message.length,
            lang
        });

        if (this.shortTerm.conversationFlow.length > 15) {
            this.shortTerm.conversationFlow.shift();
        }

        if (intent) {
            this.shortTerm.lastIntents.push(intent.name);
            if (this.shortTerm.lastIntents.length > 7) {
                this.shortTerm.lastIntents.shift();
            }
        }

        this.shortTerm.lastMood = mood;
        this.shortTerm.lastEntities = entities;
        this.shortTerm.detectedLanguage = lang;
        this.longTerm.userProfile.interactionCount++;
        this.longTerm.userProfile.lastVisit = new Date().toISOString();

        if (entities.products?.length > 0) {
            entities.products.forEach(p => {
                if (!this.shortTerm.mentionedProducts.includes(p)) {
                    this.shortTerm.mentionedProducts.push(p);
                }
            });
        }
    }

    getContext() {
        return {
            recentIntents: this.shortTerm.lastIntents,
            currentMood: this.shortTerm.lastMood,
            mentionedProducts: this.shortTerm.mentionedProducts,
            flowLength: this.shortTerm.conversationFlow.length,
            userProfile: this.longTerm.userProfile,
            detectedLanguage: this.shortTerm.detectedLanguage
        };
    }

    detectPattern() {
        const intents = this.shortTerm.lastIntents;
        if (intents.length < 2) return null;

        const lastTwo = intents.slice(-2).join("-");
        
        const patterns = {
            "greeting-greeting": "user_uncertain",
            "price_inquiry-price_inquiry": "price_sensitive",
            "product_recommendation-price_inquiry": "smart_shopper",
            "technical_question-technical_question": "detail_oriented",
            "comparison-comparison": "analytical_buyer"
        };

        return patterns[lastTwo] || null;
    }

    reset() {
        this.shortTerm = {
            lastIntents: [],
            lastMood: "neutral",
            lastEntities: {},
            conversationFlow: [],
            userPreferences: {},
            mentionedProducts: [],
            askedQuestions: [],
            detectedLanguage: null
        };
    }
}

const memory = new ConversationMemory();

// ================= دعم اللغات المتعددة =================

const supportedLanguages = {
    ar: { name: "العربية", native: "العربية", dir: "rtl", flag: "🇸🇦" },
    en: { name: "English", native: "English", dir: "ltr", flag: "🇺🇸" },
    fr: { name: "French", native: "Français", dir: "ltr", flag: "🇫🇷" },
    de: { name: "German", native: "Deutsch", dir: "ltr", flag: "🇩🇪" },
    es: { name: "Spanish", native: "Español", dir: "ltr", flag: "🇪🇸" },
    tr: { name: "Turkish", native: "Türkçe", dir: "ltr", flag: "🇹🇷" },
    it: { name: "Italian", native: "Italiano", dir: "ltr", flag: "🇮🇹" },
    pt: { name: "Portuguese", native: "Português", dir: "ltr", flag: "🇧🇷" },
    ru: { name: "Russian", native: "Русский", dir: "ltr", flag: "🇷🇺" },
    zh: { name: "Chinese", native: "中文", dir: "ltr", flag: "🇨🇳" },
    ja: { name: "Japanese", native: "日本語", dir: "ltr", flag: "🇯🇵" },
    ko: { name: "Korean", native: "한국어", dir: "ltr", flag: "🇰🇷" },
    hi: { name: "Hindi", native: "हिन्दी", dir: "ltr", flag: "🇮🇳" },
    fa: { name: "Persian", native: "فارسی", dir: "rtl", flag: "🇮🇷" }
};

// ================= معالجة النصوص المتقدمة =================

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF\u00C0-\u017F\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\d\$\.\,\!\?\؟]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenizeAdvanced(text) {
    const normalized = normalizeText(text);
    const tokens = normalized.split(/\s+/).filter(Boolean);
    
    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
        bigrams.push(`${tokens[i]}_${tokens[i + 1]}`);
    }

    const trigrams = [];
    for (let i = 0; i < tokens.length - 2; i++) {
        trigrams.push(`${tokens[i]}_${tokens[i + 1]}_${tokens[i + 2]}`);
    }

    return { tokens, bigrams, trigrams, original: normalized };
}

function detectLanguage(text) {
    if (/[\u0600-\u06FF]/.test(text)) {
        if (/چ|گ|پ|ژ/.test(text)) return 'fa';
        return 'ar';
    }
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    
    const latinText = text.toLowerCase();
    
    if (/\b(le|la|les|un|une|des|et|est|sont|je|tu|il|elle|nous|vous|ils|elles|merci|bonjour|salut)\b/i.test(latinText)) return 'fr';
    if (/\b(der|die|das|und|ist|sind|ich|du|er|sie|wir|ihr|danke|hallo|tschüss)\b/i.test(latinText)) return 'de';
    if (/\b(el|la|los|las|un|una|y|es|son|yo|tú|él|ella|nosotros|gracias|hola|adiós)\b/i.test(latinText)) return 'es';
    if (/\b(ve|bir|bu|şu|o|var|yok|için|ile|ama|çünkü|teşekkürler|merhaba|güle)\b/i.test(latinText)) return 'tr';
    if (/\b(il|lo|la|i|gli|le|un|una|e|è|sono|io|tu|lui|lei|grazie|ciao|arrivederci)\b/i.test(latinText)) return 'it';
    if (/\b(o|a|os|as|um|uma|e|é|são|eu|você|ele|ela|obrigado|olá|tchau)\b/i.test(latinText)) return 'pt';
    
    return 'en';
}

// ================= تحليل المشاعر المتقدم =================

function analyzeSentiment(tokens, originalText, lang) {
    const lexicon = NaturalLanguageUnderstanding.sentimentLexicon;
    
    let positiveScore = 0;
    let negativeScore = 0;
    let urgentScore = 0;
    
    const positiveWords = [...(lexicon.positive[lang] || []), ...lexicon.positive.en];
    const negativeWords = [...(lexicon.negative[lang] || []), ...lexicon.negative.en];
    const urgentWords = [...(lexicon.urgent[lang] || []), ...lexicon.urgent.en];

    tokens.forEach(token => {
        if (positiveWords.some(w => token.includes(w) || w.includes(token))) positiveScore++;
        if (negativeWords.some(w => token.includes(w) || w.includes(token))) negativeScore++;
        if (urgentWords.some(w => token.includes(w) || w.includes(token))) urgentScore++;
    });

    const exclamations = (originalText.match(/!|！|！/g) || []).length;
    const questions = (originalText.match(/\?|？|؟/g) || []).length;
    const caps = (originalText.match(/[A-ZА-ЯЁ\u0600-\u06FF]{3,}/g) || []).length;
    const emojis = (originalText.match(NaturalLanguageUnderstanding.entityPatterns.emoji) || []).length;

    if (exclamations > 2) positiveScore += 1;
    if (caps > 1) urgentScore += 1;
    if (questions > 1) negativeScore += 0.5;
    if (emojis > 2) positiveScore += 0.5;

    const totalSentiment = positiveScore - negativeScore;
    
    let mood = "neutral";
    let confidence = 0.5;
    
    if (totalSentiment > 1) {
        mood = "positive";
        confidence = Math.min(totalSentiment / 4, 1);
    } else if (totalSentiment < -1) {
        mood = "negative";
        confidence = Math.min(Math.abs(totalSentiment) / 4, 1);
    }

    return {
        mood,
        confidence,
        isUrgent: urgentScore > 0,
        sentimentScores: { positive: positiveScore, negative: negativeScore, urgent: urgentScore },
        hasEmojis: emojis > 0
    };
}

// ================= استخراج الكيانات =================

function extractEntities(text) {
    const entities = {
        prices: [],
        products: [],
        brands: [],
        numbers: [],
        urls: [],
        emails: [],
        phones: [],
        dates: [],
        emojis: []
    };

    const patterns = NaturalLanguageUnderstanding.entityPatterns;

    entities.prices = [...text.matchAll(patterns.price)].map(m => ({
        value: parseFloat(m[1].replace(',', '.')),
        raw: m[0]
    }));

    entities.products = [...new Set([...text.matchAll(patterns.product)].map(m => m[0]))];
    entities.brands = [...new Set([...text.matchAll(patterns.brand)].map(m => m[0]))];
    entities.numbers = [...text.matchAll(patterns.number)].map(m => parseFloat(m[0]));
    entities.urls = [...text.matchAll(patterns.url)].map(m => m[0]);
    entities.emails = [...text.matchAll(patterns.email)].map(m => m[0]);
    entities.phones = [...text.matchAll(patterns.phone)].map(m => m[0]);
    entities.dates = [...text.matchAll(patterns.date)].map(m => m[0]);
    entities.emojis = [...text.matchAll(patterns.emoji)].map(m => m[0]);

    return entities;
}

// ================= نوايا محسنة مع دعم 15 لغة =================

const intents = [
    {
        name: "greeting",
        keywords: {
            ar: ["مرحبا", "اهلا", "السلام", "صباح", "مساء", "هاي", "هلا", "أهلاً", "مرحبًا"],
            en: ["hi", "hello", "hey", "good", "morning", "evening", "sup", "yo", "howdy", "greetings"],
            fr: ["bonjour", "salut", "coucou", "bonsoir", "hello", "salutations"],
            de: ["hallo", "guten", "morgen", "tag", "hi", "servus", "grüß"],
            es: ["hola", "buenos", "días", "buenas", "tardes", "noches", "saludos"],
            tr: ["merhaba", "selam", "günaydın", "iyi", "günler", "selamlar"],
            it: ["ciao", "buongiorno", "buonasera", "salve", "hello"],
            pt: ["olá", "oi", "bom", "dia", "boa", "tarde", "noite", "salve"],
            ru: ["привет", "здравствуйте", "добрый", "день", "утро", "вечер", "здравствуй"],
            zh: ["你好", "您好", "早上好", "晚上好", "嗨"],
            ja: ["こんにちは", "おはよう", "こんばんは", "やあ", "ハロー"],
            ko: ["안녕하세요", "안녕", "반갑습니다", "하이"],
            hi: ["नमस्ते", "हैलो", "सुप्रभात", "शुभ", "संध्या"],
            fa: ["سلام", "درود", "صبح", "بخیر", "عصر"]
        },
        patterns: [/^(hi|hello|hey|مرحبا|اهلا|السلام|bonjour|hola|ciao|olá|привет|你好|こんにちは|안녕)/i],
        responses: {
            ar: {
                neutral: ["مرحباً بك! 👋 كيف يمكنني مساعدتك اليوم؟", "أهلاً وسهلاً! 😊 أنا هنا لمساعدتك", "تشرفت بك! ✨ ما الذي تبحث عنه؟"],
                positive: ["أهلاً بك المشرق! 🌟 سعيد جداً بوجودك هنا", "مرحباً يا صديقي! 🎉 دعنا ننجز أموراً رائعة معاً"],
                negative: ["مرحباً بك، أرى أن لديك بعض الاستفسارات. أنا هنا لمساعدتك 💪"]
            },
            en: {
                neutral: ["Hello! 👋 How can I help you today?", "Hi there! 😊 I'm here to assist you", "Welcome! ✨ What are you looking for?"],
                positive: ["Hey there, sunshine! 🌟 Great to have you here!", "Hello friend! 🎉 Let's do something awesome together!"],
                negative: ["Hi there, I see you have some questions. I'm here to help 💪"]
            },
            fr: {
                neutral: ["Bonjour! 👋 Comment puis-je vous aider aujourd'hui?", "Salut! 😊 Je suis là pour vous aider"],
                positive: ["Bonjour, rayon de soleil! 🌟 Ravie de vous voir!"]
            },
            de: {
                neutral: ["Hallo! 👋 Wie kann ich Ihnen heute helfen?", "Hi! 😊 Ich bin hier, um Ihnen zu helfen"],
                positive: ["Hallo, Sonnenschein! 🌟 Schön, dass Sie hier sind!"]
            },
            es: {
                neutral: ["¡Hola! 👋 ¿Cómo puedo ayudarte hoy?", "¡Hola! 😊 Estoy aquí para ayudarte"],
                positive: ["¡Hola, rayo de sol! 🌟 ¡Qué bueno verte!"]
            },
            tr: {
                neutral: ["Merhaba! 👋 Bugün size nasıl yardımcı olabilirim?", "Selam! 😊 Size yardımcı olmak için buradayım"],
                positive: ["Merhaba, güneş ışığı! 🌟 Burada olduğun harika!"]
            },
            it: {
                neutral: ["Ciao! 👋 Come posso aiutarti oggi?", "Salve! 😊 Sono qui per aiutarti"],
                positive: ["Ciao, raggio di sole! 🌟 Fantastico averti qui!"]
            },
            pt: {
                neutral: ["Olá! 👋 Como posso ajudá-lo hoje?", "Oi! 😊 Estou aqui para ajudá-lo"],
                positive: ["Olá, raio de sol! 🌟 Ótimo ter você aqui!"]
            },
            ru: {
                neutral: ["Привет! 👋 Чем могу помочь сегодня?", "Здравствуйте! 😊 Я здесь, чтобы помочь"],
                positive: ["Привет, солнечный луч! 🌟 Рады вас видеть!"]
            },
            zh: {
                neutral: ["你好！👋 今天我能帮你什么？", "您好！😊 我在这里帮助您"],
                positive: ["你好，阳光！🌟 很高兴见到你！"]
            },
            ja: {
                neutral: ["こんにちは！👋 今日は何かお手伝いしましょうか？", "やあ！😊 お手伝いします"],
                positive: ["こんにちは、サンシャイン！🌟 ここにいてくれてうれしい！"]
            },
            ko: {
                neutral: ["안녕하세요! 👋 오늘 무엇을 도와드릴까요?", "안녕! 😊 도와드리겠습니다"],
                positive: ["안녕, 햇살! 🌟 여기 와줘서 기뻐요!"]
            },
            hi: {
                neutral: ["नमस्ते! 👋 आज मैं आपकी कैसे मदद कर सकता हूं?", "हैलो! 😊 मैं आपकी मदद के लिए यहां हूं"],
                positive: ["नमस्ते, धूप! 🌟 आप यहां हो यह बहुत अच्छा है!"]
            },
            fa: {
                neutral: ["سلام! 👋 امروز چطور می‌توانم کمکتان کنم؟", "درود! 😊 برای کمک به شما اینجا هستم"],
                positive: ["سلام خورشید! 🌟 خوشحالم که اینجا هستید!"]
            }
        },
        followUp: {
            ar: ["هل تبحث عن منتج معين؟", "هل لديك سؤال محدد؟", "كيف يمكنني مساعدتك اليوم؟"],
            en: ["Are you looking for a specific product?", "Do you have a specific question?", "How can I help you today?"],
            fr: ["Cherchez-vous un produit spécifique?", "Avez-vous une question spécifique?", "Comment puis-je vous aider?"],
            de: ["Suchen Sie ein bestimmtes Produkt?", "Haben Sie eine bestimmte Frage?", "Wie kann ich Ihnen helfen?"],
            es: ["¿Buscas un producto específico?", "¿Tienes una pregunta específica?", "¿Cómo puedo ayudarte?"],
            tr: ["Belirli bir ürün mü arıyorsunuz?", "Belirli bir sorunuz var mı?", "Nasıl yardımcı olabilirim?"],
            it: ["Stai cercando un prodotto specifico?", "Hai una domanda specifica?", "Come posso aiutarti?"],
            pt: ["Você está procurando um produto específico?", "Você tem uma pergunta específica?", "Como posso ajudá-lo?"],
            ru: ["Вы ищете конкретный продукт?", "У вас есть конкретный вопрос?", "Как я могу помочь?"],
            zh: ["您在找特定的产品吗？", "您有具体问题吗？", "我能帮您什么？"],
            ja: ["特定の製品をお探しですか？", "具体的な質問がありますか？", "どうすればお手伝いできますか？"],
            ko: ["특정 제품을 찾고 계신가요?", "구체적인 질문이 있으신가요?", "어떻게 도와드릴까요?"],
            hi: ["क्या आप कोई विशिष्ट उत्पाद ढूंढ रहे हैं?", "क्या आपका कोई विशिष्ट प्रश्न है?", "मैं कैसे मदद कर सकता हूं?"],
            fa: ["آیا محصول خاصی را می‌جویید؟", "سوال خاصی دارید؟", "چگونه می‌توانم کمک کنم؟"]
        }
    },
    {
        name: "price_inquiry",
        keywords: {
            ar: ["سعر", "كم", "تكلفة", "رخيص", "غالي", "ثمن", "قيمة", "خصم", "بكم"],
            en: ["price", "cost", "cheap", "expensive", "how much", "discount", "afford", "rate"],
            fr: ["prix", "coût", "combien", "cher", "bon marché", "rabais", "tarif"],
            de: ["preis", "kosten", "wie viel", "teuer", "billig", "rabatt"],
            es: ["precio", "costo", "cuánto", "caro", "barato", "descuento"],
            tr: ["fiyat", "maliyet", "ne kadar", "pahalı", "ucuz", "indirim"],
            it: ["prezzo", "costo", "quanto", "caro", "economico", "sconto"],
            pt: ["preço", "custo", "quanto", "caro", "barato", "desconto"],
            ru: ["цена", "стоимость", "сколько", "дорого", "дешево", "скидка"],
            zh: ["价格", "多少钱", "贵", "便宜", "折扣"],
            ja: ["価格", "値段", "いくら", "高い", "安い", "割引"],
            ko: ["가격", "비용", "얼마", "비싼", "싼", "할인"],
            hi: ["कीमत", "कितना", "महंगा", "सस्ता", "छूट"],
            fa: ["قیمت", "هزینه", "چقدر", "گران", "ارزان", "تخفیف"]
        },
        responses: {
            ar: {
                neutral: ["السعر يعتمد على عدة عوامل: الجودة، العلامة التجارية، والميزات.", "للحصول على أفضل سعر، أنصحك بمقارنة 3 متاجر على الأقل.", "حدد ميزانيتك أولاً وسأجد لك الخيار الأنسب."],
                positive: ["رائع أنك مهتم بالسعر! هذا يدل على ذكاء شرائي 👍", "مقارنة الأسعار خطوة ذكية! دعني أساعدك."],
                negative: ["أفهم قلقك من الأسعار. دعنا نجد خياراً يناسب ميزانيتك.", "لا تقلق، هناك دائماً خيارات بأسعار مختلفة."]
            },
            en: {
                neutral: ["The price depends on several factors: quality, brand, and features.", "For the best price, I recommend comparing at least 3 stores.", "Set your budget first and I'll find the most suitable option."],
                positive: ["Great that you're price-conscious! That's smart shopping 👍", "Price comparison is a smart move! Let me help you."],
                negative: ["I understand your price concerns. Let's find an option within your budget.", "Don't worry, there are always options at different price points."]
            },
            fr: {
                neutral: ["Le prix dépend de plusieurs facteurs: qualité, marque et caractéristiques.", "Pour le meilleur prix, je recommande de comparer au moins 3 magasins."],
                positive: ["Super que vous soyez sensible au prix! C'est un achat intelligent 👍"]
            },
            de: {
                neutral: ["Der Preis hängt von mehreren Faktoren ab: Qualität, Marke und Funktionen.", "Für den besten Preis empfehle ich, mindestens 3 Geschäfte zu vergleichen."],
                positive: ["Toll, dass Sie preissensibel sind! Das ist kluges Einkaufen 👍"]
            },
            es: {
                neutral: ["El precio depende de varios factores: calidad, marca y características.", "Para el mejor precio, recomiendo comparar al menos 3 tiendas."],
                positive: ["¡Genial que seas consciente del precio! Eso es una compra inteligente 👍"]
            },
            tr: {
                neutral: ["Fiyat birkaç faktöre bağlıdır: kalite, marka ve özellikler.", "En iyi fiyat için en az 3 mağazayı karşılaştırmanızı öneririm."],
                positive: ["Fiyat bilincine sahip olmanız harika! Bu akıllıca bir alışveriş 👍"]
            },
            it: {
                neutral: ["Il prezzo dipende da diversi fattori: qualità, marca e caratteristiche.", "Per il miglior prezzo, consiglio di confrontare almeno 3 negozi."],
                positive: ["Ottimo che tu sia attento al prezzo! Questo è shopping intelligente 👍"]
            },
            pt: {
                neutral: ["O preço depende de vários fatores: qualidade, marca e recursos.", "Para o melhor preço, recomendo comparar pelo menos 3 lojas."],
                positive: ["Ótimo que você está atento ao preço! Isso é compra inteligente 👍"]
            },
            ru: {
                neutral: ["Цена зависит от нескольких факторов: качество, бренд и характеристики.", "Для лучшей цены рекомендую сравнить минимум 3 магазина."],
                positive: ["Отлично, что вы следите за ценой! Это умная покупка 👍"]
            },
            zh: {
                neutral: ["价格取决于几个因素：质量、品牌和功能。", "为了获得最佳价格，我建议比较至少3家商店。"],
                positive: ["很棒您关注价格！这是明智的购物 👍"]
            },
            ja: {
                neutral: ["価格は品質、ブランド、機能などいくつかの要因によって異なります。", "最良の価格を得るために、少なくとも3つの店を比較することをお勧めします。"],
                positive: ["価格に敏感なのは素晴らしい！それは賢い買い物です 👍"]
            },
            ko: {
                neutral: ["가격은 품질, 브랜드, 기능 등 여러 요소에 따라 달라집니다.", "최고의 가격을 위해 최소 3개 매장을 비교하는 것을 추천합니다."],
                positive: ["가격에 관심이 있으시군요! 현명한 쇼핑입니다 👍"]
            },
            hi: {
                neutral: ["कीमत कई कारकों पर निर्भर करती है: गुणवत्ता, ब्रांड और विशेषताएं।", "सबसे अच्छी कीमत के लिए, कम से कम 3 दुकानों की तुलना करने की सलाह देता हूं।"],
                positive: ["कीमत के प्रति जागरूक होना बहुत अच्छा है! यह समझदार खरीदारी है 👍"]
            },
            fa: {
                neutral: ["قیمت به چند عامل بستگی دارد: کیفیت، برند و ویژگی‌ها.", "برای بهترین قیمت، پیشنهاد می‌کنم حداقل ۳ فروشگاه را مقایسه کنید."],
                positive: ["عالی که به قیمت توجه دارید! این خرید هوشمندانه است 👍"]
            }
        },
        requiresContext: true,
        entityAware: true,
        priority: 5
    },
    {
        name: "product_recommendation",
        keywords: {
            ar: ["افضل", "تنصحني", "اختار", "مناسب", "توصية", "ايش", "وش", "اي", "أفضل"],
            en: ["best", "recommend", "suggest", "which", "should", "choose", "top", "good", "better"],
            fr: ["meilleur", "recommander", "suggérer", "lequel", "choisir", "top"],
            de: ["beste", "empfehlen", "vorschlagen", "welcher", "wählen", "top"],
            es: ["mejor", "recomendar", "sugerir", "cuál", "elegir", "top"],
            tr: ["en iyi", "tavsiye", "öneri", "hangisi", "seç", "öner"],
            it: ["migliore", "consigliare", "suggerire", "quale", "scegliere", "top"],
            pt: ["melhor", "recomendar", "sugerir", "qual", "escolher", "top"],
            ru: ["лучший", "рекомендовать", "предложить", "какой", "выбрать", "топ"],
            zh: ["最好", "推荐", "建议", "哪个", "选择"],
            ja: ["最高", "おすすめ", "提案", "どれ", "選ぶ"],
            ko: ["최고", "추천", "제안", "어느", "선택"],
            hi: ["सबसे अच्छा", "सिफारिश", "सुझाव", "कौन सा", "चुनना"],
            fa: ["بهترین", "توصیه", "پیشنهاد", "کدام", "انتخاب"]
        },
        responses: {
            ar: {
                neutral: ["الأفضل يعتمد على احتياجاتك المحددة. دعني أسألك بعض الأسئلة.", "للحصول على أفضل توصية، أحتاج معرفة: ميزانيتك، استخدامك، وتفضيلاتك.", "اختيار المنتج المناسب يحتاج تحليل. هل تخبرني المزيد؟"],
                positive: ["ممتاز! سأعطيك أفضل التوصيات بناءً على تقييمات حقيقية 🌟", "سعيد بمساعدتك في الاختيار! دعنا نجد الكنز المثالي 💎"]
            },
            en: {
                neutral: ["The best choice depends on your specific needs. Let me ask some questions.", "For the best recommendation, I need to know: budget, usage, and preferences.", "Choosing the right product requires analysis. Can you tell me more?"],
                positive: ["Excellent! I'll give you the best recommendations based on real reviews 🌟", "Happy to help you choose! Let's find the perfect gem 💎"]
            },
            fr: {
                neutral: ["Le meilleur choix dépend de vos besoins spécifiques. Laissez-moi poser quelques questions."],
                positive: ["Excellent! Je vais vous donner les meilleures recommandations 🌟"]
            },
            de: {
                neutral: ["Die beste Wahl hängt von Ihren spezifischen Bedürfnissen ab. Lassen Sie mich einige Fragen stellen."],
                positive: ["Ausgezeichnet! Ich gebe Ihnen die besten Empfehlungen 🌟"]
            },
            es: {
                neutral: ["La mejor elección depende de sus necesidades específicas. Déjeme hacer algunas preguntas."],
                positive: ["¡Excelente! Te daré las mejores recomendaciones 🌟"]
            },
            tr: {
                neutral: ["En iyi seçim özel ihtiyaçlarınıza bağlıdır. Birkaç soru sormama izin verin."],
                positive: ["Mükemmel! Gerçek incelemelere dayalı en iyi tavsiyeleri vereceğim 🌟"]
            },
            it: {
                neutral: ["La migliore scelta dipende dalle tue esigenze specifiche. Fammi alcune domande."],
                positive: ["Eccellente! Ti darò le migliori raccomandazioni 🌟"]
            },
            pt: {
                neutral: ["A melhor escolha depende de suas necessidades específicas. Deixe-me fazer algumas perguntas."],
                positive: ["Excelente! Vou te dar as melhores recomendações 🌟"]
            },
            ru: {
                neutral: ["Лучший выбор зависит от ваших конкретных потребностей. Позвольте задать несколько вопросов."],
                positive: ["Отлично! Дам лучшие рекомендации 🌟"]
            },
            zh: {
                neutral: ["最佳选择取决于您的具体需求。让我问几个问题。"],
                positive: ["太棒了！我会根据真实评价给您最佳推荐 🌟"]
            },
            ja: {
                neutral: ["最良の選択は具体的なニーズによって異なります。いくつか質問させてください。"],
                positive: ["素晴らしい！実際のレビューに基づいて最高の推奨をします 🌟"]
            },
            ko: {
                neutral: ["최고의 선택은 구체적인 요구에 따라 다릅니다. 몇 가지 질문을 드리겠습니다."],
                positive: ["훌륭해요! 실제 리뷰를 기반으로 최고의 추천을 드릴게요 🌟"]
            },
            hi: {
                neutral: ["सबसे अच्छा विकल्प आपकी विशिष्ट जरूरतों पर निर्भर करता है। कुछ सवाल पूछने दीजिए।"],
                positive: ["उत्कृष्ट! वास्तविक समीक्षाओं के आधान पर सर्वोत्तम सिफारिशें दूंगा 🌟"]
            },
            fa: {
                neutral: ["بهترین انتخاب به نیازهای خاص شما بستگی دارد. بگذارید چند سوال بپرسم."],
                positive: ["عالی! بهترین توصیه‌ها را بر اساس نظرات واقعی به شما می‌دهم 🌟"]
            }
        },
        priority: 4
    },
    {
        name: "comparison",
        keywords: {
            ar: ["فرق", "مقارنة", "افضل", "بين", "كذا", "ولا", "قارن", "أفضل"],
            en: ["difference", "compare", "versus", "vs", "between", "or", "better"],
            fr: ["différence", "comparer", "versus", "entre", "ou"],
            de: ["unterschied", "vergleichen", "zwischen", "oder"],
            es: ["diferencia", "comparar", "entre", "versus", "o"],
            tr: ["fark", "karşılaştır", "arasında", "veya", "mi"],
            it: ["differenza", "confrontare", "tra", "versus", "o"],
            pt: ["diferença", "comparar", "entre", "versus", "ou"],
            ru: ["разница", "сравнить", "между", "versus", "или"],
            zh: ["区别", "比较", "之间", "还是"],
            ja: ["違い", "比較", "の間", "それとも"],
            ko: ["차이", "비교", "사이", "또는"],
            hi: ["अंतर", "तुलना", "के बीच", "या"],
            fa: ["تفاوت", "مقایسه", "بین", "یا"]
        },
        responses: {
            ar: {
                neutral: ["المقارنة بين الخيارات ضرورية لاتخاذ قرار صحيح. دعني أحلل لك:", "سأقارن لك بناءً على: السعر، الجودة، التقييمات، والميزات."]
            },
            en: {
                neutral: ["Comparing options is essential for making a right decision. Let me analyze:", "I'll compare based on: price, quality, reviews, and features."]
            },
            fr: {
                neutral: ["Comparer les options est essentiel pour prendre une bonne décision. Laissez-moi analyser:"]
            },
            de: {
                neutral: ["Der Vergleich von Optionen ist wichtig für eine richtige Entscheidung. Lassen Sie mich analysieren:"]
            },
            es: {
                neutral: ["Comparar opciones es esencial para tomar una decisión correcta. Déjeme analizar:"]
            },
            tr: {
                neutral: ["Seçenekleri karşılaştırmak doğru karar vermek için önemlidir. Analiz edeyim:"]
            },
            it: {
                neutral: ["Confrontare le opzioni è essenziale per prendere la decisione giusta. Lasciatemi analizzare:"]
            },
            pt: {
                neutral: ["Comparar opções é essencial para tomar a decisão certa. Deixe-me analisar:"]
            },
            ru: {
                neutral: ["Сравнение вариантов важно для правильного решения. Позвольте проанализировать:"]
            },
            zh: {
                neutral: ["比较选项对于做出正确决定至关重要。让我分析："]
            },
            ja: {
                neutral: ["オプションを比較することは正しい決定をするために重要です。分析させてください:"]
            },
            ko: {
                neutral: ["옵션 비교는 올바른 결정을 내리는 데 필수적입니다. 분석해 드리겠습니다:"]
            },
            hi: {
                neutral: ["विकल्पों की तुलना सही निर्णय लेने के लिए आवश्यक है। विश्लेषण करने दीजिए:"]
            },
            fa: {
                neutral: ["مقایسه گزینه‌ها برای تصمیم‌گیری صحیح ضروری است. بگذارید تحلیل کنم:"]
            }
        },
        priority: 4
    },
    {
        name: "technical_question",
        keywords: {
            ar: ["كيف", "لماذا", "ماهو", "اشرح", "طريقة", "مبدأ", "فكرة", "شرح"],
            en: ["how", "why", "what", "explain", "way", "method", "principle", "tell"],
            fr: ["comment", "pourquoi", "quoi", "expliquer", "méthode"],
            de: ["wie", "warum", "was", "erklären", "methode"],
            es: ["cómo", "por qué", "qué", "explicar", "método"],
            tr: ["nasıl", "neden", "ne", "açıkla", "yöntem"],
            it: ["come", "perché", "cosa", "spiegare", "metodo"],
            pt: ["como", "por que", "o que", "explicar", "método"],
            ru: ["как", "почему", "что", "объяснить", "метод"],
            zh: ["如何", "为什么", "什么", "解释", "方法"],
            ja: ["どのように", "なぜ", "何", "説明", "方法"],
            ko: ["어떻게", "왜", "무엇", "설명", "방법"],
            hi: ["कैसे", "क्यों", "क्या", "समझाएं", "तरीका"],
            fa: ["چگونه", "چرا", "چه", "توضیح", "روش"]
        },
        responses: {
            ar: {
                neutral: ["سأشرح لك بطريقة مبسطة:", "الفكرة الأساسية هي:", "دعني أوضح لك خطوة بخطوة:"]
            },
            en: {
                neutral: ["Let me explain it simply:", "The basic concept is:", "Let me walk you through it step by step:"]
            },
            fr: {
                neutral: ["Laissez-moi expliquer simplement:", "Le concept de base est:"]
            },
            de: {
                neutral: ["Lassen Sie mich es einfach erklären:", "Das Grundkonzept ist:"]
            },
            es: {
                neutral: ["Déjeme explicarlo de manera simple:", "El concepto básico es:"]
            },
            tr: {
                neutral: ["Basitçe açıklayayım:", "Temel kavram şudur:"]
            },
            it: {
                neutral: ["Lasciatemi spiegare semplicemente:", "Il concetto di base è:"]
            },
            pt: {
                neutral: ["Deixe-me explicar de forma simples:", "O conceito básico é:"]
            },
            ru: {
                neutral: ["Позвольте объяснить просто:", "Основная концепция:"]
            },
            zh: {
                neutral: ["让我简单地解释一下：", "基本概念是："]
            },
            ja: {
                neutral: ["簡単に説明させてください：", "基本的な概念は："]
            },
            ko: {
                neutral: ["간단히 설명해 드리겠습니다:", "기본 개념은:"]
            },
            hi: {
                neutral: ["मुझे आसानी से समझाने दीजिए:", "मूल अवधारणा है:"]
            },
            fa: {
                neutral: ["بگذارید ساده توضیح دهم:", "مفهوم اصلی این است:"]
            }
        },
        priority: 3
    },
    {
        name: "complaint",
        keywords: {
            ar: ["مشكلة", "عطل", "خربان", "ماشتغل", "لايعمل", "سيء", "يخرب", "عطلان", "مشكله"],
            en: ["problem", "issue", "broken", "not working", "defect", "faulty", "error", "doesn't work"],
            fr: ["problème", "panne", "cassé", "ne fonctionne pas", "défaut"],
            de: ["problem", "defekt", "kaputt", "funktioniert nicht", "fehler"],
            es: ["problema", "avería", "roto", "no funciona", "defecto"],
            tr: ["sorun", "bozuk", "çalışmıyor", "arızalı", "hata"],
            it: ["problema", "guasto", "rotto", "non funziona", "difetto"],
            pt: ["problema", "quebrado", "não funciona", "defeito", "erro"],
            ru: ["проблема", "сломан", "не работает", "дефект", "ошибка"],
            zh: ["问题", "坏了", "不工作", "故障", "错误"],
            ja: ["問題", "壊れた", "動かない", "欠陥", "エラー"],
            ko: ["문제", "고장", "작동하지 않음", "결함", "오류"],
            hi: ["समस्या", "टूटा", "काम नहीं कर रहा", "दोष", "त्रुटि"],
            fa: ["مشکل", "خراب", "کار نمی‌کند", "عیب", "خطا"]
        },
        responses: {
            ar: {
                neutral: ["أفهم أن لديك مشكلة. دعني أساعدك في حلها 💪", "لا تقلق، سنعمل معاً لإيجاد حل. ما هي المشكلة بالضبط؟", "أنا هنا لمساعدتك. صف لي المشكلة بالتفصيل."],
                negative: ["أسمعك وأشعر بإحباطك. دعنا نحل هذا معاً الآن! 🔧", "مشاكل المنتجات محبطة، لكن معظمها قابل للحل. ماذا حدث؟"]
            },
            en: {
                neutral: ["I understand you have a problem. Let me help you solve it 💪", "Don't worry, we'll work together to find a solution. What exactly is the issue?"],
                negative: ["I hear you and feel your frustration. Let's solve this together now! 🔧"]
            },
            fr: {
                neutral: ["Je comprends que vous avez un problème. Laissez-moi vous aider 💪"],
                negative: ["Je vous entends et je sens votre frustration. Résolvons cela ensemble maintenant! 🔧"]
            },
            de: {
                neutral: ["Ich verstehe, dass Sie ein Problem haben. Lassen Sie mich helfen 💪"],
                negative: ["Ich verstehe Ihre Frustration. Lassen Sie uns das jetzt zusammen lösen! 🔧"]
            },
            es: {
                neutral: ["Entiendo que tienes un problema. Déjame ayudarte 💪"],
                negative: ["Te escucho y siento tu frustración. ¡Resolvamos esto juntos ahora! 🔧"]
            },
            tr: {
                neutral: ["Bir sorununuz olduğunu anlıyorum. Yardımcı olmama izin verin 💪"],
                negative: ["Sizi duyuyor ve hayal kırıklığınızı hissediyorum. Hadi bunu birlikte çözelim! 🔧"]
            },
            it: {
                neutral: ["Capisco che hai un problema. Lasciami aiutare 💪"],
                negative: ["Ti sento e comprendo la tua frustrazione. Risolviamolo insieme ora! 🔧"]
            },
            pt: {
                neutral: ["Entendo que você tem um problema. Deixe-me ajudar 💪"],
                negative: ["Ouço você e sinto sua frustração. Vamos resolver isso juntos agora! 🔧"]
            },
            ru: {
                neutral: ["Понимаю, что у вас проблема. Позвольте помочь 💪"],
                negative: ["Я слышу вас и понимаю ваше разочарование. Давайте решим это вместе сейчас! 🔧"]
            },
            zh: {
                neutral: ["我理解您有问题。让我帮您解决 💪"],
                negative: ["我听到您的挫折感。让我们现在一起解决这个问题！🔧"]
            },
            ja: {
                neutral: ["問題があることを理解しています。手伝わせてください 💪"],
                negative: ["あなたの不満を聞いています。今すぐ一緒に解決しましょう！🔧"]
            },
            ko: {
                neutral: ["문제가 있다는 것을 이해합니다. 도와드리겠습니다 💪"],
                negative: ["당신의 좌절감을 듣고 있습니다. 지금 함께 해결합시다! 🔧"]
            },
            hi: {
                neutral: ["मैं समझता हूं कि आपको समस्या है। मुझे मदद करने दीजिए 💪"],
                negative: ["मैं आपकी निराशा महसूस कर रहा हूं। चलो अभी साथ मिलकर हल करते हैं! 🔧"]
            },
            fa: {
                neutral: ["می‌فهمم که مشکلی دارید. بگذارید کمک کنم 💪"],
                negative: ["شما را می‌شنوم و ناامیدی‌تان را درک می‌کنم. بیایید الان با هم حل کنیم! 🔧"]
            }
        },
        priority: 10
    },
    {
        name: "business_advice",
        keywords: {
            ar: ["مشروع", "ربح", "فلوس", "استثمار", "تجارة", "سوق", "بيزنس"],
            en: ["business", "money", "invest", "profit", "trade", "market", "startup"],
            fr: ["entreprise", "argent", "investir", "profit", "commerce"],
            de: ["geschäft", "geld", "investieren", "gewinn", "handel"],
            es: ["negocio", "dinero", "invertir", "ganancia", "comercio"],
            tr: ["iş", "para", "yatırım", "kâr", "ticaret"],
            it: ["affari", "soldi", "investire", "profitto", "commercio"],
            pt: ["negócio", "dinheiro", "investir", "lucro", "comércio"],
            ru: ["бизнес", "деньги", "инвестировать", "прибыль", "торговля"],
            zh: ["生意", "钱", "投资", "利润", "商业"],
            ja: ["ビジネス", "お金", "投資", "利益", "貿易"],
            ko: ["사업", "돈", "투자", "수익", "무역"],
            hi: ["व्यापार", "पैसा", "निवेश", "मुनाफा", "व्यापार"],
            fa: ["کسب و کار", "پول", "سرمایه‌گذاری", "سود", "تجارت"]
        },
        responses: {
            ar: {
                neutral: ["أي مشروع ناجح يبدأ بـ: فكرة واضحة + خطة مدروسة + تنفيذ متقن.", "النجاح في الأعمال يحتاج: دراسة السوق + التميز + خدمة ممتازة.", "نصيحتي: ابدأ صغيراً، تعلم من الأخطاء، طور باستمرار."]
            },
            en: {
                neutral: ["Any successful project starts with: a clear idea + a studied plan + excellent execution.", "Business success needs: market research + differentiation + excellent service.", "My advice: start small, learn from mistakes, keep improving."]
            },
            fr: {
                neutral: ["Tout projet réussi commence par: une idée claire + un plan étudié + une excellente exécution."]
            },
            de: {
                neutral: ["Jedes erfolgreiche Projekt beginnt mit: einer klaren Idee + einem durchdachten Plan + hervorragender Umsetzung."]
            },
            es: {
                neutral: ["Cualquier proyecto exitoso comienza con: una idea clara + un plan estudiado + una ejecución excelente."]
            },
            tr: {
                neutral: ["Başarılı her proje şununla başlar: net bir fikir + çalışılmış bir plan + mükemmel uygulama."]
            },
            it: {
                neutral: ["Ogni progetto di successo inizia con: un'idea chiara + un piano studiato + un'esecuzione eccellente."]
            },
            pt: {
                neutral: ["Qualquer projeto de sucesso começa com: uma ideia clara + um plano estudado + uma execução excelente."]
            },
            ru: {
                neutral: ["Любой успешный проект начинается с: четкой идеи + изученного плана + отличного выполнения."]
            },
            zh: {
                neutral: ["任何成功的项目始于：清晰的想法 + 研究的计划 + 优秀的执行。"]
            },
            ja: {
                neutral: ["成功するプロジェクトはすべて次で始まります：明確なアイデア + 研究された計画 + 優れた実行。"]
            },
            ko: {
                neutral: ["모든 성공적인 프로젝트는 명확한 아이디어 + 연구된 계획 + 훌륭한 실행으로 시작됩니다."]
            },
            hi: {
                neutral: ["कोई भी सफल प्रोजेक्ट इससे शुरू होता है: स्पष्ट विचार + अध्ययन किया गया योजना + उत्कृष्ट निष्पादन।"]
            },
            fa: {
                neutral: ["هر پروژه موفق با این شروع می‌شود: ایده واضح + برنامه مطالعه شده + اجرای عالی."]
            }
        },
        priority: 2
    },
    {
        name: "thanks",
        keywords: {
            ar: ["شكرا", "شكراً", "مشكور", "ممنون", "جزاك", "الله يعطيك", "شكرا جزيلا"],
            en: ["thanks", "thank", "appreciate", "grateful", "thx", "thank you"],
            fr: ["merci", "remercie", "reconnaissant"],
            de: ["danke", "dankbar", "vielen dank"],
            es: ["gracias", "agradezco", "muchas gracias"],
            tr: ["teşekkürler", "teşekkür", "sağol", "çok teşekkür"],
            it: ["grazie", "ringrazio", "grazie mille"],
            pt: ["obrigado", "agradeço", "muito obrigado"],
            ru: ["спасибо", "благодарю", "большое спасибо"],
            zh: ["谢谢", "感谢", "非常感谢"],
            ja: ["ありがとう", "ありがとうございます", "感謝"],
            ko: ["감사", "고마워요", "감사합니다"],
            hi: ["धन्यवाद", "शुक्रिया", "बहुत धन्यवाद"],
            fa: ["ممنون", "مرسی", "متشکرم", "خیلی ممنون"]
        },
        responses: {
            ar: {
                neutral: ["العفو! 😊 سعيد بمساعدتك", "لا شكر على واجب! 🙏", "في خدمتك دائماً! ✨"],
                positive: ["عفواً يا صديقي! 🤗 كان من دواعي سروري مساعدتك!", "أنت رائع! 🌟 دائماً هنا لأجلك!"]
            },
            en: {
                neutral: ["You're welcome! 😊 Happy to help", "No problem at all! 🙏", "Always at your service! ✨"],
                positive: ["You're so welcome, friend! 🤗 It was my pleasure!", "You're awesome! 🌟 Always here for you!"]
            },
            fr: {
                neutral: ["De rien! 😊 Heureux de vous aider", "Pas de problème! 🙏"],
                positive: ["Je vous en prie, ami! 🤗 C'était un plaisir!"]
            },
            de: {
                neutral: ["Gern geschehen! 😊 Froh zu helfen", "Kein Problem! 🙏"],
                positive: ["Sehr gerne, Freund! 🤗 Es war mir ein Vergnügen!"]
            },
            es: {
                neutral: ["¡De nada! 😊 Feliz de ayudar", "¡No hay problema! 🙏"],
                positive: ["¡De nada, amigo! 🤗 ¡Fue un placer!"]
            },
            tr: {
                neutral: ["Rica ederim! 😊 Yardımcı olmaktan mutluluk duydum", "Sorun değil! 🙏"],
                positive: ["Rica ederim dostum! 🤗 Memnuniyetle!"]
            },
            it: {
                neutral: ["Prego! 😊 Felice di aiutare", "Nessun problema! 🙏"],
                positive: ["Prego amico! 🤗 È stato un piacere!"]
            },
            pt: {
                neutral: ["De nada! 😊 Feliz em ajudar", "Sem problemas! 🙏"],
                positive: ["De nada, amigo! 🤗 Foi um prazer!"]
            },
            ru: {
                neutral: ["Пожалуйста! 😊 Рад помочь", "Без проблем! 🙏"],
                positive: ["Пожалуйста, друг! 🤗 Было приятно!"]
            },
            zh: {
                neutral: ["不客气！😊 很高兴能帮到你", "没问题！🙏"],
                positive: ["不客气，朋友！🤗 很高兴能帮助您！"]
            },
            ja: {
                neutral: ["どういたしまして！😊 お手伝いできて嬉しいです", "問題ありません！🙏"],
                positive: ["どういたしまして、友達！🤗 喜んでお手伝いしました！"]
            },
            ko: {
                neutral: ["천만에요! 😊 도와드려서 기뻐요", "문제없어요! 🙏"],
                positive: ["천만에요 친구! 🤗 기꺼이 도와드렸어요!"]
            },
            hi: {
                neutral: ["स्वागत है! 😊 मदद करके खुशी हुई", "कोई बात नहीं! 🙏"],
                positive: ["स्वागत है दोस्त! 🤗 मुझे खुशी हुई!"]
            },
            fa: {
                neutral: ["خواهش می‌کنم! 😊 خوشحال که کمک کردم", "مشکلی نیست! 🙏"],
                positive: ["خواهش می‌کنم دوست! 🤗 خوشحال شدم!"]
            }
        },
        priority: 1
    },
    {
        name: "goodbye",
        keywords: {
            ar: ["وداعا", "مع السلامة", "باي", "سلام", "الى اللقاء", "مع السلامه"],
            en: ["bye", "goodbye", "see you", "later", "cya", "farewell", "good bye"],
            fr: ["au revoir", "adieu", "à bientôt", "bye"],
            de: ["tschüss", "auf wiedersehen", "bis bald", "bye"],
            es: ["adiós", "hasta luego", "chao", "bye"],
            tr: ["güle güle", "hoşça kal", "bye", "görüşürüz"],
            it: ["arrivederci", "ciao", "a presto", "addio"],
            pt: ["tchau", "adeus", "até logo", "até mais"],
            ru: ["пока", "до свидания", "прощай", "до скорого"],
            zh: ["再见", "拜拜", "回头见"],
            ja: ["さようなら", "バイバイ", "またね"],
            ko: ["안녕", "잘 가", "또 봐", "바이"],
            hi: ["अलविदा", "बाय", "फिर मिलेंगे"],
            fa: ["خداحافظ", "بای", "به امید دیدار"]
        },
        responses: {
            ar: {
                neutral: ["مع السلامة! 👋 أتمنى لك يوماً سعيداً", "إلى اللقاء! 🌟 كان سعيداً بمساعدتك", "وداعاً! 🙏 لا تتردد في العودة متى احتجتني"],
                positive: ["إلى اللقاء يا صديقي! 🎉 أتمنى لك كل التوفيق!", "باي باي! 🚀 أراك قريباً!"]
            },
            en: {
                neutral: ["Goodbye! 👋 Have a great day", "See you! 🌟 It was happy to help you", "Farewell! 🙏 Don't hesitate to come back anytime"],
                positive: ["Goodbye, friend! 🎉 Wishing you all the best!", "Bye bye! 🚀 See you soon!"]
            },
            fr: {
                neutral: ["Au revoir! 👋 Passez une bonne journée", "À bientôt! 🌟 Heureux de vous avoir aidé"],
                positive: ["Au revoir, ami! 🎉 Je vous souhaite tout le meilleur!"]
            },
            de: {
                neutral: ["Auf Wiedersehen! 👋 Einen schönen Tag noch", "Bis bald! 🌟 War froh, Ihnen zu helfen"],
                positive: ["Auf Wiedersehen, Freund! 🎉 Alles Gute!"]
            },
            es: {
                neutral: ["¡Adiós! 👋 Que tengas un buen día", "¡Hasta luego! 🌟 Fue feliz ayudarte"],
                positive: ["¡Adiós, amigo! 🎉 ¡Te deseo todo lo mejor!"]
            },
            tr: {
                neutral: ["Güle güle! 👋 İyi günler", "Hoşça kal! 🌟 Yardımcı olmaktan mutluydum"],
                positive: ["Güle güle dostum! 🎉 Her şeyin en iyisini dilerim!"]
            },
            it: {
                neutral: ["Arrivederci! 👋 Buona giornata", "A presto! 🌟 Felice di averti aiutato"],
                positive: ["Arrivederci amico! 🎉 Ti auguro tutto il meglio!"]
            },
            pt: {
                neutral: ["Adeus! 👋 Tenha um bom dia", "Até logo! 🌟 Foi feliz em ajudá-lo"],
                positive: ["Adeus, amigo! 🎉 Desejo tudo de melhor!"]
            },
            ru: {
                neutral: ["До свидания! 👋 Хорошего дня", "Пока! 🌟 Рад был помочь"],
                positive: ["Пока, друг! 🎉 Желаю всего наилучшего!"]
            },
            zh: {
                neutral: ["再见！👋 祝你有美好的一天", "回头见！🌟 很高兴帮助您"],
                positive: ["再见朋友！🎉 祝你一切顺利！"]
            },
            ja: {
                neutral: ["さようなら！👋 良い一日を", "またね！🌟 お手伝いできて嬉しかったです"],
                positive: ["さようなら友達！🎉 全ての幸せを祈っています！"]
            },
            ko: {
                neutral: ["안녕! 👋 좋은 하루 되세요", "또 봐요! 🌟 도와드려서 기뻤어요"],
                positive: ["안녕 친구! 🎉 모든 행복을 빌어요!"]
            },
            hi: {
                neutral: ["अलविदा! 👋 शुभ दिन", "फिर मिलेंगे! 🌟 मदद करके खुशी हुई"],
                positive: ["अलविदा दोस्त! 🎉 शुभकामनाएं!"]
            },
            fa: {
                neutral: ["خداحافظ! 👋 روز خوبی داشته باشید", "به امید دیدار! 🌟 کمک کردن خوشحال‌کننده بود"],
                positive: ["خداحافظ دوست! 🎉 همه چیز خوب برات آرزو می‌کنم!"]
            }
        },
        priority: 1
    },
    {
        name: "unclear",
        keywords: {},
        responses: {
            ar: {
                neutral: ["سؤالك مثير للاهتمام 🤔 حاول توضيحه أكثر لأعطيك إجابة أدق.", "أحتاج المزيد من السياق لأفهم ما تريده بالضبط.", "هل يمكنك إعادة صياغة سؤالك بطريقة مختلفة?"]
            },
            en: {
                neutral: ["Interesting question 🤔 Try to clarify more for a better answer.", "I need more context to understand exactly what you want.", "Could you rephrase your question differently?"]
            },
            fr: {
                neutral: ["Question intéressante 🤔 Essayez de préciser pour une meilleure réponse."]
            },
            de: {
                neutral: ["Interessante Frage 🤔 Versuchen Sie es genauer zu erklären für eine bessere Antwort."]
            },
            es: {
                neutral: ["Pregunta interesante 🤔 Intenta aclarar más para una mejor respuesta."]
            },
            tr: {
                neutral: ["İlginç soru 🤔 Daha iyi bir cevap için daha fazla açıklayın."]
            },
            it: {
                neutral: ["Domanda interessante 🤔 Cerca di chiarire di più per una risposta migliore."]
            },
            pt: {
                neutral: ["Pergunta interessante 🤔 Tente esclarecer mais para uma resposta melhor."]
            },
            ru: {
                neutral: ["Интересный вопрос 🤔 Попробуйте уточнить для лучшего ответа."]
            },
            zh: {
                neutral: ["有趣的问题 🤔 试着更清楚地解释以获得更好的答案。"]
            },
            ja: {
                neutral: ["面白い質問 🤔 より良い回答のために詳しく説明してください。"]
            },
            ko: {
                neutral: ["흥미로운 질문 🤔 더 나은 답변을 위해 더 명확히 설명해 주세요."]
            },
            hi: {
                neutral: ["दिलचस्प सवाल 🤔 बेहतर जवाब के लिए और स्पष्ट करें।"]
            },
            fa: {
                neutral: ["سوال جالب 🤔 برای پاسخ بهتر بیشتر توضیح دهید."]
            }
        },
        priority: 0
    }
];

// ================= محرك الذاكرة والنوايا المتقدم =================

function detectIntentAdvanced(tokens, bigrams, trigrams, entities, context, lang) {
    let candidates = [];

    intents.forEach(intent => {
        let score = 0;
        
        const currentLangKeywords = intent.keywords?.[lang] || [];
        const allKeywords = [...currentLangKeywords, ...(intent.keywords?.en || [])];

        tokens.forEach(token => {
            allKeywords.forEach(keyword => {
                if (token === keyword) score += 3;
                else if (token.includes(keyword) || keyword.includes(token)) score += 2;
            });
        });

        if (intent.patterns) {
            const originalText = tokens.join(' ');
            intent.patterns.forEach(pattern => {
                if (pattern.test(originalText)) score += 5;
            });
        }

        if (context.recentIntents.includes(intent.name)) {
            score += 1;
        }

        if (intent.priority) {
            score += intent.priority;
        }

        if (score > 0) {
            candidates.push({ intent, score });
        }
    });

    candidates.sort((a, b) => b.score - a.score);

    return candidates[0]?.intent || intents.find(i => i.name === "unclear");
}

function buildSmartResponse(intent, sentiment, entities, context, originalMessage, lang) {
    const responses = intent.responses?.[lang] || intent.responses?.en;
    
    if (!responses) {
        return "🤔 عذراً، لم أفهم سؤالك.";
    }

    const moodResponses = responses[sentiment.mood] || responses.neutral;
    let baseResponse = moodResponses[Math.floor(Math.random() * moodResponses.length)];

    let entityInfo = "";
    
    if (entities.prices.length > 0) {
        const prices = entities.prices.map(p => p.raw).join(", ");
        entityInfo += ` (${prices})`;
    }
    
    if (entities.products.length > 0) {
        const products = [...new Set(entities.products)].join(", ");
        entityInfo += lang === 'ar' ? ` 📦 ${products}` : ` 📦 ${products}`;
    }

    let contextInfo = "";
    
    if (sentiment.isUrgent) {
        contextInfo += " 🚨";
    }
    
    if (sentiment.hasEmojis) {
        contextInfo += " 😊";
    }

    let followUp = "";
    if (intent.followUp && intent.followUp[lang]) {
        const followUps = intent.followUp[lang];
        followUp = "\n\n" + followUps[Math.floor(Math.random() * followUps.length)];
    }

    return baseResponse + entityInfo + contextInfo + followUp;
}

function generateContextualFallback(context, lang) {
    const lastIntent = context.recentIntents[context.recentIntents.length - 1];
    
    const fallbacks = {
        ar: {
            after_price: "هل تريد معرفة المزيد عن الأسعار أم لديك سؤال آخر؟",
            after_recommendation: "هل وجدت التوصية مفيدة؟ هل تريد خيارات إضافية؟",
            after_technical: "هل الشرح واضح؟ أحتاج أوضح أكثر؟",
            default: "سؤالك مثير للاهتمام 🤔 هل يمكنك توضيح أكثر؟"
        },
        en: {
            after_price: "Do you want to know more about prices or do you have another question?",
            after_recommendation: "Did you find the recommendation helpful? Want more options?",
            after_technical: "Is the explanation clear? Do I need to explain more?",
            default: "Interesting question 🤔 Can you clarify more?"
        },
        fr: {
            default: "Question intéressante 🤔 Pouvez-vous préciser?"
        },
        de: {
            default: "Interessante Frage 🤔 Können Sie mehr erklären?"
        },
        es: {
            default: "Pregunta interesante 🤔 ¿Puede aclarar más?"
        },
        tr: {
            default: "İlginç soru 🤔 Daha fazla açıklayabilir misiniz?"
        },
        it: {
            default: "Domanda interessante 🤔 Puoi chiarire di più?"
        },
        pt: {
            default: "Pergunta interessante 🤔 Pode esclarecer mais?"
        },
        ru: {
            default: "Интересный вопрос 🤔 Можете уточнить?"
        },
        zh: {
            default: "有趣的问题 🤔 能解释更多吗？"
        },
        ja: {
            default: "面白い質問 🤔 もっと説明できますか？"
        },
        ko: {
            default: "흥미로운 질문 🤔 더 설명해 주시겠어요?"
        },
        hi: {
            default: "दिलचस्प सवाल 🤔 और स्पष्ट करें?"
        },
        fa: {
            default: "سوال جالب 🤔 می‌توانید بیشتر توضیح دهید؟"
        }
    };

    const langFallbacks = fallbacks[lang] || fallbacks.en;
    
    if (lastIntent === "price_inquiry") return langFallbacks.after_price || langFallbacks.default;
    if (lastIntent === "product_recommendation") return langFallbacks.after_recommendation || langFallbacks.default;
    if (lastIntent === "technical_question") return langFallbacks.after_technical || langFallbacks.default;
    
    return langFallbacks.default;
}

// ================= دالة معالجة الرسائل الرئيسية - تم تصحيحها =================

/**
 * معالجة رسالة الدردشة
 * @param {string} message - رسالة المستخدم
 * @param {string} userId - معرف المستخدم (اختياري)
 * @returns {Object} نتيجة المعالجة
 */
function processChatMessage(message, userId = 'guest') {
    try {
        // كشف اللغة
        const lang = detectLanguage(message);
        
        // معالجة النص
        const { tokens, bigrams, trigrams } = tokenizeAdvanced(message);
        
        // تحليل المشاعر
        const sentiment = analyzeSentiment(tokens, message, lang);
        
        // استخراج الكيانات
        const entities = extractEntities(message);
        
        // الحصول على السياق
        const context = memory.getContext();
        
        // كشف النية
        const intent = detectIntentAdvanced(tokens, bigrams, trigrams, entities, context, lang);
        
        // إضافة التفاعل للذاكرة
        memory.addInteraction(intent, entities, sentiment.mood, message, lang);
        
        // بناء الرد
        const response = buildSmartResponse(intent, sentiment, entities, context, message, lang);
        
        // إرجاع النتيجة مع response و reply (لكلاهما)
        return {
            response: response,
            reply: response,  // ✅ تمت إضافة reply ليتوافق مع السيرفر
            intent: intent.name,
            sentiment: sentiment.mood,
            language: lang,
            entities: {
                prices: entities.prices,
                products: entities.products,
                brands: entities.brands
            },
            isUrgent: sentiment.isUrgent,
            confidence: sentiment.confidence,
            userId: userId
        };
    } catch (error) {
        console.error('Chat Engine Error:', error);
        return {
            response: '🤔 عذراً، حدث خطأ في معالجة رسالتك.',
            reply: '🤔 عذراً، حدث خطأ في معالجة رسالتك.',
            intent: 'error',
            sentiment: 'neutral',
            language: 'ar',
            entities: {},
            error: error.message
        };
    }
}

// ================= تصدير الوحدات =================

module.exports = {
    memory,
    intents,
    analyzeSentiment,
    extractEntities,
    detectLanguage,
    supportedLanguages,
    processChatMessage,
    ConversationMemory,
    NaturalLanguageUnderstanding,
    normalizeText,
    tokenizeAdvanced,
    detectIntentAdvanced,
    buildSmartResponse,
    generateContextualFallback
};
