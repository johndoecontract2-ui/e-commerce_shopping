import { useEffect, useState } from "react";
import { api, money } from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";

const blank = {
  name: "",
  slug: "",
  category: "",
  brand: "",
  description: "",
  image: "",
  price: "",
  mrp: "",
  countInStock: "",
  isFeatured: false,
};

export default function Admin() {
  const toast = useToast();
  const [tab, setTab] = useState("products");

  return (
    <div className="wrap admin">
      <span className="eyebrow">Admin</span>
      <h1 className="shop__title">Store management</h1>

      <div className="admin__tabs">
        <button className={`chip ${tab === "products" ? "chip--active" : ""}`} onClick={() => setTab("products")}>
          Products
        </button>
        <button className={`chip ${tab === "orders" ? "chip--active" : ""}`} onClick={() => setTab("orders")}>
          Orders
        </button>
      </div>

      {tab === "products" ? <ProductsTab toast={toast} /> : <OrdersTab toast={toast} />}
    </div>
  );
}

function ProductsTab({ toast }) {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api.get("/products?limit=48").then(setData).catch((e) => toast.error(e.message));
  }
  useEffect(load, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function slugify(s) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      price: Number(form.price),
      mrp: Number(form.mrp) || 0,
      countInStock: Number(form.countInStock),
    };
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.show("Product updated");
      } else {
        await api.post("/products", payload);
        toast.show("Product created");
      }
      setForm(blank);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  function edit(p) {
    setEditingId(p._id);
    setForm({
      name: p.name, slug: p.slug, category: p.category, brand: p.brand || "",
      description: p.description || "", image: p.image || "",
      price: String(p.price), mrp: String(p.mrp || ""), countInStock: String(p.countInStock),
      isFeatured: p.isFeatured,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id) {
    if (!confirm("Delete this product?")) return;
    try {
      await api.del(`/products/${id}`);
      toast.show("Product deleted");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="admin__grid">
      <form className="panel admin__form" onSubmit={submit}>
        <h2 className="panel__title">{editingId ? "Edit product" : "Add product"}</h2>
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="checkout__row">
          <div className="field">
            <label>Category</label>
            <input value={form.category} onChange={(e) => set("category", e.target.value)} required />
          </div>
          <div className="field">
            <label>Brand</label>
            <input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Image URL</label>
          <input value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="checkout__row">
          <div className="field">
            <label>Price (₹)</label>
            <input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} required />
          </div>
          <div className="field">
            <label>MRP (₹)</label>
            <input type="number" min="0" value={form.mrp} onChange={(e) => set("mrp", e.target.value)} />
          </div>
          <div className="field">
            <label>Stock</label>
            <input type="number" min="0" value={form.countInStock} onChange={(e) => set("countInStock", e.target.value)} required />
          </div>
        </div>
        <label className="consent__opt">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
          <span><strong>Feature on homepage</strong></span>
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn--sm" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setForm(blank); setEditingId(null); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="admin__list">
        {!data ? (
          <div className="skeleton" style={{ height: 300 }} />
        ) : (
          <table className="atable">
            <thead>
              <tr><th>Product</th><th>Price</th><th>Stock</th><th></th></tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="atable__prod">
                      {p.image && <img src={p.image} alt="" />}
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="mono">{money(p.price)}</td>
                  <td className="mono">{p.countInStock}</td>
                  <td className="atable__actions">
                    <button onClick={() => edit(p)}>Edit</button>
                    <button className="danger" onClick={() => remove(p._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function OrdersTab({ toast }) {
  const [orders, setOrders] = useState(null);

  function load() {
    api.get("/orders").then(setOrders).catch((e) => toast.error(e.message));
  }
  useEffect(load, []);

  async function setStatus(id, status) {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.show(`Order marked ${status}`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!orders) return <div className="skeleton" style={{ height: 300 }} />;
  if (orders.length === 0) return <p className="consent__intro">No orders yet.</p>;

  return (
    <div className="admin__list">
      <table className="atable">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td className="mono">#{o._id.slice(-8).toUpperCase()}</td>
              <td>{o.user?.name || "—"}</td>
              <td className="mono">{money(o.totalPrice)}</td>
              <td style={{ textTransform: "capitalize" }}>{o.status}</td>
              <td>
                <select value={o.status} onChange={(e) => setStatus(o._id, e.target.value)}>
                  {["pending", "paid", "shipped", "delivered", "cancelled"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
