import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totals } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    toast.show("Signed out");
    navigate("/");
  }

  return (
    <header className="nav">
      <div className="wrap nav__inner">
        <Link to="/" className="nav__logo" aria-label="ShopCart home">
          <span className="nav__mark">◐</span>
          <span>ShopCart</span>
        </Link>

        <button
          className="nav__burger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <nav className={`nav__links ${menuOpen ? "is-open" : ""}`} onClick={() => setMenuOpen(false)}>
          <NavLink to="/shop" className="nav__link">Shop</NavLink>
          {user && <NavLink to="/orders" className="nav__link">Orders</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin" className="nav__link">Admin</NavLink>}

          <Link to="/cart" className="nav__cart">
            Cart
            {totals.count > 0 && <span className="nav__cart-badge">{totals.count}</span>}
          </Link>

          {user ? (
            <div className="nav__user">
              <Link to="/account" className="nav__link nav__link--strong">
                {user.name.split(" ")[0]}
              </Link>
              <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn--sm">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
