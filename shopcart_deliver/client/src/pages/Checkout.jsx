import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { orderApi, money } from "../lib/api.js";
import Receipt from "../components/Receipt.jsx";

const empty = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
};

export default function Checkout() {
  const { items, totals, clear } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [addr, setAddr] = useState({ ...empty, fullName: user?.name || "" });
  const [method, setMethod] = useState("card");
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    navigate("/cart", { replace: true });
    return null;
  }

  function set(field, value) {
    setAddr((a) => ({ ...a, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  // Client-side validation mirrors the server's Zod schema (defense in depth).
  function validate() {
    const e = {};
    if (addr.fullName.trim().length < 2) e.fullName = "Enter your full name";
    if (addr.line1.trim().length < 3) e.line1 = "Enter your address";
    if (addr.city.trim().length < 2) e.city = "Enter your city";
    if (addr.state.trim().length < 2) e.state = "Enter your state";
    if (!/^\d{6}$/.test(addr.pincode)) e.pincode = "Pincode must be 6 digits";
    if (!/^\d{10}$/.test(addr.phone)) e.phone = "Phone must be 10 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function placeOrder(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setPlacing(true);
    try {
      const order = await orderApi.create({
        items: items.map((i) => ({ product: i._id, qty: i.qty })),
        shippingAddress: addr,
        paymentMethod: method,
      });

      // Simulated payment capture for card/upi. In production this is where
      // the Razorpay/RBI-tokenization flow (OTP + AFA) would run.
      if (method !== "cod") {
        await orderApi.pay(order._id, { paymentId: `sim_${Date.now()}` });
      }

      clear();
      toast.show("Order placed successfully!");
      navigate(`/orders/${order._id}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  }

  const fieldClass = (f) => `field ${errors[f] ? "field--error" : ""}`;

  return (
    <div className="wrap checkout">
      <h1 className="shop__title">Checkout</h1>

      <form className="checkout__grid" onSubmit={placeOrder} noValidate>
        <div className="checkout__main">
          <section className="panel">
            <h2 className="panel__title">Shipping address</h2>
            <div className={fieldClass("fullName")}>
              <label htmlFor="fn">Full name</label>
              <input id="fn" value={addr.fullName} onChange={(e) => set("fullName", e.target.value)} />
              {errors.fullName && <span className="err-text">{errors.fullName}</span>}
            </div>
            <div className={fieldClass("line1")}>
              <label htmlFor="l1">Address line 1</label>
              <input id="l1" value={addr.line1} onChange={(e) => set("line1", e.target.value)} placeholder="House no., street" />
              {errors.line1 && <span className="err-text">{errors.line1}</span>}
            </div>
            <div className="field">
              <label htmlFor="l2">Address line 2 (optional)</label>
              <input id="l2" value={addr.line2} onChange={(e) => set("line2", e.target.value)} placeholder="Landmark, area" />
            </div>
            <div className="checkout__row">
              <div className={fieldClass("city")}>
                <label htmlFor="city">City</label>
                <input id="city" value={addr.city} onChange={(e) => set("city", e.target.value)} />
                {errors.city && <span className="err-text">{errors.city}</span>}
              </div>
              <div className={fieldClass("state")}>
                <label htmlFor="state">State</label>
                <input id="state" value={addr.state} onChange={(e) => set("state", e.target.value)} />
                {errors.state && <span className="err-text">{errors.state}</span>}
              </div>
            </div>
            <div className="checkout__row">
              <div className={fieldClass("pincode")}>
                <label htmlFor="pin">Pincode</label>
                <input id="pin" inputMode="numeric" value={addr.pincode} onChange={(e) => set("pincode", e.target.value)} />
                {errors.pincode && <span className="err-text">{errors.pincode}</span>}
              </div>
              <div className={fieldClass("phone")}>
                <label htmlFor="ph">Phone</label>
                <input id="ph" inputMode="numeric" value={addr.phone} onChange={(e) => set("phone", e.target.value)} />
                {errors.phone && <span className="err-text">{errors.phone}</span>}
              </div>
            </div>
          </section>

          <section className="panel">
            <h2 className="panel__title">Payment method</h2>
            <div className="paylist">
              {[
                { id: "card", label: "Card", sub: "Saved securely via RBI tokenization" },
                { id: "upi", label: "UPI", sub: "Pay with any UPI app" },
                { id: "cod", label: "Cash on delivery", sub: "Pay when it arrives" },
              ].map((opt) => (
                <label key={opt.id} className={`payopt ${method === opt.id ? "is-sel" : ""}`}>
                  <input
                    type="radio"
                    name="pay"
                    value={opt.id}
                    checked={method === opt.id}
                    onChange={() => setMethod(opt.id)}
                  />
                  <span className="payopt__label">{opt.label}</span>
                  <span className="payopt__sub">{opt.sub}</span>
                </label>
              ))}
            </div>
            {method === "card" && (
              <p className="pay-note mono">
                For your security we never store your card number — only a token
                and the last 4 digits. You'll confirm with an OTP.
              </p>
            )}
          </section>
        </div>

        <aside className="checkout__aside">
          <Receipt totals={totals} title="You'll pay" />
          <button className="btn btn--mint btn--block" disabled={placing}>
            {placing ? (
              <><span className="spinner spinner--ink" /> Placing…</>
            ) : (
              `Place order · ${money(totals.totalPrice)}`
            )}
          </button>
          <p className="checkout__terms">
            By placing this order you agree to our terms. Taxes and shipping are
            shown above — there are no additional charges.
          </p>
        </aside>
      </form>
    </div>
  );
}
