// ================= SMART CHAT ENGINE v4.0 - MULTILINGUAL ULTRA =================
// هذا الملف يصدر دالة وليس router

const NaturalLanguageUnderstanding = {
  sentimentLexicon: {
    positive: {
      ar: ["ممتاز", "رائع", "جميل", "حلو", "مذهل", "افضل", "احسنت", "شكرا", "سعيد", "محبوب", "نجاح"],
      en: ["awesome", "great", "love", "amazing", "excellent", "good", "nice", "perfect", "wonderful"],
      fr: ["excellent", "superbe", "magnifique", "génial", "merci", "parfait"],
      de: ["ausgezeichnet", "wunderbar", "großartig", "perfekt", "danke", "toll"],
      es: ["excelente", "maravilloso", "genial", "perfecto", "gracias"],
      tr: ["mükemmel", "harika", "süper", "teşekkürler"],
      it: ["eccellente", "meraviglioso", "fantastico", "grazie"],
      pt: ["excelente", "maravilhoso", "fantástico", "obrigado"],
      ru: ["отлично", "прекрасно", "замечательно", "спасибо"],
      zh: ["很好", "太棒了", "完美", "谢谢"],
      ja: ["素晴らしい", "完璧", "ありがとう"],
      ko: ["훌륭한", "완벽한", "감사합니다"],
      hi: ["बहुत अच्छा", "शानदार", "धन्यवाद"],
      fa: ["عالی", "مرسی", "فوق‌العاده"]
    },
    negative: {
      ar: ["سيء", "مشكله", "غلط", "غبي", "احبط", "فشل", "خسارة", "مخيف"],
      en: ["bad", "hate", "poor", "terrible", "awful", "worst", "horrible"],
      fr: ["mauvais", "nul", "terrible", "horrible"],
      de: ["schlecht", "schrecklich", "enttäuschend"],
      es: ["malo", "terrible", "horrible"],
      tr: ["kötü", "berbat", "sorun"],
      it: ["cattivo", "terribile", "orribile"],
      pt: ["ruim", "terrível", "horrível"],
      ru: ["плохо", "ужасно", "проблема"],
      zh: ["不好", "糟糕", "问题"],
      ja: ["悪い", "ひどい", "問題"],
      ko: ["나쁜", "끔찍한", "문제"],
      hi: ["बुरा", "भयानक", "समस्या"],
      fa: ["بد", "وحشتناک", "مشکل"]
    }
  },
  entityPatterns: {
    price: /\b(\d+[\.,]?\d*)\s*(دولار|ريال|درهم|\$|USD|EUR)\b/gi,
    product: /\b(ايفون|iphone|سامسونج|samsung|لابتوب|laptop|هاتف|phone|ساعة|watch)\b/gi,
    brand: /\b(apple|sony|lg|xiaomi|huawei|nike|adidas|samsung|google|microsoft)\b/gi,
    number: /\b\d+\.?\d*\b/g
  }
};

const supportedLanguages = {
  ar: { name: "العربية", flag: "🇸🇦" },
  en: { name: "English", flag: "🇺🇸" },
  fr: { name: "Français", flag: "🇫🇷" },
  de: { name: "Deutsch", flag: "🇩🇪" },
  es: { name: "Español", flag: "🇪🇸" },
  tr: { name: "Türkçe", flag: "🇹🇷" },
  it: { name: "Italiano", flag: "🇮🇹" },
  pt: { name: "Português", flag: "🇧🇷" },
  ru: { name: "Русский", flag: "🇷🇺" },
  zh: { name: "中文", flag: "🇨🇳" },
  ja: { name: "日本語", flag: "🇯🇵" },
  ko: { name: "한국어", flag: "🇰🇷" },
  hi: { name: "हिन्दी", flag: "🇮🇳" },
  fa: { name: "فارسی", flag: "🇮🇷" }
};

// الذاكرة
const sessions = new Map();

// كشف اللغة
function detectLanguage(text) {
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  return 'en';
}

