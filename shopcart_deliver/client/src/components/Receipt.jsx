import { money } from "../lib/api.js";

/**
 * The "receipt" — the signature UI motif. Every charge is itemized in
 * monospace, reinforcing the honest-pricing promise: nothing is hidden,
 * and this is exactly what the server will charge.
 */
export default function Receipt({ totals, title = "Order summary" }) {
  return (
    <div className="receipt">
      <div className="receipt__top">
        <span className="receipt__brand mono">◐ SHOPCART</span>
        <span className="receipt__title">{title}</span>
      </div>
      <div className="receipt__perf" aria-hidden />

      <dl className="receipt__lines mono">
        <div>
          <dt>Items ({totals.count})</dt>
          <dd>{money(totals.itemsPrice)}</dd>
        </div>
        <div>
          <dt>GST (18%)</dt>
          <dd>{money(totals.taxPrice)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{totals.shippingPrice === 0 ? "FREE" : money(totals.shippingPrice)}</dd>
        </div>
      </dl>

      <div className="receipt__perf" aria-hidden />
      <div className="receipt__total mono">
        <span>Total</span>
        <span>{money(totals.totalPrice)}</span>
      </div>
      <p className="receipt__fine">No hidden fees. This is the final amount.</p>
    </div>
  );
}
