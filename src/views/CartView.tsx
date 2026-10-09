"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, AlertTriangle, Minus, Plus, ShoppingBag, Trash2, Truck, Wrench } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { categoryIcon, toneFor } from "@/components/icons";
import { useToast } from "@/components/Toaster";
import { removeCartItem, updateCartItem, useCart, clearCart, addCartItem, type CartItem } from "@/lib/cart-store";
import { MAX_DAYS, MAX_QTY, MIN_DAYS, formatMoney, priceLine, sumTotals } from "@/lib/pricing";
import { todayIso } from "@/lib/dates";
import type { Category, Product, Vendor } from "@/lib/types";

interface Props {
  products: Product[];
  categories: Category[];
  vendors: Vendor[];
}

export function CartView({ products, categories, vendors }: Props) {
  const { t, text, currency } = useLang();
  const toast = useToast();
  const items = useCart();
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(todayIso()), []);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const vendorById = useMemo(() => new Map(vendors.map((v) => [v.id, v])), [vendors]);

  const fmt = (n: number) => `${formatMoney(n)} ${currency}`;

  const priced = items.map((item) => {
    const product = productById.get(item.productId);
    const line = product ? priceLine(product, { qty: item.qty, days: item.days, delivery: item.delivery, installation: item.installation }) : null;
    return { item, product, line };
  });
  const valid = priced.filter((p): p is { item: CartItem; product: Product; line: NonNullable<typeof p.line> } => Boolean(p.product && p.line));
  const totals = sumTotals(valid.map((v) => v.line));
  const units = items.reduce((sum, i) => sum + i.qty, 0);

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state" style={{ maxWidth: 620, margin: "0 auto" }}>
            <ShoppingBag size={44} aria-hidden="true" color="#3B82F6" />
            <h1 style={{ fontSize: "1.6rem", marginTop: 14 }}>{t("cart.empty")}</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              {t("cart.emptyText")}
            </p>
            <div style={{ marginTop: 22 }}>
              <Link href="/equipment" className="btn btn-primary">
                {t("cart.browse")}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>{t("cart.title")}</h1>
          <p>{t("cart.subtitle")}</p>
        </div>
      </section>
      <section className="section-tight">
        <div className="container cart-layout">
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="panel-head">
              <strong>{t("cart.itemsCount", { count: units })}</strong>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  clearCart();
                  toast.show(t("cart.cleared"));
                }}
              >
                <Trash2 size={16} aria-hidden="true" />
                {t("cart.clear")}
              </button>
            </div>
            {priced.map(({ item, product, line }, idx) => {
              if (!product || !line) {
                return (
                  <div key={item.id} className="cart-line">
                    <span className="icon-tile tone-red" aria-hidden="true">
                      <AlertTriangle size={24} />
                    </span>
                    <div className="cart-line-body">
                      <strong>{t("err.product_unavailable")}</strong>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => removeCartItem(item.id)}>
                      {t("cart.remove")}
                    </button>
                  </div>
                );
              }
              const category = categoryById.get(product.categoryId);
              const vendor = vendorById.get(product.vendorId);
              const Icon = category ? categoryIcon(category.icon) : categoryIcon("");
              const tone = toneFor(idx);
              const minDate = today ?? item.eventDate;
              return (
                <CartLine
                  key={item.id}
                  item={item}
                  product={product}
                  line={line}
                  vendorName={vendor?.name ?? ""}
                  today={minDate}
                  Icon={Icon}
                  tone={tone}
                  fmt={fmt}
                />
              );
            })}
          </div>

          <aside className="card summary-card" aria-labelledby="summary-title">
            <h2 id="summary-title" style={{ fontSize: "1.2rem" }}>
              {t("cart.summary")}
            </h2>
            <div className="summary-lines">
              <div>
                <span>{t("common.subtotal")}</span>
                <span>{fmt(totals.subtotal)}</span>
              </div>
              <div>
                <span>{t("common.delivery")}</span>
                <span>{totals.deliveryTotal > 0 ? fmt(totals.deliveryTotal) : t("common.free")}</span>
              </div>
              <div>
                <span>{t("common.installation")}</span>
                <span>{totals.installationTotal > 0 ? fmt(totals.installationTotal) : t("common.none")}</span>
              </div>
              <div className="summary-total">
                <span>{t("common.total")}</span>
                <span>{fmt(totals.total)}</span>
              </div>
            </div>
            <p className="hint">{t("cart.priceNote")}</p>
            <Link href="/checkout" className="btn btn-success btn-block">
              {t("cart.checkout")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/equipment" className="btn btn-outline btn-block">
              {t("cart.continueShopping")}
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}

