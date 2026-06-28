const fs = require("fs");
const path = require("path");

const ordersPath = path.join(__dirname, "..", "data", "orders.json");

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ordersPath, "utf8"));
  } catch (error) {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2));
}

function nextOrderId(orders) {
  const max = orders.reduce((highest, order) => {
    const numeric = Number(String(order.id || "").replace("ORD-", ""));
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 1000);
  return `ORD-${max + 1}`;
}

function saveOrder(order) {
  const orders = readOrders();
  const existingIndex = orders.findIndex((item) => item.id === order.id);
  if (existingIndex >= 0) orders[existingIndex] = order;
  else orders.unshift(order);
  writeOrders(orders);
  return order;
}

function findOrder(orderId) {
  return readOrders().find((order) => order.id === orderId);
}

function findOrderBySession(sessionId) {
  return readOrders().find((order) => order.payment?.sessionId === sessionId);
}

function updateOrder(orderId, updater) {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) return null;
  orders[index] = updater(orders[index]);
  writeOrders(orders);
  return orders[index];
}

module.exports = {
  findOrder,
  findOrderBySession,
  nextOrderId,
  readOrders,
  saveOrder,
  updateOrder
};
