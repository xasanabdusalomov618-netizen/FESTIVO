"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, CalendarDays, ChevronDown, ChevronUp, MapPin, Phone, Truck, XCircle, PackageCheck, ArrowRight, Mail } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toaster";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import type { AppNotification, Booking, PublicUser } from "@/lib/types";

interface Props {
  user: PublicUser;
  bookings: Booking[];
  notifications: AppNotification[];
}

const ACTIVE = new Set(["pending", "confirmed", "delivering", "installed"]);

export function BookingsView({ user, bookings, notifications }: Props) {
  const { t, text, currency, lang, errorText } = useLang();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const unread = notifications.filter((n) => !n.read).length;

  async function cancel(b: Booking) {
    if (!window.confirm(t("bookings.cancelConfirm"))) return;
    setBusy(b.id);
    try {
      const res = await fetch(`/api/bookings/${b.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.show(errorText(data.error), "error");
        return;
      }
      toast.show(t("bookings.cancelled"));
      router.refresh();
    } catch {
      toast.show(t("toast.networkError"), "error");
    } finally {
      setBusy(null);
    }
  }

  async function markRead() {
    await fetch("/api/notifications/read", { method: "POST" });
    toast.show(t("toast.notificationsRead"));
    router.refresh();
  }

  const openCount = bookings.filter((b) => ACTIVE.has(b.status)).length;
  const deliveringCount = bookings.filter((b) => b.status === "delivering").length;
  const fmt = (n: number) => `${formatMoney(n)} ${currency}`;

  return (
    <>
      <section className="page-head">
        <div className="container dash-head" style={{ marginBottom: 0 }}>
          <div>
            <h1>{t("bookings.title")}</h1>
            <p>{t("bookings.subtitle")}</p>
          </div>
          <Link href="/equipment" className="btn btn-primary">
            {t("bookings.emptyCta")}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="kpis" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <div className="card kpi">
              <span className="icon-tile tone-blue" aria-hidden="true">
                <PackageCheck size={20} />
              </span>
              <b>{bookings.length}</b>
              <span>{t("bookings.title")}</span>
            </div>
            <div className="card kpi">
              <span className="icon-tile tone-green" aria-hidden="true">
                <CalendarDays size={20} />
              </span>
              <b>{openCount}</b>
              <span>{t("bookings.open")}</span>
            </div>
            <div className="card kpi">
              <span className="icon-tile tone-red" aria-hidden="true">
                <Truck size={20} />
              </span>
              <b>{deliveringCount}</b>
              <span>{t("bookings.deliveries")}</span>
            </div>
          </div>

          <div className="dash-layout">
            <div>
              {bookings.length === 0 ? (
                <div className="empty-state">
                  <PackageCheck size={40} aria-hidden="true" color="#3B82F6" />
                  <h2 style={{ fontSize: "1.25rem", marginTop: 14 }}>{t("bookings.empty")}</h2>
                  <p className="muted" style={{ marginTop: 6 }}>
                    {t("bookings.emptyText")}
                  </p>
                  <div style={{ marginTop: 20 }}>
                    <Link href="/equipment" className="btn btn-primary">
                      {t("bookings.emptyCta")}
                    </Link>
                  </div>
                </div>
              ) : (
                bookings.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    busy={busy === b.id}
                    onCancel={() => cancel(b)}
                    fmt={fmt}
                    name={(id: string) => id}
                    text={text}
                    t={t}
                    lang={lang}
                  />
                ))
              )}
            </div>

            <aside className="stack" style={{ gap: 20 }}>
              <section className="card panel" aria-labelledby="notif-title">
                <div className="panel-head">
                  <h2 id="notif-title" style={{ fontSize: "1.05rem", display: "flex", gap: 8, alignItems: "center" }}>
                    <Bell size={18} aria-hidden="true" />
                    {t("bookings.notifications")}
                    {unread > 0 && <span className="badge badge-red">{unread}</span>}
                  </h2>
                  {unread > 0 && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={markRead}>
                      {t("bookings.markAllRead")}
                    </button>
                  )}
                </div>
                <div className="panel-body">
                  {notifications.length === 0 ? (
                    <p className="muted">{t("bookings.noNotifications")}</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`notif ${n.read ? "" : "is-unread"}`}>
                        <span className="notif-dot" aria-hidden="true" />
                        <div>
                          <strong>
                            {n.kind === "booking_created"
                              ? t("bookings.newBooking", { code: n.bookingCode })
                              : t("bookings.statusChanged", { code: n.bookingCode, status: t(`status.${n.status}`) })}
                          </strong>
                          <small>
                            {!n.read && <span className="badge badge-red" style={{ marginRight: 6 }}>{t("bookings.unread")}</span>}
                            {formatDate(n.createdAt.slice(0, 10))}
                          </small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="card card-pad" aria-labelledby="profile-title">
                <h2 id="profile-title" style={{ fontSize: "1.05rem" }}>
                  {t("bookings.profile")}
                </h2>
                <p className="hint" style={{ margin: "4px 0 14px" }}>
                  {t("bookings.profileText")}
                </p>
                <dl className="kv" style={{ gridTemplateColumns: "1fr", gap: 4 }}>
                  <dd style={{ fontWeight: 700, fontSize: "1.05rem" }}>{user.name}</dd>
                  <dd className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                    <Phone size={16} aria-hidden="true" /> {user.phone}
                  </dd>
                  <dd className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                    <Mail size={16} aria-hidden="true" /> {user.email}
                  </dd>
                </dl>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

function BookingCard({
  booking,
  busy,
  onCancel,
  fmt,
  text,
  t,
}: {
  booking: Booking;
  busy: boolean;
  onCancel: () => void;
  fmt: (n: number) => string;
  name: (id: string) => string;
  text: (v: Booking["lines"][number]["nameSnapshot"]) => string;
  t: ReturnType<typeof useLang>["t"];
  lang: string;
}) {
  const [open, setOpen] = useState(false);
  const dates = Array.from(new Set(booking.lines.map((l) => l.eventDate))).sort();
  return (
    <article className="card booking-card" aria-labelledby={`bk-${booking.id}`}>
      <div className="booking-head">
        <div>
          <h2 id={`bk-${booking.id}`} style={{ fontSize: "1.15rem" }}>
            {t("bookings.code")} {booking.code}
          </h2>
          <span className="hint">
            {t("bookings.created")}: {formatDate(booking.createdAt.slice(0, 10))}
          </span>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="booking-meta">
        <div>
          <span>{t("bookings.eventDate")}</span>
          {dates.map((d) => formatDate(d)).join(", ")}
        </div>
        <div>
          <span>{t("bookings.total")}</span>
          <strong>{fmt(booking.total)}</strong>
        </div>
        <div>
          <span>{t("bookings.payment")}</span>
          {t(booking.paymentMethod === "cash" ? "checkout.paymentCash" : "checkout.paymentTransfer")}
        </div>
      </div>

      <div className="line-list" aria-label={t("bookings.items")}>
        {booking.lines.map((l, i) => (
          <div key={`${l.productId}-${i}`}>
            <span>
              {t("bookings.lineQty", { qty: l.qty, name: text(l.nameSnapshot) })} · {l.days} {t("common.days")}
              {l.delivery ? ` · ${t("cart.deliveryShort")}` : ""}
              {l.installation ? ` · ${t("cart.installShort")}` : ""}
            </span>
            <strong>{fmt(l.lineTotal)}</strong>
          </div>
        ))}
      </div>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
            {open ? t("bookings.hideDetails") : t("bookings.showDetails")}
          </button>
          {booking.status === "pending" && (
            <button type="button" className="btn btn-danger btn-sm" onClick={onCancel} disabled={busy}>
              <XCircle size={16} aria-hidden="true" />
              {t("bookings.cancel")}
            </button>
          )}
        </div>
        {booking.status === "pending" && <span className="hint">{t("bookings.cancelHint")}</span>}
      </div>

      {open && (
        <div className="stack" style={{ gap: 14, paddingTop: 6 }}>
          <div className="booking-meta">
            <div>
              <span>{t("common.name")}</span>
              {booking.customer.fullName}
            </div>
            <div>
              <span>{t("common.phone")}</span>
              {booking.customer.phone}
            </div>
            <div>
              <span>{t("bookings.deliveryTo")}</span>
              <MapPin size={14} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> {booking.customer.address}
            </div>
          </div>
          {booking.customer.notes && <p className="muted">{booking.customer.notes}</p>}
          <div>
            <h3 style={{ fontSize: "0.95rem", marginBottom: 8 }}>{t("bookings.timeline")}</h3>
            <ol className="timeline">
              {booking.history.map((h, i) => (
                <li key={`${h.status}-${i}`} className={h.status === "cancelled" ? "is-cancelled" : h.status === "completed" || h.status === "installed" ? "is-done" : ""}>
                  <div>
                    <strong>{t(`status.${h.status}`)}</strong>
                    <span className="hint" style={{ marginLeft: 8 }}>
                      {formatDate(h.at.slice(0, 10))}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <span className="hint">{t("bookings.orderSummary")}:</span>
            <span className="badge badge-neutral">
              {t("common.subtotal")} {fmt(booking.subtotal)}
            </span>
            <span className="badge badge-neutral">
              {t("common.delivery")} {fmt(booking.deliveryTotal)}
            </span>
            <span className="badge badge-neutral">
              {t("common.installation")} {fmt(booking.installationTotal)}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
