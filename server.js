require("dotenv").config();
const express = require("express");
const path = require("path");
const products = require("./data/products.json");
const menuCategories = require("./data/categories.json");
const goals = require("./data/goals.json");
const blogs = require("./data/blogs.json");
const paymentGateway = require("./services/payment-gateway");
const ordersStore = require("./services/orders");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.post("/api/payment-webhook", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const event = paymentGateway.verifyWebhook(req);
    const normalized = paymentGateway.parsePaymentEvent(event);
    const order = normalized.orderId
      ? ordersStore.findOrder(normalized.orderId)
      : ordersStore.findOrderBySession(normalized.sessionId);

    if (!order) return res.status(200).json({ received: true, ignored: "order-not-found" });

    if (normalized.status === "paid") {
      ordersStore.updateOrder(order.id, (current) => ({
        ...current,
        paidAt: current.paidAt || new Date().toISOString(),
        payment: {
          ...current.payment,
          status: "paid",
          transactionId: normalized.transactionId || current.payment.transactionId
        },
        orderStatus: "processing"
      }));
    } else if (["failed", "expired", "canceled", "cancelled"].includes(normalized.status)) {
      ordersStore.updateOrder(order.id, (current) => ({
        ...current,
        payment: { ...current.payment, status: "failed" },
        orderStatus: "payment-failed"
      }));
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Payment webhook error:", error.message);
    return res.status(400).json({ error: "Invalid payment webhook" });
  }
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const categories = menuCategories;

const money = (value) => Number(value).toFixed(2);

const categoryCounts = categories.reduce((counts, category) => {
  counts[category.slug] = products.filter((product) => product.category === category.slug).length;
  return counts;
}, {});

const priceBounds = products.reduce(
  (bounds, product) => ({
    min: Math.min(bounds.min, product.price),
    max: Math.max(bounds.max, product.price)
  }),
  { min: Infinity, max: 0 }
);

const popularProducts = products
  .slice()
  .sort((a, b) => b.rating - a.rating || Number(b.sale) - Number(a.sale))
  .slice(0, 4);

const productMatchesGoal = (product, goal) => {
  const tags = product.tags || [];
  const productGoals = product.goals || [];
  return (
    productGoals.includes(goal.name) ||
    productGoals.includes(goal.matchGoal) ||
    tags.some((tag) => goal.tags.includes(tag)) ||
    goal.categories.includes(product.category) ||
    goal.subcategories.includes(product.subcategory) ||
    (goal.diet && (product.diet || []).includes(goal.diet))
  );
};

const findCategory = (slug) => categories.find((category) => category.slug === slug);

const findSubcategory = (category, slug) => {
  if (!category || !slug) return null;
  return category.children.find((child) => child.slug === slug);
};

const getCategoryProducts = (categorySlug, subcategorySlug) =>
  products.filter((product) => {
    const categoryMatch = product.category === categorySlug;
    const subcategoryMatch = !subcategorySlug || product.subcategory === subcategorySlug;
    return categoryMatch && subcategoryMatch;
  });

app.use((req, res, next) => {
  res.locals.products = products;
  res.locals.categories = categories;
  res.locals.blogs = blogs;
  res.locals.currentPath = req.path;
  res.locals.money = money;
  res.locals.categoryCounts = categoryCounts;
  res.locals.priceBounds = priceBounds;
  res.locals.popularProducts = popularProducts;
  res.locals.goals = goals;
  res.locals.paymentMode = process.env.PAYMENT_GATEWAY_MODE || "sandbox";
  res.locals.whatsappNumber = process.env.WHATSAPP_NUMBER || "971553271712";
  next();
});

function normalizeCheckoutCart(cartItems = []) {
  return cartItems
    .map((item) => ({
      productId: item.productId || item.id,
      quantity: Math.max(1, Number(item.quantity || item.qty || 1))
    }))
    .filter((item) => item.productId);
}

function calculateOrder(cartItems) {
  const normalizedCart = normalizeCheckoutCart(cartItems);
  const items = normalizedCart.map((cartItem) => {
    const product = products.find((item) => item.id === cartItem.productId || item.slug === cartItem.productId);
    if (!product) return null;
    const quantity = Math.max(1, Number(cartItem.quantity) || 1);
    const unitPrice = Number(product.price);
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity
    };
  }).filter(Boolean);

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = subtotal > 250 || subtotal === 0 ? 0 : 15;
  const discount = 0;
  const total = subtotal + deliveryFee - discount;

  return { items, subtotal, deliveryFee, discount, total, currency: "AED" };
}

