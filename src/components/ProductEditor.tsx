"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { useToast } from "./Toaster";
import type { Product } from "@/lib/types";
import type { ErrorCode } from "@/lib/errors";

interface Draft {
  pricePerDay: string;
  deliveryFee: string;
  installFee: string;
  stock: string;
  active: boolean;
}

/** Inline editor for a listing: price, fees, stock and visibility. */
export function ProductEditor({ product, showActive = false, showInstall = true }: { product: Product; showActive?: boolean; showInstall?: boolean }) {
  const { t, text, errorText } = useLang();
  const router = useRouter();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>({
    pricePerDay: String(product.pricePerDay),
    deliveryFee: String(product.deliveryFee),
    installFee: String(product.installFee),
    stock: String(product.stock),
    active: product.active,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const dirty =
    draft.pricePerDay !== String(product.pricePerDay) ||
    draft.deliveryFee !== String(product.deliveryFee) ||
    draft.installFee !== String(product.installFee) ||
    draft.stock !== String(product.stock) ||
    draft.active !== product.active;

  async function save() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pricePerDay: Number(draft.pricePerDay),
          deliveryFee: Number(draft.deliveryFee),
          installFee: Number(draft.installFee),
          stock: Number(draft.stock),
          active: draft.active,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: ErrorCode };
        setError(errorText(data.error));
        return;
      }
      toast.show(t("vendor.saved"));
      router.refresh();
    } catch {
      setError(t("toast.networkError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row-edit">
        <label className="sr-only" htmlFor={`price-${product.id}`}>
          {t("vendor.pricePerDay")} – {text(product.name)}
        </label>
        <input id={`price-${product.id}`} className="input num-input" inputMode="numeric" value={draft.pricePerDay} onChange={(e) => setDraft({ ...draft, pricePerDay: e.target.value.replace(/\D/g, "") })} aria-label={t("vendor.pricePerDay")} />
        <input className="input num-input" inputMode="numeric" value={draft.deliveryFee} onChange={(e) => setDraft({ ...draft, deliveryFee: e.target.value.replace(/\D/g, "") })} aria-label={t("vendor.deliveryFee")} />
        {showInstall && (
          <input
            className="input num-input"
            inputMode="numeric"
            value={draft.installFee}
            disabled={!product.installable}
            onChange={(e) => setDraft({ ...draft, installFee: e.target.value.replace(/\D/g, "") })}
            aria-label={t("vendor.installFee")}
            title={product.installable ? undefined : t("vendor.notInstallable")}
          />
        )}
        <input className="input num-input" style={{ width: 90 }} inputMode="numeric" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value.replace(/\D/g, "") })} aria-label={t("vendor.stock")} />
        {showActive && (
          <label className="switch">
            <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
            {t("admin.activeToggle")}
          </label>
        )}
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={!dirty || saving}>
          <Save size={15} aria-hidden="true" />
          {t("vendor.saveRow")}
        </button>
      </div>
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
