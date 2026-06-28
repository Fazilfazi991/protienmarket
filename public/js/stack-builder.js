(function () {
  const root = document.querySelector("[data-stack-builder]");
  if (!root) return;
  const products = window.STACK_PRODUCTS || [];
  const state = {};
  const steps = [
    ["goal", "Choose goal", ["Lose Fat", "Build Muscle", "Maintenance", "Vegan", "Meal Plan Support"]],
    ["protein", "Choose main protein", ["Whey Protein", "Clear Protein", "Vegan Protein", "Mass Gainer", "Not Sure"]],
    ["addon", "Choose add-on", ["Protein Bars", "Fresh Protein", "Meal Plan", "Snacks", "Skip"]],
    ["support", "Choose support", ["WhatsApp expert help", "Add shaker later", "No support"]]
  ];

  function pick() {
    const selected = [];
    const bySub = (sub) => products.find((p) => p.subcategory === sub);
    const byCat = (cat) => products.find((p) => p.category === cat);
    if (state.protein === "Whey Protein") selected.push(bySub("whey-protein"));
    else if (state.protein === "Clear Protein") selected.push(bySub("clear-protein"));
    else if (state.protein === "Vegan Protein" || state.goal === "Vegan") selected.push(bySub("vegan-protein-powders"));
    else if (state.protein === "Mass Gainer") selected.push(bySub("mass-gainers"));
    else selected.push(bySub("whey-protein"));
    if (state.addon === "Protein Bars") selected.push(bySub("bars"));
    if (state.addon === "Fresh Protein") selected.push(byCat("fresh-protein"));
    if (state.addon === "Meal Plan" || state.goal === "Meal Plan Support") selected.push(byCat("meal-plan"));
    if (state.addon === "Snacks") selected.push(byCat("bars-snacks"));
    return selected.filter(Boolean).filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  }

  function renderPreview() {
    const selected = pick();
    const total = selected.reduce((sum, p) => sum + p.price, 0);
    root.querySelector("[data-stack-preview]").innerHTML = selected.length ? selected.map((p) => `<div class="stack-line"><img src="${p.image}" alt="${p.name}"><span>${p.name}</span><strong>AED ${Number(p.price).toFixed(2)}</strong></div>`).join("") : "<p>Pick your goal to start building.</p>";
    root.querySelector("[data-stack-builder-total]").textContent = `AED ${total.toFixed(2)}`;
    root.querySelector("[data-stack-save]").textContent = selected.length > 1 ? "Estimated stack saving: AED 25.00" : "";
    root.querySelector("[data-builder-whatsapp]").href = `https://wa.me/971553271712?text=${encodeURIComponent("Hi, can you review my protein stack for " + (state.goal || "my goal") + "?")}`;
  }

  function renderStep(i) {
    steps.forEach(([key, title, options], idx) => {
      const node = root.querySelector(`[data-stack-step="${key}"]`);
      node.hidden = idx !== i;
      node.innerHTML = `<p class="eyebrow">Step ${idx + 1} of ${steps.length}</p><h2>${title}</h2><div class="option-grid">${options.map((option) => `<button class="option-card ${state[key] === option ? "is-active" : ""}" type="button" data-option="${option}">${option}</button>`).join("")}</div>`;
      node.querySelectorAll("[data-option]").forEach((button) => {
        button.addEventListener("click", () => {
          state[key] = button.dataset.option;
          localStorage.setItem("customerGoalProfile", JSON.stringify({ goal: state.goal, preferredProductType: state.protein, lastUpdated: new Date().toISOString() }));
          renderPreview();
          renderStep(Math.min(i + 1, steps.length - 1));
        });
      });
    });
  }

  root.querySelector("[data-edit-stack]").addEventListener("click", () => renderStep(0));
  root.querySelector("[data-add-builder-stack]").addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("protein:add-stack", { detail: pick().map((p) => p.id) }));
  });
  renderStep(0);
  renderPreview();
})();
