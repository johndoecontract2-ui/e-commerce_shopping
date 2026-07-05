import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <div className="footer__brand">
          <div className="nav__logo" style={{ color: "var(--paper)" }}>
            <span className="nav__mark">◐</span>
            <span>ShopCart</span>
          </div>
          <p className="footer__tag">Thoughtfully made goods, honestly priced.</p>
        </div>

        <div className="footer__cols">
          <div className="footer__col">
            <h4>Shop</h4>
            <Link to="/shop">All products</Link>
            <Link to="/shop?category=Electronics">Electronics</Link>
            <Link to="/shop?category=Home">Home</Link>
            <Link to="/shop?category=Fashion">Fashion</Link>
          </div>
          <div className="footer__col">
            <h4>Help</h4>
            <Link to="/policies#shipping">Shipping & returns</Link>
            <Link to="/policies#privacy">Privacy notice</Link>
            <Link to="/policies#grievance">Grievance redressal</Link>
            <Link to="/account">Your account</Link>
          </div>
          <div className="footer__col footer__col--legal">
            <h4>ShopCart Retail Pvt. Ltd.</h4>
            <p>
              4th Floor, Prestige Tower, MG Road,<br />
              Bengaluru, Karnataka 560001, India
            </p>
            <p>
              Grievance Officer: Priya Nair<br />
              <a href="mailto:grievance@shopcart.dev">grievance@shopcart.dev</a><br />
              Response within 48 hours · redressal within 30 days
            </p>
          </div>
        </div>
      </div>
      <div className="wrap footer__base">
        <span>© {new Date().getFullYear()} ShopCart. All rights reserved.</span>
        <span className="mono">Prices inclusive of GST · No hidden fees</span>
      </div>
    </footer>
  );
}
