"use client";

import Link from "next/link";
import { useLang } from "@/i18n/LanguageProvider";

export function NotFoundView() {
  const { t } = useLang();
  return (
    <section className="section">
      <div className="container">
        <div className="empty-state" style={{ maxWidth: 560, margin: "0 auto" }}>
          <span className="eyebrow">404</span>
          <h1 style={{ fontSize: "1.8rem", marginTop: 8 }}>{t("notFound.title")}</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            {t("notFound.text")}
          </p>
          <div style={{ marginTop: 20 }}>
            <Link href="/" className="btn btn-primary">
              {t("notFound.cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
