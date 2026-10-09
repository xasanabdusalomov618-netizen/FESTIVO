"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, CreditCard, Landmark, LogIn, Truck, UserPlus } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { useSessionUser } from "@/components/SessionProvider";
import { useToast } from "@/components/Toaster";
import { clearCart, useCart } from "@/lib/cart-store";
import { formatMoney, priceLine, sumTotals } from "@/lib/pricing";
import { normalizePhone, formatPhone } from "@/lib/validation";
import { formatDate } from "@/lib/dates";
import { categoryIcon } from "@/components/icons";
import type { Category, PaymentMethod, Product, Vendor } from "@/lib/types";
import type { ErrorCode } from "@/lib/errors";

interface Props {
  products: Product[];
  categories: Category[];
  vendors: Vendor[];
  today: string;
}

type FieldKey = "fullName" | "phone" | "address" | "notes" | "paymentMethod";
type Errors = Partial<Record<FieldKey, ErrorCode>>;

export function CheckoutView({ products, categories, vendors, today }: Props) {
  const { t, text, currency, errorText } = useLang();
  const user = useSessionUser();
  const router = useRouter();
  const toast = useToast();
  const items = useCart();

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState<{ code: string; total: number } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName((v) => v || user.name);
      setPhone((v) => v || user.phone);
    }
  }, [user]);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const vendorById = useMemo(() => new Map(vendors.map((v) => [v.id, v])), [vendors]);
  const fmt = (n: number) => `${formatMoney(n)} ${currency}`;

  const lines = items
    .map((item) => {
      const product = productById.get(item.productId);
      if (!product) return null;
      return { item, product, line: priceLine(product, { qty: item.qty, days: item.days, delivery: item.delivery, installation: item.installation }) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const totals = sumTotals(lines.map((l) => l.line));
  const hasMissing = lines.length !== items.length;

  if (booked) {
    return (
      <section className="section">
        <div className="container">
          <div className="card card-pad" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", display: "grid", gap: 14, justifyItems: "center", padding: 36 }}>
            <span className="icon-tile tone-green" style={{ width: 64, height: 64, borderRadius: 20 }} aria-hidden="true">
              <CheckCircle2 size={34} />
            </span>
            <h1 style={{ fontSize: "1.6rem" }}>{t("checkout.bookedTitle")}</h1>
            <p className="muted">{t("checkout.bookedText", { code: booked.code })}</p>
            <p>
              <strong>
                {t("common.total")}: {fmt(booked.total)}
              </strong>
            </p>
            <div className="row" style={{ justifyContent: "center" }}>
              <Link href="/bookings" className="btn btn-primary">
                {t("checkout.viewBookings")}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/equipment" className="btn btn-outline">
                {t("cart.continueShopping")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section">
        <div className="container">
          <div className="card card-pad" style={{ maxWidth: 620, margin: "0 auto", display: "grid", gap: 14, padding: 34 }}>
            <span className="icon-tile tone-blue" aria-hidden="true">
              <LogIn size={22} />
            </span>
            <h1 style={{ fontSize: "1.6rem" }}>{t("checkout.signInTitle")}</h1>
            <p className="muted">{t("checkout.signInText")}</p>
            <div className="row">
              <Link href="/login?next=/checkout" className="btn btn-primary">
                <LogIn size={18} aria-hidden="true" />
                {t("checkout.signInCta")}
              </Link>
              <Link href="/register?next=/checkout" className="btn btn-outline">
                <UserPlus size={18} aria-hidden="true" />
                {t("checkout.createCta")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state" style={{ maxWidth: 620, margin: "0 auto" }}>
            <h1 style={{ fontSize: "1.5rem" }}>{t("checkout.emptyTitle")}</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              {t("checkout.emptyText")}
            </p>
            <div style={{ marginTop: 20 }}>
              <Link href="/equipment" className="btn btn-primary">
                {t("cart.browse")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function validate(): Errors {
    const e: Errors = {};
    if (fullName.trim().length < 2) e.fullName = "name_required";
    if (!normalizePhone(phone.trim())) e.phone = "phone_invalid";
    if (address.trim().length < 5) e.address = "address_required";
    if (notes.trim().length > 500) e.notes = "notes_long";
    return e;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setFormError(t("checkout.fixErrors"));
      return;
    }
    if (hasMissing) {
      setFormError(t("err.product_unavailable"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: { fullName, phone, address, notes },
          paymentMethod: payment,
          lines: items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            eventDate: i.eventDate,
            days: i.days,
            delivery: i.delivery,
            installation: i.installation,
          })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: ErrorCode; field?: string; booking?: { code: string; total: number } };
      if (!res.ok || !data.booking) {
        const code = data.error ?? "generic";
        if (data.field) {
          const key = data.field as FieldKey;
          if (key in { fullName: 1, phone: 1, address: 1, notes: 1, paymentMethod: 1 }) setErrors({ [key]: code });
        }
        setFormError(errorText(code));
        if (res.status === 401) router.push("/login?next=/checkout");
        return;
      }
      clearCart();
      setBooked({ code: data.booking.code, total: data.booking.total });
      toast.show(t("toast.bookingCreated"));
      router.refresh();
    } catch {
      setFormError(t("toast.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  const fieldError = (key: FieldKey) =>
    errors[key] ? (
      <span className="field-error" role="alert">
        {errorText(errors[key])}
      </span>
    ) : null;

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>{t("checkout.title")}</h1>
          <p>{t("checkout.subtitle")}</p>
        </div>
      </section>
      <section className="section-tight">
        <div className="container checkout-layout">
          <form className="card card-pad stack" onSubmit={submit} noValidate aria-describedby={formError ? "checkout-error" : undefined}>
            <h2 style={{ fontSize: "1.15rem" }}>{t("checkout.customerTitle")}</h2>
            {formError && (
              <div id="checkout-error" className="form-error" role="alert">
                {formError}
              </div>
            )}
            <div className="form-grid">
              <div className="field">
                <label className="label" htmlFor="co-name">
                  {t("auth.name")}
                </label>
                <input
                  id="co-name"
                  className="input"
                  autoComplete="name"
                  value={fullName}
                  aria-invalid={!!errors.fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <span className="hint">{t("checkout.fullNameHelp")}</span>
                {fieldError("fullName")}
              </div>
              <div className="field">
                <label className="label" htmlFor="co-phone">
                  {t("common.phone")}
                </label>
                <input
                  id="co-phone"
                  className="input"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  aria-invalid={!!errors.phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <span className="hint">{t("checkout.phoneHelp")}</span>
                {fieldError("phone")}
              </div>
              <div className="field span-2">
                <label className="label" htmlFor="co-address">
                  {t("common.address")}
                </label>
                <input
                  id="co-address"
                  className="input"
                  autoComplete="street-address"
                  value={address}
                  aria-invalid={!!errors.address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <span className="hint">{t("checkout.addressHelp")}</span>
                {fieldError("address")}
              </div>
              <div className="field span-2">
                <label className="label" htmlFor="co-notes">
                  {t("common.notes")}
                </label>
                <textarea
                  id="co-notes"
                  className="textarea"
                  maxLength={600}
                  placeholder={t("checkout.notesPlaceholder")}
                  value={notes}
                  aria-invalid={!!errors.notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {fieldError("notes")}
              </div>
            </div>

            <h2 style={{ fontSize: "1.15rem", marginTop: 6 }}>{t("checkout.paymentTitle")}</h2>
            <div className="form-grid" role="radiogroup" aria-label={t("checkout.paymentTitle")}>
              {(
                [
                  { id: "cash", icon: Truck, label: t("checkout.paymentCash"), help: t("checkout.paymentCashHelp"), tone: "green" },
                  { id: "transfer", icon: Landmark, label: t("checkout.paymentTransfer"), help: t("checkout.paymentTransferHelp"), tone: "blue" },
                ] as const
              ).map((opt) => (
                <label key={opt.id} className={`check ${payment === opt.id ? "is-on" : ""}`} style={{ alignItems: "center" }}>
                  <input type="radio" name="payment" value={opt.id} checked={payment === opt.id} onChange={() => setPayment(opt.id)} />
                  <span className={`icon-tile tone-${opt.tone}`} style={{ width: 40, height: 40, borderRadius: 12 }} aria-hidden="true">
                    <opt.icon size={20} />
                  </span>
                  <div>
                    <strong>{opt.label}</strong>
                    <span className="hint">{opt.help}</span>
                  </div>
                </label>
              ))}
            </div>
            <p className="hint">
              <CreditCard size={14} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> {t("checkout.termsNote")}
            </p>

            <button type="submit" className="btn btn-success btn-block" disabled={submitting || hasMissing}>
              {submitting ? t("checkout.placing") : t("checkout.placeOrder")}
              {!submitting && <ArrowRight size={18} aria-hidden="true" />}
            </button>
          </form>

          <aside className="card summary-card checkout-summary" aria-labelledby="co-summary">
            <h2 id="co-summary" style={{ fontSize: "1.15rem" }}>
              {t("checkout.summaryTitle")}
            </h2>
            {hasMissing && (
              <div className="notice warn" role="alert">
                <AlertTriangle size={18} aria-hidden="true" color="#ef4444" />
                <span>{t("err.product_unavailable")}</span>
              </div>
            )}
            <div style={{ display: "grid", gap: 12 }}>
              {lines.map(({ item, product, line }) => {
                const Icon = categoryIcon(categoryById.get(product.categoryId)?.icon ?? "");
                return (
                  <div key={item.id} className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                    <span className="icon-tile tone-blue" style={{ width: 40, height: 40, borderRadius: 12 }} aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: "0.94rem" }}>{text(product.name)}</strong>
                      <div className="hint">
                        {item.qty} × {item.days} {t("common.days")} · {formatDate(item.eventDate)}
                        {vendorById.get(product.vendorId) ? ` · ${vendorById.get(product.vendorId)!.name}` : ""}
                      </div>
                    </div>
                    <strong style={{ whiteSpace: "nowrap", fontSize: "0.92rem" }}>{fmt(line.lineTotal)}</strong>
                  </div>
                );
              })}
            </div>
            <hr className="divider" />
            <div className="summary-lines">
              <div>
                <span>{t("common.subtotal")}</span>
                <span>{fmt(totals.subtotal)}</span>
              </div>
              <div>
                <span>{t("common.delivery")}</span>
                <span>{totals.deliveryTotal > 0 ? fmt(totals.deliveryTotal) : t("common.none")}</span>
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
            <p className="hint">{t("checkout.itemsLine", { count: items.reduce((s, i) => s + i.qty, 0) })}</p>
            <p className="hint">{t("cart.priceNote")}</p>
            {/* Today is passed for future server-side date checks */}
            <span hidden data-today={today} />
          </aside>
        </div>
      </section>
    </>
  );
}
