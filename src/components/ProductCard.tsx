"use client";

import Link from "next/link";
import { useLang } from "@/i18n/LanguageProvider";
import type { Category, Product, Vendor } from "@/lib/types";
import { categoryIcon, type Tone } from "./icons";
import { Package, ArrowRight } from "lucide-react";

export interface ProductCardData {
  product: Product;
  category?: Category;
  vendor?: Vendor;
}

export function ProductCard({ data, tone = "blue", onAdd }: { data: ProductCardData; tone?: Tone; onAdd?: () => void }) {
  const { t, text, money, currency } = useLang();
  const { product, category, vendor } = data;
  const Icon = category ? categoryIcon(category.icon) : Package;
  const toneBg = tone === "green" ? "tone-green" : tone === "red" ? "tone-red" : "tone-blue";
  const outOfStock = product.stock <= 0;

  return (
    <article className="card card-hover product-card">
      <div className="product-media" style={{ background: "#f8fafc" }}>
        <div className="icon-large" aria-hidden="true">
          <span className={`icon-tile ${toneBg}`} style={{ width: 56, height: 56, borderRadius: 16 }}>
            <Icon size={28} />
          </span>
        </div>
      </div>
      <div className="product-body">
        <div className="product-badges-inline">
          {product.featured && <span className="badge badge-navy">{t("catalog.featured")}</span>}
          {product.installable && <span className="badge badge-green">{t("catalog.installable")}</span>}
        </div>
        <span className="hint">{category ? text(category.name) : ""}</span>
        <h3>
          <Link href={`/equipment/${product.slug}`}>{text(product.name)}</Link>
        </h3>
        <p className="product-desc">{text(product.description)}</p>
        <div className="row" style={{ gap: 8 }}>
          {outOfStock ? (
            <span className="badge badge-red">{t("catalog.outOfStock")}</span>
          ) : product.stock <= 3 ? (
            <span className="badge badge-blue">{t("catalog.lowStock", { count: product.stock })}</span>
          ) : (
            <span className="badge badge-green badge-dot">{t("catalog.inStock")}</span>
          )}
          {vendor && <span className="hint">{vendor.name}</span>}
        </div>
        <div className="product-foot">
          <div>
            <div className="price">
              {money(product.pricePerDay)} {currency}
              <small>{t("common.perDay")}</small>
            </div>
            {product.deliveryFee > 0 && (
              <div className="hint">{t("catalog.deliveryFrom", { price: `${money(product.deliveryFee)} ${currency}` })}</div>
            )}
          </div>
          {onAdd ? (
            <button type="button" className="btn btn-success btn-sm" onClick={onAdd} disabled={outOfStock}>
              {t("catalog.addToCart")}
            </button>
          ) : (
            <Link href={`/equipment/${product.slug}`} className="btn btn-primary btn-sm">
              {t("common.view")} <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
