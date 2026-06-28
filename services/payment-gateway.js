const Stripe = require("stripe");

const mode = process.env.PAYMENT_GATEWAY_MODE || "sandbox";
const secretKey = process.env.PAYMENT_GATEWAY_SECRET_KEY || "";
const webhookSecret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || "";
const siteUrl = process.env.SITE_URL || "http://localhost:3000";

const stripe = secretKey ? new Stripe(secretKey, { apiVersion: "2024-06-20" }) : null;

async function createPaymentSession(order) {
  if (!stripe) {
    throw new Error("Payment gateway secret key is missing.");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    currency: order.currency.toLowerCase(),
    client_reference_id: order.id,
    customer_email: order.customer.email,
    metadata: {
      orderId: order.id,
      gatewayMode: mode
    },
    line_items: order.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: order.currency.toLowerCase(),
        unit_amount: Math.round(item.unitPrice * 100),
        product_data: {
          name: item.name,
          metadata: {
            productId: item.productId,
            slug: item.slug
          }
        }
      }
    })).concat(order.deliveryFee > 0 ? [{
      quantity: 1,
      price_data: {
        currency: order.currency.toLowerCase(),
        unit_amount: Math.round(order.deliveryFee * 100),
        product_data: { name: "UAE Delivery" }
      }
    }] : []),
    success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/payment/failed?orderId=${encodeURIComponent(order.id)}&reason=cancelled`
  });

  return {
    gateway: "stripe",
    sessionId: session.id,
    paymentUrl: session.url
  };
}

function verifyWebhook(req) {
  if (!stripe || !webhookSecret) {
    if (Buffer.isBuffer(req.body)) {
      return JSON.parse(req.body.toString("utf8"));
    }
    return req.body;
  }

  const signature = req.headers["stripe-signature"];
  return stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
}

function parsePaymentEvent(event) {
  const payload = event.data?.object || event;
  const status = payload.payment_status || payload.status;
  const orderId = payload.metadata?.orderId || payload.client_reference_id;

  return {
    type: event.type || "unknown",
    orderId,
    sessionId: payload.id,
    transactionId: payload.payment_intent || payload.latest_charge || "",
    status: status === "paid" || event.type === "checkout.session.completed" ? "paid" : status,
    raw: event
  };
}

async function retrieveSession(sessionId) {
  if (!stripe || !sessionId) return null;
  return stripe.checkout.sessions.retrieve(sessionId);
}

module.exports = {
  createPaymentSession,
  parsePaymentEvent,
  retrieveSession,
  verifyWebhook
};
