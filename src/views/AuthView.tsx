"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn, UserPlus, ShieldCheck, Store, ShoppingBag } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { useToast } from "@/components/Toaster";
import { homeForRole } from "@/lib/roles";
import type { ErrorCode } from "@/lib/errors";
import type { PublicUser } from "@/lib/types";

const DEMO = [
  { key: "demoCustomer", email: "customer@festivo.uz", password: "customer123", icon: ShoppingBag, tone: "tone-blue" },
  { key: "demoVendor", email: "vendor1@festivo.uz", password: "vendor123", icon: Store, tone: "tone-green" },
  { key: "demoAdmin", email: "admin@festivo.uz", password: "admin123", icon: ShieldCheck, tone: "tone-red" },
] as const;

export function AuthView({ mode, next }: { mode: "login" | "register"; next: string }) {
  const { t, errorText } = useLang();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ code: ErrorCode; field?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  const errText = (code: ErrorCode) => errorText(code);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = isLogin ? { email, password } : { name, email, phone, password };
      const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { user?: PublicUser; error?: ErrorCode; field?: string };
      if (!res.ok || !data.user) {
        setError({ code: data.error ?? "generic", field: data.field });
        return;
      }
      toast.show(isLogin ? t("auth.welcome", { name: data.user.name }) : t("toast.registered"));
      router.push(next || homeForRole(data.user.role));
      router.refresh();
    } catch {
      setError({ code: "generic" });
    } finally {
      setLoading(false);
    }
  }

  function fill(d: (typeof DEMO)[number]) {
    setEmail(d.email);
    setPassword(d.password);
    setError(null);
  }

  return (
    <section className="container auth-layout">
      <div>
        <span className="eyebrow">{isLogin ? t("nav.signIn") : t("nav.register")}</span>
        <h1 style={{ marginTop: 10 }}>{isLogin ? t("auth.loginTitle") : t("auth.registerTitle")}</h1>
        <p className="muted" style={{ marginTop: 12, maxWidth: 520 }}>
          {isLogin ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
        </p>
        {isLogin && (
          <div style={{ marginTop: 32, maxWidth: 520 }}>
            <h2 style={{ fontSize: "1.05rem" }}>{t("auth.demoTitle")}</h2>
            <p className="hint" style={{ margin: "4px 0 12px" }}>
              {t("auth.demoText")}
            </p>
            <div className="demo-list">
              {DEMO.map((d) => (
                <button key={d.email} type="button" className="demo-item" onClick={() => fill(d)}>
                  <span className={`icon-tile ${d.tone}`} style={{ width: 38, height: 38, borderRadius: 11 }} aria-hidden="true">
                    <d.icon size={18} />
                  </span>
                  <span>
                    <strong>{t(`auth.${d.key}`)}</strong>
                    <br />
                    <code>{d.email}</code>
                  </span>
                  <code>{d.password}</code>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form className="card auth-card" onSubmit={submit} noValidate>
        {error && (
          <div className="form-error" role="alert">
            {errText(error.code)}
          </div>
        )}
        {!isLogin && (
          <div className="field">
            <label className="label" htmlFor="auth-name">
              {t("auth.name")}
            </label>
            <input id="auth-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={error?.field === "name" || undefined} required />
          </div>
        )}
        <div className="field">
          <label className="label" htmlFor="auth-email">
            {t("auth.email")}
          </label>
          <input
            id="auth-email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error?.field === "email" || undefined}
            required
          />
        </div>
        {!isLogin && (
          <div className="field">
            <label className="label" htmlFor="auth-phone">
              {t("auth.phone")}
            </label>
            <input
              id="auth-phone"
              className="input"
              type="tel"
              autoComplete="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={error?.field === "phone" || undefined}
              required
            />
          </div>
        )}
        <div className="field">
          <label className="label" htmlFor="auth-password">
            {t("auth.password")}
          </label>
          <input
            id="auth-password"
            className="input"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error?.field === "password" || undefined}
            required
          />
          {!isLogin && <span className="hint">{t("auth.passwordHelp")}</span>}
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {isLogin ? <LogIn size={18} aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}
          {loading ? (isLogin ? t("auth.signingIn") : t("auth.creating")) : isLogin ? t("auth.signInButton") : t("auth.registerButton")}
        </button>
        <p className="muted" style={{ textAlign: "center", fontSize: "0.95rem" }}>
          {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <Link href={`${isLogin ? "/register" : "/login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`} style={{ fontWeight: 650 }}>
            {isLogin ? t("auth.goRegister") : t("auth.goLogin")}
          </Link>
        </p>
      </form>
    </section>
  );
}
