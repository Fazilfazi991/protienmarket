(function () {
  const root = document.querySelector("[data-quiz-app]");
  if (!root) return;
  const products = window.QUIZ_PRODUCTS || [];
  const productName = (product) => window.I18N?.productName(product) || product.name;
  const productDescription = (product) => window.I18N?.productDescription(product) || product.description;
  const priceBlock = (amount) => window.ShopMoney?.priceBlock(amount) || `<strong>AED ${Number(amount || 0).toFixed(2)}</strong>`;
  const steps = [
    { key: "goal", title: "What is your main goal?", options: ["Lose Fat", "Build Muscle", "Maintain Fitness", "Athletic Performance"] },
    { key: "dietPreference", title: "What is your diet preference?", options: ["No Preference", "Vegetarian", "Vegan", "Non-Vegetarian"] },
    { key: "preferredProductType", title: "How do you prefer to get your protein?", options: ["Protein Shake", "Meal Plan", "Bars & Snacks", "Fresh Protein", "Not Sure"] },
    { key: "training", title: "How often do you train?", options: ["0-1 days/week", "2-3 days/week", "4-5 days/week", "6+ days/week"] },
    { key: "budget", title: "What is your monthly budget?", options: ["Under AED 150", "AED 150-300", "AED 300-500", "AED 500+"] }
  ];
  let index = 0;
  const answers = {};
  const stepNode = root.querySelector("[data-quiz-step]");
  const progress = root.querySelector("[data-quiz-progress]");
  const result = root.querySelector("[data-quiz-result]");
  const next = root.querySelector("[data-quiz-next]");
  const back = root.querySelector("[data-quiz-back]");

  function score(product) {
    let points = 0;
    const tags = product.tags || [];
    const goals = product.goals || [];
    if (answers.dietPreference === "Vegan" && product.category === "vegan-protein") points += 8;
    if ((product.diet || []).includes(answers.dietPreference)) points += 2;
    if (goals.includes(answers.goal)) points += 5;
    if (answers.goal === "Lose Fat" && ["thermogenic", "clear-protein", "fit-diet"].includes(product.subcategory)) points += 5;
    if (answers.goal === "Build Muscle" && ["whey-protein", "mass-gainers", "bars"].includes(product.subcategory)) points += 5;
    if (answers.preferredProductType === "Meal Plan" && product.category === "meal-plan") points += 6;
    if (answers.preferredProductType === "Bars & Snacks" && product.category === "bars-snacks") points += 6;
    if (answers.preferredProductType === "Fresh Protein" && product.category === "fresh-protein") points += 6;
    if (answers.preferredProductType === "Protein Shake" && (product.category === "protein" || product.subcategory.includes("protein"))) points += 6;
    if (answers.budget === "Under AED 150" && product.price <= 150) points += 4;
    if (answers.budget === "AED 500+" && (tags.includes("meal-plan") || product.category === "meal-plan")) points += 3;
    return points;
  }

  function renderStep() {
    const step = steps[index];
    progress.style.width = `${((index + 1) / steps.length) * 100}%`;
    stepNode.innerHTML = `<p class="eyebrow">Step ${index + 1} of ${steps.length}</p><h2>${step.title}</h2><div class="option-grid">${step.options.map((option) => `<button class="option-card ${answers[step.key] === option ? "is-active" : ""}" type="button" data-answer="${option}">${option}</button>`).join("")}</div>`;
    stepNode.querySelectorAll("[data-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        answers[step.key] = button.dataset.answer;
        renderStep();
      });
    });
    back.hidden = index === 0;
    next.textContent = index === steps.length - 1 ? "Show Results" : "Next";
  }

  function card(product) {
    return `<article class="recommendation-card"><img src="${product.image}" alt="${productName(product)}" loading="lazy"><h3>${productName(product)}</h3><p>${productDescription(product)}</p>${priceBlock(product.price)}<button class="btn btn--gold" type="button" data-add-quiz-product="${product.id}">${window.I18N?.t("buttons.addToCart", "Add to Cart") || "Add to Cart"}</button></article>`;
  }

  function showResults() {
    const matched = products.slice().sort((a, b) => score(b) - score(a)).slice(0, 6);
    const stack = matched.slice(0, 3);
    localStorage.setItem("customerGoalProfile", JSON.stringify({ ...answers, lastUpdated: new Date().toISOString() }));
    root.querySelector("[data-result-type]").textContent = answers.dietPreference === "Vegan" ? "Vegan Protein Routine" : `${answers.goal} Routine`;
    root.querySelector("[data-result-copy]").textContent = "These products match your goal, preference, budget, and routine using rule-based recommendations.";
    root.querySelector("[data-result-products]").innerHTML = matched.map(card).join("");
    root.querySelector("[data-result-stack]").innerHTML = stack.map((product) => `<li>${productName(product)} ${priceBlock(product.price)}</li>`).join("");
    root.querySelector("[data-quiz-whatsapp]").href = `https://wa.me/971553271712?text=${encodeURIComponent("Hi, I completed the Find My Protein quiz. Can you review my recommendations for " + answers.goal + "?")}`;
    result.hidden = false;
  }

  next.addEventListener("click", () => {
    const step = steps[index];
    if (!answers[step.key]) return;
    if (index < steps.length - 1) {
      index += 1;
      renderStep();
    } else {
      showResults();
    }
  });
  back.addEventListener("click", () => {
    index = Math.max(0, index - 1);
    renderStep();
  });
  root.querySelector("[data-retake-quiz]").addEventListener("click", () => {
    Object.keys(answers).forEach((key) => delete answers[key]);
    index = 0;
    result.hidden = true;
    renderStep();
  });
  root.querySelector("[data-add-quiz-stack]").addEventListener("click", () => {
    const ids = Array.from(root.querySelectorAll("[data-result-stack] li")).map((_, i) => products.slice().sort((a, b) => score(b) - score(a))[i]?.id).filter(Boolean);
    window.dispatchEvent(new CustomEvent("protein:add-stack", { detail: ids }));
  });
  window.addEventListener("languageChanged", () => {
    renderStep();
    if (!result.hidden) showResults();
  });
  renderStep();
})();
