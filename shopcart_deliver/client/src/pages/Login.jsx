import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login({ email: email.trim(), password });
      toast.show(`Welcome back, ${u.name.split(" ")[0]}!`);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(kind) {
    if (kind === "admin") {
      setEmail("admin@shopcart.dev");
      setPassword("Admin@12345");
    } else {
      setEmail("customer@shopcart.dev");
      setPassword("Customer@123");
    }
  }

  return (
    <div className="wrap auth">
      <div className="auth__card">
        <span className="eyebrow">Welcome back</span>
        <h1 className="auth__title">Sign in</h1>

        {error && <div className="auth__alert">{error}</div>}

        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn--block" disabled={busy}>
            {busy ? <><span className="spinner" /> Signing in…</> : "Sign in"}
          </button>
        </form>

        <p className="auth__switch">
          New here? <Link to="/register">Create an account</Link>
        </p>

        <div className="auth__demo">
          <span className="mono">Try a demo account:</span>
          <div>
            <button type="button" className="chip" onClick={() => fillDemo("customer")}>Customer</button>
            <button type="button" className="chip" onClick={() => fillDemo("admin")}>Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
}
