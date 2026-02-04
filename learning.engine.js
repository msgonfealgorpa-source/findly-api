const memory = {};

function learningEngine(userId, verdict, outcome) {
  if (!memory[userId]) {
    memory[userId] = { correct: 0, wrong: 0 };
  }

  if (outcome === "bought") {
    memory[userId].correct++;
  } else {
    memory[userId].wrong++;
  }

  return {
    accuracy:
      memory[userId].correct /
      (memory[userId].correct + memory[userId].wrong || 1)
  };
}

module.exports = learningEngine;
