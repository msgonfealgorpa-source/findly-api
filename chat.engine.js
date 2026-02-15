// ================= SMART CHAT ENGINE v5.0 - AI POWERED & FREE =================
// محرك دردشة ذكي مدعوم بالذكاء الاصطناعي - مجاني 100%

const ZAI = require('z-ai-web-dev-sdk').default;

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
                language: null,
                context: {}
            });
        }
        return this.sessions.get(sessionId);
    }

    addMessage(sessionId, role, content) {
        const session = this.getSession(sessionId);
        session.messages.push({ role, content });
        
        // الحفاظ على آخر 20 رسالة فقط
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
    // العربية
    if (/[\u0600-\u06FF]/.test(text)) {
        if (/چ|گ|پ|ژ/.test(text)) return 'fa'; // فارسي
        return 'ar';
    }
    // الصينية
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
    // اليابانية
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
    // الكورية
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
    // الروسية
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
    // الهندية
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    
    // اللغات اللاتينية
    const lowerText = text.toLowerCase();
    
    if (/\b(le|la|les|bonjour|merci|salut|comment|vous)\b/.test(lowerText)) return 'fr';
    if (/\b(der|die|das|hallo|danke|wie|ich|bin)\b/.test(lowerText)) return 'de';
    if (/\b(hola|gracias|buenos|como|estas|que)\b/.test(lowerText)) return 'es';
    if (/\b(merhaba|teşekkür|nasıl|iyi|gün)\b/.test(lowerText)) return 'tr';
    if (/\b(ciao|grazie|come|stai|buongiorno)\b/.test(lowerText)) return 'it';
    if (/\b(olá|obrigado|como|você|bom)\b/.test(lowerText)) return 'pt';
    
    return 'en';
}

