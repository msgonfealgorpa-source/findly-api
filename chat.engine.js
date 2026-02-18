/* =========================================
SMART CHAT ENGINE v5.0 - GEMINI AI
Intelligent Shopping Assistant
========================================= */

const axios = require('axios');

// ================= CONFIGURATION =================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ================= SUPPORTED LANGUAGES =================
const supportedLanguages = {
    ar: { name: "Arabic", native: "العربية", dir: "rtl", flag: "🇸🇦" },
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

// ================= CONVERSATION MEMORY =================
class ConversationMemory {
    constructor() {
        this.sessions = new Map();
        this.maxMessages = 20;
    }

    getSession(sessionId) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                messages: [],
                language: null,
                createdAt: Date.now()
            });
        }
        return this.sessions.get(sessionId);
    }

    addMessage(sessionId, role, content) {
        const session = this.getSession(sessionId);
        session.messages.push({ 
            role, 
            content, 
            timestamp: Date.now() 
        });
        
        // Keep only last N messages
        if (session.messages.length > this.maxMessages) {
            session.messages = session.messages.slice(-this.maxMessages);
        }
    }

    getHistory(sessionId) {
        return this.getSession(sessionId).messages;
    }

    setLanguage(sessionId, lang) {
        this.getSession(sessionId).language = lang;
    }

    getLanguage(sessionId) {
        return this.getSession(sessionId).language;
    }

    clearSession(sessionId) {
        this.sessions.delete(sessionId);
    }

    // Clean old sessions (run periodically)
    cleanOldSessions(maxAge = 3600000) { // 1 hour
        const now = Date.now();
        for (const [id, session] of this.sessions) {
            if (now - session.createdAt > maxAge) {
                this.sessions.delete(id);
            }
        }
    }
}

const memory = new ConversationMemory();

// Clean old sessions every 30 minutes
setInterval(() => memory.cleanOldSessions(), 1800000);

// ================= LANGUAGE DETECTION =================
function detectLanguage(text) {
    // Arabic
    if (/[\u0600-\u06FF]/.test(text)) {
        if (/چ|گ|پ|ژ/.test(text)) return 'fa'; // Persian
        return 'ar';
    }
    // Chinese
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
    // Japanese
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
    // Korean
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
    // Russian
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
    // Hindi
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    
    // European languages by keywords
    const lowerText = text.toLowerCase();
    if (/\b(le|la|les|bonjour|merci|salut|comment|pourquoi)\b/.test(lowerText)) return 'fr';
    if (/\b(der|die|das|hallo|danke|wie|warum|was)\b/.test(lowerText)) return 'de';
    if (/\b(hola|gracias|buenos|como|por|que)\b/.test(lowerText)) return 'es';
    if (/\b(merhaba|teşekkür|nasıl|neden)\b/.test(lowerText)) return 'tr';
    if (/\b(ciao|grazie|come|perché)\b/.test(lowerText)) return 'it';
    if (/\b(olá|obrigado|como|por|que)\b/.test(lowerText)) return 'pt';
    
    return 'en';
}

// ================= SYSTEM PROMPTS =================
function getSystemPrompt(lang) {
    const prompts = {
        ar: `أنت Findly Sage، مساعد ذكي للتسوق والمتخصص في مساعدة المستخدمين.

🎯 مهامك الأساسية:
• مساعدة المستخدمين في العثور على أفضل المنتجات بأسعار منافسة
• تقديم نصائح شرائية ذكية ومفيدة ومخصصة
• مقارنة المنتجات والأسعار من متاجر مختلفة
• الرد على استفسارات التسوق بأسلوب احترافي

📋 قواعد الرد:
• كن ودوداً ومحترفاً في جميع الأوقات
• قدم إجابات مفيدة ومختصرة (لا تتجاوز 150 كلمة)
• استخدم الإيموجي بشكل معتدل ومناسب
• أجب باللغة العربية فقط
• إذا سُئلت عن شيء خارج التسوق، وجه المحادثة برفق للموضوع`,

        en: `You are Findly Sage, an intelligent shopping assistant.

🎯 Your Main Tasks:
• Help users find the best products at competitive prices
• Provide smart and personalized shopping advice
• Compare products and prices from different stores
• Answer shopping queries professionally

📋 Response Rules:
• Be friendly and professional at all times
• Provide useful and concise answers (max 150 words)
• Use emojis moderately and appropriately
• Answer in English only
• If asked about non-shopping topics, gently redirect`,

        fr: `Vous êtes Findly Sage, un assistant shopping intelligent.

🎯 Vos tâches:
• Aider les utilisateurs à trouver les meilleurs produits
• Donner des conseils d'achat personnalisés
• Comparer les produits et les prix

📋 Règles:
• Soyez amical et professionnel
• Réponses concises (max 150 mots)
• Utilisez des émojis modérément
• Répondez en français uniquement`,

        de: `Sie sind Findly Sage, ein intelligenter Einkaufsassistent.

🎯 Ihre Aufgaben:
• Helfen Sie Benutzern, die besten Produkte zu finden
• Geben Sie personalisierte Einkaufstipps

📋 Regeln:
• Seien Sie freundlich und professionell
• Kurze Antworten (max 150 Wörter)
• Antworten Sie auf Deutsch`,

        es: `Eres Findly Sage, un asistente de compras inteligente.

🎯 Tus tareas:
• Ayudar a los usuarios a encontrar los mejores productos
• Dar consejos de compra personalizados

📋 Reglas:
• Sé amigable y profesional
• Respuestas concisas (máx 150 palabras)
• Responde solo en español`,

        tr: `Sen Findly Sage, akıllı bir alışveriş asistanısın.

🎯 Görevlerin:
• Kullanıcılara en iyi ürünleri bulmada yardımcı olmak
• Kişiselleştirilmiş alışveriş tavsiyeleri vermek

📋 Kurallar:
• Dostane ve profesyonel ol
• Kısa yanıtlar (maks 150 kelime)
• Sadece Türkçe yanıt ver`
    };
    
    return prompts[lang] || prompts.en;
}

