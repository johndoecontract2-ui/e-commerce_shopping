import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../middleware/index.js";

const TAX_RATE = 0.18; // 18% GST
const FREE_SHIP_THRESHOLD = 999;
const SHIP_FEE = 79;

// Round to 2 decimals without binary-float drift (e.g. 667.8199999 -> 667.82).
const money = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Compute totals authoritatively on the server. The client is never
 * trusted for prices — this prevents tampering and drip-pricing, and
 * guarantees the displayed breakdown matches what is charged.
 * Every component is rounded so the parts always sum exactly to the total.
 */
export function computeTotals(items) {
  const itemsPrice = money(items.reduce((sum, it) => sum + it.price * it.qty, 0));
  const taxPrice = money(itemsPrice * TAX_RATE);
  const shippingPrice =
    itemsPrice >= FREE_SHIP_THRESHOLD || itemsPrice === 0 ? 0 : SHIP_FEE;
  const totalPrice = money(itemsPrice + taxPrice + shippingPrice);
  return { itemsPrice, taxPrice, shippingPrice, totalPrice };
}

// POST /api/orders  (auth)
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  // Resolve every product from the DB (never trust client-sent prices).
  const ids = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const lineItems = [];
  for (const item of items) {
    const product = byId.get(item.product);
    if (!product) {
      res.status(400);
      throw new Error(`Product not found: ${item.product}`);
    }
    if (product.countInStock < item.qty) {
      res.status(409);
      throw new Error(`Insufficient stock for "${product.name}"`);
    }
    lineItems.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      qty: item.qty,
    });
  }

  const totals = computeTotals(lineItems);

  // Decrement stock atomically-ish (single-node safe; use a txn on a replica set).
  for (const item of items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { countInStock: -item.qty } }
    );
  }

  const order = await Order.create({
    user: req.user._id,
    items: lineItems,
    shippingAddress,
    paymentMethod,
    ...totals,
    status: "pending",
  });

  res.status(201).json(order);
});

// GET /api/orders/mine  (auth)
export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id  (auth — own order or admin)
export const getOrder = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error("Invalid order id");
  }
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  const owns = order.user._id.toString() === req.user._id.toString();
  if (!owns && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }
  res.json(order);
});

// PUT /api/orders/:id/pay  (auth) — mock payment capture
export const payOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }
  order.isPaid = true;
  order.paidAt = new Date();
  order.status = "paid";
  order.paymentResult = {
    id: req.body?.paymentId || `mock_${Date.now()}`,
    status: "captured",
    updateTime: new Date().toISOString(),
  };
  await order.save();
  res.json(order);
});

// GET /api/orders  (admin)
export const allOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 });
  res.json(orders);
});

// PUT /api/orders/:id/status  (admin)
export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ["pending", "paid", "shipped", "delivered", "cancelled"];
  if (!valid.includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  order.status = status;
  if (status === "delivered") {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }
  await order.save();
  res.json(order);
});
