import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartCtx = createContext(null);
const STORAGE_KEY = "shopcart:cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage may be unavailable (private mode) — cart stays in memory */
    }
  }, [items]);

  function add(product, qty = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      const inStock = product.countInStock;
      if (existing) {
        const nextQty = Math.min(existing.qty + qty, inStock);
        return prev.map((i) => (i._id === product._id ? { ...i, qty: nextQty } : i));
      }
      return [
        ...prev,
        {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image,
          countInStock: inStock,
          qty: Math.min(qty, inStock),
        },
      ];
    });
  }

  function setQty(id, qty) {
    setItems((prev) =>
      prev
        .map((i) =>
          i._id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.countInStock)) } : i
        )
        .filter((i) => i.qty > 0)
    );
  }

  function remove(id) {
    setItems((prev) => prev.filter((i) => i._id !== id));
  }

  function clear() {
    setItems([]);
  }

  const totals = useMemo(() => {
    const itemsPrice = items.reduce((s, i) => s + i.price * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);
    const taxPrice = Math.round(itemsPrice * 0.18 * 100) / 100;
    const shippingPrice = itemsPrice >= 999 || itemsPrice === 0 ? 0 : 79;
    const totalPrice = Math.round((itemsPrice + taxPrice + shippingPrice) * 100) / 100;
    return { itemsPrice, taxPrice, shippingPrice, totalPrice, count };
  }, [items]);

  return (
    <CartCtx.Provider value={{ items, add, setQty, remove, clear, totals }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
