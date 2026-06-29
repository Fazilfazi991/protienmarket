(function () {
  const translations = window.TRANSLATIONS || {};
  const supported = ["en", "ar"];
  const storageKey = "siteLanguage";

  function get(obj, path) {
    return String(path || "").split(".").reduce((value, part) => value && value[part], obj);
  }

  function currentLang() {
    const saved = localStorage.getItem(storageKey);
    return supported.includes(saved) ? saved : "en";
  }

  function t(key, fallback = "") {
    const lang = currentLang();
    return get(translations[lang], key) || get(translations.en, key) || fallback || key;
  }

  function isArabic() {
    return currentLang() === "ar";
  }

  function updateDirection(lang) {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.body.classList.remove("lang-en", "lang-ar", "dir-ltr", "dir-rtl");
    document.body.classList.add(`lang-${lang}`, `dir-${dir}`);
  }

  function translatePage(lang) {
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n, node.textContent);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder, node.getAttribute("placeholder") || ""));
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
      node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel, node.getAttribute("aria-label") || ""));
    });
    document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
      const active = button.dataset.langToggle === lang;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function applyProductTranslations() {
    document.querySelectorAll("[data-product-card]").forEach((card) => {
      const name = isArabic() && card.dataset.nameAr ? card.dataset.nameAr : card.dataset.nameEn;
      const description = isArabic() && card.dataset.descriptionAr ? card.dataset.descriptionAr : card.dataset.descriptionEn;
      const category = card.dataset.categoryKey ? t(`categories.${card.dataset.categoryKey}`, card.dataset.categoryLabel || card.dataset.categoryKey) : "";
      card.querySelectorAll("[data-product-name]").forEach((node) => { node.textContent = name || node.textContent; });
      card.querySelectorAll("[data-product-description]").forEach((node) => { node.textContent = description || node.textContent; });
      card.querySelectorAll("[data-category-label]").forEach((node) => { node.textContent = category || node.textContent; });
      const img = card.querySelector("img");
      if (img && name) img.alt = name;
    });
    document.querySelectorAll("[data-product-detail-name]").forEach((node) => {
      node.textContent = isArabic() && node.dataset.nameAr ? node.dataset.nameAr : node.dataset.nameEn || node.textContent;
    });
    document.querySelectorAll("[data-product-detail-description]").forEach((node) => {
      node.textContent = isArabic() && node.dataset.descriptionAr ? node.dataset.descriptionAr : node.dataset.descriptionEn || node.textContent;
    });
  }

  function applyLanguage(lang) {
    const normalized = supported.includes(lang) ? lang : "en";
    updateDirection(normalized);
    translatePage(normalized);
    applyProductTranslations();
  }

  function setLanguage(lang) {
    const normalized = supported.includes(lang) ? lang : "en";
    localStorage.setItem(storageKey, normalized);
    applyLanguage(normalized);
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: normalized } }));
  }

  function convertAEDtoUSD(aed) {
    const config = window.SHOP_CONFIG || {};
    return Number(aed || 0) * Number(config.aedToUsdRate || 0.2723);
  }

  function formatAED(amount) {
    return `AED ${Number(amount || 0).toFixed(2)}`;
  }

  function formatUSD(amount) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount || 0));
  }

  function priceBlock(aed, large = false) {
    const config = window.SHOP_CONFIG || {};
    const usd = convertAEDtoUSD(aed);
    const usdLine = config.displayUsdPrices === false ? "" : `<span class="price-usd ltr-value">≈ ${formatUSD(usd)}</span>`;
    return `<span class="price-block${large ? " price-block--large" : ""}"><span class="price-aed ltr-value">${formatAED(aed)}</span>${usdLine}</span>`;
  }

  function productName(product) {
    return isArabic() && product?.nameAr ? product.nameAr : product?.name;
  }

  function productDescription(product) {
    return isArabic() && product?.descriptionAr ? product.descriptionAr : product?.description;
  }

  function categoryName(slug, fallback) {
    return t(`categories.${slug}`, fallback || slug);
  }

  window.I18N = {
    t,
    setLanguage,
    applyLanguage,
    currentLang,
    isArabic,
    productName,
    productDescription,
    categoryName
  };

  window.ShopMoney = {
    convertAEDtoUSD,
    formatAED,
    formatUSD,
    priceBlock
  };

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-lang-toggle]");
    if (toggle) setLanguage(toggle.dataset.langToggle);
  });

  if (document.body) {
    applyLanguage(currentLang());
  } else {
    document.addEventListener("DOMContentLoaded", () => applyLanguage(currentLang()));
  }
})();