// ================= نظام الـ Prompts الذكي =================
function getSystemPrompt(lang) {
    const prompts = {
        ar: `أنت Findly Sage، مساعد ذكي للتسوق والتسعير. 

مهامك:
- مساعدة المستخدمين في العثور على أفضل المنتجات والأسعار
- تقديم نصائح شرائية ذكية ومفيدة
- الإجابة على أسئلة المستخدمين بطريقة ودية ومحترفة
- مقارنة المنتجات والأسعار عند الطلب

قواعد الرد:
- كن ودوداً ومحترفاً دائماً
- قدم إجابات مفيدة ومختصرة (لا تتجاوز 150 كلمة)
- استخدم الإيموجي بشكل معتدل لجعل الرد أكثر حيوية
- إذا سأل المستخدم عن منتج، اسأله عن ميزانيته واحتياجاته
- إذا سأل عن سعر، قدم نصائح للحصول على أفضل سعر

أجب دائماً باللغة العربية.`,
        
        en: `You are Findly Sage, an intelligent shopping and pricing assistant.

Your tasks:
- Help users find the best products and prices
- Provide smart and useful shopping advice
- Answer users' questions in a friendly and professional manner
- Compare products and prices on request

Response rules:
- Always be friendly and professional
- Give useful and concise answers (no more than 150 words)
- Use emojis moderately to make responses more lively
- If user asks about a product, ask about their budget and needs
- If user asks about price, give tips for getting the best price

Always respond in English.`,
        
        fr: `Vous êtes Findly Sage, un assistant intelligent pour le shopping.

Vos tâches:
- Aider les utilisateurs à trouver les meilleurs produits et prix
- Fournir des conseils d'achat intelligents et utiles
- Répondre aux questions de manière amicale et professionnelle

Règles de réponse:
- Soyez toujours amical et professionnel
- Donnez des réponses utiles et concises (pas plus de 150 mots)
- Utilisez des emojis avec modération

Répondez toujours en français.`,
        
        de: `Sie sind Findly Sage, ein intelligenter Einkaufsassistent.

Ihre Aufgaben:
- Helfen Sie Benutzern, die besten Produkte und Preise zu finden
- Geben Sie intelligente und nützliche Einkaufstipps
- Beantworten Sie Fragen freundlich und professionell

Antwortregeln:
- Seien Sie immer freundlich und professionell
- Geben Sie nützliche und prägnante Antworten (nicht mehr als 150 Wörter)
- Verwenden Sie Emojis sparsam

Antworten Sie immer auf Deutsch.`,
        
        es: `Eres Findly Sage, un asistente inteligente de compras.

Tus tareas:
- Ayudar a los usuarios a encontrar los mejores productos y precios
- Proporcionar consejos de compra inteligentes y útiles
- Responder preguntas de manera amigable y profesional

Reglas de respuesta:
- Siempre sé amigable y profesional
- Da respuestas útiles y concisas (no más de 150 palabras)
- Usa emojis con moderación

Responde siempre en español.`,
        
        tr: `Sen Findly Sage, akıllı bir alışveriş asistanısın.

Görevlerin:
- Kullanıcılara en iyi ürünleri ve fiyatları bulmalarında yardımcı olmak
- Akıllı ve yararlı alışveriş tavsiyeleri vermek
- Soruları dostane ve profesyonel bir şekilde yanıtlamak

Yanıt kuralları:
- Her zaman dostane ve profesyonel ol
- Yararlı ve özlü yanıtlar ver (150 kelimeyi geçme)
- Emoji'leri ölçülü kullan

Her zaman Türkçe yanıt ver.`,
        
        it: `Sei Findly Sage, un assistente intelligente per lo shopping.

I tuoi compiti:
- Aiutare gli utenti a trovare i migliori prodotti e prezzi
- Fornire consigli di acquisto intelligenti e utili
- Rispondere alle domande in modo amichevole e professionale

Regole di risposta:
- Sii sempre amichevole e professionale
- Fornisci risposte utili e concise (non più di 150 parole)
- Usa le emoji con moderazione

Rispondi sempre in italiano.`,
        
        pt: `Você é Findly Sage, um assistente inteligente de compras.

Suas tarefas:
- Ajudar os usuários a encontrar os melhores produtos e preços
- Fornecer conselhos de compra inteligentes e úteis
- Responder perguntas de forma amigável e profissional

Regras de resposta:
- Seja sempre amigável e profissional
- Dê respostas úteis e concisas (não mais de 150 palavras)
- Use emojis com moderação

Responda sempre em português.`,
        
        ru: `Вы — Findly Sage, умный помощник по покупкам.

Ваши задачи:
- Помогать пользователям находить лучшие товары и цены
- Давать умные и полезные советы по покупкам
- Отвечать на вопросы дружелюбно и профессионально

Правила ответов:
- Всегда будьте дружелюбны и профессиональны
- Давайте полезные и краткие ответы (не более 150 слов)
- Используйте эмодзи умеренно

Отвечайте всегда на русском языке.`,
        
        zh: `你是 Findly Sage，一个智能购物助手。

你的任务：
- 帮助用户找到最好的产品和价格
- 提供智能有用的购物建议
- 友好专业地回答问题

回答规则：
- 始终保持友好和专业
- 给出有用简洁的回答（不超过150字）
- 适度使用表情符号

始终用中文回答。`,
        
        ja: `あなたはFindly Sage、スマートなショッピングアシスタントです。

あなたのタスク：
- ユーザーが最高の商品と価格を見つけるのを助ける
- スマートで役立つ買い物のアドバイスを提供する
- 友好的でプロフェッショナルに質問に答える

回答ルール：
- 常に友好的でプロフェッショナルでいる
- 役立つ簡潔な回答を与える（150語以内）
- 絵文字を適度に使う

常に日本語で答えてください。`,
        
        ko: `당신은 Findly Sage, 스마트 쇼핑 어시스턴트입니다.

당신의 임무:
- 사용자가 최고의 제품과 가격을 찾도록 도움
- 스마트하고 유용한 쇼핑 조언 제공
- 친근하고 전문적으로 질문에 답변

답변 규칙:
- 항상 친근하고 전문적이세요
- 유용하고 간결한 답변 제공 (150단어 이내)
- 이모지를 적당히 사용하세요

항상 한국어로 답변하세요.`,
        
        hi: `आप Findly Sage हैं, एक स्मार्ट शॉपिंग असिस्टेंट।

आपके कार्य:
- उपयोगकर्ताओं को सर्वश्रेष्ठ उत्पाद और कीमतें खोजने में मदद करना
- स्मार्ट और उपयोगी खरीदारी सलाह देना
- दोस्ताना और पेशेवर तरीके से सवालों के जवाब देना

उत्तर नियम:
- हमेशा दोस्ताना और पेशेवर रहें
- उपयोगी और संक्षिप्त उत्तर दें (150 शब्दों से अधिक नहीं)
- इमोजी का संयमित उपयोग करें

हमेशा हिंदी में जवाब दें।`,
        
        fa: `شما Findly Sage هستید، یک دستیار هوشمند خرید.

وظایف شما:
- کمک به کاربران برای پیدا کردن بهترین محصولات و قیمت‌ها
- ارائه مشاوره خرید هوشمند و مفید
- پاسخ به سوالات به صورت دوستانه و حرفه‌ای

قوانین پاسخ:
- همیشه دوستانه و حرفه‌ای باشید
- پاسخ‌های مفید و مختصر بدهید (بیشتر از 150 کلمه نه)
- از ایموجی به میزان کم استفاده کنید

همیشه به فارسی پاسخ دهید.`
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
            fr: "De rien! 😊 Heureux d'aider!",
            default: "You're welcome! 😊"
        },
        goodbye: {
            ar: "مع السلامة! 👋 نتمنى لك يوماً سعيداً!",
            en: "Goodbye! 👋 Have a great day!",
            fr: "Au revoir! 👋 Bonne journée!",
            default: "Goodbye! 👋"
        },
        error: {
            ar: "عذراً، حدث خطأ بسيط. حاول مرة أخرى! 🔄",
            en: "Sorry, a small error occurred. Please try again! 🔄",
            default: "Sorry, an error occurred. Please try again! 🔄"
        }
    };
    
    const intentFallbacks = fallbacks[intent] || fallbacks.error;
    return intentFallbacks[lang] || intentFallbacks.default;
}

