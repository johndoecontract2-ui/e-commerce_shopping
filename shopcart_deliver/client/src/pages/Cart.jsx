import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { money } from "../lib/api.js";
import Receipt from "../components/Receipt.jsx";

export default function Cart() {
  const { items, setQty, remove, totals } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="wrap center-min">
        <div className="empty">
          <div className="empty__icon" aria-hidden>🛒</div>
          <h3>Your cart is empty</h3>
          <p>Once you add something, it'll show up here.</p>
          <Link to="/shop" className="btn btn--mint">Start shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap cart">
      <h1 className="shop__title">Your cart</h1>

      <div className="cart__grid">
        <ul className="cart__items">
          {items.map((it) => (
            <li key={it._id} className="citem">
              <Link to={`/product/${it.slug}`} className="citem__media">
                {it.image ? <img src={it.image} alt={it.name} /> : <div className="pcard__ph" />}
              </Link>
              <div className="citem__body">
                <Link to={`/product/${it.slug}`} className="citem__name">{it.name}</Link>
                <span className="mono citem__price">{money(it.price)}</span>
                {it.qty >= it.countInStock && (
                  <span className="citem__max mono">Max stock reached</span>
                )}
              </div>
              <div className="citem__controls">
                <div className="qty qty--sm">
                  <button onClick={() => setQty(it._id, it.qty - 1)} aria-label="Decrease">–</button>
                  <span className="mono">{it.qty}</span>
                  <button
                    onClick={() => setQty(it._id, it.qty + 1)}
                    disabled={it.qty >= it.countInStock}
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
                <span className="mono citem__line">{money(it.price * it.qty)}</span>
                <button className="citem__remove" onClick={() => remove(it._id)} aria-label={`Remove ${it.name}`}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="cart__summary">
          <Receipt totals={totals} />
          <button className="btn btn--mint btn--block" onClick={() => navigate("/checkout")}>
            Proceed to checkout
          </button>
          <Link to="/shop" className="cart__continue">← Continue shopping</Link>
          <p className="cart__note mono">
            {totals.shippingPrice === 0
              ? "✓ Free shipping applied"
              : `Add ${money(999 - totals.itemsPrice)} more for free shipping`}
          </p>
        </aside>
      </div>
    </div>
  );
}
