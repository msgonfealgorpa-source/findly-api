// ================= SMART CHAT ENGINE v5.0 - GEMINI AI FREE =================
// محرك دردشة ذكي مدعوم بـ Google Gemini - مجاني للأبد

const axios = require('axios');

// ================= إعدادات Gemini =================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-1.5-flash'; // مجاني وسريع
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ================= دعم اللغات =================
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

// ================= نظام ذاكرة المحادثات =================
class ConversationMemory {
    constructor() {
        this.sessions = new Map();
    }

    getSession(sessionId) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                messages: [],
                language: null
            });
        }
        return this.sessions.get(sessionId);
    }

    addMessage(sessionId, role, content) {
        const session = this.getSession(sessionId);
        session.messages.push({ role, content });
        if (session.messages.length > 20) {
            session.messages = session.messages.slice(-20);
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
}

const memory = new ConversationMemory();

// ================= كشف اللغة =================
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
    
    const lowerText = text.toLowerCase();
    if (/\b(le|la|les|bonjour|merci|salut)\b/.test(lowerText)) return 'fr';
    if (/\b(der|die|das|hallo|danke)\b/.test(lowerText)) return 'de';
    if (/\b(hola|gracias|buenos)\b/.test(lowerText)) return 'es';
    if (/\b(merhaba|teşekkür|nasıl)\b/.test(lowerText)) return 'tr';
    if (/\b(ciao|grazie|come)\b/.test(lowerText)) return 'it';
    if (/\b(olá|obrigado|como)\b/.test(lowerText)) return 'pt';
    
    return 'en';
}

