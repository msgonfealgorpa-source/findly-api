function generateSmartExplanation(brain, products, lang = "en") {
  const templates = {
    ar: {
      intro: "حللت طلبك بدقة واخترت لك أفضل الخيارات بناءً على:",
      reasons: [
        "أفضل تقييم من المستخدمين",
        "أفضل سعر مقابل الجودة",
        "أعلى انتشار وشعبية",
        "مواصفات مناسبة لطلبك"
      ],
      ending: "إذا حاب تقارن أو تغيّر الميزانية أو المواصفات، قلّي 👌"
    },
    en: {
      intro: "I carefully analyzed your request and selected the best options based on:",
      reasons: [
        "Highest user ratings",
        "Best value for money",
        "Popularity and trust",
        "Matching your exact needs"
      ],
      ending: "Want to compare or change budget/specs? Just tell me 👌"
    },
    fr: {
      intro: "J'ai analysé votre demande et sélectionné les meilleurs choix selon :",
      reasons: [
        "Meilleures notes utilisateurs",
        "Meilleur rapport qualité-prix",
        "Grande popularité",
        "Correspondance parfaite à votre besoin"
      ],
      ending: "Souhaitez-vous comparer ou modifier votre budget ? 👌"
    },
    tr: {
      intro: "İsteğinizi dikkatlice analiz ettim ve en iyi seçenekleri şu kriterlere göre seçtim:",
      reasons: [
        "En yüksek kullanıcı puanı",
        "En iyi fiyat / performans",
        "Popülerlik",
        "İhtiyacınıza uygunluk"
      ],
      ending: "Karşılaştırmak veya bütçeyi değiştirmek ister misiniz? 👌"
    },
    es: {
      intro: "Analicé tu solicitud y seleccioné las mejores opciones basándome en:",
      reasons: [
        "Mejor calificación",
        "Mejor relación calidad-precio",
        "Popularidad",
        "Adecuación a tus necesidades"
      ],
      ending: "¿Quieres comparar o cambiar el presupuesto? 👌"
    }
  };

  const t = templates[lang] || templates["en"];

  return {
    intro: t.intro,
    reasons: t.reasons.slice(0, 3),
    ending: t.ending
  };
}

module.exports = { generateSmartExplanation };
