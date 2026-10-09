"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Calendar, LogOut, Menu, ShoppingCart, Truck, User, Wrench, X, LayoutDashboard, Store, ShieldCheck, ClipboardList, Search } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { useSessionUser } from "./SessionProvider";
import { useCartCount } from "@/lib/cart-store";
import { useToast } from "./Toaster";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Search;
  match: (path: string) => boolean;
}

export function SiteHeader() {
  const { t } = useLang();
  const user = useSessionUser();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const toast = useToast();
  const cartCount = useCartCount();
  const [open, setOpen] = useState(false);

  const nav: NavItem[] = [
    { href: "/", label: t("nav.home"), icon: Store, match: (p) => p === "/" },
    { href: "/equipment", label: t("nav.browse"), icon: Search, match: (p) => p.startsWith("/equipment") },
    { href: "/plan", label: t("nav.plan"), icon: Calendar, match: (p) => p.startsWith("/plan") },
    { href: "/bookings", label: t("nav.bookings"), icon: ClipboardList, match: (p) => p.startsWith("/bookings") },
    { href: "/delivery", label: t("nav.delivery"), icon: Truck, match: (p) => p.startsWith("/delivery") },
  ];

  const dashboard = user
    ? user.role === "admin"
      ? { href: "/admin", label: t("nav.admin"), icon: ShieldCheck }
      : user.role === "vendor"
        ? { href: "/vendor", label: t("nav.vendor"), icon: Wrench }
        : { href: "/bookings", label: t("nav.bookings"), icon: LayoutDashboard }
    : null;

  async function signOut() {
    setOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.show(t("toast.loggedOut"));
      router.push("/");
      router.refresh();
    } catch {
      toast.show(t("toast.networkError"), "error");
    }
  }

  return (
    <header className="site-header">
      <a href="#main" className="skip-link">
        {t("nav.skip")}
      </a>
      <div className="topbar" aria-hidden={false}>
        <div className="container">
          <span className="topbar-dot">
            <span className="dot dot-red" />
            <span className="dot dot-blue" />
            <span className="dot dot-green" />
            <span style={{ marginLeft: 8 }}>{t("brand.tagline")}</span>
          </span>
          <span className="hide-md">{t("footer.hours")}</span>
        </div>
      </div>
      <div className="container header-inner">
        <Logo />
        <nav className="main-nav" aria-label={t("nav.mainNav")}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.match(pathname) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <LanguageSwitcher />
          <Link href="/cart" className="cart-link" aria-label={`${t("nav.cart")} (${cartCount})`}>
            <ShoppingCart size={18} aria-hidden="true" />
            <span className="cart-label">{t("nav.cart")}</span>
            {cartCount > 0 && <span className="cart-count" aria-hidden="true">{cartCount}</span>}
          </Link>
          {user ? (
            <div className="row hide-md" style={{ gap: 6 }}>
              {dashboard && (
                <Link href={dashboard.href} className="btn btn-outline btn-sm">
                  <User size={16} aria-hidden="true" />
                  <span>{user.name.split(" ")[0]}</span>
                </Link>
              )}
              <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
                <LogOut size={16} aria-hidden="true" />
                {t("nav.signOut")}
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm hide-md">
              {t("nav.signIn")}
            </Link>
          )}
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`}>
        <div className="container">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={item.match(pathname) ? "page" : undefined}>
              <item.icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          ))}
          <Link href="/cart" onClick={() => setOpen(false)}>
            <ShoppingCart size={18} aria-hidden="true" />
            {t("nav.cart")} {cartCount > 0 ? `(${cartCount})` : ""}
          </Link>
          {user ? (
            <>
              {dashboard && (
                <Link href={dashboard.href} onClick={() => setOpen(false)}>
                  <dashboard.icon size={18} aria-hidden="true" />
                  {dashboard.label}
                </Link>
              )}
              <button type="button" onClick={signOut}>
                <LogOut size={18} aria-hidden="true" />
                {t("nav.signOut")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>
                <User size={18} aria-hidden="true" />
                {t("nav.signIn")}
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <User size={18} aria-hidden="true" />
                {t("nav.register")}
              </Link>
            </>
          )}
          <div style={{ padding: "16px 0 20px" }}>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}