// تحليل المشاعر
function analyzeSentiment(text, lang) {
  const textLower = text.toLowerCase();
  const lexicon = NaturalLanguageUnderstanding.sentimentLexicon;
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  const positiveWords = lexicon.positive[lang] || lexicon.positive.en;
  const negativeWords = lexicon.negative[lang] || lexicon.negative.en;
  
  positiveWords.forEach(w => { if (textLower.includes(w)) positiveCount++; });
  negativeWords.forEach(w => { if (textLower.includes(w)) negativeCount++; });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// استخراج الكيانات
function extractEntities(text) {
  const entities = { prices: [], products: [], brands: [] };
  
  const priceMatches = text.match(NaturalLanguageUnderstanding.entityPatterns.price);
  if (priceMatches) entities.prices = priceMatches;
  
  const productMatches = text.match(NaturalLanguageUnderstanding.entityPatterns.product);
  if (productMatches) entities.products = [...new Set(productMatches)];
  
  const brandMatches = text.match(NaturalLanguageUnderstanding.entityPatterns.brand);
  if (brandMatches) entities.brands = [...new Set(brandMatches)];
  
  return entities;
}

// الردود
const responses = {
  ar: {
    greeting: ["مرحباً بك! 👋 كيف يمكنني مساعدتك اليوم؟", "أهلاً وسهلاً! 😊 أنا هنا لمساعدتك", "تشرفت بك! ✨ ما الذي تبحث عنه؟"],
    price_inquiry: ["سأساعدك في العثور على أفضل الأسعار! ما المنتج الذي تبحث عنه؟", "يمكنني مقارنة الأسعار من متاجر متعددة. أخبرني عن المنتج."],
    product_recommendation: ["للحصول على أفضل توصية، أحتاج معرفة ميزانيتك واستخدامك.", "سأعطيك أفضل التوصيات! ما نوع المنتج الذي تبحث عنه؟"],
    comparison: ["سأقارن لك المنتجات! ما المنتجات التي تريد مقارنتها؟", "المقارنة بين المنتجات تساعدك على اتخاذ قرار صائب."],
    technical_question: ["سأشرح لك بطريقة مبسطة. ما الذي تريد معرفته؟", "أنا هنا للإجابة على أسئلتك التقنية."],
    complaint: ["أفهم أن لديك مشكلة. دعني أساعدك في حلها 💪", "لا تقلق، سنعمل معاً لإيجاد حل."],
    business_advice: ["أي مشروع ناجح يبدأ بفكرة واضحة وخطة مدروسة.", "النجاح في الأعمال يحتاج دراسة السوق والتميز."],
    thanks: ["العفو! 😊 سعيد بمساعدتك", "لا شكر على واجب! 🙏", "في خدمتك دائماً! ✨"],
    goodbye: ["مع السلامة! 👋 أتمنى لك يوماً سعيداً", "إلى اللقاء! 🌟 كان سعيداً بمساعدتك"],
    unclear: ["سؤالك مثير للاهتمام 🤔 حاول توضيحه أكثر.", "أحتاج المزيد من السياق لأفهم ما تريده."]
  },
  en: {
    greeting: ["Hello! 👋 How can I help you today?", "Hi there! 😊 I'm here to assist you", "Welcome! ✨ What are you looking for?"],
    price_inquiry: ["I'll help you find the best prices! What product are you interested in?", "I can compare prices from multiple stores. Tell me what you're looking for."],
    product_recommendation: ["For the best recommendation, I need to know your budget and usage.", "I'll give you the best recommendations! What type of product are you looking for?"],
    comparison: ["I'll compare products for you! What products do you want to compare?", "Product comparisons help you make smart decisions."],
    technical_question: ["I'll explain it simply. What do you want to know?", "I'm here to answer your technical questions."],
    complaint: ["I understand you have a problem. Let me help you solve it 💪", "Don't worry, we'll work together to find a solution."],
    business_advice: ["Any successful project starts with a clear idea and a studied plan.", "Business success needs market research and differentiation."],
    thanks: ["You're welcome! 😊 Happy to help", "No problem at all! 🙏", "Always at your service! ✨"],
    goodbye: ["Goodbye! 👋 Have a great day", "See you! 🌟 It was happy to help you"],
    unclear: ["Interesting question 🤔 Try to clarify more.", "I need more context to understand what you want."]
  }
};

// كشف النية
function detectIntent(text, lang) {
  const textLower = text.toLowerCase();
  
  const keywords = {
    greeting: lang === 'ar' ? 
      ['مرحبا', 'اهلا', 'السلام', 'صباح', 'مساء', 'هاي', 'هلا'] :
      ['hi', 'hello', 'hey', 'good morning', 'good evening'],
    price_inquiry: lang === 'ar' ?
      ['سعر', 'كم', 'بكم', 'تكلفة', 'قيمة', 'فلوس'] :
      ['price', 'cost', 'how much', 'cheap', 'expensive'],
    product_recommendation: lang === 'ar' ?
      ['افضل', 'تنصحني', 'اختار', 'مناسب', 'توصية'] :
      ['best', 'recommend', 'suggest', 'which', 'choose'],
    comparison: lang === 'ar' ?
      ['فرق', 'مقارنة', 'بين', 'قارن'] :
      ['difference', 'compare', 'versus', 'vs', 'between'],
    technical_question: lang === 'ar' ?
      ['كيف', 'لماذا', 'ماهو', 'اشرح', 'طريقة'] :
      ['how', 'why', 'what', 'explain'],
    complaint: lang === 'ar' ?
      ['مشكلة', 'عطل', 'خربان', 'ماشتغل', 'سيء'] :
      ['problem', 'issue', 'broken', 'not working', 'error'],
    thanks: lang === 'ar' ?
      ['شكرا', 'شكراً', 'مشكور', 'ممنون'] :
      ['thanks', 'thank', 'appreciate'],
    goodbye: lang === 'ar' ?
      ['وداعا', 'مع السلامة', 'باي', 'سلام'] :
      ['bye', 'goodbye', 'see you', 'later']
  };
  
  let maxIntent = 'unclear';
  let maxScore = 0;
  
  for (const [intent, words] of Object.entries(keywords)) {
    let score = 0;
    words.forEach(w => { if (textLower.includes(w)) score++; });
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent;
    }
  }
  
  return maxIntent;
}

