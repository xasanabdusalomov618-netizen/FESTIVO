"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, Search, PackageSearch } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { ProductCard } from "@/components/ProductCard";
import { toneFor } from "@/components/icons";
import { useToast } from "@/components/Toaster";
import { addCartItem } from "@/lib/cart-store";
import { MAX_DAYS, MIN_DAYS } from "@/lib/pricing";
import type { Category, Product, Vendor } from "@/lib/types";

export interface CatalogState {
  q: string;
  category: string;
  price: string;
  sort: string;
  stock: boolean;
  date: string;
  days: number;
}

interface Props {
  products: Product[];
  categories: Category[];
  vendors: Vendor[];
  today: string;
  initial: CatalogState;
}

const PRICE_RANGES: Record<string, [number, number]> = {
  u200: [0, 199_999],
  "200-500": [200_000, 500_000],
  o500: [500_001, Number.MAX_SAFE_INTEGER],
};

function syncUrl(state: CatalogState) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.category !== "all") params.set("category", state.category);
  if (state.price !== "any") params.set("price", state.price);
  if (state.sort !== "featured") params.set("sort", state.sort);
  if (state.stock) params.set("stock", "1");
  if (state.date) params.set("date", state.date);
  if (state.days !== 1) params.set("days", String(state.days));
  const qs = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
}

