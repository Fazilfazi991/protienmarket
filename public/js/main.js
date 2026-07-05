(function () {
  const cartKey = "proteinMarketCart";
  const products = window.PRODUCTS || [];
  const getCart = () => JSON.parse(localStorage.getItem(cartKey) || "[]");
  const saveCart = (cart) => localStorage.setItem(cartKey, JSON.stringify(cart));
  const t = (key, fallback) => window.I18N?.t(key, fallback) || fallback || key;
  const productName = (product) => window.I18N?.productName(product) || product.name;
  const productDescription = (product) => window.I18N?.productDescription(product) || product.description;
  const categoryName = (slug, fallback) => window.I18N?.categoryName(slug, fallback) || fallback || slug;
  const priceBlock = (amount) => window.ShopMoney?.priceBlock(amount) || `<span class="price-aed ltr-value">AED ${Number(amount || 0).toFixed(2)}</span>`;
  const formatAED = (amount) => window.ShopMoney?.formatAED(amount) || `AED ${Number(amount || 0).toFixed(2)}`;
  const usdNote = () => window.SHOP_CONFIG?.displayUsdPrices === false ? "" : `<p class="usd-note">${t("currency.usdNote", "USD shown for reference. Checkout is charged in AED.")}</p>`;
  const localePath = (path) => {
    const lang = window.LOCALE || "en";
    if (!path || !path.startsWith("/") || path.startsWith("/api/") || /^\/(en|ar)(\/|$)/.test(path)) return path;
    return `/${lang}${path === "/" ? "" : path}`;
  };

  function updateCartCount() {
    const total = getCart().reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = total;
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

  function smartSuggestionsFor(product, limit = 4) {
    if (!product) return products.slice(0, limit);
    const rules = {
      protein: ["bars-snacks", "meal-plan", "fresh-protein"],
      "meal-plan": ["protein", "bars-snacks"],
      "vegan-protein": ["vegan-protein"],
      "bars-snacks": ["protein", "vegan-protein", "meal-plan"],
      "fresh-protein": ["protein", "bars-snacks", "meal-plan"]
    };
    const categories = rules[product.category] || ["protein", "bars-snacks", "meal-plan"];
    return products.filter((item) => item.id !== product.id && categories.includes(item.category)).slice(0, limit);
  }

  function suggestionReason(product, index = 0) {
    if (product.category === "fresh-protein" || /protein|chicken|meal/i.test(product.name)) return t("cart.reasonHighProtein", "High protein");
    if (index === 1 || product.category === "bars-snacks") return t("cart.reasonPopular", "Popular add-on");
    return t("cart.reasonPairs", "Pairs well");
  }

  function productSuggestionCard(product, index = 0) {
    return `
      <article class="suggestion-card">
        <img src="${product.image}" alt="${productName(product)}" loading="lazy">
        <div>
          <span class="suggestion-badge">${suggestionReason(product, index)}</span>
          <strong>${productName(product)}</strong>
          ${priceBlock(product.price)}
        </div>
        <button type="button" data-add-to-cart="${product.id}">${t("buttons.add", "Add")}</button>
      </article>
    `;
  }

  function cartAddonCard(product, index = 0) {
    return `
      <article class="cart-addon-card" data-product-card data-product-url="${localePath(`/product/${product.slug}`)}">
        <img src="${product.image}" alt="${productName(product)}" loading="lazy">
        <div>
          <span>${suggestionReason(product, index)}</span>
          <strong>${productName(product)}</strong>
          ${priceBlock(product.price)}
        </div>
        <button type="button" data-add-to-cart="${product.id}">${t("buttons.add", "Add")}</button>
      </article>
    `;
  }

  function closeCartDrawer() {
    const hadLock = document.body.classList.contains("cart-drawer-open");
    document.querySelector(".mini-cart-drawer")?.remove();
    document.querySelector(".mini-cart-backdrop")?.remove();
    const scrollY = Number(document.body.dataset.cartScrollY || 0);
    document.documentElement.classList.remove("cart-drawer-open");
    document.body.classList.remove("cart-drawer-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.width = "";
    delete document.body.dataset.cartScrollY;
    if (hadLock) window.scrollTo(0, scrollY);
  }

  function showCartDrawer(addedProduct) {
    closeCartDrawer();
    const cart = getCart();
    const totals = cartTotals(cart);
    const backdrop = document.createElement("div");
    backdrop.className = "mini-cart-backdrop";
    const drawer = document.createElement("aside");
    drawer.className = "mini-cart-drawer";
    drawer.setAttribute("aria-label", t("cart.title", "Cart"));
    drawer.innerHTML = `
      <button class="mini-cart-close" type="button" aria-label="${t("buttons.close", "Close")}">x</button>
      <div class="mini-cart-content">
        <p class="eyebrow">${t("cart.added", "Added to cart")}</p>
        <h2>${t("cart.added", "Added to cart")}</h2>
        <p>${productName(addedProduct)} ${t("cart.addedComplete", "has been added. Complete your plan with these recommended add-ons.")}</p>
        <h3 class="mini-cart-section-title">${t("cart.recommendedAddons", "Recommended add-ons")}</h3>
        <div class="mini-suggestions">${smartSuggestionsFor(addedProduct, 3).map(productSuggestionCard).join("")}</div>
      </div>
      <div class="mini-cart-footer">
        <div class="mini-cart-subtotal"><span>${t("cart.subtotal", "Subtotal")}</span>${priceBlock(totals.subtotal)}</div>
        <a class="btn btn--gold" href="${localePath("/cart")}">${t("cart.proceedToCart", "Proceed to Cart")}</a>
        <button class="mini-cart-continue" type="button" data-mini-cart-continue>${t("cart.continueShopping", "Continue Shopping")}</button>
      </div>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.dataset.cartScrollY = String(scrollY);
    document.documentElement.classList.add("cart-drawer-open");
    document.body.classList.add("cart-drawer-open");
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.width = "100%";
    backdrop.addEventListener("click", closeCartDrawer);
    drawer.querySelector(".mini-cart-close").addEventListener("click", closeCartDrawer);
    drawer.querySelector("[data-mini-cart-continue]")?.addEventListener("click", closeCartDrawer);
    drawer.querySelectorAll("[data-add-to-cart]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        addToCart(button.dataset.addToCart, 1);
      });
    });
  }

  function addToCart(productId, qty) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const cart = getCart();
    const existing = cart.find((item) => item.id === productId);
    if (existing) existing.qty += qty;
    else cart.push({ id: productId, qty });
    saveCart(cart);
    updateCartCount();
    showToast(`${productName(product)} ${t("buttons.addToCart", "added to cart")}`);
    showCartDrawer(product);
    renderCart();
    renderCheckoutSummary();
  }

  window.addProteinMarketProductToCart = addToCart;

  function setCartItemQuantity(productId, qty) {
    const nextQty = Math.max(0, Number(qty) || 0);
    const cart = getCart();
    const updated = cart
      .map((item) => item.id === productId ? { ...item, qty: nextQty } : item)
      .filter((item) => item.qty > 0);
    saveCart(updated);
    updateCartCount();
    renderCart();
    renderCheckoutSummary();
  }

  function removeCartItem(productId) {
    setCartItemQuantity(productId, 0);
    showToast(t("cart.itemRemoved", "Item removed from cart."));
  }

  function clearCart() {
    saveCart([]);
    updateCartCount();
    renderCart();
    renderCheckoutSummary();
    showToast(t("cart.cleared", "Cart cleared."));
  }

  function renderCart() {
    const panel = document.querySelector("[data-cart-panel]");
    if (!panel) return;
    const cart = getCart();
    if (!cart.length) {
      panel.innerHTML = `<div class="cart-panel-header"><h2>${t("cart.title", "Cart")}</h2></div><div class="cart-empty"><h3>${t("cart.empty", "Your cart is empty.")}</h3><a class="btn btn--gold" href="${localePath("/shop")}">${t("cart.backShop", "Back to Shop")}</a></div>`;
      return;
    }
    let total = 0;
    const rows = cart.map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      if (!product) return "";
      total += Number(product.price) * item.qty;
      return `
        <div class="cart-row" data-cart-row="${item.id}">
          <img src="${product.image}" alt="${productName(product)}">
          <div class="cart-row__content">
            <strong>${productName(product)}</strong>
            <div class="cart-qty-control" aria-label="${t("cart.qty", "Qty")}">
              <button type="button" data-cart-decrease="${item.id}" aria-label="Decrease quantity">-</button>
              <span class="ltr-value">${item.qty}</span>
              <button type="button" data-cart-increase="${item.id}" aria-label="Increase quantity">+</button>
            </div>
            <button class="cart-remove" type="button" data-cart-remove="${item.id}">${t("cart.remove", "Remove")}</button>
          </div>
          <div class="cart-row__price">${priceBlock(Number(product.price) * item.qty)}</div>
        </div>
      `;
    }).join("");
    const delivery = 0;
    const grandTotal = total;
    const firstProduct = products.find((entry) => entry.id === cart[0]?.id);
    const addons = smartSuggestionsFor(firstProduct, 4).map(cartAddonCard).join("");
    panel.innerHTML = `
      <div class="cart-panel-header">
        <h2>${t("cart.title", "Cart")}</h2>
        <button type="button" data-cart-clear>${t("cart.clear", "Clear Cart")}</button>
      </div>
      <div class="cart-row-list">${rows}</div>
      <section class="cart-inline-addons">
        <div class="cart-section-title">
          <h3>${t("cart.youMayAlsoLike", "You may also like")}</h3>
        </div>
        <div class="cart-addon-row">${addons}</div>
      </section>
      <section class="cart-coupon">
        <label for="cart-coupon-code">${t("cart.coupon", "Coupon Code")}</label>
        <div>
          <input id="cart-coupon-code" type="text" placeholder="${t("cart.couponPlaceholder", "Enter coupon code")}">
          <button type="button">${t("cart.apply", "Apply")}</button>
        </div>
      </section>
      <div class="cart-totals">
        <div><span>${t("cart.subtotal", "Subtotal")}</span>${priceBlock(total)}</div>
        <div><span>${t("cart.deliveryShort", "Delivery")}</span><strong class="ltr-value">${delivery ? formatAED(delivery) : t("cart.free", "Free")}</strong></div>
        <div class="total"><span>${t("cart.total", "Total")}</span>${priceBlock(grandTotal)}</div>
        ${usdNote()}
        <a class="btn btn--gold" href="${localePath("/checkout")}">${t("cart.checkout", "Proceed to Checkout")}</a>
      </div>
    `;
    bindProductEvents(panel);
  }

  function cartTotals(cart) {
    const subtotal = cart.reduce((sum, item) => {
      const product = products.find((entry) => entry.id === item.id);
      return product ? sum + Number(product.price) * item.qty : sum;
    }, 0);
    const delivery = 0;
    return { subtotal, delivery, total: subtotal + delivery };
  }

  function renderCheckoutSummary() {
    const target = document.querySelector("[data-checkout-summary]");
    if (!target) return;
    const cart = getCart();
    if (!cart.length) {
      target.innerHTML = `<p>${t("cart.empty", "Your cart is empty.")}</p><a class="btn btn--gold" href="${localePath("/shop")}">${t("cart.backShop", "Back to Shop")}</a>`;
      return;
    }
    const rows = cart.map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      if (!product) return "";
      return `<div class="summary-item"><img src="${product.image}" alt="${productName(product)}"><div><strong>${productName(product)}</strong><span>${t("cart.qty", "Qty")} ${item.qty}</span></div>${priceBlock(Number(product.price) * item.qty)}</div>`;
    }).join("");
    const totals = cartTotals(cart);
    target.innerHTML = `${rows}<div class="summary-line"><span>${t("cart.subtotal", "Subtotal")}</span>${priceBlock(totals.subtotal)}</div><div class="summary-line"><span>${t("cart.delivery", "Delivery Fee")}</span><strong class="ltr-value">${totals.delivery ? formatAED(totals.delivery) : t("cart.free", "Free")}</strong></div><div class="summary-line total"><span>${t("cart.total", "Total")}</span>${priceBlock(totals.total)}</div>${usdNote()}`;
  }

  function setupCheckoutForm() {
    const form = document.querySelector("[data-checkout-form]");
    if (!form) return;
    const errorBox = document.querySelector("[data-checkout-error]");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const cart = getCart();
      if (!cart.length) {
        errorBox.hidden = false;
        errorBox.textContent = t("cart.empty", "Your cart is empty.");
        return;
      }
      const formData = new FormData(form);
      const submitButton = form.querySelector("button[type='submit']");
      submitButton.disabled = true;
      submitButton.textContent = "Starting Payment...";
      errorBox.hidden = true;
      try {
        const response = await fetch("/api/create-payment-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: formData.get("paymentMethod"),
            customer: {
              name: formData.get("name"),
              email: formData.get("email"),
              phone: formData.get("phone"),
              address1: formData.get("address1"),
              address2: formData.get("address2"),
              city: formData.get("city"),
              emirate: formData.get("emirate"),
              notes: formData.get("notes")
            },
            cart: cart.map((item) => ({ productId: item.id, quantity: item.qty }))
          })
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Payment could not be started.");
        window.location.href = payload.redirectUrl;
      } catch (error) {
        errorBox.hidden = false;
        errorBox.textContent = error.message;
        submitButton.disabled = false;
        submitButton.textContent = t("buttons.paySecurely", "Pay Securely");
      }
    });
  }

  function productCard(product) {
    return `<article class="product-card" data-product-card data-product-url="${localePath(`/product/${product.slug}`)}" data-name-en="${product.name}" data-name-ar="${product.nameAr || ""}" data-description-en="${product.description}" data-description-ar="${product.descriptionAr || ""}" data-category-key="${product.category}"><a href="${localePath(`/product/${product.slug}`)}"><img src="${product.image}" alt="${productName(product)}" loading="lazy"></a><span class="product-card__category" data-category-label>${categoryName(product.category, product.category.replace("-", " "))}</span><h3><a href="${localePath(`/product/${product.slug}`)}" data-product-name>${productName(product)}</a></h3><p class="product-card__description" data-product-description>${productDescription(product)}</p><p class="price">${priceBlock(product.price)}</p><button class="btn btn--small btn--gold" data-add-to-cart="${product.id}">${t("buttons.addToCart", "Add to Cart")}</button></article>`;
  }

  function renderCartSuggestions() {
    const target = document.querySelector("[data-cart-suggestions]");
    if (!target) return;
    const cart = getCart();
    const first = products.find((product) => product.id === cart[0]?.id);
    target.innerHTML = smartSuggestionsFor(first, 4).map(productCard).join("");
    bindProductEvents(target);
    setupScrollReveal(target);
  }

  function bindProductEvents(scope = document) {
    scope.querySelectorAll("[data-add-to-cart]").forEach((button) => {
      if (button.dataset.cartBound) return;
      button.dataset.cartBound = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const quantityInput = document.querySelector("[data-quantity]");
        const qty = Math.max(1, Number(quantityInput ? quantityInput.value : 1) || 1);
        addToCart(button.dataset.addToCart, qty);
      });
    });
    scope.querySelectorAll("[data-product-card]").forEach((card) => {
      if (card.dataset.cardBound) return;
      card.dataset.cardBound = "true";
      card.addEventListener("click", (event) => {
        if (event.target.closest("a, button")) return;
        window.location.href = card.dataset.productUrl;
      });
    });
  }

  function setupCollectionFilters() {
    const collection = document.querySelector("[data-collection]");
    if (!collection) return;
    const sidebar = collection.querySelector("[data-filter-sidebar]");
    const cards = Array.from(collection.querySelectorAll("[data-product-grid] [data-product-card]"));
    const grid = collection.querySelector("[data-product-grid]");
    const empty = collection.querySelector("[data-filter-empty]");
    const resultCount = collection.querySelector("[data-result-count]");
    const search = collection.querySelector("[data-product-search]");
    const minInput = collection.querySelector("[data-price-min]");
    const maxInput = collection.querySelector("[data-price-max]");
    const sort = collection.querySelector("[data-sort-products]");
    const filterOpen = collection.querySelector("[data-filter-open]");
    const filterClose = collection.querySelector("[data-filter-close]");
    const categorySearch = collection.querySelector("[data-category-search]");
    const categoryRows = Array.from(collection.querySelectorAll("[data-filter-category]"));
    const activeTags = new Set();
    const activeBundles = new Set();
    const cardHasAny = (card, attr, activeValues) => {
      if (!activeValues.size) return true;
      const values = (card.dataset[attr] || "").split("|").filter(Boolean);
      return values.some((value) => activeValues.has(value));
    };
    const getCheckedValues = (selector) => Array.from(collection.querySelectorAll(`${selector}:checked`)).map((item) => item.value);

    function applyFilters() {
      const query = (search?.value || "").trim().toLowerCase();
      const min = Number(minInput?.value || 0);
      const max = Number(maxInput?.value || Number.MAX_SAFE_INTEGER);
      const badges = new Set(getCheckedValues("[data-filter-badge]"));
      const stockValues = new Set(getCheckedValues("[data-filter-stock]"));
      const rating = Number(collection.querySelector("[data-filter-rating]:checked")?.value || 0);
      let visible = 0;
      cards.forEach((card) => {
        const price = Number(card.dataset.price || 0);
        const cardRating = Number(card.dataset.rating || 0);
        const matches = (!query || card.dataset.name.includes(query)) && price >= min && price <= max && cardHasAny(card, "badges", badges) && cardHasAny(card, "tags", activeTags) && (!activeBundles.size || activeBundles.has(card.dataset.bundle)) && (!stockValues.size || stockValues.has(card.dataset.stock)) && (!rating || cardRating >= rating);
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      if (resultCount) resultCount.textContent = visible ? `${t("shop.showing", "Showing")} 1-${visible} of ${visible} ${t("shop.products", "products")}` : `${t("shop.showing", "Showing")} 0 of 0 ${t("shop.products", "products")}`;
      if (empty) empty.hidden = visible !== 0;
      if (grid) grid.hidden = visible === 0;
    }

    function sortCards() {
      if (!grid || !sort) return;
      const sorted = cards.slice().sort((a, b) => {
        if (sort.value === "price-asc") return Number(a.dataset.price) - Number(b.dataset.price);
        if (sort.value === "price-desc") return Number(b.dataset.price) - Number(a.dataset.price);
        if (sort.value === "rating") return Number(b.dataset.rating) - Number(a.dataset.rating);
        return 0;
      });
      sorted.forEach((card) => grid.appendChild(card));
    }

    [search, minInput, maxInput].forEach((input) => input?.addEventListener("input", applyFilters));
    collection.querySelectorAll("[data-filter-badge], [data-filter-stock], [data-filter-rating]").forEach((input) => input.addEventListener("change", applyFilters));
    collection.querySelectorAll("[data-filter-tag]").forEach((button) => button.addEventListener("click", () => {
      button.classList.toggle("is-active");
      activeTags.has(button.dataset.filterTag) ? activeTags.delete(button.dataset.filterTag) : activeTags.add(button.dataset.filterTag);
      applyFilters();
    }));
    collection.querySelectorAll("[data-filter-bundle]").forEach((button) => button.addEventListener("click", () => {
      button.classList.toggle("is-active");
      activeBundles.has(button.dataset.filterBundle) ? activeBundles.delete(button.dataset.filterBundle) : activeBundles.add(button.dataset.filterBundle);
      applyFilters();
    }));
    sort?.addEventListener("change", () => { sortCards(); applyFilters(); });
    filterOpen?.addEventListener("click", () => sidebar?.classList.add("is-open"));
    filterClose?.addEventListener("click", () => sidebar?.classList.remove("is-open"));
    sidebar?.addEventListener("click", (event) => { if (event.target === sidebar) sidebar.classList.remove("is-open"); });
    categorySearch?.addEventListener("input", () => {
      const query = categorySearch.value.trim().toLowerCase();
      categoryRows.forEach((row) => { row.hidden = query && !row.dataset.filterCategory.includes(query); });
    });
    window.addEventListener("languageChanged", applyFilters);
    applyFilters();
  }

  function setupScrollReveal(scope = document) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealSelectors = [
      ".hero__copy > *",
      ".section__head > *",
      ".section-intro",
      ".shop-goal-section .section-heading > *",
      ".shop-goal-section .goal-card",
      ".category-tile",
      ".product-card",
      ".blog-card",
      ".contact-mini",
      ".footer__grid > *",
      ".collection-hero .container > *",
      ".collection-toolbar",
      ".filter-panel",
      ".product-detail__media",
      ".product-detail__content > *",
      ".checkout-card",
      ".checkout-summary",
      ".protein-calc-shell",
      ".calc-form-card",
      ".plan-panel",
      ".coach-card",
      ".coach-panel"
    ];
    const nodes = Array.from(scope.querySelectorAll(revealSelectors.join(","))).filter((node) => !node.dataset.scrollRevealReady);

    if (!nodes.length) return;

    nodes.forEach((node, index) => {
      node.dataset.scrollRevealReady = "true";
      node.dataset.scrollReveal = node.matches(".product-card, .goal-card, .blog-card, .category-tile, .contact-mini") ? "fade-card" : "fade-up";
      node.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 55}ms`);
      if (reduceMotion) node.classList.add("is-visible");
    });

    if (reduceMotion) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = setupScrollReveal.observer || new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        setupScrollReveal.observer?.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.14 });

    setupScrollReveal.observer = observer;
    nodes.forEach((node) => observer.observe(node));
  }

  window.addEventListener("protein:add-stack", (event) => {
    const ids = event.detail || [];
    ids.forEach((id) => addToCart(id, 1));
    showToast("Your protein stack was added to cart.");
  });

  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (menuToggle && nav) menuToggle.addEventListener("click", () => nav.classList.toggle("is-open"));

  const shopToggle = document.querySelector("[data-shop-toggle]");
  const shopMenu = document.querySelector(".shop-menu");
  if (shopToggle && shopMenu) {
    shopToggle.addEventListener("click", (event) => {
      if (window.matchMedia("(max-width: 1020px)").matches) {
        event.preventDefault();
        shopMenu.classList.toggle("is-open");
      }
    });
  }

  const searchOverlay = document.querySelector("[data-search-overlay]");
  const searchOpen = document.querySelector("[data-search-open]");
  const searchClose = document.querySelector("[data-search-close]");
  if (searchOverlay && searchOpen && searchClose) {
    searchOpen.addEventListener("click", () => searchOverlay.classList.add("is-open"));
    searchClose.addEventListener("click", () => searchOverlay.classList.remove("is-open"));
    searchOverlay.addEventListener("click", (event) => { if (event.target === searchOverlay) searchOverlay.classList.remove("is-open"); });
  }

  document.addEventListener("click", (event) => {
    const increase = event.target.closest("[data-cart-increase]");
    const decrease = event.target.closest("[data-cart-decrease]");
    const remove = event.target.closest("[data-cart-remove]");
    const clear = event.target.closest("[data-cart-clear]");
    if (increase) {
      const current = getCart().find((item) => item.id === increase.dataset.cartIncrease);
      if (current) setCartItemQuantity(current.id, current.qty + 1);
    }
    if (decrease) {
      const current = getCart().find((item) => item.id === decrease.dataset.cartDecrease);
      if (current) setCartItemQuantity(current.id, current.qty - 1);
    }
    if (remove) removeCartItem(remove.dataset.cartRemove);
    if (clear) clearCart();
  });

  updateCartCount();
  renderCart();
  renderCheckoutSummary();
  renderCartSuggestions();
  setupCollectionFilters();
  setupCheckoutForm();
  bindProductEvents();
  setupScrollReveal();
  window.addEventListener("languageChanged", () => {
    renderCart();
    renderCheckoutSummary();
    renderCartSuggestions();
    setupScrollReveal();
  });
})();
