import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { orderApi, money } from "../lib/api.js";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    orderApi.detail(id).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="wrap center-min">
        <div className="empty">
          <h3>{error}</h3>
          <Link to="/orders" className="btn btn--sm">Back to orders</Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="wrap center-min"><div className="spinner spinner--ink" /></div>;
  }

  return (
    <div className="wrap odetail">
      <div className="odetail__banner">
        <div className="odetail__check" aria-hidden>✓</div>
        <div>
          <h1 className="odetail__title">
            {order.isPaid ? "Order confirmed" : "Order placed"}
          </h1>
          <p className="mono odetail__sub">
            #{order._id.slice(-8).toUpperCase()} ·{" "}
            {new Date(order.createdAt).toLocaleString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <span className={`odetail__pill ${order.status}`}>{order.status}</span>
      </div>

      <div className="odetail__grid">
        <div className="odetail__main">
          <section className="panel">
            <h2 className="panel__title">Items</h2>
            <ul className="odetail__items">
              {order.items.map((it) => (
                <li key={it.product}>
                  <div className="odetail__thumb">
                    {it.image ? <img src={it.image} alt={it.name} /> : <div className="pcard__ph" />}
                  </div>
                  <div className="odetail__iname">
                    <span>{it.name}</span>
                    <span className="mono">Qty {it.qty}</span>
                  </div>
                  <span className="mono">{money(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2 className="panel__title">Delivering to</h2>
            <address className="odetail__addr">
              <strong>{order.shippingAddress.fullName}</strong><br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
              <span className="mono">{order.shippingAddress.phone}</span>
            </address>
          </section>
        </div>

        <aside className="odetail__aside">
          <div className="receipt">
            <div className="receipt__top">
              <span className="receipt__brand mono">◐ SHOPCART</span>
              <span className="receipt__title">Payment summary</span>
            </div>
            <div className="receipt__perf" aria-hidden />
            <dl className="receipt__lines mono">
              <div><dt>Items</dt><dd>{money(order.itemsPrice)}</dd></div>
              <div><dt>GST (18%)</dt><dd>{money(order.taxPrice)}</dd></div>
              <div><dt>Shipping</dt><dd>{order.shippingPrice === 0 ? "FREE" : money(order.shippingPrice)}</dd></div>
            </dl>
            <div className="receipt__perf" aria-hidden />
            <div className="receipt__total mono">
              <span>Total</span><span>{money(order.totalPrice)}</span>
            </div>
            <p className="receipt__fine">
              {order.paymentMethod.toUpperCase()} · {order.isPaid ? "Paid" : "Payment pending"}
            </p>
          </div>
          <Link to="/shop" className="btn btn--ghost btn--block">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
