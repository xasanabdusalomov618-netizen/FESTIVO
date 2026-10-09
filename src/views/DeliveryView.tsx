"use client";

import Link from "next/link";
import { CalendarClock, Clock, Route, ShieldCheck, Truck, Wrench, Bell, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

export function DeliveryView() {
  const { t } = useLang();
  const blocks = [
    { id: "delivery", icon: Truck, tone: "tone-blue", title: t("delivery.howTitle"), text: t("delivery.howText") },
    { id: "fees", icon: Route, tone: "tone-green", title: t("delivery.feeTitle"), text: t("delivery.feeText") },
    { id: "install", icon: Wrench, tone: "tone-red", title: t("delivery.installTitle"), text: t("delivery.installText") },
    { id: "times", icon: Clock, tone: "tone-blue", title: t("delivery.timeTitle"), text: t("delivery.timeText") },
  ];
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>{t("delivery.title")}</h1>
          <p>{t("delivery.subtitle")}</p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container grid grid-2">
          {blocks.map((b) => (
            <article key={b.id} id={b.id} className="card info-card" style={{ scrollMarginTop: 100 }}>
              <span className={`icon-tile ${b.tone}`} aria-hidden="true">
                <b.icon size={22} />
              </span>
              <h2 style={{ fontSize: "1.2rem" }}>{b.title}</h2>
              <p>{b.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container grid grid-2" style={{ alignItems: "start" }}>
          <article id="policy" className="card info-card" style={{ scrollMarginTop: 100 }}>
            <span className="icon-tile tone-green" aria-hidden="true">
              <ShieldCheck size={22} />
            </span>
            <h2 style={{ fontSize: "1.2rem" }}>{t("delivery.policyTitle")}</h2>
            <p>{t("delivery.policyText")}</p>
          </article>
          <article className="card info-card">
            <span className="icon-tile tone-blue" aria-hidden="true">
              <Bell size={22} />
            </span>
            <h2 style={{ fontSize: "1.2rem" }}>{t("bookings.notifications")}</h2>
            <ul className="check-list">
              <li>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{t("delivery.tracking")}</span>
              </li>
              <li>
                <CalendarClock size={18} aria-hidden="true" />
                <span>{t("product.eventDateHelp")}</span>
              </li>
            </ul>
            <div>
              <Link href="/equipment" className="btn btn-primary">
                {t("delivery.cta")}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