// ================= FALLBACK RESPONSES =================
function getFallbackResponse(lang, intent) {
    const fallbacks = {
        greeting: {
            ar: "مرحباً بك! 👋 أنا Findly Sage، مساعدك الذكي للتسوق. كيف يمكنني مساعدتك اليوم؟",
            en: "Hello! 👋 I'm Findly Sage, your smart shopping assistant. How can I help you today?",
            fr: "Bonjour! 👋 Je suis Findly Sage, votre assistant shopping. Comment puis-je vous aider?",
            de: "Hallo! 👋 Ich bin Findly Sage, Ihr Einkaufsassistent. Wie kann ich helfen?",
            es: "¡Hola! 👋 Soy Findly Sage, tu asistente de compras. ¿Cómo puedo ayudarte?",
            tr: "Merhaba! 👋 Ben Findly Sage, akıllı alışveriş asistanınız. Nasıl yardımcı olabilirim?",
            default: "Hello! 👋 How can I help you today?"
        },
        thanks: {
            ar: "العفو! 😊 سعيد بمساعدتك! لا تتردد في طلب أي شيء آخر.",
            en: "You're welcome! 😊 Happy to help! Don't hesitate to ask anything else.",
            fr: "De rien! 😊 Ravi de vous aider!",
            de: "Gerne! 😊 Froh zu helfen!",
            es: "¡De nada! 😊 ¡Feliz de ayudar!",
            tr: "Rica ederim! 😊 Yardımcı olmak mutluluk verici!",
            default: "You're welcome! 😊"
        },
        goodbye: {
            ar: "مع السلامة! 👋 نتمنى لك يوماً سعيداً وتسوقاً ممتعاً!",
            en: "Goodbye! 👋 Have a great day and happy shopping!",
            fr: "Au revoir! 👋 Bonne journée!",
            de: "Auf Wiedersehen! 👋 Einen schönen Tag!",
            es: "¡Adiós! 👋 ¡Que tengas un gran día!",
            tr: "Hoşça kal! 👋 İyi günler!",
            default: "Goodbye! 👋"
        },
        error: {
            ar: "عذراً، حدث خطأ بسيط. 🔄 حاول مرة أخرى من فضلك!",
            en: "Sorry, a small error occurred. 🔄 Please try again!",
            default: "Sorry, an error occurred. 🔄"
        },
        noApiKey: {
            ar: "⚠️ لم يتم تفعيل الذكاء الاصطناعي بالكامل. أضف GEMINI_API_KEY في Railway لتفعيل جميع الميزات.",
            en: "⚠️ AI not fully activated. Add GEMINI_API_KEY in Railway to enable all features.",
            default: "⚠️ AI not fully activated."
        }
    };
    
    const intentFallbacks = fallbacks[intent] || fallbacks.error;
    return intentFallbacks[lang] || intentFallbacks.default;
}