// ================= نظام الـ Prompts =================
function getSystemPrompt(lang) {
    const prompts = {
        ar: `أنت Findly Sage، مساعد ذكي للتسوق.

مهامك:
- مساعدة المستخدمين في العثور على أفضل المنتجات والأسعار
- تقديم نصائح شرائية ذكية ومفيدة
- الإجابة على أسئلة المستخدمين بطريقة ودية

قواعد الرد:
- كن ودوداً ومحترفاً
- قدم إجابات مفيدة ومختصرة (لا تتجاوز 100 كلمة)
- استخدم الإيموجي بشكل معتدل
- أجب باللغة العربية فقط`,

        en: `You are Findly Sage, a smart shopping assistant.

Your tasks:
- Help users find the best products and prices
- Provide smart shopping advice
- Answer questions in a friendly way

Response rules:
- Be friendly and professional
- Give useful and concise answers (max 100 words)
- Use emojis moderately
- Answer in English only`,

        fr: `Vous êtes Findly Sage, un assistant shopping intelligent.

Vos tâches:
- Aider les utilisateurs à trouver les meilleurs produits
- Donner des conseils d'achat

Règles:
- Soyez amical et professionnel
- Réponses concises (max 100 mots)
- Répondez en français uniquement`,

        de: `Sie sind Findly Sage, ein intelligenter Einkaufsassistent.

Ihre Aufgaben:
- Helfen Sie Benutzern, die besten Produkte zu finden
- Geben Sie Einkaufstipps

Regeln:
- Seien Sie freundlich und professionell
- Kurze Antworten (max 100 Wörter)
- Antworten Sie auf Deutsch`,

        es: `Eres Findly Sage, un asistente de compras inteligente.

Tus tareas:
- Ayudar a los usuarios a encontrar los mejores productos
- Dar consejos de compra

Reglas:
- Sé amigable y profesional
- Respuestas concisas (máx 100 palabras)
- Responde solo en español`,

        tr: `Sen Findly Sage, akıllı bir alışveriş asistanısın.

Görevlerin:
- Kullanıcılara en iyi ürünleri bulmada yardımcı olmak
- Alışveriş tavsiyeleri vermek

Kurallar:
- Dostane ve profesyonel ol
- Kısa yanıtlar (maks 100 kelime)
- Sadece Türkçe yanıt ver`,

        it: `Sei Findly Sage, un assistente shopping intelligente.

I tuoi compiti:
- Aiutare gli utenti a trovare i migliori prodotti
- Dare consigli di acquisto

Regole:
- Sii amichevole e professionale
- Risposte concise (max 100 parole)
- Rispondi solo in italiano`,

        pt: `Você é Findly Sage, um assistente de compras inteligente.

Suas tarefas:
- Ajudar os usuários a encontrar os melhores produtos
- Dar conselhos de compra

Regras:
- Seja amigável e profissional
- Respostas concisas (máx 100 palavras)
- Responda apenas em português`,

        ru: `Вы — Findly Sage, умный помощник по покупкам.

Ваши задачи:
- Помогать пользователям находить лучшие товары
- Давать советы по покупкам

Правила:
- Будьте дружелюбны и профессиональны
- Краткие ответы (макс 100 слов)
- Отвечайте только на русском`,

        zh: `你是 Findly Sage，智能购物助手。

你的任务：
- 帮助用户找到最好的产品
- 提供购物建议

规则：
- 友好专业
- 简洁回答（最多100字）
- 只用中文回答`,

        ja: `あなたはFindly Sage、スマートショッピングアシスタントです。

あなたのタスク：
- ユーザーが最高の商品を見つけるのを助ける
- 買い物のアドバイスを提供する

ルール：
- 友好的でプロフェッショナル
- 簡潔な回答（最大100語）
- 日本語でのみ回答`,

        ko: `당신은 Findly Sage, 스마트 쇼핑 어시스턴트입니다.

당신의 임무:
- 사용자가 최고의 제품을 찾도록 도움
- 쇼핑 조언 제공

규칙:
- 친근하고 전문적
- 간결한 답변 (최대 100단어)
- 한국어로만 답변`,

        hi: `आप Findly Sage हैं, स्मार्ट शॉपिंग असिस्टेंट।

आपके कार्य:
- उपयोगकर्ताओं को सर्वश्रेष्ठ उत्पाद खोजने में मदद
- खरीदारी सलाह देना

नियम:
- दोस्ताना और पेशेवर
- संक्षिप्त उत्तर (अधिकतम 100 शब्द)
- केवल हिंदी में जवाब`,

        fa: `شما Findly Sage هستید، دستیار هوشمند خرید.

وظایف شما:
- کمک به کاربران برای پیدا کردن بهترین محصولات
- ارائه مشاوره خرید

قوانین:
- دوستانه و حرفه‌ای
- پاسخ‌های مختصر (حداکثر 100 کلمه)
- فقط به فارسی پاسخ دهید`
    };
    
    return prompts[lang] || prompts.en;
}

// ================= الردود الاحتياطية =================
function getFallbackResponse(lang, intent) {
    const fallbacks = {
        greeting: {
            ar: "مرحباً بك! 👋 كيف يمكنني مساعدتك اليوم؟",
            en: "Hello! 👋 How can I help you today?",
            fr: "Bonjour! 👋 Comment puis-je vous aider?",
            de: "Hallo! 👋 Wie kann ich Ihnen helfen?",
            es: "¡Hola! 👋 ¿Cómo puedo ayudarte?",
            tr: "Merhaba! 👋 Nasıl yardımcı olabilirim?",
            default: "Hello! 👋 How can I help you?"
        },
        thanks: {
            ar: "العفو! 😊 سعيد بمساعدتك!",
            en: "You're welcome! 😊 Happy to help!",
            default: "You're welcome! 😊"
        },
        goodbye: {
            ar: "مع السلامة! 👋 نتمنى لك يوماً سعيداً!",
            en: "Goodbye! 👋 Have a great day!",
            default: "Goodbye! 👋"
        },
        error: {
            ar: "عذراً، حدث خطأ. حاول مرة أخرى! 🔄",
            en: "Sorry, an error occurred. Please try again! 🔄",
            default: "Sorry, an error occurred. 🔄"
        },
        noApiKey: {
            ar: "⚠️ لم يتم تفعيل الذكاء الاصطناعي. أضف GEMINI_API_KEY في Railway.",
            en: "⚠️ AI not activated. Add GEMINI_API_KEY in Railway.",
            default: "⚠️ AI not activated. Add GEMINI_API_KEY."
        }
    };
    
    const intentFallbacks = fallbacks[intent] || fallbacks.error;
    return intentFallbacks[lang] || intentFallbacks.default;
}

