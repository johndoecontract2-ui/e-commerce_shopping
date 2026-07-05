import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="wrap center-min">
      <div className="empty">
        <div className="mono" style={{ fontSize: "3rem", fontWeight: 700 }}>404</div>
        <h3>This page wandered off</h3>
        <p>The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="btn btn--mint">Back home</Link>
      </div>
    </div>
  );
}
