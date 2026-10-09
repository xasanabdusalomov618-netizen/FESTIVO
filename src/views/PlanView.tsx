"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Music, Lightbulb, Users, ShoppingCart, Sparkles, Tent, Armchair, Table2, Layers } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { useToast } from "@/components/Toaster";
import { addCartItem } from "@/lib/cart-store";
import { formatMoney, priceLine, sumTotals } from "@/lib/pricing";
import { addDaysIso } from "@/lib/dates";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
  today: string;
}

type EventType = "wedding" | "birthday" | "corporate" | "conference" | "other";
const EVENT_TYPES: EventType[] = ["wedding", "birthday", "corporate", "conference", "other"];

interface KitItem {
  productId: string;
  qty: number;
  label: "chairsLine" | "tablesLine" | "tentLine" | "soundLine" | "lightLine" | "linenLine";
  icon: typeof Tent;
}

export function PlanView({ products, today }: Props) {
  const { t, currency, text } = useLang();
  const toast = useToast();
  const router = useRouter();
  const [type, setType] = useState<EventType>("wedding");
  const [date, setDate] = useState(addDaysIso(today, 14));
  const [guestsText, setGuestsText] = useState("80");
  const [days, setDays] = useState(1);
  const [withSound, setWithSound] = useState(true);
  const [withLight, setWithLight] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const guests = Number(guestsText);
  const guestsValid = Number.isInteger(guests) && guests >= 5 && guests <= 1000;
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= today;
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const fmt = (n: number) => `${formatMoney(n)} ${currency}`;

  // Simple, transparent sizing rules: 1 chair per guest (+10%), 1 round table per 10 guests,
  // a tent for events above 40 guests, sound for 60+ and optional stage lights.
  const kit: KitItem[] = useMemo(() => {
    if (!guestsValid) return [];
    const items: KitItem[] = [];
    const push = (productId: string, qty: number, label: KitItem["label"], icon: KitItem["icon"]) => {
      const p = byId.get(productId);
      if (!p || !p.active || qty <= 0) return;
      items.push({ productId, qty: Math.min(qty, p.stock), label, icon });
    };
    const tables = Math.ceil(guests / 10);
    push("p-chiavari", Math.ceil(guests * 1.1), "chairsLine", Armchair);
    push("p-round-table", tables, "tablesLine", Table2);
    if (guests > 40) {
      const tentId = guests > 150 ? "p-white-tent" : "p-clear-tent";
      push(tentId, guests > 150 ? Math.ceil(guests / 150) : 1, "tentLine", Tent);
    }
    push("p-linen", tables, "linenLine", Layers);
    if (withSound || guests >= 60) push("p-pa-system", 1, "soundLine", Music);
    if (withLight) push("p-led-par", Math.max(1, Math.ceil(guests / 60)), "lightLine", Lightbulb);
    return items;
  }, [guests, guestsValid, byId, withSound, withLight]);

  const priced = kit.map((k) => {
    const p = byId.get(k.productId)!;
    return { ...k, product: p, line: priceLine(p, { qty: k.qty, days, delivery: true, installation: p.installable }) };
  });
  const totals = sumTotals(priced.map((p) => p.line));

  function addAll() {
    setSubmitted(true);
    if (!dateValid || !guestsValid || kit.length === 0) return;
    for (const k of priced) {
      addCartItem({ productId: k.productId, eventDate: date, days, qty: k.qty, delivery: true, installation: k.product.installable });
    }
    toast.show(t("plan.kitAdded", { count: priced.length }));
    router.push("/cart");
  }

  const iconFor = (i: number) => (["blue", "green", "red"] as const)[i % 3];

  return (
    <>
      <section className="page-head">
        <div className="container">
          <span className="eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            {t("nav.plan")}
          </span>
          <h1 style={{ marginTop: 8 }}>{t("plan.title")}</h1>
          <p>{t("plan.subtitle")}</p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container plan-layout">
          <form className="card card-pad stack" onSubmit={(e) => { e.preventDefault(); addAll(); }} noValidate>
            <div className="field">
              <span className="label" id="plan-type-label">
                {t("plan.eventType")}
              </span>
              <div className="chip-row" role="radiogroup" aria-labelledby="plan-type-label">
                {EVENT_TYPES.map((et) => (
                  <button key={et} type="button" role="radio" aria-checked={type === et} className="chip" onClick={() => setType(et)}>
                    {t(`plan.types.${et}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="label" htmlFor="plan-date">
                  {t("plan.eventDate")}
                </label>
                <div className="search-box">
                  <CalendarDays size={18} aria-hidden="true" style={{ position: "absolute", left: 14, top: 14, color: "#64748b" }} />
                  <input id="plan-date" type="date" className="input" min={today} value={date} onChange={(e) => setDate(e.target.value)} aria-invalid={submitted && !dateValid} style={{ paddingLeft: 42 }} />
                </div>
                {submitted && !dateValid && (
                  <span className="field-error" role="alert">
                    {t("plan.needDate")}
                  </span>
                )}
              </div>
              <div className="field">
                <label className="label" htmlFor="plan-guests">
                  {t("plan.guests")}
                </label>
                <input
                  id="plan-guests"
                  className="input"
                  inputMode="numeric"
                  value={guestsText}
                  onChange={(e) => setGuestsText(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  aria-invalid={submitted && !guestsValid}
                />
                <span className="hint">{t("plan.guestsHelp")}</span>
                {submitted && !guestsValid && (
                  <span className="field-error" role="alert">
                    {t("plan.guestRange")}
                  </span>
                )}
              </div>
              <div className="field span-2">
                <label className="label" htmlFor="plan-days">
                  {t("plan.days")}
                </label>
                <select id="plan-days" className="select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <option key={d} value={d}>
                      {d} {t("common.days")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className={`check ${withSound ? "is-on" : ""}`}>
              <input type="checkbox" checked={withSound} onChange={(e) => setWithSound(e.target.checked)} />
              <div>
                <strong>{t("plan.withSound")}</strong>
              </div>
            </label>
            <label className={`check ${withLight ? "is-on" : ""}`}>
              <input type="checkbox" checked={withLight} onChange={(e) => setWithLight(e.target.checked)} />
              <div>
                <strong>{t("plan.withLight")}</strong>
              </div>
            </label>
            <p className="hint">
              <Users size={14} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> {type ? t(`plan.types.${type}`) : ""}
            </p>
          </form>

          <div className="card card-pad" aria-live="polite">
            <div className="section-head" style={{ marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: "1.3rem" }}>{t("plan.kitTitle")}</h2>
                <p>{guestsValid ? t("plan.kitText", { guests }) : t("plan.kitEmpty")}</p>
              </div>
            </div>

            {priced.length === 0 ? (
              <div className="empty-state" style={{ padding: 32 }}>
                <Users size={34} aria-hidden="true" color="#3B82F6" />
                <p className="muted" style={{ marginTop: 10 }}>
                  {t("plan.kitEmpty")}
                </p>
              </div>
            ) : (
              <>
                {priced.map((k, i) => (
                  <div key={k.productId} className="kit-item">
                    <span className={`icon-tile tone-${iconFor(i)}`} aria-hidden="true">
                      <k.icon size={20} />
                    </span>
                    <div>
                      <strong>{t(`plan.${k.label}`)}</strong>
                      <div className="hint">
                        {k.qty} × {text(k.product.name)}
                      </div>
                    </div>
                    <strong style={{ whiteSpace: "nowrap" }}>{fmt(k.line.lineTotal)}</strong>
                  </div>
                ))}
                <div className="kit-total">
                  <div>
                    <span className="muted">{t("plan.kitTotal")}</span>
                    <div className="price" style={{ fontSize: "1.5rem" }}>
                      {fmt(totals.total)}
                    </div>
                  </div>
                  <button type="button" className="btn btn-success" onClick={addAll} disabled={!dateValid || !guestsValid}>
                    <ShoppingCart size={18} aria-hidden="true" />
                    {t("plan.addKit")}
                  </button>
                </div>
                <p className="hint" style={{ marginTop: 12 }}>
                  {t("plan.kitNote")}{" "}
                  <Link href="/equipment">{t("nav.browse")}</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