// ================= كشف النية السريع =================
function detectQuickIntent(message) {
    const lower = message.toLowerCase();
    
    // ترحيب
    if (/^(hi|hello|hey|مرحبا|اهلا|السلام|bonjour|hola|ciao|merhaba|olá|привет|你好|こんにちは|안녕)/i.test(lower)) {
        return 'greeting';
    }
    
    // شكر
    if (/(thanks|thank|شكرا|merci|danke|gracias|teşekkür|grazie|obrigado|спасибо|谢谢|ありがとう|감사)/i.test(lower)) {
        return 'thanks';
    }
    
    // وداع
    if (/(bye|goodbye|وداعا|مع السلامة|au revoir|adiós|hoşça kal|arrivederci|tchau|пока|再见|さようなら|안녕)/i.test(lower)) {
        return 'goodbye';
    }
    
    return null;
}

// ================= تهيئة ZAI =================
let zaiInstance = null;

async function initZAI() {
    if (!zaiInstance) {
        try {
            zaiInstance = await ZAI.create();
            console.log('✅ ZAI SDK initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize ZAI SDK:', error.message);
        }
    }
    return zaiInstance;
}

// ================= دالة معالجة الرسائل الرئيسية =================
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
        
        // حفظ اللغة في الذاكرة
        memory.setLanguage(userId, lang);
        
        // كشف النية السريعة للردود البسيطة
        const quickIntent = detectQuickIntent(cleanMessage);
        
        // إضافة رسالة المستخدم للذاكرة
        memory.addMessage(userId, 'user', cleanMessage);
        
        // محاولة استخدام AI
        let aiResponse = null;
        
        try {
            const zai = await initZAI();
            
            if (zai) {
                // بناء المحادثة
                const systemPrompt = getSystemPrompt(lang);
                const history = memory.getHistory(userId);
                
                const messages = [
                    { role: 'assistant', content: systemPrompt },
                    ...history.slice(-10) // آخر 10 رسائل للسياق
                ];
                
                const completion = await zai.chat.completions.create({
                    messages: messages,
                    thinking: { type: 'disabled' }
                });
                
                aiResponse = completion.choices[0]?.message?.content;
            }
        } catch (aiError) {
            console.error('AI Error:', aiError.message);
        }
        
        // إذا فشل AI، استخدم الرد الاحتياطي
        let response = aiResponse;
        
        if (!response || response.trim() === '') {
            if (quickIntent) {
                response = getFallbackResponse(lang, quickIntent);
            } else {
                // رد ذكي احتياطي بناءً على اللغة
                const fallbacks = {
                    ar: 'أنا هنا لمساعدتك! 🤖 يمكنك سؤالي عن المنتجات والأسعار والتوصيات.',
                    en: "I'm here to help! 🤖 You can ask me about products, prices, and recommendations.",
                    fr: "Je suis là pour vous aider! 🤖 Vous pouvez me demander des produits, des prix et des recommandations.",
                    de: "Ich bin hier, um zu helfen! 🤖 Sie können mich nach Produkten, Preisen und Empfehlungen fragen.",
                    es: "¡Estoy aquí para ayudarte! 🤖 Puedes preguntarme sobre productos, precios y recomendaciones.",
                    tr: "Yardım etmek için buradayım! 🤖 Ürünler, fiyatlar ve öneriler hakkında sorabilirsiniz.",
                    default: "I'm here to help! 🤖 Ask me about products, prices, and recommendations."
                };
                response = fallbacks[lang] || fallbacks.default;
            }
        }
        
        // إضافة رد AI للذاكرة
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
        console.error('Chat Engine Error:', error.message);
        
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

// ================= تصدير الوحدات =================
module.exports = {
    processChatMessage,
    supportedLanguages,
    detectLanguage,
    memory,
    initZAI
};