// الحصول على رد
function getResponse(intent, sentiment, lang) {
  const langResponses = responses[lang] || responses.en;
  const intentResponses = langResponses[intent] || langResponses.unclear;
  
  let baseResponse = intentResponses[Math.floor(Math.random() * intentResponses.length)];
  
  return baseResponse;
}

// الدالة الرئيسية للتصدير
function processChatMessage(message, userId = 'guest') {
  // كشف اللغة
  const lang = detectLanguage(message);
  
  // تحليل المشاعر
  const sentiment = analyzeSentiment(message, lang);
  
  // استخراج الكيانات
  const entities = extractEntities(message);
  
  // كشف النية
  const intent = detectIntent(message, lang);
  
  // الحصول على رد
  const reply = getResponse(intent, sentiment, lang);
  
  // إضافة معلومات الكيانات
  let entityInfo = '';
  if (entities.prices.length > 0) {
    entityInfo += lang === 'ar' ? `\n💰 لاحظت أسعار: ${entities.prices.join(', ')}` : `\n💰 Prices noticed: ${entities.prices.join(', ')}`;
  }
  if (entities.products.length > 0) {
    entityInfo += lang === 'ar' ? `\n📦 منتجات: ${entities.products.join(', ')}` : `\n📦 Products: ${entities.products.join(', ')}`;
  }
  
  return {
    reply: reply + entityInfo,
    lang: {
      detected: lang,
      name: supportedLanguages[lang]?.name || lang,
      flag: supportedLanguages[lang]?.flag || '🌐'
    },
    intent,
    sentiment
  };
}

module.exports = { processChatMessage, supportedLanguages };
