/**
 * Thin API wrapper. Always sends cookies (credentials: include) so the
 * HttpOnly JWT cookie flows automatically — no tokens in JS/localStorage.
 */
const BASE = "/api";

async function request(path, { method = "GET", body, signal } = {}) {
  const res = await fetch(BASE + path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  get: (p, opts) => request(p, { ...opts, method: "GET" }),
  post: (p, body, opts) => request(p, { ...opts, method: "POST", body }),
  put: (p, body, opts) => request(p, { ...opts, method: "PUT", body }),
  del: (p, opts) => request(p, { ...opts, method: "DELETE" }),
};

// Domain helpers
export const authApi = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  updateConsent: (payload) => api.put("/auth/consent", payload),
};

export const productApi = {
  list: (qs = "") => api.get(`/products${qs}`),
  featured: () => api.get("/products/featured"),
  detail: (slug) => api.get(`/products/${slug}`),
  review: (slug, payload) => api.post(`/products/${slug}/reviews`, payload),
};

export const orderApi = {
  create: (payload) => api.post("/orders", payload),
  mine: () => api.get("/orders/mine"),
  detail: (id) => api.get(`/orders/${id}`),
  pay: (id, payload) => api.put(`/orders/${id}/pay`, payload),
};

export const money = (n) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