// ================= QUICK INTENT DETECTION =================
function detectQuickIntent(message) {
    const lower = message.toLowerCase().trim();
    
    // Greetings
    if (/^(hi|hello|hey|مرحبا|اهلا|السلام عليكم|bonjour|hola|ciao|merhaba|olá|привет|你好|こんにちは|안녕)/i.test(lower)) {
        return 'greeting';
    }
    // Thanks
    if (/(thanks|thank you|شكرا|merci|danke|gracias|teşekkür|grazie|obrigado|спасибо|谢谢|ありがとう|감사)/i.test(lower)) {
        return 'thanks';
    }
    // Goodbye
    if (/(bye|goodbye|وداعا|مع السلامة|au revoir|adiós|hoşça kal|arrivederci|tchau|пока|再见|さようなら|안녕)/i.test(lower)) {
        return 'goodbye';
    }
    // Shopping intent
    if (/(buy|purchase|shop|شراء|اشتري|بحث|find|search|أفضل|cheap|رخيص|سعر|price)/i.test(lower)) {
        return 'shopping';
    }
    
    return null;
}

// ================= GEMINI API CALL =================
async function callGeminiAPI(systemPrompt, userMessage, history = []) {
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not configured');
        return null;
    }
    
    try {
        // Build conversation contents
        const contents = [];
        
        // Add conversation history
        for (const msg of history) {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }
        
        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });
        
        const response = await axios.post(
            `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: contents,
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 300,
                    topP: 0.8,
                    topK: 40
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ]
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 20000
            }
        );
        
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || null;
        
    } catch (error) {
        console.error('❌ Gemini API Error:', error.response?.data || error.message);
        return null;
    }
}

// ================= MAIN MESSAGE PROCESSOR =================
async function processChatMessage(message, userId = 'guest') {
    try {
        // Validate input
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return {
                response: '👋 مرحباً! كيف يمكنني مساعدتك؟',
                reply: '👋 مرحباً! كيف يمكنني مساعدتك؟',
                intent: 'empty',
                sentiment: 'neutral',
                language: 'ar'
            };
        }

        const cleanMessage = message.trim();
        
        // Detect language
        const lang = detectLanguage(cleanMessage);
        memory.setLanguage(userId, lang);
        
        // Quick intent detection
        const quickIntent = detectQuickIntent(cleanMessage);
        
        // Add user message to memory
        memory.addMessage(userId, 'user', cleanMessage);
        
        // Try AI response
        let aiResponse = null;
        
        if (GEMINI_API_KEY) {
            const systemPrompt = getSystemPrompt(lang);
            const history = memory.getHistory(userId).slice(-10); // Last 10 messages
            
            aiResponse = await callGeminiAPI(systemPrompt, cleanMessage, history);
        } else {
            console.warn('⚠️ No GEMINI_API_KEY - using fallback responses');
        }
        
        // Determine final response
        let response;
        
        if (aiResponse) {
            response = aiResponse;
        } else if (!GEMINI_API_KEY) {
            response = getFallbackResponse(lang, 'noApiKey');
        } else if (quickIntent) {
            response = getFallbackResponse(lang, quickIntent);
        } else {
            const fallbacks = {
                ar: 'أنا هنا لمساعدتك في التسوق! 🛒 اسألني عن أي منتج أو سعر.',
                en: "I'm here to help with your shopping! 🛒 Ask me about any product or price.",
                fr: "Je suis là pour vous aider! 🛒 Demandez-moi n'importe quel produit.",
                de: "Ich bin hier um zu helfen! 🛒 Fragen Sie mich nach Produkten.",
                es: "¡Estoy aquí para ayudarte! 🛒 Pregúntame sobre cualquier producto.",
                tr: "Alışverişte yardımcı olmak için buradayım! 🛒",
                default: "I'm here to help! 🛒"
            };
            response = fallbacks[lang] || fallbacks.default;
        }
        
        // Add response to memory
        memory.addMessage(userId, 'assistant', response);
        
        console.log(`💬 Chat [${userId}]: "${cleanMessage.substring(0, 30)}..." -> Lang: ${lang}, Intent: ${quickIntent || 'general'}`);
        
        return {
            response: response,
            reply: response,
            intent: quickIntent || 'general',
            sentiment: 'neutral',
            language: lang,
            entities: {},
            userId: userId
        };
        
    } catch (error) {
        console.error('❌ Chat Engine Error:', error.message);
        
        return {
            response: '🤔 عذراً، حدث خطأ. حاول مرة أخرى!',
            reply: '🤔 عذراً، حدث خطأ. حاول مرة أخرى!',
            intent: 'error',
            sentiment: 'neutral',
            language: 'ar',
            error: error.message
        };
    }
}

// ================= EXPORTS =================
module.exports = {
    processChatMessage,
    supportedLanguages,
    detectLanguage,
    memory,
    getSystemPrompt,
    getFallbackResponse
};
