import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { productApi } from "../lib/api.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(params.get("search") || "");

  const search = params.get("search") || "";
  const category = params.get("category") || "all";
  const sort = params.get("sort") || "newest";
  const page = parseInt(params.get("page") || "1", 10);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError("");
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (category !== "all") qs.set("category", category);
    if (sort) qs.set("sort", sort);
    qs.set("page", String(page));
    productApi
      .list(`?${qs.toString()}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function update(next) {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === "" || v === "all") merged.delete(k);
      else merged.set(k, v);
    });
    if (!("page" in next)) merged.set("page", "1");
    setParams(merged);
  }

  function submitSearch(e) {
    e.preventDefault();
    update({ search: searchInput.trim() || null, page: "1" });
  }

  const categories = data?.categories || [];

  return (
    <div className="wrap shop">
      <header className="shop__head">
        <div>
          <span className="eyebrow">The shop</span>
          <h1 className="shop__title">Everything we make</h1>
        </div>
        <form className="shop__search" onSubmit={submitSearch} role="search">
          <input
            type="search"
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search products"
          />
          <button className="btn btn--sm" type="submit">Search</button>
        </form>
      </header>

      <div className="shop__filters">
        <div className="shop__chips">
          <button
            className={`chip ${category === "all" ? "chip--active" : ""}`}
            onClick={() => update({ category: null })}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`chip ${category === c ? "chip--active" : ""}`}
              onClick={() => update({ category: c })}
            >
              {c}
            </button>
          ))}
        </div>

        <label className="shop__sort">
          <span>Sort</span>
          <select value={sort} onChange={(e) => update({ sort: e.target.value })}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </label>
      </div>

      {error && <p className="err-text">{error}</p>}

      {loading ? (
        <div className="pgrid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 320 }} />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <div className="empty">
          <h3>No products match that search</h3>
          <p>Try a different term or clear your filters to see everything.</p>
          <button className="btn btn--sm" onClick={() => { setSearchInput(""); setParams({}); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <p className="shop__count mono">{data.total} product{data.total !== 1 ? "s" : ""}</p>
          <div className="pgrid">
            {data.items.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>

          {data.pages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button
                className="btn btn--ghost btn--sm"
                disabled={page <= 1}
                onClick={() => update({ page: String(page - 1) })}
              >
                ← Prev
              </button>
              <span className="pager__info mono">
                {page} / {data.pages}
              </span>
              <button
                className="btn btn--ghost btn--sm"
                disabled={page >= data.pages}
                onClick={() => update({ page: String(page + 1) })}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
