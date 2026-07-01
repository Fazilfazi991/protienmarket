(function () {
  const sidebar = document.querySelector("[data-admin-sidebar]");
  const menu = document.querySelector("[data-admin-menu]");

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("is-open");
  }

  if (menu && sidebar) {
    menu.addEventListener("click", () => sidebar.classList.toggle("is-open"));
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".admin-sidebar a");
    if (link) closeSidebar();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });
})();
