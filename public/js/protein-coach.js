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
  const t = (key, fallback) => window.I18N?.t(key, fallback) || fallback || key;
  const productName = (product) => window.I18N?.productName(product) || product.name;
  const priceBlock = (amount) => window.ShopMoney?.priceBlock(amount) || `<span>AED ${Number(amount || 0).toFixed(2)}</span>`;
  const localePath = (path) => {
    const lang = window.LOCALE || "en";
    if (!path || !path.startsWith("/") || /^\/(en|ar)(\/|$)/.test(path)) return path;
    return `/${lang}${path === "/" ? "" : path}`;
  };
  const iconBase = "/protein_market_icon_pack/protein_market_icons/svg/";
  const icon = (name) => `${iconBase}${name}.svg`;

  const coachSteps = [
    {
      id: "goal",
      eyebrow: "Your goal",
      title: "Let's find your perfect protein match",
      subtitle: "Answer a few questions and we'll build a personalized recommendation.",
      question: "What's your main goal?",
      layout: "goal-grid",
      options: [
        { label: "Lose Fat", value: "lose-fat", icon: icon("goal_lose_fat"), description: "Burn fat and get leaner" },
        { label: "Build Muscle", value: "build-muscle", icon: icon("goal_build_muscle"), description: "Gain lean muscle and strength" },
        { label: "Stay Fit", value: "stay-fit", icon: icon("goal_stay_fit"), description: "Maintain fitness and energy" },
        { label: "Improve Recovery", value: "recovery", icon: icon("goal_recovery"), description: "Recover faster after training" },
        { label: "Eat Healthier", value: "eat-healthier", icon: icon("goal_eat_healthier"), description: "Build a cleaner daily routine" },
        { label: "Not Sure", value: "not-sure", icon: icon("goal_not_sure"), description: "Let us guide your match" }
      ]
    },
    {
      id: "profile",
      eyebrow: "About you",
      title: "Tell us about yourself",
      question: "A little context helps us personalize your plan.",
      groups: [
        {
          id: "age",
          label: "Age range",
          icon: icon("age_group"),
          options: [
            { label: "18-25", value: "18-25" },
            { label: "26-35", value: "26-35" },
            { label: "36-45", value: "36-45" },
            { label: "45+", value: "45-plus" }
          ]
        },
        {
          id: "gender",
          label: "Gender",
          icon: icon("gender"),
          options: [
            { label: "Male", value: "male" },
            { label: "Female", value: "female" }
          ]
        }
      ],
      note: "Your age helps us estimate your nutrition requirements more accurately.",
      privacy: "Your information remains private and secure."
    },
    {
      id: "training",
      eyebrow: "Activity level",
      title: "How often do you train?",
      question: "Choose the closest fit for your current routine.",
      options: [
        { label: "Beginner (1-2 days)", value: "1-2", icon: icon("activity_beginner"), description: "Starting your fitness journey." },
        { label: "Moderate (3-4 days)", value: "3-4", icon: icon("activity_beginner"), description: "Train regularly and build consistency." },
        { label: "Serious (5-6 days)", value: "5-6", icon: icon("activity_athlete"), description: "Train hard most days." },
        { label: "Athlete (Daily)", value: "daily", icon: icon("activity_athlete"), description: "Train daily or professionally." }
      ],
      note: "Activity level directly impacts your daily protein requirements."
    },
    {
      id: "lifestyle",
      eyebrow: "Diet & preferences",
      title: "Tell us about your lifestyle",
      question: "We'll only recommend products that fit your preferences and budget.",
      groups: [
        {
          id: "diet",
          label: "Diet options",
          options: [
            { label: "Non-Vegetarian", value: "non-vegetarian", icon: icon("diet_nonveg") },
            { label: "Vegetarian", value: "vegetarian", icon: icon("diet_vegetarian") },
            { label: "Vegan", value: "vegan", icon: icon("diet_vegan") },
            { label: "Keto", value: "keto", icon: icon("diet_keto") },
            { label: "Gluten-Free", value: "gluten-free", icon: icon("diet_gluten_free") }
          ]
        },
        {
          id: "productType",
          label: "Product interests",
          options: [
            { label: "Whey Protein", value: "protein-powder", icon: icon("product_whey") },
            { label: "Clear Protein", value: "clear-protein", icon: icon("product_clear") },
            { label: "Fresh Protein Meals", value: "fresh-protein", icon: icon("product_meal") },
            { label: "Protein Snacks", value: "bars-snacks", icon: icon("product_snack") },
            { label: "Meal Plans", value: "meal-plans", icon: icon("product_meal") }
          ]
        },
        {
          id: "budget",
          label: "Budget selector",
          options: [
            { label: "Under AED 150", value: "under-150", icon: icon("budget_wallet") },
            { label: "AED 150-300", value: "150-300", icon: icon("budget_wallet") },
            { label: "AED 300-500", value: "300-500", icon: icon("budget_wallet") },
            { label: "Premium AED 500+", value: "500-plus", icon: icon("budget_wallet") }
          ]
        }
      ],
      note: "We'll only recommend products that fit your preferences and budget."
    }
  ];

  const state = {
    currentStep: 0,
    answers: {},
    recommendations: [],
    motion: "forward"
  };

  function lockPageScroll(locked) {
    document.documentElement.classList.toggle("coach-modal-open", locked);
    document.body.classList.toggle("coach-modal-open", locked);
  }

  function scrollCoachTop() {
    body.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function openCoach() {
    panel.hidden = false;
    root.classList.add("is-open");
    lockPageScroll(true);
    if (!body.dataset.ready) renderIntro();
  }

  function closeCoach() {
    panel.hidden = true;
    root.classList.remove("is-open");
    lockPageScroll(false);
    sessionStorage.setItem("proteinCoachClosed", "1");
  }

  function resetCoach() {
    state.currentStep = 0;
    state.answers = {};
    state.recommendations = [];
    state.motion = "back";
    renderIntro();
  }

  function startCoach() {
    state.currentStep = 0;
    state.answers = {};
    state.motion = "forward";
    renderQuestion();
  }

  function optionLabel(questionId, value) {
    const step = coachSteps.find((item) => item.id === questionId || item.groups?.some((group) => group.id === questionId));
    const options = step?.options || step?.groups?.find((group) => group.id === questionId)?.options || [];
    return options.find((option) => option.value === value)?.label || value;
  }

  function renderIntro() {
    body.dataset.ready = "true";
    body.innerHTML = `
      <div class="coach-intro coach-view">
        <p class="coach-kicker">${t("coach.title", "Protein Coach")}</p>
        <h3>${t("coach.quick", "Find the right product in 30 seconds")}</h3>
        <p>${t("coach.introCopy", "Answer 5 quick questions and we'll suggest products that fit your goal.")}</p>
        <button class="coach-primary" type="button" data-coach-start>${t("coach.start", "Start")}</button>
        <a class="coach-secondary-link" href="${localePath("/shop")}">${t("coach.skip", "Skip and browse shop")}</a>
      </div>
    `;
  }

  function renderQuestion() {
    const step = coachSteps[state.currentStep];
    const canContinue = step.groups ? step.groups.every((group) => state.answers[group.id]) : Boolean(state.answers[step.id]);
    body.innerHTML = `
      <div class="coach-question coach-view coach-view--${state.motion}">
        ${renderStepProgress()}
        <p class="coach-microcopy">${step.eyebrow}</p>
        <h3>${step.question}</h3>
        ${step.subtitle ? `<p class="coach-question-subtitle">${step.subtitle}</p>` : ""}
        ${step.groups ? renderGroupedStep(step) : renderOptionGrid(step)}
        ${step.note ? `<div class="coach-note"><span><img src="${icon("recommendation")}" alt="" aria-hidden="true"></span><p>${step.note}</p></div>` : ""}
        ${step.privacy ? `<p class="coach-privacy"><img src="${icon("secure_private")}" alt="" aria-hidden="true">${step.privacy}</p>` : ""}
        <div class="coach-action-bar">
          <button class="coach-next" type="button" data-coach-next ${canContinue ? "" : "disabled"}>${state.currentStep === coachSteps.length - 1 ? "Generate My Plan" : "Continue ->"}</button>
        </div>
      </div>
    `;
    scrollCoachTop();
  }

  function renderStepProgress() {
    const total = coachSteps.length + 1;
    const current = state.currentStep + 1;
    return `
      <div class="coach-step-progress">
        <span>Step ${current} of ${total}</span>
        <div class="coach-step-dots" aria-hidden="true">
          ${Array.from({ length: total }).map((_, index) => `<i class="${index < current ? "is-active" : ""}"></i>`).join("")}
        </div>
      </div>
    `;
  }

  function renderOptionGrid(step) {
    const isGoalStep = step.layout === "goal-grid";
    const mainOptions = isGoalStep ? step.options.slice(0, 4) : step.options;
    const secondaryOptions = isGoalStep ? step.options.slice(4) : [];
    const renderOption = (option, isSecondary = false) => `
      <button class="coach-option ${isSecondary ? "coach-option--secondary" : ""} ${state.answers[step.id] === option.value ? "is-selected" : ""}" type="button" data-coach-answer="${option.value}" data-coach-answer-id="${step.id}">
        <span><img src="${option.icon}" alt="" aria-hidden="true"></span>
        <strong>${option.label}</strong>
        ${option.description ? `<small>${option.description}</small>` : ""}
      </button>
    `;

    return `
      <div class="coach-options ${step.layout || ""}">
        ${mainOptions.map((option) => renderOption(option)).join("")}
      </div>
      ${secondaryOptions.length ? `<div class="coach-secondary-options">${secondaryOptions.map((option) => renderOption(option, true)).join("")}</div>` : ""}
    `;
  }

  function renderGroupedStep(step) {
    return step.groups.map((group) => `
      <div class="coach-group">
        <h4>${group.icon ? `<img src="${group.icon}" alt="" aria-hidden="true">` : ""}${group.label}</h4>
        <div class="coach-chip-grid">
          ${group.options.map((option) => `
            <button class="coach-chip ${state.answers[group.id] === option.value ? "is-selected" : ""}" type="button" data-coach-answer="${option.value}" data-coach-answer-id="${group.id}">
              ${option.icon ? `<span><img src="${option.icon}" alt="" aria-hidden="true"></span>` : ""}<strong>${option.label}</strong>
            </button>
          `).join("")}
        </div>
      </div>
    `).join("");
  }

  function selectAnswer(id, value) {
    state.answers[id] = value;
    const selected = body.querySelector(`[data-coach-answer="${CSS.escape(value)}"]`);
    if (selected) selected.classList.add("is-selected");
    renderQuestion();
  }

  function nextStep() {
    if (state.currentStep < coachSteps.length - 1) {
      state.motion = "forward";
      state.currentStep += 1;
      renderQuestion();
      return;
    }
    body.innerHTML = '<div class="coach-loading coach-view"><span></span><h3>Building your plan...</h3><p>Your personalized stack is almost ready.</p></div>';
    window.setTimeout(renderResults, 350);
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
    if (answers.productType === "clear-protein" && product.subcategory === "clear-protein") score += 28;

    const limit = budgetLimit(answers.budget);
    if (Number(product.price) <= limit) score += 16;
    if (answers.budget === "500-plus" && product.bundle) score += 12;
    if (answers.training === "5-6" || answers.training === "daily") {
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
        href: localePath("/category/vegan-protein")
      };
    }
    if (answers.productType === "meal-plans") return { title: "Best match: Meal Plans", copy: "Choose calorie-aware plans that keep your nutrition consistent.", href: localePath("/category/meal-plan") };
    if (answers.productType === "bars-snacks") return { title: "Best match: Bars & Snacks", copy: "Use protein snacks for easy fuel between meals.", href: localePath("/category/bars-snacks") };
    if (answers.productType === "fresh-protein") return { title: "Best match: Fresh Protein", copy: "Fresh protein works well for clean lunches and dinner prep.", href: localePath("/category/fresh-protein") };
    if (answers.goal === "lose-fat") return { title: "Best match: Fat Loss Protein", copy: "Start with clear protein, thermogenic protein, or a lean meal plan.", href: localePath("/category/protein/thermogenic") };
    if (answers.goal === "build-muscle") return { title: "Best match: Muscle Gain Stack", copy: "Whey, mass gainers, and protein snacks fit your goal best.", href: localePath("/goal/build-muscle") };
    if (answers.goal === "recovery") return { title: "Best match: Recovery Support", copy: "Whey, fresh protein, and balanced meals can support recovery.", href: localePath("/goal/athlete-recovery") };
    return { title: "Best match: Daily Protein", copy: "A simple protein routine with snacks or meal support is a great start.", href: localePath("/shop") };
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
        <div class="coach-step-row">
          <span>Step 5 of 5</span>
          <button type="button" data-coach-reset>Restart</button>
        </div>
        <div class="coach-progress"><span style="width:100%"></span></div>
        <p class="coach-kicker">Your match is ready.</p>
        <h3>Your Personalized Nutrition Plan</h3>
        <p class="coach-result-subtitle">Based on your goal and preferences.</p>
        <div class="coach-summary-grid">
          <article><span>Goal</span><strong>${optionLabel("goal", state.answers.goal)}</strong></article>
          <article><span>Protein Target</span><strong>130g/day</strong></article>
          <article><span>Calories</span><strong>2100 kcal</strong></article>
        </div>
        <a class="coach-match-card" href="${category.href}">
          <strong>${category.title}</strong>
          <span>${category.copy}</span>
        </a>
        <div class="coach-products">
          ${recommendations.map((product) => `
            <article class="coach-product-card">
              <img src="${product.image}" alt="${productName(product)}" loading="lazy">
              <div>
                <span>${reasonFor(product, state.answers)}</span>
                <strong>${productName(product)}</strong>
                <small>${priceBlock(product.price)}</small>
              </div>
              <a href="${localePath(`/product/${product.slug}`)}">${t("buttons.viewDetails", "View")}</a>
              <button type="button" data-coach-add="${product.id}">Add</button>
            </article>
          `).join("")}
        </div>
        <div class="coach-actions">
          <a class="coach-primary" href="${category.href}"><img src="${icon("cart")}" alt="" aria-hidden="true">${t("coach.view", "View Recommended Products")}</a>
          <button type="button" data-coach-reset><img src="${icon("back_arrow")}" alt="" aria-hidden="true">${t("coach.retake", "Retake Quiz")}</button>
          <a class="coach-whatsapp" href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}" target="_blank" rel="noreferrer"><img src="${icon("whatsapp")}" alt="" aria-hidden="true">${t("coach.ask", "Ask on WhatsApp")}</a>
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
      added.textContent = `${productName(product)} added to cart.`;
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
    const next = event.target.closest("[data-coach-next]");
    const reset = event.target.closest("[data-coach-reset]");
    const add = event.target.closest("[data-coach-add]");

    if (start) startCoach();
    if (answer) selectAnswer(answer.dataset.coachAnswerId, answer.dataset.coachAnswer);
    if (next && !next.disabled) nextStep();
    if (reset) resetCoach();
    if (add) addProductToCart(add.dataset.coachAdd);
  });

  window.setTimeout(() => {
    if (!sessionStorage.getItem("proteinCoachClosed")) tooltip.classList.add("is-visible");
  }, 2000);
  window.addEventListener("languageChanged", () => {
    if (panel.hidden) return;
    if (!body.dataset.ready) return;
    if (state.recommendations.length) renderResults();
    else if (Object.keys(state.answers).length) renderQuestion();
    else renderIntro();
  });
})();
