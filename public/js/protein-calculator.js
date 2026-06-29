(function () {
  const app = document.querySelector("[data-calculator-app]");
  if (!app) return;

  const cartKey = "proteinMarketCart";
  const resultKey = "proteinCalculatorResult";
  const products = window.PRODUCTS || [];
  const form = document.querySelector("[data-protein-form]");
  const button = document.querySelector("[data-calculate-button]");
  const emptyPanel = document.querySelector("[data-result-empty]");
  const dashboard = document.querySelector("[data-result-dashboard]");
  const recommendationsGrid = document.querySelector("[data-recommendation-grid]");
  const whatsappLink = document.querySelector("[data-whatsapp-result]");
  let currentRecommendations = [];
  let currentValues = null;
  const productName = (product) => window.I18N?.productName(product) || product.name;
  const priceBlock = (amount) => window.ShopMoney?.priceBlock(amount) || `<strong>AED ${Number(amount || 0).toFixed(2)}</strong>`;

  const goalMultipliers = {
    "Fat Loss": 2,
    "Muscle Gain": 2.2,
    "Maintenance": 1.6,
    "Athletic Performance": 2
  };

  const activityAdjustments = {
    "Sedentary": -0.1,
    "Lightly Active": 0,
    "Moderately Active": 0.05,
    "Very Active": 0.1,
    "Athlete": 0.15
  };

  const calorieActivity = {
    "Sedentary": 1.2,
    "Lightly Active": 1.375,
    "Moderately Active": 1.55,
    "Very Active": 1.725,
    "Athlete": 1.9
  };

  const activityLabels = {
    "Sedentary": "Low activity",
    "Lightly Active": "Light activity",
    "Moderately Active": "Moderate activity",
    "Very Active": "High activity",
    "Athlete": "Athlete level"
  };

  const insights = {
    "Fat Loss": "Consistent protein intake throughout the day can help support satiety, recovery, and lean muscle retention.",
    "Muscle Gain": "Pair your protein target with progressive strength training and enough calories for better muscle-building results.",
    "Maintenance": "Distribute protein evenly across meals to support energy, recovery, and daily consistency.",
    "Athletic Performance": "Prioritize protein around training and recovery windows to support performance and adaptation."
  };

  function money(value) {
    return `AED ${Number(value || 0).toFixed(2)}`;
  }

  function getCart() {
    return JSON.parse(localStorage.getItem(cartKey) || "[]");
  }

  function saveCart(cart) {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
    });
  }

  function showToast(message) {
    const oldToast = document.querySelector(".toast");
    if (oldToast) oldToast.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 1800);
  }

  function addToCart(productId) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.qty += 1;
    else cart.push({ id: product.id, qty: 1 });
    saveCart(cart);
    showToast("Added to cart");
  }

  function clearErrors() {
    form.querySelectorAll(".field-error").forEach((node) => {
      node.textContent = "";
    });
    form.querySelectorAll(".has-error").forEach((node) => node.classList.remove("has-error"));
  }

  function setError(name, message) {
    const field = form.elements[name];
    const error = form.querySelector(`[data-error-for="${name}"]`);
    field?.closest(".calc-field")?.classList.add("has-error");
    if (error) error.textContent = message;
  }

  function readForm() {
    const data = Object.fromEntries(new FormData(form).entries());
    return {
      fitnessGoal: data.fitnessGoal,
      activityLevel: data.activityLevel,
      dietPreference: data.dietPreference,
      productInterest: data.productInterest || "Not Sure",
      age: Number(data.age),
      sex: data.sex,
      height: Number(data.height),
      weight: Number(data.weight),
      bodyFat: Number(data.bodyFat),
      leanMass: Number(data.leanMass)
    };
  }

  function validate(values) {
    clearErrors();
    let valid = true;
    ["fitnessGoal", "activityLevel", "dietPreference", "sex"].forEach((name) => {
      if (!values[name]) {
        setError(name, "Required.");
        valid = false;
      }
    });
    if (!values.age || values.age < 13 || values.age > 90) {
      setError("age", "Enter 13 to 90.");
      valid = false;
    }
    if (!values.height || values.height <= 0) {
      setError("height", "Enter height.");
      valid = false;
    }
    if (!values.weight || values.weight <= 0) {
      setError("weight", "Enter weight.");
      valid = false;
    }
    if (!values.bodyFat || values.bodyFat < 5 || values.bodyFat > 60) {
      setError("bodyFat", "Use 5 to 60.");
      valid = false;
    }
    if (!values.leanMass || values.leanMass <= 0) {
      setError("leanMass", "Enter target mass.");
      valid = false;
    }
    return valid;
  }

  function calculate(values) {
    const leanMassEstimate = values.weight * (1 - values.bodyFat / 100);
    const targetLeanMass = values.leanMass > 0 && values.leanMass <= values.weight * 1.3 ? values.leanMass : 0;
    const baseMass = Math.max(leanMassEstimate, targetLeanMass || leanMassEstimate);
    const proteinTarget = Math.round(baseMass * goalMultipliers[values.fitnessGoal] * (1 + activityAdjustments[values.activityLevel]));
    const bmr = values.sex === "Male"
      ? 10 * values.weight + 6.25 * values.height - 5 * values.age + 5
      : 10 * values.weight + 6.25 * values.height - 5 * values.age - 161;

    return {
      leanMassEstimate: Math.round(leanMassEstimate),
      baseMass: Math.round(baseMass),
      proteinTarget,
      lowerRange: Math.max(0, proteinTarget - 10),
      upperRange: proteinTarget + 10,
      proteinKg: proteinTarget / values.weight,
      proteinCalories: proteinTarget * 4,
      dailyCalories: Math.round(bmr * calorieActivity[values.activityLevel]),
      meals: [
        ["Breakfast", 0.25],
        ["Lunch", 0.3],
        ["Dinner", 0.25],
        ["Snack/Post-workout", 0.2]
      ].map(([label, percent]) => ({ label, percent, grams: Math.round(proteinTarget * percent) }))
    };
  }

  function productText(product) {
    return `${product.name} ${product.category} ${product.subcategory} ${(product.tags || []).join(" ")} ${(product.goals || []).join(" ")}`.toLowerCase();
  }

  function interestMatch(product, interest) {
    if (interest === "Protein Powder") return ["protein", "vegan-protein"].includes(product.category) && !/meal|snack|frozen/.test(product.subcategory);
    if (interest === "Meal Plan") return product.category === "meal-plan" || product.subcategory.includes("meal-plan");
    if (interest === "Bars & Snacks") return product.category === "bars-snacks" || product.subcategory.includes("snack");
    return false;
  }

  function recommendProducts(values) {
    const scored = products.map((product) => {
      const text = productText(product);
      let score = product.rating || 0;
      if (values.dietPreference === "Vegan") score += product.category === "vegan-protein" || text.includes("vegan") || text.includes("plant") ? 30 : -18;
      if ((product.goals || []).includes(values.fitnessGoal)) score += 12;
      if (values.fitnessGoal === "Fat Loss" && /thermogenic|clear|low-sugar|fit-diet|lean|chips|snack/.test(text)) score += 10;
      if (values.fitnessGoal === "Muscle Gain" && /whey|mass|gainer|bar|high-protein|strength|my-meal/.test(text)) score += 10;
      if (values.fitnessGoal === "Maintenance" && /balanced|whey|bar|kcal|milk|fit-diet/.test(text)) score += 8;
      if (values.fitnessGoal === "Athletic Performance" && /performance|whey|fresh|recovery|fish|chicken|athlete/.test(text)) score += 9;
      if (interestMatch(product, values.productInterest)) score += 14;
      if (product.sale) score += 1;
      return { product, score };
    });

    return scored
      .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)
      .map((item) => item.product)
      .filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index)
      .slice(0, 3);
  }

  function tagFor(product, values) {
    const text = productText(product);
    if (values.dietPreference === "Vegan" || text.includes("vegan") || text.includes("plant")) return "Vegan";
    if (text.includes("clear")) return "Light protein";
    if (text.includes("mass") || text.includes("gainer")) return "Mass support";
    if (text.includes("bar") || text.includes("snack")) return "Smart snack";
    if (text.includes("meal")) return "Meal plan";
    return "Daily protein";
  }

  function animateTarget(value) {
    const node = dashboard.querySelector("[data-protein-target]");
    const start = Number(node.textContent || 0);
    const started = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - started) / 520);
      node.textContent = Math.round(start + (value - start) * progress);
      if (progress < 1) window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  function renderMeals(result) {
    const mealList = dashboard.querySelector("[data-meal-split]");
    mealList.innerHTML = result.meals.map((meal, index) => `
      <div class="meal-pill">
        <span style="--dot:${index}"></span>
        <strong>${meal.label}</strong>
        <em>${meal.grams} g</em>
      </div>
    `).join("");
    dashboard.querySelector("[data-donut-total]").textContent = `${result.proteinTarget}g`;
    dashboard.querySelector("[data-protein-donut]").style.setProperty("--protein-angle", "360deg");
  }

  function renderProducts(values, recommendations) {
    currentRecommendations = recommendations;
    recommendationsGrid.innerHTML = recommendations.map((product) => `
      <article class="dashboard-product">
        <img src="${product.image}" alt="${product.name}">
        <div>
          <h4>${productName(product)}</h4>
          <p>${tagFor(product, values)}</p>
          <span>${"&#9733;".repeat(Math.round(product.rating || 4))} <em>${Number(product.rating || 4).toFixed(1)}</em></span>
          ${priceBlock(product.price)}
        </div>
        <button type="button" aria-label="Add ${product.name} to cart" data-calc-add-to-cart="${product.id}">+</button>
      </article>
    `).join("");
    recommendationsGrid.querySelectorAll("[data-calc-add-to-cart]").forEach((addButton) => {
      addButton.addEventListener("click", () => addToCart(addButton.dataset.calcAddToCart));
    });
  }

  function updateWhatsapp(values, result, recommendations) {
    const message = `Hi, I calculated my protein plan on the website.\n\nGoal: ${values.fitnessGoal}\nActivity Level: ${values.activityLevel}\nDiet Preference: ${values.dietPreference}\nWeight: ${values.weight} kg\nDaily Protein Target: ${result.proteinTarget} g/day\nEstimated Calories: ${result.dailyCalories} kcal\nRecommended Products: ${recommendations.map((product) => product.name).join(", ")}\n\nCan you suggest the best product or meal plan for me?`;
    whatsappLink.href = `https://wa.me/971553271712?text=${encodeURIComponent(message)}`;
  }

  function setResultsActive() {
    document.querySelectorAll(".calc-step").forEach((step) => step.classList.remove("is-active"));
    document.querySelectorAll(".calc-step").forEach((step, index) => {
      if (index < 2) step.classList.add("is-complete");
    });
    document.querySelector('[data-step="results"]')?.classList.add("is-active");
  }

  function renderResult(values, result, recommendations) {
    emptyPanel.hidden = true;
    dashboard.hidden = false;
    dashboard.classList.remove("is-visible");
    window.requestAnimationFrame(() => dashboard.classList.add("is-visible"));
    setResultsActive();
    animateTarget(result.proteinTarget);
    dashboard.querySelector("[data-range]").textContent = `${result.lowerRange}g - ${result.upperRange}g`;
    dashboard.querySelector('[data-metric="dailyCalories"]').textContent = `${result.dailyCalories.toLocaleString()} kcal`;
    dashboard.querySelector('[data-metric="leanGoal"]').textContent = `${Math.round(values.leanMass)} kg`;
    dashboard.querySelector('[data-metric="proteinKg"]').textContent = `${result.proteinKg.toFixed(2)} g`;
    dashboard.querySelector('[data-metric="activity"]').textContent = values.activityLevel;
    dashboard.querySelector('[data-metric="activityLabel"]').textContent = activityLabels[values.activityLevel];
    dashboard.querySelector("[data-goal-insight]").textContent = insights[values.fitnessGoal];
    renderMeals(result);
    renderProducts(values, recommendations);
    updateWhatsapp(values, result, recommendations);
    currentValues = values;
  }

  function runCalculation(shouldScroll) {
    const values = readForm();
    if (!validate(values)) return;

    button.classList.add("is-loading");
    button.querySelector("span").textContent = "Calculating...";
    window.setTimeout(() => {
      const result = calculate(values);
      const recommendations = recommendProducts(values);
      localStorage.setItem(resultKey, JSON.stringify({
        values,
        result,
        recommendations: recommendations.map((product) => product.id)
      }));
      localStorage.setItem("customerGoalProfile", JSON.stringify({
        goal: values.fitnessGoal === "Fat Loss" ? "Lose Fat" : values.fitnessGoal === "Muscle Gain" ? "Build Muscle" : values.fitnessGoal,
        dietPreference: values.dietPreference,
        proteinTarget: result.proteinTarget,
        preferredProductType: values.productInterest,
        lastUpdated: new Date().toISOString()
      }));
      renderResult(values, result, recommendations);
      button.classList.remove("is-loading");
      button.querySelector("span").textContent = "Calculate My Plan";
      if (shouldScroll && window.matchMedia("(max-width: 768px)").matches) {
        dashboard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runCalculation(true);
  });

  try {
    const saved = JSON.parse(localStorage.getItem(resultKey) || "null");
    if (saved?.values) {
      Object.entries(saved.values).forEach(([key, value]) => {
        if (form.elements[key]) form.elements[key].value = value;
      });
    }
  } catch (error) {
    localStorage.removeItem(resultKey);
  }
  window.addEventListener("languageChanged", () => {
    try {
      const saved = JSON.parse(localStorage.getItem(resultKey) || "null");
      if (!saved?.values) return;
      const recommendations = (saved.recommendations || []).map((id) => products.find((product) => product.id === id)).filter(Boolean);
      if (recommendations.length && !dashboard.hidden) renderProducts(saved.values, recommendations);
    } catch (error) {
      localStorage.removeItem(resultKey);
    }
  });
})();
