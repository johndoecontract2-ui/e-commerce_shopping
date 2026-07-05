# ShopCart — Secure MERN E-Commerce Platform

A complete, production-ready e-commerce web application built to the specification
in *"Architecting the Modern E-Commerce Ecosystem"*. It pairs a React + Vite
storefront with a hardened Node/Express/MongoDB API, and implements the report's
requirements around **UI/UX, ethical design, server- and client-side security, and
Indian regulatory compliance (DPDP Act, Consumer Protection E-Commerce Rules, RBI
tokenization)**.

---

## What's inside

```
shopcart/
├── server/            Express + MongoDB REST API
│   ├── config/        env loader (no hardcoded secrets) + DB connection
│   ├── models/        User, Product, Order (Mongoose schemas)
│   ├── middleware/    auth (JWT cookies), RBAC, validation, error handling
│   ├── controllers/   auth, product, order business logic
│   ├── routes/        route definitions with per-route rate limits
│   ├── utils/         Zod validators, seed data + seed script
│   ├── test-unit.js   15 DB-independent tests (pricing, auth, validation…)
│   └── test-e2e.js    full HTTP integration suite (needs MongoDB)
└── client/            React + Vite single-page storefront
    └── src/
        ├── components/  Navbar, ProductCard, Receipt, Footer, guards…
        ├── context/     Auth, Cart, Toast providers
        ├── pages/       Home, Shop, Product, Cart, Checkout, Account,
        │                Orders, Admin, Policies, auth pages
        └── lib/         API client
```

---

## Quick start

You need **Node.js 18+** and a **MongoDB** database (either a local `mongod` or a
free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env          # then edit .env — set MONGO_URI and a JWT_SECRET
npm run seed                  # loads demo products + accounts
npm run dev                   # starts API on http://localhost:5000
```

Generate a strong secret with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Frontend

```bash
cd client
npm install
npm run dev                   # starts storefront on http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend automatically, so the
auth cookie stays same-origin.

### Demo accounts (created by `npm run seed`)

| Role     | Email                   | Password       |
|----------|-------------------------|----------------|
| Admin    | admin@shopcart.dev      | `Admin@12345`  |
| Customer | customer@shopcart.dev   | `Customer@123` |

---

## Testing

```bash
cd server
node test-unit.js             # 15 tests, no database needed
node test-e2e.js              # full API flow (auto-starts in-memory Mongo,
                              #  or set TEST_MONGO_URI to use your own)
```

`test-unit.js` covers the logic most prone to bugs: server-side price
computation (incl. floating-point rounding), Zod validation, bcrypt hashing,
JWT round-trips, account-lockout math, and sensitive-field redaction.

`test-e2e.js` exercises the real HTTP API end to end: registration/validation,
login + brute-force lockout, product search/sort/filter, order creation with
server-side pricing and stock enforcement, payment, RBAC, cross-user access
(IDOR) protection, and NoSQL-injection defense.

---

## How the report's requirements are implemented

### Security (OWASP Top 10 + PCI DSS + RBI)
- **A01 Broken Access Control** — JWT + role-based `authorize()` middleware; every
  order read checks ownership (prevents IDOR); admin routes are role-gated.
- **A02 Cryptographic Failures** — passwords hashed with bcrypt (configurable
  rounds); secrets read only from env; cookies `Secure` in production.
- **A03 Injection** — Zod validation at the API boundary (mirrored on the client),
  `express-mongo-sanitize` strips `$`/`.` operators, escaped regex for search.
- **A05/A06 Misconfiguration & Components** — Helmet security headers + CSP, strict
  CORS to the known frontend origin, no verbose errors in production, 0 npm audit
  vulnerabilities.
- **A07 Auth Failures** — account lockout after N failed logins; JWT stored in an
  **HttpOnly, SameSite cookie — never localStorage** (XSS-safe); rate-limited auth.
- **RBI Card-on-File Tokenization** — the schema stores only a token index + last-4
  + network/issuer for display; the raw PAN is never stored. The checkout copy
  reflects the OTP/AFA consent flow.

### Ethical UI (Dark Patterns / Consumer Protection Rules)
- **No drip pricing** — taxes and shipping are computed and shown *before* checkout,
  and again on the "receipt". The server is the single source of truth for totals.
- **No false urgency** — stock indicators bind to real inventory only.
- **No basket sneaking** — the cart changes only on explicit user action.
- **No confirm-shaming** — neutral, equal-weight choices.
- Footer + Policies page publish legal name, address, **Grievance Officer** details,
  and the 48-hour / 30-day redressal commitments.

### Data Privacy (DPDP Act, 2023)
- Consent is **opt-in, unbundled, and never pre-ticked**; purchase never depends on
  marketing/analytics consent.
- Users can **withdraw consent as easily as they gave it** from the Account page.
- Consent choices and timestamp are recorded on the user record (audit trail).

### Architecture & UX
- MERN stack with a decoupled React SPA and a clean REST API.
- Responsive down to mobile, visible keyboard focus, and `prefers-reduced-motion`
  respected.
- Loading skeletons, toast feedback, empty states, and inline form validation.

---

## Configuration reference

All configuration is environment-driven (`server/.env`). Nothing sensitive is
hardcoded. See `server/.env.example` for the full list. Key variables:

| Variable            | Purpose                                    |
|---------------------|--------------------------------------------|
| `MONGO_URI`         | MongoDB connection string                  |
| `JWT_SECRET`        | Signing secret for session tokens          |
| `CLIENT_ORIGIN`     | Allowed CORS origin (the frontend URL)     |
| `MAX_LOGIN_ATTEMPTS`| Failed logins before lockout               |
| `LOCK_MINUTES`      | Lockout duration                           |
| `RAZORPAY_KEY_*`    | Payment gateway keys (server-side only)    |

In production the config loader **fails fast** if a required secret is missing, so
the app can't accidentally boot with insecure defaults.

---

## Production notes / next steps

The payment step is wired as a simulated capture so the full order lifecycle runs
end to end out of the box. To go live, drop in a real gateway (Razorpay is
pre-configured in env) at the marked point in `client/src/pages/Checkout.jsx` and
`server/controllers/orderController.js`, and run the OTP/AFA + tokenization flow
described in the report. For a multi-node deployment, wrap the stock-decrement +
order-create in a MongoDB transaction (replica set) and put the API behind PM2 or a
container orchestrator with centralized logging (OWASP A09).
