import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../lib/api.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Home() {
  const [featured, setFeatured] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    productApi
      .featured()
      .then(setFeatured)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="wrap hero__inner">
          <div className="hero__copy">
            <span className="eyebrow">New season · 2026</span>
            <h1 className="hero__title">
              Good things,<br />
              <span className="serif hero__title-em">honestly</span> priced.
            </h1>
            <p className="hero__lede">
              No fake countdowns. No surprise fees at checkout. Just carefully chosen
              products with the full price shown up front — the way shopping should be.
            </p>
            <div className="hero__cta">
              <Link to="/shop" className="btn btn--mint">Browse the shop</Link>
              <Link to="/policies#privacy" className="btn btn--ghost">How we handle your data</Link>
            </div>
            <div className="hero__proof">
              <div><strong className="mono">4.8★</strong><span>avg. rating</span></div>
              <div><strong className="mono">48h</strong><span>grievance response</span></div>
              <div><strong className="mono">₹0</strong><span>hidden charges</span></div>
            </div>
          </div>
          <div className="hero__art" aria-hidden>
            <div className="hero__disc" />
            <div className="hero__tag mono">price shown = price paid</div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="wrap section">
        <div className="section__head">
          <div>
            <span className="eyebrow">Handpicked</span>
            <h2 className="section__title">This week's favourites</h2>
          </div>
          <Link to="/shop" className="section__link">View all →</Link>
        </div>

        {error && <p className="err-text">{error}</p>}

        {!featured ? (
          <div className="pgrid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 320 }} />
            ))}
          </div>
        ) : (
          <div className="pgrid">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Value strip */}
      <section className="wrap valstrip">
        <div className="valcard">
          <span className="valcard__k mono">01</span>
          <h3>Transparent pricing</h3>
          <p>Taxes and shipping are calculated and shown before you reach checkout — never sprung on you at the end.</p>
        </div>
        <div className="valcard">
          <span className="valcard__k mono">02</span>
          <h3>Your data, your call</h3>
          <p>Marketing and analytics consent is opt-in and reversible any time from your account. Nothing is pre-ticked.</p>
        </div>
        <div className="valcard">
          <span className="valcard__k mono">03</span>
          <h3>Secure by default</h3>
          <p>Sessions live in secure, HTTP-only cookies and passwords are hashed. We never store your raw card number.</p>
        </div>
      </section>
    </div>
  );
}