// ================= كشف النية السريع =================
function detectQuickIntent(message) {
    const lower = message.toLowerCase();
    
    if (/^(hi|hello|hey|مرحبا|اهلا|السلام|bonjour|hola|ciao|merhaba|olá|привет|你好|こんにちは|안녕)/i.test(lower)) {
        return 'greeting';
    }
    if (/(thanks|thank|شكرا|merci|danke|gracias|teşekkür|grazie|obrigado|спасибо|谢谢|ありがとう|감사)/i.test(lower)) {
        return 'thanks';
    }
    if (/(bye|goodbye|وداعا|مع السلامة|au revoir|adiós|hoşça kal|arrivederci|tchau|пока|再见|さようなら|안녕)/i.test(lower)) {
        return 'goodbye';
    }
    
    return null;
}

// ================= استدعاء Gemini API =================
async function callGeminiAPI(systemPrompt, userMessage, history = []) {
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY not set');
        return null;
    }
    
    try {
        // بناء المحتوى
        const contents = [];
        
        // إضافة التاريخ
        for (const msg of history) {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }
        
        // إضافة الرسالة الحالية
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
                    topP: 0.8
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            }
        );
        
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || null;
        
    } catch (error) {
        console.error('❌ Gemini API Error:', error.response?.data || error.message);
        return null;
    }
}

// ================= دالة معالجة الرسائل =================
async function processChatMessage(message, userId = 'guest') {
    try {
        // التحقق من الرسالة
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
        
        // كشف اللغة
        const lang = detectLanguage(cleanMessage);
        memory.setLanguage(userId, lang);
        
        // كشف النية السريعة
        const quickIntent = detectQuickIntent(cleanMessage);
        
        // إضافة رسالة المستخدم للذاكرة
        memory.addMessage(userId, 'user', cleanMessage);
        
        // محاولة استدعاء Gemini
        let aiResponse = null;
        
        if (GEMINI_API_KEY) {
            const systemPrompt = getSystemPrompt(lang);
            const history = memory.getHistory(userId).slice(-8); // آخر 8 رسائل
            
            aiResponse = await callGeminiAPI(systemPrompt, cleanMessage, history);
        } else {
            console.warn('⚠️ No GEMINI_API_KEY - using fallback');
        }
        
        // تحديد الرد النهائي
        let response;
        
        if (aiResponse) {
            response = aiResponse;
        } else if (!GEMINI_API_KEY) {
            response = getFallbackResponse(lang, 'noApiKey');
        } else if (quickIntent) {
            response = getFallbackResponse(lang, quickIntent);
        } else {
            const fallbacks = {
                ar: 'أنا هنا لمساعدتك! 🤖 اسألني عن المنتجات والأسعار.',
                en: "I'm here to help! 🤖 Ask me about products and prices.",
                default: "I'm here to help! 🤖"
            };
            response = fallbacks[lang] || fallbacks.default;
        }
        
        // إضافة الرد للذاكرة
        memory.addMessage(userId, 'assistant', response);
        
        console.log(`💬 Chat [${userId}]: "${cleanMessage.substring(0, 30)}..." -> Lang: ${lang}`);
        
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

// ================= تصدير =================
module.exports = {
    processChatMessage,
    supportedLanguages,
    detectLanguage,
    memory
};
