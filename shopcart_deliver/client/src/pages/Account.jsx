import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { authApi, money } from "../lib/api.js";

export default function Account() {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [consents, setConsents] = useState({
    marketing: user?.consents?.marketing || false,
    analytics: user?.consents?.analytics || false,
  });
  const [saving, setSaving] = useState(false);

  async function saveConsents() {
    setSaving(true);
    try {
      const updated = await authApi.updateConsent(consents);
      setUser(updated);
      toast.show("Privacy preferences updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    consents.marketing !== user?.consents?.marketing ||
    consents.analytics !== user?.consents?.analytics;

  return (
    <div className="wrap account">
      <span className="eyebrow">Your account</span>
      <h1 className="shop__title">Hello, {user.name.split(" ")[0]}</h1>

      <div className="account__grid">
        <section className="panel">
          <h2 className="panel__title">Profile</h2>
          <dl className="account__dl">
            <div><dt>Name</dt><dd>{user.name}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Role</dt><dd style={{ textTransform: "capitalize" }}>{user.role}</dd></div>
          </dl>
        </section>

        <section className="panel">
          <h2 className="panel__title">Privacy & consent</h2>
          <p className="consent__intro">
            Grant or withdraw consent at any time — as easily as it was given.
          </p>
          <label className="consent__opt">
            <input
              type="checkbox"
              checked={consents.marketing}
              onChange={(e) => setConsents((c) => ({ ...c, marketing: e.target.checked }))}
            />
            <span>
              <strong>Marketing emails</strong>
              <small>Offers and product news.</small>
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
              <small>Usage data to help us improve.</small>
            </span>
          </label>
          <button className="btn btn--sm" onClick={saveConsents} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </section>

        <section className="panel">
          <h2 className="panel__title">Saved cards</h2>
          {user.savedCards?.length ? (
            <ul className="cards">
              {user.savedCards.map((c) => (
                <li key={c._id} className="cardrow mono">
                  <span>{c.network} •••• {c.last4}</span>
                  <span className={`cardrow__status ${c.status}`}>{c.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="consent__intro">
              No saved cards. When you save one at checkout, only a secure token
              and the last 4 digits are stored — never the full number.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
