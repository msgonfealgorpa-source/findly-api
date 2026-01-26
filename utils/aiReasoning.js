function generateSmartExplanation(brain, products, lang = "ar") {
    const hasSpecs = brain.targetSpecs.ram || brain.targetSpecs.battery;
    
    const messages = {
        ar: {
            intro: `حللت طلبك لـ "${brain.raw}".`,
            logic: hasSpecs ? "ركزت في اختياراتي على المنتجات التي تطابق المواصفات التقنية التي طلبتها." : "رتبت لك أفضل الخيارات بناءً على التقييمات والسعر العادل.",
            ending: "هل تريدني أن أبحث عن مواصفات أعلى أو ميزانية مختلفة؟ 👌"
        },
        en: {
            intro: `I analyzed your search for "${brain.raw}".`,
            logic: hasSpecs ? "I prioritized devices that match your specific hardware requirements." : "I ranked the best available options based on ratings and fair pricing.",
            ending: "Need higher specs or a different budget? Just ask! 👌"
        }
    };

    const m = messages[lang] || messages['en'];
    return `${m.intro}\n\n• ${m.logic}\n\n${m.ending}`;
}

module.exports = { generateSmartExplanation };
