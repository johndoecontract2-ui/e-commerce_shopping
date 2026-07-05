import { Link } from "react-router-dom";
import { money } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Stars from "./Stars.jsx";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const toast = useToast();

  const off =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
  const soldOut = product.countInStock <= 0;

  function handleAdd(e) {
    e.preventDefault();
    if (soldOut) return;
    add(product, 1);
    toast.show(`Added “${product.name}” to cart`);
  }

  return (
    <Link to={`/product/${product.slug}`} className="pcard">
      <div className="pcard__media">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <div className="pcard__ph" aria-hidden />
        )}
        {off > 0 && <span className="badge-sale pcard__off">–{off}%</span>}
        {soldOut && <span className="pcard__soldout">Sold out</span>}
      </div>

      <div className="pcard__body">
        <span className="pcard__cat">{product.category}</span>
        <h3 className="pcard__name">{product.name}</h3>
        <Stars value={product.rating} count={product.numReviews} size={13} />

        <div className="pcard__foot">
          <div className="pcard__price">
            <span className="mono pcard__now">{money(product.price)}</span>
            {off > 0 && <span className="mono pcard__mrp">{money(product.mrp)}</span>}
          </div>
          <button
            className="pcard__add"
            onClick={handleAdd}
            disabled={soldOut}
            aria-label={`Add ${product.name} to cart`}
          >
            +
          </button>
        </div>
      </div>
    </Link>
  );
}
