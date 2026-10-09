"use client";

import Link from "next/link";
import { Mail, MapPin, Clock } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { Logo } from "./Logo";

export function SiteFooter() {
  const { t } = useLang();
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p style={{ marginTop: 14, maxWidth: 360 }}>{t("footer.tagline")}</p>
          </div>
          <div>
            <h3>{t("footer.shop")}</h3>
            <Link href="/equipment">{t("nav.browse")}</Link>
            <Link href="/plan">{t("nav.plan")}</Link>
            <Link href="/bookings">{t("nav.bookings")}</Link>
            <Link href="/delivery">{t("nav.delivery")}</Link>
          </div>
          <div>
            <h3>{t("footer.help")}</h3>
            <Link href="/delivery#policy">{t("footer.terms")}</Link>
            <Link href="/delivery#delivery">{t("footer.support")}</Link>
            <Link href="/cart">{t("nav.cart")}</Link>
          </div>
          <div>
            <h3>{t("footer.contact")}</h3>
            <div className="footer-list">
              <span>
                <Mail size={16} aria-hidden="true" /> <a href="mailto:support@festivo.uz">support@festivo.uz</a>
              </span>
              <span>
                <MapPin size={16} aria-hidden="true" /> {t("footer.address")}
              </span>
              <span>
                <Clock size={16} aria-hidden="true" /> {t("footer.hours")}
              </span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {year} FESTIVO. {t("footer.rights")}
          </span>
          <span>{t("footer.languages")}</span>
        </div>
      </div>
    </footer>
  );
}