function validateCheckoutPayload(body) {
  const required = ["name", "email", "phone", "address1", "city", "emirate"];
  const missing = required.filter((field) => !String(body.customer?.[field] || "").trim());
  if (missing.length) return `Missing required fields: ${missing.join(", ")}`;
  if (!String(body.customer.email).includes("@")) return "Please enter a valid email address.";
  return "";
}

app.get("/", (req, res) => {
  res.render("index", {
    goals,
    featuredProducts: products.slice(0, 5),
    featuredBlogs: blogs.slice(0, 3)
  });
});

app.get("/shop", (req, res) => {
  const activeCategory = req.query.category || "all";
  const q = (req.query.q || "").trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const categoryMatch = activeCategory === "all" || product.category === activeCategory;
    const searchMatch = !q || product.name.toLowerCase().includes(q) || product.description.toLowerCase().includes(q);
    return categoryMatch && searchMatch;
  });

  res.render("shop", { filteredProducts, activeCategory, activeSubcategory: null, q });
});

app.get("/category/:categorySlug", (req, res) => {
  const category = findCategory(req.params.categorySlug);
  if (!category) return res.status(404).render("not-found");

  res.render("category", {
    category,
    subcategory: null,
    activeCategory: category.slug,
    activeSubcategory: null,
    filteredProducts: getCategoryProducts(category.slug)
  });
});

app.get("/category/:categorySlug/:subcategorySlug", (req, res) => {
  const category = findCategory(req.params.categorySlug);
  const subcategory = findSubcategory(category, req.params.subcategorySlug);
  if (!category || !subcategory) return res.status(404).render("not-found");

  res.render("category", {
    category,
    subcategory,
    activeCategory: category.slug,
    activeSubcategory: subcategory.slug,
    filteredProducts: getCategoryProducts(category.slug, subcategory.slug)
  });
});

app.get("/product/:slug", (req, res) => {
  const product = products.find((item) => item.slug === req.params.slug);
  if (!product) return res.status(404).render("not-found");
  const category = findCategory(product.category);
  const subcategory = findSubcategory(category, product.subcategory);
  const relatedProducts = products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, 4);

  res.render("product", { product, category, subcategory, relatedProducts });
});