function CartLine({
  item,
  product,
  line,
  vendorName,
  today,
  Icon,
  tone,
  fmt,
}: {
  item: CartItem;
  product: Product;
  line: ReturnType<typeof priceLine>;
  vendorName: string;
  today: string;
  Icon: ReturnType<typeof categoryIcon>;
  tone: ReturnType<typeof toneFor>;
  fmt: (n: number) => string;
}) {
  const { t, text } = useLang();
  const toast = useToast();
  const [available, setAvailable] = useState<number | null>(null);
  const toneClass = tone === "green" ? "tone-green" : tone === "red" ? "tone-red" : "tone-blue";

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.eventDate) || item.eventDate < today) return;
    const c = new AbortController();
    const params = new URLSearchParams({ productId: product.id, date: item.eventDate, days: String(item.days) });
    fetch(`/api/availability?${params}`, { signal: c.signal })
      .then((r) => r.json())
      .then((d: { available?: number }) => setAvailable(typeof d.available === "number" ? d.available : null))
      .catch(() => undefined);
    return () => c.abort();
  }, [product.id, item.eventDate, item.days, today]);

  const short = available !== null && item.qty > available;
  const dateIsPast = item.eventDate < today;

  const setQty = (qty: number) => updateCartItem(item.id, { qty });
  const setDate = (eventDate: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || eventDate < today) {
      toast.show(t("cart.invalidDate"), "error");
      return;
    }
    removeCartItem(item.id);
    addCartItem({ productId: item.productId, eventDate, days: item.days, qty: item.qty, delivery: item.delivery, installation: item.installation });
    toast.show(t("cart.updated"));
  };
  const setDays = (days: number) => {
    removeCartItem(item.id);
    addCartItem({ productId: item.productId, eventDate: item.eventDate, days, qty: item.qty, delivery: item.delivery, installation: item.installation });
  };
  const setOption = (key: "delivery" | "installation", value: boolean) => {
    removeCartItem(item.id);
    addCartItem({
      productId: item.productId,
      eventDate: item.eventDate,
      days: item.days,
      qty: item.qty,
      delivery: key === "delivery" ? value : item.delivery,
      installation: key === "installation" ? value : item.installation,
    });
  };

  return (
    <div className="cart-line">
      <span className={`icon-tile ${toneClass}`} aria-hidden="true">
        <Icon size={26} />
      </span>
      <div className="cart-line-body">
        <div>
          <h3>{text(product.name)}</h3>
          <span className="hint">{vendorName}</span>
        </div>
        <div className="cart-controls">
          <div className="qty" role="group" aria-label={t("product.quantity")}>
            <button type="button" aria-label="−1" onClick={() => setQty(item.qty - 1)} disabled={item.qty <= 1}>
              <Minus size={16} />
            </button>
            <output>{item.qty}</output>
            <button type="button" aria-label="+1" onClick={() => setQty(item.qty + 1)} disabled={item.qty >= Math.min(MAX_QTY, product.stock)}>
              <Plus size={16} />
            </button>
          </div>
          <label className="sr-only" htmlFor={`d-${item.id}`}>
            {t("cart.eventDate")}
          </label>
          <input
            id={`d-${item.id}`}
            type="date"
            className="input"
            min={today}
            defaultValue={item.eventDate}
            onBlur={(e) => {
              if (e.target.value !== item.eventDate) setDate(e.target.value);
            }}
            aria-invalid={dateIsPast ? true : undefined}
          />
          <label className="sr-only" htmlFor={`days-${item.id}`}>
            {t("cart.days")}
          </label>
          <select id={`days-${item.id}`} className="select" style={{ width: "auto", minWidth: 120, minHeight: 42 }} value={item.days} onChange={(e) => setDays(Number(e.target.value))}>
            {Array.from({ length: MAX_DAYS - MIN_DAYS + 1 }, (_, i) => i + MIN_DAYS).map((d) => (
              <option key={d} value={d}>
                {d} {t("common.days")}
              </option>
            ))}
          </select>
        </div>
        <div className="row" style={{ gap: 14 }}>
          <label className="row" style={{ gap: 6, fontSize: "0.92rem", fontWeight: 600, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={item.delivery}
              onChange={(e) => setOption("delivery", e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "#3B82F6" }}
            />
            <Truck size={16} aria-hidden="true" /> {t("cart.deliveryShort")}
          </label>
          <label
            className="row"
            style={{ gap: 6, fontSize: "0.92rem", fontWeight: 600, cursor: product.installable ? "pointer" : "not-allowed", opacity: product.installable ? 1 : 0.5 }}
          >
            <input
              type="checkbox"
              checked={item.installation && product.installable}
              disabled={!product.installable}
              onChange={(e) => setOption("installation", e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "#22C55E" }}
            />
            <Wrench size={16} aria-hidden="true" /> {t("cart.installShort")}
          </label>
        </div>
        {short && (
          <span className="field-error" role="alert">
            {t("err.insufficient_stock")}
          </span>
        )}
        {dateIsPast && (
          <span className="field-error" role="alert">
            {t("err.date_past")}
          </span>
        )}
      </div>
      <div className="cart-line-price">
        <span className="price" style={{ fontSize: "1.05rem" }}>
          {fmt(line.lineTotal)}
        </span>
        <span className="hint">{t("product.rentalLine", { qty: item.qty, days: item.days, dayUnit: t("common.days") })}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeCartItem(item.id)} aria-label={`${t("cart.remove")}: ${text(product.name)}`}>
          <Trash2 size={16} aria-hidden="true" />
          {t("cart.remove")}
        </button>
      </div>
    </div>
  );
}

