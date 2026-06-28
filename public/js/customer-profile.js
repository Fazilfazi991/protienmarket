(function () {
  const key = "customerGoalProfile";
  const profile = JSON.parse(localStorage.getItem(key) || "null");
  if (!profile) return;

  const home = document.querySelector("[data-profile-return]");
  if (home) {
    home.hidden = false;
    home.innerHTML = `<div class="profile-return__copy"><strong>Continue your ${profile.goal} plan</strong><p>Your recommendations are saved on this device.</p></div><div class="profile-return__actions"><a class="profile-pill profile-pill--gold" href="/find-my-protein">View Recommended Products</a><a class="profile-pill" href="/protein-calculator">Recalculate</a><a class="profile-pill" href="/build-your-stack">Build My Stack</a></div>`;
  }

  const shopBadge = document.querySelector("[data-shop-profile-badge]");
  if (shopBadge) {
    shopBadge.hidden = false;
    shopBadge.textContent = `Showing products matched to your ${profile.goal} goal`;
  }

  document.querySelectorAll("[data-product-card]").forEach((card) => {
    const goals = (card.dataset.goals || card.getAttribute("data-goals") || "").toLowerCase();
    const tags = (card.dataset.tags || "").toLowerCase();
    const goal = String(profile.goal || "").toLowerCase().replace(/\s+/g, "-");
    if (goals.includes(String(profile.goal || "").toLowerCase()) || tags.includes(goal) || tags.includes("daily-protein")) {
      const badge = document.createElement("span");
      badge.className = "best-match-badge";
      badge.textContent = "Best Match";
      card.appendChild(badge);
    }
  });
})();
