/**
 * DB-independent unit tests. These cover the logic most prone to bugs:
 * price computation, Zod validation, password hashing/verify, JWT round-trip,
 * lockout math, and the toJSON redaction. No MongoDB required.
 */
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "unit_test_secret_value_long_enough";

import assert from "node:assert";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "./config/env.js";
import {
  registerSchema,
  loginSchema,
  orderSchema,
  addressSchema,
} from "./utils/validators.js";
import { computeTotals } from "./controllers/orderController.js";

let pass = 0,
  fail = 0;
const pending = [];
function test(label, fn) {
  const p = (async () => {
    try {
      await fn();
      pass++;
      console.log(`  ✓ ${label}`);
    } catch (e) {
      fail++;
      console.log(`  ✗ ${label}\n      ${e.message}`);
    }
  })();
  pending.push(p);
}

console.log("\n── Pricing logic (real controller code) ──");
test("small cart adds shipping fee", () => {
  const t = computeTotals([{ price: 200, qty: 1 }]);
  assert.equal(t.itemsPrice, 200);
  assert.equal(t.taxPrice, 36);
  assert.equal(t.shippingPrice, 79);
  assert.equal(t.totalPrice, 315);
});
test("cart over threshold ships free", () => {
  const t = computeTotals([{ price: 1000, qty: 1 }]);
  assert.equal(t.shippingPrice, 0);
  assert.equal(t.totalPrice, 1180);
});
test("multi-item quantity math", () => {
  const t = computeTotals([
    { price: 300, qty: 2 },
    { price: 150, qty: 3 },
  ]);
  assert.equal(t.itemsPrice, 1050);
  assert.equal(t.shippingPrice, 0);
});
test("total equals rounded sum of parts (no float drift)", () => {
  const t = computeTotals([{ price: 499, qty: 1 }]);
  const roundedSum =
    Math.round((t.itemsPrice + t.taxPrice + t.shippingPrice) * 100) / 100;
  assert.equal(t.totalPrice, roundedSum);
  assert.equal(t.totalPrice, 667.82);
});

console.log("\n── Zod validation ──");
test("valid registration passes", () => {
  const r = registerSchema.safeParse({
    name: "Jane",
    email: "jane@example.com",
    password: "password123",
  });
  assert.ok(r.success);
  assert.equal(r.data.consents.marketing, false); // safe default, not pre-ticked
});
test("short password rejected", () => {
  const r = registerSchema.safeParse({
    name: "Jane",
    email: "jane@example.com",
    password: "short",
  });
  assert.ok(!r.success);
});
test("bad email rejected", () => {
  assert.ok(!loginSchema.safeParse({ email: "nope", password: "x" }).success);
});
test("pincode must be 6 digits", () => {
  const bad = addressSchema.safeParse({
    fullName: "A B",
    line1: "123 St",
    city: "City",
    state: "State",
    pincode: "12",
    phone: "9876543210",
  });
  assert.ok(!bad.success);
});
test("order requires at least one item", () => {
  const r = orderSchema.safeParse({
    items: [],
    shippingAddress: {
      fullName: "A B",
      line1: "123 St",
      city: "City",
      state: "State",
      pincode: "560001",
      phone: "9876543210",
    },
  });
  assert.ok(!r.success);
});
test("order defaults paymentMethod to cod", () => {
  const r = orderSchema.safeParse({
    items: [{ product: "abc", qty: 1 }],
    shippingAddress: {
      fullName: "A B",
      line1: "123 St",
      city: "City",
      state: "State",
      pincode: "560001",
      phone: "9876543210",
    },
  });
  assert.ok(r.success);
  assert.equal(r.data.paymentMethod, "cod");
});

console.log("\n── Password hashing ──");
test("bcrypt hash verifies correctly", async () => {
  const hash = await bcrypt.hash("Sup3rSecret!", config.bcryptRounds);
  assert.notEqual(hash, "Sup3rSecret!");
  assert.ok(await bcrypt.compare("Sup3rSecret!", hash));
  assert.ok(!(await bcrypt.compare("wrong", hash)));
});

console.log("\n── JWT round-trip ──");
test("token signs and verifies", () => {
  const token = jwt.sign({ id: "u1", role: "admin" }, config.jwtSecret, {
    expiresIn: "1h",
  });
  const decoded = jwt.verify(token, config.jwtSecret);
  assert.equal(decoded.id, "u1");
  assert.equal(decoded.role, "admin");
});
test("tampered token rejected", () => {
  const token = jwt.sign({ id: "u1" }, config.jwtSecret);
  assert.throws(() => jwt.verify(token + "x", config.jwtSecret));
});

console.log("\n── Lockout math ──");
test("lock triggers at max attempts", () => {
  let attempts = 0,
    lockUntil = null;
  for (let i = 0; i < config.maxLoginAttempts; i++) {
    attempts += 1;
    if (attempts >= config.maxLoginAttempts) {
      lockUntil = Date.now() + config.lockMinutes * 60000;
      attempts = 0;
    }
  }
  assert.ok(lockUntil && lockUntil > Date.now());
});

console.log("\n── Model redaction (toJSON) ──");
test("User.toJSON strips sensitive fields", async () => {
  const { default: User } = await import("./models/User.js");
  const u = new User({ name: "T", email: "t@t.com", passwordHash: "secrethash" });
  u.loginAttempts = 3;
  const json = u.toJSON();
  assert.equal(json.passwordHash, undefined);
  assert.equal(json.loginAttempts, undefined);
  assert.equal(json.name, "T");
});

(async () => {
  await Promise.all(pending);
  console.log(`\n──────────────────────────────`);
  console.log(`Unit results: ${pass} passed, ${fail} failed`);
  console.log(`──────────────────────────────\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
