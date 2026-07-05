import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { orderApi, money } from "../lib/api.js";

const statusColor = {
  pending: "#b58900",
  paid: "#00b384",
  shipped: "#2b7de9",
  delivered: "#00b384",
  cancelled: "#ff5d3b",
};

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    orderApi.mine().then(setOrders).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="wrap"><p className="err-text">{error}</p></div>;

  if (!orders) {
    return (
      <div className="wrap" style={{ paddingTop: 40 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 90, marginBottom: 14 }} />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="wrap center-min">
        <div className="empty">
          <h3>No orders yet</h3>
          <p>When you place an order, it'll appear here.</p>
          <Link to="/shop" className="btn btn--mint">Start shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap orders">
      <span className="eyebrow">Your account</span>
      <h1 className="shop__title">Order history</h1>

      <ul className="orders__list">
        {orders.map((o) => (
          <li key={o._id}>
            <Link to={`/orders/${o._id}`} className="orow">
              <div className="orow__main">
                <span className="orow__id mono">#{o._id.slice(-8).toUpperCase()}</span>
                <span className="orow__date">
                  {new Date(o.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </div>
              <div className="orow__items mono">
                {o.items.length} item{o.items.length !== 1 ? "s" : ""}
              </div>
              <span className="orow__status" style={{ color: statusColor[o.status] }}>
                ● {o.status}
              </span>
              <span className="orow__total mono">{money(o.totalPrice)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
