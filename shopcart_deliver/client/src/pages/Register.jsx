import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  // DPDP Act: consent is opt-in and unbundled. Both default to FALSE.
  const [consents, setConsents] = useState({ marketing: false, analytics: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Enter your name";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.password.length < 8) e.password = "At least 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const u = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        consents,
      });
      toast.show(`Account created — welcome, ${u.name.split(" ")[0]}!`);
      navigate("/", { replace: true });
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err.message }));
    } finally {
      setBusy(false);
    }
  }

  const fc = (f) => `field ${errors[f] ? "field--error" : ""}`;

  return (
    <div className="wrap auth">
      <div className="auth__card">
        <span className="eyebrow">Join ShopCart</span>
        <h1 className="auth__title">Create your account</h1>

        {errors.form && <div className="auth__alert">{errors.form}</div>}

        <form onSubmit={submit} noValidate>
          <div className={fc("name")}>
            <label htmlFor="name">Full name</label>
            <input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
            {errors.name && <span className="err-text">{errors.name}</span>}
          </div>
          <div className={fc("email")}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
            {errors.email && <span className="err-text">{errors.email}</span>}
          </div>
          <div className={fc("password")}>
            <label htmlFor="pw">Password</label>
            <input id="pw" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
            {errors.password ? (
              <span className="err-text">{errors.password}</span>
            ) : (
              <span className="hint">Use at least 8 characters.</span>
            )}
          </div>

          <fieldset className="consent">
            <legend>Your privacy choices</legend>
            <p className="consent__intro">
              These are optional and off by default. You can change them any time
              from your account — we'll never make your purchase depend on them.
            </p>
            <label className="consent__opt">
              <input
                type="checkbox"
                checked={consents.marketing}
                onChange={(e) => setConsents((c) => ({ ...c, marketing: e.target.checked }))}
              />
              <span>
                <strong>Marketing emails</strong>
                <small>Occasional offers and product news.</small>
              </span>
            </label>
            <label className="consent__opt">
              <input
                type="checkbox"
                checked={consents.analytics}
                onChange={(e) => setConsents((c) => ({ ...c, analytics: e.target.checked }))}
              />
              <span>
                <strong>Analytics</strong>
                <small>Help us improve by sharing usage data.</small>
              </span>
            </label>
          </fieldset>

          <button className="btn btn--block" disabled={busy}>
            {busy ? <><span className="spinner" /> Creating…</> : "Create account"}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
