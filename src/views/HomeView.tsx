"use client";

import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2, ClipboardCheck, Truck, Wrench, Users, Layers, Globe2 } from "lucide-react";
import type { Category } from "@/lib/types";
import { useLang } from "@/i18n/LanguageProvider";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { categoryIcon, toneFor, type Tone } from "@/components/icons";
import { StatusBadge } from "@/components/StatusBadge";

interface Props {
  categories: Category[];
  productCount: number;
  vendorCount: number;
  featured: ProductCardData[];
  previewDate: string;
}

/** Wraps numbers (e.g. "10") in the brand red accent — works in every language. */
function accentNumbers(text: string) {
  return text.split(/(\d+)/).map((part, i) =>
    /^\d+$/.test(part) ? (
      <span key={i} className="accent">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

const STEP_COLORS = ["var(--blue)", "var(--green)", "var(--red)"];

export function HomeView({ categories, productCount, vendorCount, featured, previewDate }: Props) {
  const { t, text, date } = useLang();
  const previewItems = featured.slice(0, 2);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">
              <span className="dot dot-red" aria-hidden="true" />
              {t("home.eyebrow")}
            </span>
            <h1 id="hero-title">{accentNumbers(t("home.headline"))}</h1>
            <p className="lead">{t("home.subtitle")}</p>
            <div className="hero-actions">
              <Link href="/equipment" className="btn btn-primary">
                {t("home.ctaBrowse")}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link href="/plan" className="btn btn-success">
                <Calendar size={18} aria-hidden="true" />
                {t("home.ctaPlan")}
              </Link>
            </div>
            <div className="hero-stats" role="list">
              <div className="hero-stat" role="listitem">
                <b>{productCount}</b>
                <span>{t("home.statEquipment")}</span>
              </div>
              <div className="hero-stat" role="listitem">
                <b>{vendorCount}</b>
                <span>{t("home.statVendors")}</span>
              </div>
              <div className="hero-stat" role="listitem">
                <b>{categories.length}</b>
                <span>{t("home.statCategories")}</span>
              </div>
              <div className="hero-stat" role="listitem">
                <b>3</b>
                <span>{t("home.statLanguages")}</span>
              </div>
            </div>
          </div>

          <aside className="preview-card" aria-label={t("home.previewTitle")}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <span className="hint">{t("home.previewTitle")} · FV-1001</span>
                <h3 style={{ marginTop: 4 }}>{t("home.previewCustomer")}</h3>
              </div>
              <span className="badge badge-green badge-dot">{t("status.confirmed")}</span>
            </div>
            <div style={{ marginTop: 10 }}>
              {previewItems.map(({ product, category }, i) => {
                const Icon = category ? categoryIcon(category.icon) : categoryIcon("");
                return (
                  <div key={product.id} className="preview-item">
                    <span className={`icon-tile tone-${toneFor(i)}`} aria-hidden="true">
                      <Icon size={22} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", fontSize: "0.95rem" }}>{text(product.name)}</strong>
                      <span className="hint">{category ? text(category.name) : ""}</span>
                    </div>
                    <CheckCircle2 size={20} color="#16a34a" aria-hidden="true" style={{ marginLeft: "auto" }} />
                  </div>
                );
              })}
            </div>
            <div className="preview-meta">
              <div>
                <span>{t("home.previewDate")}</span>
                <b>{date(previewDate)}</b>
              </div>
              <div>
                <span>{t("home.previewStatus")}</span>
                <StatusBadge status="confirmed" />
              </div>
            </div>
            <div className="timeline-bar" aria-hidden="true">
              <i className="on-blue" />
              <i className="on-green" />
              <i />
              <i />
            </div>
            <p className="hint" style={{ marginTop: 10 }}>
              {t("home.previewLine")}
            </p>
          </aside>
        </div>
      </section>

      <section className="section" aria-labelledby="categories-title">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 id="categories-title">{t("home.categoriesTitle")}</h2>
              <p>{t("home.categoriesSubtitle")}</p>
            </div>
            <Link href="/equipment" className="btn btn-outline">
              {t("common.seeAll")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-4">
            {categories.map((c, i) => {
              const Icon = categoryIcon(c.icon);
              const tone: Tone = toneFor(i);
              return (
                <Link key={c.id} href={`/equipment?category=${c.id}`} className="card card-hover category-card">
                  <span className={`icon-tile tone-${tone}`} aria-hidden="true">
                    <Icon size={24} />
                  </span>
                  <h3>{text(c.name)}</h3>
                  <p>{text(c.description)}</p>
                  <span className="go">
                    {t("common.view")} <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section-surface" aria-labelledby="how-title">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 id="how-title">{t("home.howTitle")}</h2>
              <p>{t("home.howSubtitle")}</p>
            </div>
          </div>
          <div className="grid grid-3 steps">
            {[
              { icon: Layers, title: t("home.step1Title"), text: t("home.step1Text") },
              { icon: Calendar, title: t("home.step2Title"), text: t("home.step2Text") },
              { icon: Truck, title: t("home.step3Title"), text: t("home.step3Text") },
            ].map((s, i) => (
              <div key={i} className="card card-pad step">
                <div className="step-num" style={{ background: STEP_COLORS[i] }}>
                  {i + 1}
                </div>
                <h3>{s.title}</h3>
                <p className="muted" style={{ marginTop: 8 }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="featured-title">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 id="featured-title">{t("home.featuredTitle")}</h2>
              <p>{t("home.featuredSubtitle")}</p>
            </div>
            <Link href="/equipment" className="btn btn-outline">
              {t("common.seeAll")}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-4">
            {featured.map((d, i) => (
              <ProductCard key={d.product.id} data={d} tone={toneFor(i)} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-surface" aria-labelledby="delivery-title">
        <div className="container grid grid-2" style={{ alignItems: "center", gap: 48 }}>
          <div>
            <span className="eyebrow">
              <Wrench size={16} aria-hidden="true" />
              {t("nav.delivery")}
            </span>
            <h2 id="delivery-title" style={{ marginTop: 10 }}>
              {t("home.deliveryTitle")}
            </h2>
            <p className="muted" style={{ marginTop: 12, maxWidth: 520 }}>
              {t("home.deliveryText")}
            </p>
            <ul className="check-list" style={{ marginTop: 22 }}>
              {[t("home.deliveryPoint1"), t("home.deliveryPoint2"), t("home.deliveryPoint3")].map((p) => (
                <li key={p}>
                  <CheckCircle2 size={20} aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 26 }}>
              <Link href="/delivery" className="btn btn-primary">
                {t("home.deliveryCta")}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="card card-pad" style={{ display: "grid", gap: 14 }}>
            {[
              { icon: Truck, tone: "blue" as const, label: t("delivery.feeTitle"), value: t("delivery.feeText") },
              { icon: Wrench, tone: "green" as const, label: t("delivery.installTitle"), value: t("delivery.installText") },
              { icon: ClipboardCheck, tone: "red" as const, label: t("delivery.timeTitle"), value: t("delivery.timeText") },
            ].map((item) => (
              <div key={item.label} className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                <span className={`icon-tile tone-${item.tone}`} aria-hidden="true">
                  <item.icon size={22} />
                </span>
                <div>
                  <h3 style={{ fontSize: "1rem" }}>{item.label}</h3>
                  <p className="muted" style={{ fontSize: "0.92rem", marginTop: 4 }}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-label={t("home.bandTitle")}>
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>{t("home.bandTitle")}</h2>
              <p>{t("home.bandText")}</p>
            </div>
            <div className="row">
              <Link href="/plan" className="btn btn-success">
                <Users size={18} aria-hidden="true" />
                {t("nav.plan")}
              </Link>
              <Link href="/equipment" className="btn btn-on-dark">
                <Globe2 size={18} aria-hidden="true" />
                {t("nav.browse")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

