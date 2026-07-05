import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDB, disconnectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { seedDatabase } from "./utils/seed.js";

let mongod, server, base;
let pass = 0,
  fail = 0;

function ok(cond, label) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}`);
  }
}

// Tiny fetch wrapper that preserves cookies per "session".
function client() {
  let cookie = "";
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* no body */
    }
    return { status: res.status, data };
  };
}

async function run() {
  process.env.NODE_ENV = "test";

  // Prefer an explicit URI (e.g. a local mongod or Atlas) if provided;
  // otherwise spin up an in-memory server (downloads a binary on first run).
  let uri = process.env.TEST_MONGO_URI;
  if (!uri) {
    try {
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
    } catch (e) {
      console.log(
        "\n⚠️  Could not start in-memory MongoDB (binary download blocked in this sandbox)."
      );
      console.log(
        "   Run the full HTTP suite locally with either of:\n" +
          "     • a running mongod, then:  TEST_MONGO_URI=mongodb://127.0.0.1:27017/shopcart_test node test-e2e.js\n" +
          "     • default (auto-downloads):  node test-e2e.js\n"
      );
      console.log("   Meanwhile, DB-independent logic is fully covered by: node test-unit.js\n");
      process.exit(0);
    }
  }

  await connectDB(uri);
  await seedDatabase();

  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  console.log("\n── Health ──");
  {
    const api = client();
    const r = await api("GET", "/api/health");
    ok(r.status === 200 && r.data.status === "ok", "GET /api/health returns ok");
  }

  console.log("\n── Products ──");
  let slug, productId;
  {
    const api = client();
    const r = await api("GET", "/api/products");
    ok(r.status === 200, "GET /api/products 200");
    ok(Array.isArray(r.data.items) && r.data.items.length > 0, "returns product list");
    ok(Array.isArray(r.data.categories), "returns category facets");
    slug = r.data.items[0].slug;
    productId = r.data.items[0]._id;

    const s = await api("GET", "/api/products?search=aurora");
    ok(s.data.items.every((p) => /aurora/i.test(p.name)), "search filter works");

    const sorted = await api("GET", "/api/products?sort=price_asc");
    const prices = sorted.data.items.map((p) => p.price);
    ok(
      prices.every((v, i) => i === 0 || prices[i - 1] <= v),
      "sort price_asc is ascending"
    );

    const feat = await api("GET", "/api/products/featured");
    ok(feat.status === 200 && feat.data.every((p) => p.isFeatured), "featured endpoint");

    const one = await api("GET", `/api/products/${slug}`);
    ok(one.status === 200 && one.data.slug === slug, "GET product by slug");

    const missing = await api("GET", "/api/products/does-not-exist");
    ok(missing.status === 404, "unknown slug -> 404");
  }

  console.log("\n── Auth: register / validation / lockout ──");
  const customer = client();
  {
    const bad = await customer("POST", "/api/auth/register", {
      name: "X",
      email: "not-an-email",
      password: "123",
    });
    ok(bad.status === 400, "invalid registration rejected (Zod)");

    const r = await customer("POST", "/api/auth/register", {
      name: "Alice Buyer",
      email: "alice@example.com",
      password: "Sup3rSecret!",
      consents: { marketing: true, analytics: false },
    });
    ok(r.status === 201, "register 201");
    ok(r.data.passwordHash === undefined, "passwordHash never leaked in JSON");
    ok(r.data.consents.marketing === true, "consent stored (explicit opt-in)");

    const dup = await customer("POST", "/api/auth/register", {
      name: "Alice Buyer",
      email: "alice@example.com",
      password: "Sup3rSecret!",
    });
    ok(dup.status === 409, "duplicate email -> 409");

    const me = await customer("GET", "/api/auth/me");
    ok(me.status === 200 && me.data.email === "alice@example.com", "GET /me with cookie");
  }

  {
    // Lockout: 5 wrong attempts should lock the account.
    const attacker = client();
    let lockedHit = false;
    for (let i = 0; i < 6; i++) {
      const r = await attacker("POST", "/api/auth/login", {
        email: "alice@example.com",
        password: "wrongpass",
      });
      if (r.status === 423) lockedHit = true;
    }
    ok(lockedHit, "account locks after repeated failures (423)");
  }

  console.log("\n── Orders (server-side pricing + stock) ──");
  let orderId;
  {
    // Fresh customer to avoid the locked account above.
    const buyer = client();
    await buyer("POST", "/api/auth/register", {
      name: "Bob Buyer",
      email: "bob@example.com",
      password: "An0therSecret!",
    });

    const noauth = client();
    const unauth = await noauth("POST", "/api/orders", { items: [] });
    ok(unauth.status === 401, "order without auth -> 401");

    const r = await buyer("POST", "/api/orders", {
      items: [{ product: productId, qty: 2 }],
      shippingAddress: {
        fullName: "Bob Buyer",
        line1: "12 MG Road",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        phone: "9876543210",
      },
      paymentMethod: "card",
    });
    ok(r.status === 201, "create order 201");
    orderId = r.data._id;

    // Verify server computed totals (client sent no prices).
    const expectedItems = r.data.items[0].price * 2;
    ok(r.data.itemsPrice === expectedItems, "itemsPrice computed server-side");
    ok(
      r.data.taxPrice === Math.round(expectedItems * 0.18 * 100) / 100,
      "18% GST computed server-side"
    );
    ok(
      r.data.totalPrice ===
        r.data.itemsPrice + r.data.taxPrice + r.data.shippingPrice,
      "total = items + tax + shipping (no drip pricing)"
    );

    const mine = await buyer("GET", "/api/orders/mine");
    ok(mine.status === 200 && mine.data.length === 1, "GET /orders/mine");

    const paid = await buyer("PUT", `/api/orders/${orderId}/pay`, {
      paymentId: "pay_test_123",
    });
    ok(paid.status === 200 && paid.data.isPaid === true, "pay order marks paid");

    // Another user must not read this order.
    const stranger = client();
    await stranger("POST", "/api/auth/register", {
      name: "Eve",
      email: "eve@example.com",
      password: "Str@ngerThings1",
    });
    const forbidden = await stranger("GET", `/api/orders/${orderId}`);
    ok(forbidden.status === 403, "cannot read another user's order (RBAC/IDOR)");
  }

  console.log("\n── Stock enforcement ──");
  {
    const buyer = client();
    await buyer("POST", "/api/auth/register", {
      name: "Greedy",
      email: "greedy@example.com",
      password: "W@ntItAll123",
    });
    const r = await buyer("POST", "/api/orders", {
      items: [{ product: productId, qty: 99999 }],
      shippingAddress: {
        fullName: "Greedy G",
        line1: "1 Some St",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
        phone: "9000000000",
      },
      paymentMethod: "cod",
    });
    ok(r.status === 409, "over-ordering blocked by stock check (409)");
  }

  console.log("\n── Admin RBAC ──");
  {
    const admin = client();
    const login = await admin("POST", "/api/auth/login", {
      email: "admin@shopcart.dev",
      password: "Admin@12345",
    });
    ok(login.status === 200 && login.data.role === "admin", "admin login");

    const created = await admin("POST", "/api/products", {
      name: "Test Widget",
      slug: "test-widget",
      category: "Misc",
      price: 100,
      countInStock: 5,
    });
    ok(created.status === 201, "admin can create product");

    const all = await admin("GET", "/api/orders");
    ok(all.status === 200 && Array.isArray(all.data), "admin can list all orders");

    // Customer must be blocked from admin routes.
    const cust = client();
    await cust("POST", "/api/auth/login", {
      email: "customer@shopcart.dev",
      password: "Customer@123",
    });
    const blocked = await cust("POST", "/api/products", {
      name: "Nope",
      slug: "nope",
      category: "X",
      price: 1,
      countInStock: 1,
    });
    ok(blocked.status === 403, "customer blocked from admin create (403)");
  }

  console.log("\n── NoSQL injection defense ──");
  {
    const api = client();
    // Attempt operator injection in login body.
    const r = await api("POST", "/api/auth/login", {
      email: { $gt: "" },
      password: { $gt: "" },
    });
    ok(r.status === 400 || r.status === 401, "operator-injection login rejected");
  }

  // ── Teardown ──
  await new Promise((r) => server.close(r));
  await disconnectDB();
  await mongod.stop();

  console.log(`\n──────────────────────────────`);
  console.log(`Results: ${pass} passed, ${fail} failed`);
  console.log(`──────────────────────────────\n`);
  process.exit(fail === 0 ? 0 : 1);
}

run().catch(async (err) => {
  console.error("Test harness crashed:", err);
  try {
    if (server) server.close();
    await disconnectDB();
    if (mongod) await mongod.stop();
  } catch {}
  process.exit(1);
});