app.get("/cart", (req, res) => res.render("cart"));
app.get("/checkout", (req, res) => res.render("checkout"));
app.post("/api/create-payment-session", async (req, res) => {
  try {
    const validationError = validateCheckoutPayload(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const totals = calculateOrder(req.body.cart || []);
    if (!totals.items.length) return res.status(400).json({ error: "Your cart is empty." });

    const orders = ordersStore.readOrders();
    const order = {
      id: ordersStore.nextOrderId(orders),
      createdAt: new Date().toISOString(),
      customer: {
        name: String(req.body.customer.name || "").trim(),
        email: String(req.body.customer.email || "").trim(),
        phone: String(req.body.customer.phone || "").trim(),
        address1: String(req.body.customer.address1 || "").trim(),
        address2: String(req.body.customer.address2 || "").trim(),
        city: String(req.body.customer.city || "").trim(),
        emirate: String(req.body.customer.emirate || "").trim(),
        notes: String(req.body.customer.notes || "").trim()
      },
      ...totals,
      payment: {
        method: req.body.paymentMethod || "online",
        gateway: process.env.PAYMENT_GATEWAY_MODE || "sandbox",
        status: req.body.paymentMethod === "cod" ? "cash-on-delivery" : "pending",
        sessionId: "",
        transactionId: "",
        paymentUrl: ""
      },
      orderStatus: req.body.paymentMethod === "cod" ? "processing" : "pending-payment"
    };

    if (order.payment.method === "cod") {
      ordersStore.saveOrder(order);
      return res.json({ orderId: order.id, redirectUrl: `/payment/success?orderId=${encodeURIComponent(order.id)}&method=cod` });
    }

    ordersStore.saveOrder(order);
    const session = await paymentGateway.createPaymentSession(order);
    const updated = ordersStore.updateOrder(order.id, (current) => ({
      ...current,
      payment: {
        ...current.payment,
        gateway: session.gateway,
        sessionId: session.sessionId,
        paymentUrl: session.paymentUrl
      }
    }));

    return res.json({
      orderId: updated.id,
      sessionId: session.sessionId,
      redirectUrl: session.paymentUrl
    });
  } catch (error) {
    console.error("Create payment session error:", error.message);
    return res.status(500).json({ error: "Payment could not be started. Please try again." });
  }
});

app.get("/payment/success", async (req, res) => {
  let order = req.query.orderId ? ordersStore.findOrder(req.query.orderId) : null;
  if (!order && req.query.session_id) {
    order = ordersStore.findOrderBySession(req.query.session_id);
    try {
      const session = await paymentGateway.retrieveSession(req.query.session_id);
      if (order && session?.payment_status === "paid") {
        order = ordersStore.updateOrder(order.id, (current) => ({
          ...current,
          paidAt: current.paidAt || new Date().toISOString(),
          payment: {
            ...current.payment,
            status: "paid",
            transactionId: session.payment_intent || current.payment.transactionId
          },
          orderStatus: "processing"
        }));
      }
    } catch (error) {
      console.error("Success verification warning:", error.message);
    }
  }
  if (!order) return res.status(404).render("not-found");
  res.render("payment-success", { order });
});

app.get("/payment/failed", (req, res) => {
  const order = req.query.orderId ? ordersStore.findOrder(req.query.orderId) : null;
  res.render("payment-failed", { order, reason: req.query.reason || "failed" });
});

app.get("/order/:orderId", (req, res) => {
  const order = ordersStore.findOrder(req.params.orderId);
  if (!order) return res.status(404).render("not-found");
  res.render("order-confirmation", { order });
});

app.get("/admin/orders", (req, res) => {
  res.render("admin-orders", { orders: ordersStore.readOrders() });
});

app.get("/admin/orders/:orderId", (req, res) => {
  const order = ordersStore.findOrder(req.params.orderId);
  if (!order) return res.status(404).render("not-found");
  res.render("admin-order-detail", { order });
});

app.post("/admin/orders/:orderId/status", (req, res) => {
  const allowed = ["processing", "delivered", "cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).send("Invalid status");
  const order = ordersStore.updateOrder(req.params.orderId, (current) => ({
    ...current,
    orderStatus: req.body.status
  }));
  if (!order) return res.status(404).render("not-found");
  res.redirect(`/admin/orders/${encodeURIComponent(order.id)}`);
});
app.get("/protein-calculator", (req, res) => res.render("protein-calculator"));
app.get("/find-my-protein", (req, res) => res.render("find-my-protein"));
app.get("/build-your-stack", (req, res) => res.render("build-your-stack"));
app.get("/goal/:goalSlug", (req, res) => {
  const goal = goals.find((item) => item.slug === req.params.goalSlug);
  if (!goal) return res.status(404).render("not-found");
  const goalProducts = products.filter((product) => productMatchesGoal(product, goal)).slice(0, 8);
  const stackProducts = goalProducts.slice(0, 3);
  res.render("goal", { goal, goalProducts, stackProducts });
});
app.get("/blog", (req, res) => res.render("blog", { allBlogs: blogs }));

app.get("/blog/:slug", (req, res) => {
  const post = blogs.find((item) => item.slug === req.params.slug);
  if (!post) return res.status(404).render("not-found");
  res.render("blog-detail", { post });
});

app.get("/about", (req, res) => res.render("about"));
app.get("/contact", (req, res) => res.render("contact"));
app.get("/faq", (req, res) => res.render("faq"));

app.listen(PORT, () => {
  console.log(`Protein Market running at http://localhost:${PORT}`);
});
