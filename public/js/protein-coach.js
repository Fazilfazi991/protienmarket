(function () {
  const root = document.querySelector("[data-protein-coach]");
  if (!root) return;

  const panel = root.querySelector("[data-coach-panel]");
  const body = root.querySelector("[data-coach-body]");
  const toggle = root.querySelector("[data-coach-toggle]");
  const close = root.querySelector("[data-coach-close]");
  const tooltip = root.querySelector("[data-coach-tooltip]");
  const products = window.COACH_PRODUCTS || [];
  const whatsappNumber = window.COACH_WHATSAPP_NUMBER || "971553271712";
  const cartKey = "proteinMarketCart";

  const coachQuestions = [
    {
      id: "goal",
      question: "What's your main goal?",
      microcopy: "Let's find your best protein match.",
      options: [
        { label: "Lose fat", value: "lose-fat", icon: "-" },
        { label: "Build muscle", value: "build-muscle", icon: "+" },
        { label: "Stay fit", value: "stay-fit", icon: "OK" },
        { label: "Improve recovery", value: "recovery", icon: "R" },
        { label: "Eat healthier", value: "eat-healthier", icon: "H" },
        { label: "Not sure", value: "not-sure", icon: "?" }
      ]
    },
    {
      id: "productType",
      question: "What type of product are you looking for?",
      microcopy: "Nice, got it.",
      options: [
        { label: "Protein powder", value: "protein-powder", icon: "P" },
        { label: "Meal plans", value: "meal-plans", icon: "M" },
        { label: "Bars & snacks", value: "bars-snacks", icon: "B" },
        { label: "Fresh protein", value: "fresh-protein", icon: "F" },
        { label: "Vegan options", value: "vegan-options", icon: "V" },
        { label: "Not sure", value: "not-sure", icon: "?" }
      ]
    },
    {
      id: "diet",
      question: "Any diet preference?",
      microcopy: "Almost there.",
      options: [
        { label: "No preference", value: "no-preference", icon: "*" },
        { label: "Vegan", value: "vegan", icon: "V" },
        { label: "Vegetarian", value: "vegetarian", icon: "VG" },
        { label: "Non-vegetarian", value: "non-vegetarian", icon: "N" },
        { label: "Gluten-free", value: "gluten-free", icon: "GF" },
        { label: "Low sugar", value: "low-sugar", icon: "LS" }
      ]
    },
    {
      id: "training",
      question: "How often do you train?",
      microcopy: "One last stretch.",
      options: [
        { label: "0-1 days/week", value: "0-1", icon: "1" },
        { label: "2-3 days/week", value: "2-3", icon: "3" },
        { label: "4-5 days/week", value: "4-5", icon: "5" },
        { label: "6+ days/week", value: "6+", icon: "6+" }
      ]
    },
    {
      id: "budget",
      question: "What's your budget?",
      microcopy: "One last thing.",
      options: [
        { label: "Under AED 150", value: "under-150", icon: "AED" },
        { label: "AED 150-300", value: "150-300", icon: "AED" },
        { label: "AED 300-500", value: "300-500", icon: "AED" },
        { label: "AED 500+", value: "500-plus", icon: "AED" }
      ]
    }
  ];

  const state = {
    currentStep: 0,
    answers: {},
    recommendations: []
  };

  function openCoach() {
    panel.hidden = false;
    root.classList.add("is-open");
    if (!body.dataset.ready) renderIntro();
  }

  function closeCoach() {
    panel.hidden = true;
    root.classList.remove("is-open");
    sessionStorage.setItem("proteinCoachClosed", "1");
  }

  function resetCoach() {
    state.currentStep = 0;
    state.answers = {};
    state.recommendations = [];
    renderIntro();
  }

  function startCoach() {
    state.currentStep = 0;
    state.answers = {};
    renderQuestion();
  }

  function optionLabel(questionId, value) {
    const question = coachQuestions.find((item) => item.id === questionId);
    return question?.options.find((option) => option.value === value)?.label || value;
  }

  function renderIntro() {
    body.dataset.ready = "true";
    body.innerHTML = `
      <div class="coach-intro coach-view">
        <p class="coach-kicker">Your quick match</p>
        <h3>Find your best protein match</h3>
        <p>Answer 5 quick questions and we'll suggest products that fit your goal.</p>
        <button class="coach-primary" type="button" data-coach-start>Start</button>
        <a class="coach-secondary-link" href="/shop">Skip and browse shop</a>
      </div>
    `;
  }

  function renderQuestion() {
    const question = coachQuestions[state.currentStep];
    const progress = ((state.currentStep + 1) / coachQuestions.length) * 100;
    body.innerHTML = `
      <div class="coach-question coach-view">
        <div class="coach-step-row">
          <span>Step ${state.currentStep + 1} of ${coachQuestions.length}</span>
          <button type="button" data-coach-reset>Restart</button>
        </div>
        <div class="coach-progress"><span style="width:${progress}%"></span></div>
        <p class="coach-microcopy">${question.microcopy}</p>
        <h3>${question.question}</h3>
        <div class="coach-options">
          ${question.options.map((option) => `
            <button class="coach-option" type="button" data-coach-answer="${option.value}">
              <span>${option.icon}</span>
              <strong>${option.label}</strong>
            </button>
          `).join("")}
        </div>
        <div class="coach-nav-row">
          ${state.currentStep > 0 ? '<button type="button" data-coach-back>Back</button>' : '<span></span>'}
        </div>
      </div>
    `;
  }

  function selectAnswer(value) {
    const question = coachQuestions[state.currentStep];
    state.answers[question.id] = value;
    const selected = body.querySelector(`[data-coach-answer="${CSS.escape(value)}"]`);
    if (selected) selected.classList.add("is-selected");

    window.setTimeout(() => {
      if (state.currentStep < coachQuestions.length - 1) {
        state.currentStep += 1;
        renderQuestion();
      } else {
        body.innerHTML = '<div class="coach-loading coach-view"><span></span><h3>Building your match...</h3><p>Your match is almost ready.</p></div>';
        window.setTimeout(renderResults, 350);
      }
    }, 160);
  }

  function goBack() {
    if (state.currentStep > 0) {
      state.currentStep -= 1;
      renderQuestion();
    }
  }

  function textFor(product) {
    return [
      product.name,
      product.category,
      product.subcategory,
      ...(product.tags || []),
      ...(product.goals || []),
      ...(product.diet || [])
    ].join(" ").toLowerCase();
  }

  function budgetLimit(value) {
    if (value === "under-150") return 150;
    if (value === "150-300") return 300;
    if (value === "300-500") return 500;
    return Infinity;
  }

  function scoreProduct(product, answers) {
    const text = textFor(product);
    let score = 0;

    if (answers.diet === "vegan") {
      if (product.category === "vegan-protein") score += 35;
      if (text.includes("vegan") || text.includes("plant")) score += 18;
    }
    if (answers.diet === "vegetarian" && text.includes("vegetarian")) score += 10;
    if (answers.diet === "gluten-free" && text.includes("gluten-free")) score += 16;
    if (answers.diet === "low-sugar" && text.includes("low-sugar")) score += 16;

    if (answers.goal === "lose-fat") {
      if (["thermogenic", "clear-protein", "fit-diet"].includes(product.subcategory)) score += 26;
      if (/fat-loss|low-sugar|lean|low-calorie/.test(text)) score += 18;
      if (product.category === "meal-plan") score += 8;
    }
    if (answers.goal === "build-muscle") {
      if (["whey-protein", "mass-gainers", "bars"].includes(product.subcategory)) score += 26;
      if (/muscle|high-protein|recovery|bulk|strength/.test(text)) score += 18;
    }
    if (answers.goal === "recovery") {
      if (["whey-protein", "fresh-protein", "fit-diet"].includes(product.subcategory) || product.category === "fresh-protein") score += 24;
      if (/recovery|post-workout|performance/.test(text)) score += 16;
    }
    if (answers.goal === "eat-healthier") {
      if (["meal-plan", "fresh-protein", "bars-snacks", "vegan-protein"].includes(product.category)) score += 18;
      if (/organic|high-fiber|balanced|daily/.test(text)) score += 10;
    }
    if (answers.goal === "stay-fit" || answers.goal === "not-sure") {
      if (/daily-protein|maintenance|balanced|top rated/.test(text)) score += 14;
    }

    if (answers.productType === "meal-plans" && product.category === "meal-plan") score += 28;
    if (answers.productType === "bars-snacks" && product.category === "bars-snacks") score += 28;
    if (answers.productType === "fresh-protein" && product.category === "fresh-protein") score += 28;
    if (answers.productType === "vegan-options" && product.category === "vegan-protein") score += 28;
    if (answers.productType === "protein-powder" && ["protein", "vegan-protein"].includes(product.category)) score += 24;

    const limit = budgetLimit(answers.budget);
    if (Number(product.price) <= limit) score += 16;
    if (answers.budget === "500-plus" && product.bundle) score += 12;
    if (answers.training === "4-5" || answers.training === "6+") {
      if (/recovery|performance|mass|whey|meal/.test(text)) score += 8;
    }
    if (product.inStock === false) score -= 50;

    return score;
  }

  function recommendedCategory(answers) {
    if (answers.diet === "vegan" || answers.productType === "vegan-options") {
      return {
        title: "Best match: Vegan Protein",
        copy: "Start with plant protein, vegan snacks, or a plant-based meal plan.",
        href: "/category/vegan-protein"
      };
    }
    if (answers.productType === "meal-plans") return { title: "Best match: Meal Plans", copy: "Choose calorie-aware plans that keep your nutrition consistent.", href: "/category/meal-plan" };
    if (answers.productType === "bars-snacks") return { title: "Best match: Bars & Snacks", copy: "Use protein snacks for easy fuel between meals.", href: "/category/bars-snacks" };
    if (answers.productType === "fresh-protein") return { title: "Best match: Fresh Protein", copy: "Fresh protein works well for clean lunches and dinner prep.", href: "/category/fresh-protein" };
    if (answers.goal === "lose-fat") return { title: "Best match: Fat Loss Protein", copy: "Start with clear protein, thermogenic protein, or a lean meal plan.", href: "/category/protein/thermogenic" };
    if (answers.goal === "build-muscle") return { title: "Best match: Muscle Gain Stack", copy: "Whey, mass gainers, and protein snacks fit your goal best.", href: "/goal/build-muscle" };
    if (answers.goal === "recovery") return { title: "Best match: Recovery Support", copy: "Whey, fresh protein, and balanced meals can support recovery.", href: "/goal/athletic-performance" };
    return { title: "Best match: Daily Protein", copy: "A simple protein routine with snacks or meal support is a great start.", href: "/shop" };
  }

  function getRecommendations(answers) {
    const ranked = products
      .map((product) => ({ product, score: scoreProduct(product, answers) }))
      .sort((a, b) => b.score - a.score || Number(a.product.price) - Number(b.product.price));
    const best = ranked.filter((item) => item.score > 0).slice(0, 3).map((item) => item.product);
    return best.length ? best : products.slice(0, 3);
  }

  function reasonFor(product, answers) {
    if (answers.diet === "vegan" && product.category === "vegan-protein") return "Vegan fit";
    if (answers.goal === "lose-fat") return "Lean choice";
    if (answers.goal === "build-muscle") return "Muscle support";
    if (answers.productType === "meal-plans") return "Meal support";
    if (answers.productType === "bars-snacks") return "Easy snack";
    return "Best match";
  }

  function renderResults() {
    const category = recommendedCategory(state.answers);
    const recommendations = getRecommendations(state.answers);
    state.recommendations = recommendations;
    const whatsappText = `Hi, I completed the Protein Coach quiz. My goal is ${optionLabel("goal", state.answers.goal)} and I am interested in ${optionLabel("productType", state.answers.productType)}. Can you review my recommendations?`;

    body.innerHTML = `
      <div class="coach-result coach-view">
        <p class="coach-kicker">Your match is ready.</p>
        <h3>Here's what fits you best</h3>
        <p class="coach-result-subtitle">Based on your goal and preferences.</p>
        <a class="coach-match-card" href="${category.href}">
          <strong>${category.title}</strong>
          <span>${category.copy}</span>
        </a>
        <div class="coach-products">
          ${recommendations.map((product) => `
            <article class="coach-product-card">
              <img src="${product.image}" alt="${product.name}" loading="lazy">
              <div>
                <span>${reasonFor(product, state.answers)}</span>
                <strong>${product.name}</strong>
                <small>AED ${Number(product.price).toFixed(2)}</small>
              </div>
              <a href="/product/${product.slug}">View</a>
              <button type="button" data-coach-add="${product.id}">Add</button>
            </article>
          `).join("")}
        </div>
        <div class="coach-actions">
          <a class="coach-primary" href="${category.href}">View Recommended Products</a>
          <button type="button" data-coach-reset>Retake Quiz</button>
          <a class="coach-whatsapp" href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}" target="_blank" rel="noreferrer">Ask on WhatsApp</a>
        </div>
        <p class="coach-added" data-coach-added hidden>Added to cart.</p>
      </div>
    `;
  }

  function addProductToCart(productId) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if (typeof window.addProteinMarketProductToCart === "function") {
      window.addProteinMarketProductToCart(productId, 1);
    } else {
      const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
      const existing = cart.find((item) => item.id === productId);
      if (existing) existing.qty += 1;
      else cart.push({ id: productId, qty: 1 });
      localStorage.setItem(cartKey, JSON.stringify(cart));
      document.querySelectorAll("[data-cart-count]").forEach((node) => {
        node.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
      });
    }
    const added = body.querySelector("[data-coach-added]");
    if (added) {
      added.hidden = false;
      added.textContent = `${product.name} added to cart.`;
      window.setTimeout(() => { added.hidden = true; }, 1800);
    }
  }

  toggle.addEventListener("click", () => {
    panel.hidden ? openCoach() : closeCoach();
  });
  close.addEventListener("click", closeCoach);
  body.addEventListener("click", (event) => {
    const start = event.target.closest("[data-coach-start]");
    const answer = event.target.closest("[data-coach-answer]");
    const back = event.target.closest("[data-coach-back]");
    const reset = event.target.closest("[data-coach-reset]");
    const add = event.target.closest("[data-coach-add]");

    if (start) startCoach();
    if (answer) selectAnswer(answer.dataset.coachAnswer);
    if (back) goBack();
    if (reset) resetCoach();
    if (add) addProductToCart(add.dataset.coachAdd);
  });

  window.setTimeout(() => {
    if (!sessionStorage.getItem("proteinCoachClosed")) tooltip.classList.add("is-visible");
  }, 2000);
})();
