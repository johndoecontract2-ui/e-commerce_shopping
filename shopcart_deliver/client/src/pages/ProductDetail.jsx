import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { productApi, money } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Stars from "../components/Stars.jsx";

export default function ProductDetail() {
  const { slug } = useParams();
  const { add } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setError("");
    productApi
      .detail(slug)
      .then((p) => {
        setProduct(p);
        setQty(p.countInStock > 0 ? 1 : 0);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    setProduct(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (error) {
    return (
      <div className="wrap center-min">
        <div className="empty">
          <h3>{error}</h3>
          <Link to="/shop" className="btn btn--sm">Back to shop</Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="wrap pdp">
        <div className="skeleton" style={{ height: 460, borderRadius: 22 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="skeleton" style={{ height: 32, width: "70%" }} />
          <div className="skeleton" style={{ height: 20, width: "40%" }} />
          <div className="skeleton" style={{ height: 120 }} />
        </div>
      </div>
    );
  }

  const off =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
  const soldOut = product.countInStock <= 0;

  function handleAdd() {
    add(product, qty);
    toast.show(`Added ${qty} × “${product.name}” to cart`);
  }

  async function submitReview(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await productApi.review(slug, { rating, comment: comment.trim() });
      setProduct(updated);
      setComment("");
      toast.show("Thanks for your review!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const alreadyReviewed = product.reviews?.some(
    (r) => user && r.user === user._id
  );

  return (
    <div className="wrap">
      <nav className="crumbs mono">
        <Link to="/shop">Shop</Link> / <span>{product.category}</span> / <span>{product.name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp__media">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="pcard__ph" style={{ height: "100%" }} />
          )}
          {off > 0 && <span className="badge-sale pdp__off">–{off}% off</span>}
        </div>

        <div className="pdp__info">
          <span className="pcard__cat">{product.brand ? `${product.brand} · ` : ""}{product.category}</span>
          <h1 className="pdp__name">{product.name}</h1>
          <Stars value={product.rating} count={product.numReviews} size={17} />

          <div className="pdp__price">
            <span className="mono pdp__now">{money(product.price)}</span>
            {off > 0 && <span className="mono pdp__mrp">{money(product.mrp)}</span>}
            {off > 0 && <span className="pdp__save">You save {money(product.mrp - product.price)}</span>}
          </div>
          <p className="pdp__incl mono">Incl. of all taxes</p>

          <p className="pdp__desc">{product.description}</p>

          <div className="pdp__stock">
            {soldOut ? (
              <span className="pdp__oos">Currently sold out</span>
            ) : product.countInStock <= 5 ? (
              <span className="pdp__low">Only {product.countInStock} left</span>
            ) : (
              <span className="pdp__in">In stock</span>
            )}
          </div>

          {!soldOut && (
            <div className="pdp__buy">
              <div className="qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">–</button>
                <span className="mono">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.countInStock, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button className="btn btn--mint btn--block" onClick={handleAdd}>
                Add to cart · {money(product.price * qty)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="reviews">
        <h2 className="section__title">Reviews</h2>

        {product.reviews?.length ? (
          <ul className="review-list">
            {product.reviews.map((r) => (
              <li key={r._id} className="review">
                <div className="review__head">
                  <strong>{r.name}</strong>
                  <Stars value={r.rating} size={13} />
                </div>
                {r.comment && <p>{r.comment}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pdp__desc">No reviews yet — be the first to share your thoughts.</p>
        )}

        {user ? (
          alreadyReviewed ? (
            <p className="mono" style={{ color: "var(--ink-soft)" }}>You've already reviewed this product.</p>
          ) : (
            <form className="review-form" onSubmit={submitReview}>
              <h3>Write a review</h3>
              <div className="field">
                <label>Rating</label>
                <div className="rate-pick">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`rate-star ${n <= rating ? "is-on" : ""}`}
                      onClick={() => setRating(n)}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="rev">Your review (optional)</label>
                <textarea
                  id="rev"
                  rows={3}
                  value={comment}
                  maxLength={1000}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you think?"
                />
              </div>
              <button className="btn btn--sm" disabled={submitting}>
                {submitting ? "Posting…" : "Post review"}
              </button>
            </form>
          )
        ) : (
          <p className="mono" style={{ color: "var(--ink-soft)" }}>
            <Link to="/login" style={{ textDecoration: "underline" }}>Sign in</Link> to write a review.
          </p>
        )}
      </section>
    </div>
  );
}
