(function () {
  const sidebar = document.querySelector("[data-admin-sidebar]");
  const menu = document.querySelector("[data-admin-menu]");
  const drawer = document.querySelector("[data-order-drawer]");
  const drawerClose = document.querySelector("[data-drawer-close]");
  const drawerId = document.querySelector("[data-drawer-id]");
  const drawerContent = document.querySelector("[data-drawer-content]");

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("is-open");
  }

  function openDrawer(order) {
    if (!drawer || !drawerId || !drawerContent) return;

    drawerId.textContent = order.id;
    drawerContent.innerHTML = `
      <div class="drawer-box">
        <h3>Customer info</h3>
        <p><strong>${order.name}</strong></p>
        <p>${order.phone}</p>
        <p>${order.email}</p>
        <p>${order.address}</p>
      </div>
      <div class="drawer-box">
        <h3>Products ordered</h3>
        ${order.products.map((item) => `<p>${item[0]} - Qty ${item[1]} - ${item[2]}</p>`).join("")}
        <p><strong>Total: ${order.total}</strong></p>
      </div>
      <div class="drawer-box">
        <h3>Status</h3>
        <p>Payment: ${order.payment}</p>
        <p>Order: ${order.status}</p>
        <select aria-label="Update order status">
          <option>${order.status}</option>
          <option>Processing</option>
          <option>Out for Delivery</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
      </div>
      <div class="drawer-box">
        <h3>Notes</h3>
        <p>${order.notes}</p>
        <button class="admin-primary" type="button">Open WhatsApp</button>
      </div>
    `;

    drawer.hidden = false;
  }

  if (menu && sidebar) {
    menu.addEventListener("click", () => sidebar.classList.toggle("is-open"));
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".admin-sidebar a");
    const orderButton = event.target.closest("[data-order]");

    if (link) closeSidebar();
    if (orderButton) openDrawer(JSON.parse(orderButton.dataset.order));
    if (event.target === drawer) drawer.hidden = true;
  });

  if (drawerClose && drawer) {
    drawerClose.addEventListener("click", () => {
      drawer.hidden = true;
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSidebar();
      if (drawer) drawer.hidden = true;
    }
  });
})();
