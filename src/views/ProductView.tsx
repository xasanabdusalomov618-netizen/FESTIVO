"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Clock, Minus, Plus, ShoppingCart, Truck, Wrench, Info } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { categoryIcon } from "@/components/icons";
import { useToast } from "@/components/Toaster";
import { addCartItem } from "@/lib/cart-store";
import { MAX_DAYS, MIN_DAYS, formatMoney, priceLine } from "@/lib/pricing";
import type { Category, Product, Vendor } from "@/lib/types";
import { toneFor } from "@/components/icons";

interface Props {
  product: Product;
  category: Category | null;
  vendor: Vendor | null;
  related: ProductCardData[];
  today: string;
  defaultDate: string;
}

type Avail = { status: "idle" | "loading" | "ok" | "error"; available: number };

export function ProductView({ product, category, vendor, related, today, defaultDate }: Props) {
  const { t, text, currency } = useLang();
  const toast = useToast();
  const [date, setDate] = useState(defaultDate);
  const [days, setDays] = useState(1);
  const [qty, setQty] = useState(1);
  const [delivery, setDelivery] = useState(false);
  const [installation, setInstallation] = useState(false);
  const [avail, setAvail] = useState<Avail>({ status: "idle", available: product.stock });
  const [added, setAdded] = useState<{ qty: number; date: string } | null>(null);
  const [dateError, setDateError] = useState("");

  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= today;

  useEffect(() => {
    if (!dateValid) {
      setAvail({ status: "idle", available: 0 });
      return;
    }
    const controller = new AbortController();
    setAvail((prev) => ({ ...prev, status: "loading" }));
    const params = new URLSearchParams({ productId: product.id, date, days: String(days) });
    fetch(`/api/availability?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { available?: number; error?: string }) => {
        if (typeof data.available === "number") setAvail({ status: "ok", available: data.available });
        else setAvail({ status: "error", available: 0 });
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvail({ status: "error", available: 0 });
      });
    return () => controller.abort();
  }, [product.id, date, days, dateValid]);

  const maxQty = avail.status === "ok" ? avail.available : product.stock;
  const safeQty = Math.min(qty, Math.max(1, maxQty));
  const priced = useMemo(
    () => priceLine(product, { qty: safeQty, days, delivery, installation }),
    [product, safeQty, days, delivery, installation],
  );

  const fmt = (n: number) => `${formatMoney(n)} ${currency}`;
  const Icon = category ? categoryIcon(category.icon) : categoryIcon("");
  const tone = toneFor(0);
  const toneClass = tone === "green" ? "tone-green" : tone === "red" ? "tone-red" : "tone-blue";
  const unavailable = !dateValid || avail.status === "error" || maxQty <= 0 || (avail.status === "ok" && safeQty > avail.available);

  function add() {
    if (!dateValid) {
      setDateError(date && date < today ? t("err.date_past") : t("product.selectDate"));
      return;
    }
    setDateError("");
    if (maxQty <= 0 || safeQty > maxQty) {
      toast.show(t("err.insufficient_stock"), "error");
      return;
    }
    addCartItem({ productId: product.id, eventDate: date, days, qty: safeQty, delivery, installation: installation && product.installable });
    setAdded({ qty: safeQty, date });
    toast.show(t("toast.addedToCart"));
  }

  const availNote = (() => {
    if (!dateValid) return { cls: "avail-wait", text: t("product.selectDate") };
    if (avail.status === "loading" || avail.status === "idle") return { cls: "avail-wait", text: t("product.checkingAvailability") };
    if (avail.status === "error") return { cls: "avail-bad", text: t("err.generic") };
    if (avail.available <= 0) return { cls: "avail-bad", text: t("product.notAvailableForDates") };
    return { cls: "avail-ok", text: t("product.availableForDates", { count: avail.available }) };
  })();

  return (
    <>
      <section className="section-tight" style={{ paddingBottom: 0 }}>
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">{t("nav.home")}</Link>
            <span>/</span>
            <Link href="/equipment">{t("nav.browse")}</Link>
            {category && (
              <>
                <span>/</span>
                <Link href={`/equipment?category=${category.id}`}>{text(category.name)}</Link>
              </>
            )}
            <span>/</span>
            <span aria-current="page" style={{ color: "var(--navy)" }}>
              {text(product.name)}
            </span>
          </nav>
          <Link href="/equipment" className="btn btn-ghost btn-sm" style={{ marginLeft: -12, marginBottom: 8 }}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t("product.back")}
          </Link>
        </div>
      </section>

      <section className="section-tight" style={{ paddingTop: 16 }}>
        <div className="container detail-layout">
          <div className="stack">
            <div className="detail-hero" style={{ background: "#f8fafc" }}>
              <div className="icon-large" aria-hidden="true">
                <span className={`icon-tile ${toneClass}`} style={{ width: 96, height: 96, borderRadius: 26 }}>
                  <Icon size={48} />
                </span>
              </div>
              <div className="product-badges" style={{ top: 16, left: 16 }}>
                {product.featured && <span className="badge badge-navy">{t("catalog.featured")}</span>}
                {product.installable && <span className="badge badge-green">{t("catalog.installable")}</span>}
              </div>
            </div>

            <div className="card card-pad">
              <span className="hint">{category ? text(category.name) : ""}</span>
              <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.1rem)", marginTop: 4 }}>{text(product.name)}</h1>
              <h2 style={{ fontSize: "1.2rem", marginTop: 18 }}>{t("product.about")}</h2>
              <p className="muted" style={{ marginTop: 8 }}>
                {text(product.description)}
              </p>
              <hr className="divider" style={{ margin: "18px 0" }} />
              <h3 style={{ fontSize: "1rem", marginBottom: 10 }}>{t("product.specs")}</h3>
              <dl className="kv">
                <dt>{t("common.category")}</dt>
                <dd>{category ? text(category.name) : "—"}</dd>
                <dt>{t("common.vendor")}</dt>
                <dd>{vendor ? vendor.name : "—"}</dd>
                <dt>{t("product.specVendor")}</dt>
                <dd>{vendor ? text(vendor.city) : "—"}</dd>
                <dt>{t("product.specUnit")}</dt>
                <dd>{t("product.specUnitValue")}</dd>
                <dt>{t("product.specStock")}</dt>
                <dd>{product.stock}</dd>
                <dt>{t("product.rating")}</dt>
                <dd>{vendor ? `★ ${vendor.rating.toFixed(1)}` : "—"}</dd>
              </dl>
            </div>
          </div>

          <div className="card buy-box" aria-live="polite">
            <div>
              <div className="buy-price">
                <span className="price">
                  {formatMoney(product.pricePerDay)} {currency}
                </span>
                <span className="muted">{t("common.perDay")}</span>
              </div>
              <p className="hint" style={{ marginTop: 4 }}>
                {t("product.unitPrice")}
              </p>
            </div>

            <div className="field">
              <label className="label" htmlFor="pv-date">
                {t("product.eventDate")}
              </label>
              <div className="search-box">
                <CalendarDays size={18} aria-hidden="true" style={{ position: "absolute", left: 14, top: 14, color: "#64748b", pointerEvents: "none" }} />
                <input
                  id="pv-date"
                  type="date"
                  className="input"
                  style={{ paddingLeft: 42 }}
                  min={today}
                  value={date}
                  aria-invalid={dateError ? true : undefined}
                  aria-describedby="pv-date-help"
                  onChange={(e) => {
                    setDate(e.target.value);
                    setDateError("");
                    setAdded(null);
                  }}
                />
              </div>
              {dateError ? (
                <span className="field-error" role="alert">
                  {dateError}
                </span>
              ) : (
                <span className="hint" id="pv-date-help">
                  {t("product.eventDateHelp")}
                </span>
              )}
            </div>

            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <div className="field" style={{ gap: 6 }}>
                <label className="label" htmlFor="pv-days">
                  {t("product.days")}
                </label>
                <select id="pv-days" className="select" style={{ minWidth: 150 }} value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  {Array.from({ length: MAX_DAYS - MIN_DAYS + 1 }, (_, i) => i + MIN_DAYS).map((d) => (
                    <option key={d} value={d}>
                      {d} {t("common.days")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ gap: 6 }}>
                <span className="label" id="pv-qty-label">
                  {t("product.quantity")}
                </span>
                <div className="qty" role="group" aria-labelledby="pv-qty-label">
                  <button type="button" onClick={() => setQty(Math.max(1, safeQty - 1))} disabled={safeQty <= 1} aria-label="−1">
                    <Minus size={16} />
                  </button>
                  <output aria-live="polite">{safeQty}</output>
                  <button type="button" onClick={() => setQty(Math.min(Math.max(1, maxQty), safeQty + 1))} disabled={safeQty >= maxQty} aria-label="+1">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            <span className="hint" style={{ marginTop: -8 }}>
              {t("product.quantityHelp")}
            </span>

            <label className={`check ${delivery ? "is-on" : ""}`}>
              <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} />
              <div style={{ flex: 1 }}>
                <strong>
                  <Truck size={16} aria-hidden="true" style={{ verticalAlign: "-3px", marginRight: 6 }} />
                  {t("product.deliveryOption")}
                </strong>
                <span className="hint">{t("product.deliveryOptionHelp")}</span>
              </div>
              <span className="badge badge-blue">+{formatMoney(product.deliveryFee)}</span>
            </label>

            <label className={`check ${installation ? "is-on" : ""} ${!product.installable ? "is-disabled" : ""}`}>
              <input
                type="checkbox"
                checked={installation && product.installable}
                disabled={!product.installable}
                onChange={(e) => setInstallation(e.target.checked)}
              />
              <div style={{ flex: 1 }}>
                <strong>
                  <Wrench size={16} aria-hidden="true" style={{ verticalAlign: "-3px", marginRight: 6 }} />
                  {t("product.installationOption")}
                </strong>
                <span className="hint">{product.installable ? t("product.installationOptionHelp") : t("product.installationUnavailable")}</span>
              </div>
              {product.installable && <span className="badge badge-green">+{formatMoney(product.installFee)} / {t("common.quantityUnits")}</span>}
            </label>

            <div className={`avail-note ${availNote.cls}`} role="status">
              {availNote.cls === "avail-ok" ? <CheckCircle2 size={18} aria-hidden="true" /> : availNote.cls === "avail-bad" ? <AlertTriangle size={18} aria-hidden="true" /> : <Clock size={18} aria-hidden="true" />}
              <span>{availNote.text}</span>
            </div>

            <div className="summary-lines" aria-label={t("product.priceBreakdown")}>
              <strong style={{ fontSize: "0.95rem" }}>{t("product.priceBreakdown")}</strong>
              <div>
                <span>{t("product.rentalLine", { qty: safeQty, days, dayUnit: t("common.days") })}</span>
                <span>{fmt(priced.rentalTotal)}</span>
              </div>
              {delivery && (
                <div>
                  <span>{t("product.deliveryLine")}</span>
                  <span>{fmt(priced.deliveryTotal)}</span>
                </div>
              )}
              {installation && product.installable && (
                <div>
                  <span>{t("product.installationLine", { qty: safeQty })}</span>
                  <span>{fmt(priced.installationTotal)}</span>
                </div>
              )}
              <div className="summary-total">
                <span>{t("product.lineTotal")}</span>
                <span>{fmt(priced.lineTotal)}</span>
              </div>
            </div>

            <button type="button" className="btn btn-success btn-block" onClick={add} disabled={unavailable && dateValid}>
              <ShoppingCart size={18} aria-hidden="true" />
              {t("catalog.addToCart")}
            </button>

            {added && (
              <div className="added-card" role="status">
                <div className="row" style={{ flexWrap: "nowrap" }}>
                  <CheckCircle2 size={22} color="#16a34a" aria-hidden="true" />
                  <div>
                    <strong>{t("product.addedTitle")}</strong>
                    <p className="muted" style={{ fontSize: "0.92rem" }}>
                      {t("product.addedText", { qty: added.qty, name: text(product.name), date: added.date.split("-").reverse().join(".") })}
                    </p>
                  </div>
                </div>
                <div className="row">
                  <Link href="/cart" className="btn btn-primary btn-sm">
                    {t("product.goToCart")}
                  </Link>
                  <Link href="/equipment" className="btn btn-outline btn-sm">
                    {t("product.continueBrowsing")}
                  </Link>
                </div>
              </div>
            )}

            <div className="notice" style={{ marginTop: 2 }}>
              <Info size={18} aria-hidden="true" color="#3b82f6" />
              <span>{t("cart.priceNote")}</span>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section-surface" aria-labelledby="related-title" style={{ marginTop: 48 }}>
          <div className="container">
            <div className="section-head">
              <h2 id="related-title">{t("product.related")}</h2>
            </div>
            <div className="grid grid-3">
              {related.map((d, i) => (
                <ProductCard key={d.product.id} data={d} tone={toneFor(i)} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
