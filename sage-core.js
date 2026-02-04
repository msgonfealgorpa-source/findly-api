const intentEngine = require("./intent.engine");
const learningEngine = require("./learning.engine");
const profileEngine = require("./profile.engine");
const priceHistoryEngine = require("./price-history.engine");
const priceEngine = require("./price.engine");
const timingEngine = require("./timing.engine");
const trustEngine = require("./trust.engine");
const valueEngine = require("./value.engine");
const decisionEngine = require("./decision.engine");

function SageCore(
  product,
  allProducts,
  userEvents = {},
  userHistory = {},
  userId = "anonymous",
  userOutcome = null
) {
  const prices = allProducts
    .map(p => Number(p.price))
    .filter(p => !isNaN(p));

  const price = Number(product.price);

  // 🔍 التحليلات الأساسية
  const priceIntel = priceEngine(price, prices);
  const timingIntel = timingEngine(priceIntel);
  const trustIntel = trustEngine(product, priceIntel);
  const valueIntel = valueEngine(priceIntel, trustIntel);

  // 🧠 ذاكرة السعر
  const historyIntel = priceHistoryEngine(
    product.id || product.title,
    price
  );

  // 🧭 نية المستخدم
  const intent = intentEngine(userEvents);

  // 🎯 تخصيص القرار
  const profile = profileEngine(userHistory);

  // 🧠 القرار النهائي
  const finalVerdict = decisionEngine({
    priceIntel,
    timingIntel,
    trustIntel,
    valueIntel,
    historyIntel,
    intent,
    profile
  });

  // 📚 التعلم (إذا في نتيجة)
  const learning = userOutcome
    ? learningEngine(userId, finalVerdict.action, userOutcome)
    : null;

  return {
    priceIntel,
    timingIntel,
    trustIntel,
    valueIntel,
    historyIntel,
    intent,
    profile,
    learning,
    finalVerdict
  };
}

module.exports = SageCore;
