
export function smartRank(results, query) {
  const intent = extractIntent(query);

  return results.map(p => ({
    ...p,
    smartScore: scoreProduct(p, intent),
    explanation: explain(p, intent)
  })).sort((a, b) => b.smartScore - a.smartScore);
}

function extractIntent(query) {
  const budgetMatch = query.match(/(\d+)\s?\$/);
  return {
    raw: query,
    budget: budgetMatch ? Number(budgetMatch[1]) : null
  };
}

function scoreProduct(product, intent) {
  let score = 0;

  if (intent.budget && product.price) {
    const diff = Math.abs(product.price - intent.budget);
    score += Math.max(0, 1 - diff / intent.budget) * 0.5;
  }

  if (product.rating) {
    score += (product.rating / 5) * 0.3;
  }

  if (product.popularity) {
    score += Math.min(product.popularity / 1000, 1) * 0.2;
  }

  return score;
}

function explain(p, intent) {
  let r = [];

  if (intent.budget && p.price <= intent.budget)
    r.push("ضمن ميزانيتك");

  if (p.rating >= 4.5)
    r.push("تقييم ممتاز");

  return r.join(" • ");
}