export function CatalogView({ products, categories, vendors, today, initial }: Props) {
  const { t, text } = useLang();
  const toast = useToast();
  const [state, setState] = useState<CatalogState>(initial);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const update = (patch: Partial<CatalogState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      syncUrl(next);
      return next;
    });
  };

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const vendorById = useMemo(() => new Map(vendors.map((v) => [v.id, v])), [vendors]);

  const results = useMemo(() => {
    const q = state.q.trim().toLowerCase();
    const range = PRICE_RANGES[state.price];
    let list = products.filter((p) => {
      if (state.category !== "all" && p.categoryId !== state.category) return false;
      if (range && (p.pricePerDay < range[0] || p.pricePerDay > range[1])) return false;
      if (state.stock && p.stock <= 0) return false;
      if (q) {
        const hay = [
          text(p.name),
          text(p.description),
          categoryById.get(p.categoryId) ? text(categoryById.get(p.categoryId)!.name) : "",
          vendorById.get(p.vendorId)?.name ?? "",
          p.name.uz,
          p.name.ru,
          p.name.en,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Deterministic comparison (no locale collation) so the server and browser render the same order.
    const byName = (a: Product, b: Product) => {
      const x = text(a.name).toLowerCase();
      const y = text(b.name).toLowerCase();
      return x < y ? -1 : x > y ? 1 : 0;
    };
    if (state.sort === "asc") list = [...list].sort((a, b) => a.pricePerDay - b.pricePerDay);
    else if (state.sort === "desc") list = [...list].sort((a, b) => b.pricePerDay - a.pricePerDay);
    else if (state.sort === "name") list = [...list].sort(byName);
    else list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || byName(a, b));
    return list;
  }, [products, state, text, categoryById, vendorById]);

  const reset = () => {
    const next: CatalogState = { ...state, q: "", category: "all", price: "any", sort: "featured", stock: false };
    setState(next);
    syncUrl(next);
  };

  const add = (product: Product) => {
    if (!state.date || state.date < today) {
      toast.show(t("cart.invalidDate"), "error");
      document.getElementById("catalog-date")?.focus();
      return;
    }
    addCartItem({ productId: product.id, eventDate: state.date, days: state.days, qty: 1, delivery: false, installation: false });
    toast.show(`${t("toast.addedToCart")}: ${text(product.name)}`);
  };

  const hasFilters = state.q || state.category !== "all" || state.price !== "any" || state.stock || state.sort !== "featured";

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>{t("catalog.title")}</h1>
          <p>{t("catalog.subtitle")}</p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container catalog-layout">
          <aside className={`card filters ${filtersOpen ? "" : "is-collapsed"}`} aria-label={t("common.filters")}>
            <div className="search-box">
              <label className="sr-only" htmlFor="catalog-search">
                {t("common.search")}
              </label>
              <Search size={18} aria-hidden="true" />
              <input
                id="catalog-search"
                className="input"
                type="search"
                value={state.q}
                placeholder={t("common.searchPlaceholder")}
                onChange={(e) => update({ q: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="catalog-category">
                {t("catalog.category")}
              </label>
              <select id="catalog-category" className="select" value={state.category} onChange={(e) => update({ category: e.target.value })}>
                <option value="all">{t("catalog.allCategories")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {text(c.name)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="catalog-price">
                {t("catalog.price")}
              </label>
              <select id="catalog-price" className="select" value={state.price} onChange={(e) => update({ price: e.target.value })}>
                <option value="any">{t("catalog.priceAny")}</option>
                <option value="u200">{t("catalog.priceUnder200")}</option>
                <option value="200-500">{t("catalog.price200to500")}</option>
                <option value="o500">{t("catalog.priceOver500")}</option>
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="catalog-sort">
                {t("catalog.sort")}
              </label>
              <select id="catalog-sort" className="select" value={state.sort} onChange={(e) => update({ sort: e.target.value })}>
                <option value="featured">{t("catalog.sortFeatured")}</option>
                <option value="asc">{t("catalog.sortPriceAsc")}</option>
                <option value="desc">{t("catalog.sortPriceDesc")}</option>
                <option value="name">{t("catalog.sortName")}</option>
              </select>
            </div>

            <label className="check" style={{ padding: "12px 14px" }}>
              <input type="checkbox" checked={state.stock} onChange={(e) => update({ stock: e.target.checked })} />
              <span>{t("catalog.inStockOnly")}</span>
            </label>

            <hr className="divider" />

            <div className="field">
              <label className="label" htmlFor="catalog-date">
                {t("product.eventDate")}
              </label>
              <input
                id="catalog-date"
                className="input"
                type="date"
                min={today}
                value={state.date}
                onChange={(e) => update({ date: e.target.value })}
              />
              <span className="hint">{t("product.eventDateHelp")}</span>
            </div>

            <div className="field">
              <label className="label" htmlFor="catalog-days">
                {t("product.days")}
              </label>
              <select id="catalog-days" className="select" value={state.days} onChange={(e) => update({ days: Number(e.target.value) })}>
                {Array.from({ length: MAX_DAYS - MIN_DAYS + 1 }, (_, i) => i + MIN_DAYS).map((d) => (
                  <option key={d} value={d}>
                    {d} {t("common.days")}
                  </option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
                {t("catalog.clearFilters")}
              </button>
            )}
          </aside>

          <div>
            <div className="catalog-toolbar">
              <div className="row">
                <button
                  type="button"
                  className="btn btn-outline btn-sm mobile-filter-toggle"
                  aria-expanded={filtersOpen}
                  onClick={() => setFiltersOpen((v) => !v)}
                >
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  {t("common.filters")}
                </button>
                <strong aria-live="polite">{t("catalog.results", { count: results.length })}</strong>
              </div>
              {state.date && (
                <span className="hint">
                  {`${t("product.eventDate")}: ${state.date.split("-").reverse().join(".")} · ${state.days} ${t("common.days")}`}
                </span>
              )}
            </div>

            {results.length === 0 ? (
              <div className="empty-state">
                <PackageSearch size={40} aria-hidden="true" color="#3B82F6" />
                <h3 style={{ marginTop: 14 }}>{t("catalog.noResults")}</h3>
                <p className="muted">{t("catalog.noResultsText")}</p>
                <div style={{ marginTop: 18 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
                    {t("catalog.clearFilters")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-3">
                {results.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    tone={toneFor(i)}
                    data={{ product: p, category: categoryById.get(p.categoryId), vendor: vendorById.get(p.vendorId) }}
                    onAdd={() => add(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
