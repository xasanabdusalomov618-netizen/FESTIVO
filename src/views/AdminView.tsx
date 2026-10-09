"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Boxes, ClipboardList, Clock, Store, Users, Wallet } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { StatusBadge } from "@/components/StatusBadge";
import { ProductEditor } from "@/components/ProductEditor";
import { useToast } from "@/components/Toaster";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import { formatPhone } from "@/lib/validation";
import type { Booking, BookingStatus, Category, Product, PublicUser, Vendor } from "@/lib/types";
import type { ErrorCode } from "@/lib/errors";

interface Props {
  isAdmin: boolean;
  bookings: Booking[];
  users: PublicUser[];
  products: Product[];
  vendors: Vendor[];
  categories: Category[];
}

const STATUSES: BookingStatus[] = ["pending", "confirmed", "delivering", "installed", "completed", "cancelled"];

export function AdminView({ isAdmin, bookings, users, products, vendors, categories }: Props) {
  const { t, text, currency, errorText } = useLang();
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState("all");

  const vendorName = useMemo(() => new Map(vendors.map((v) => [v.id, v.name])), [vendors]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  if (!isAdmin) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state" style={{ maxWidth: 620, margin: "0 auto" }}>
            <h1 style={{ fontSize: "1.5rem" }}>{t("admin.title")}</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              {t("admin.notAdmin")}
            </p>
            <div style={{ marginTop: 20 }}>
              <Link href="/" className="btn btn-primary">
                {t("nav.home")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const fmt = (n: number) => `${formatMoney(n)} ${currency}`;
  const countable = bookings.filter((b) => b.status !== "cancelled");
  const revenue = countable.reduce((s, b) => s + b.total, 0);
  const pending = bookings.filter((b) => b.status === "pending").length;
  const shown = bookings.filter((b) => filter === "all" || b.status === filter);

  async function setStatus(id: string, status: BookingStatus) {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: ErrorCode };
      toast.show(errorText(data.error), "error");
      return;
    }
    toast.show(t("admin.statusSaved"));
    router.refresh();
  }

  return (
    <>
      <section className="page-head">
        <div className="container dash-head" style={{ marginBottom: 0 }}>
          <div>
            <h1>{t("admin.title")}</h1>
            <p>{t("admin.subtitle")}</p>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="kpis">
            <div className="card kpi">
              <span className="icon-tile tone-blue" aria-hidden="true">
                <ClipboardList size={20} />
              </span>
              <b>{bookings.length}</b>
              <span>{t("admin.statBookings")}</span>
            </div>
            <div className="card kpi">
              <span className="icon-tile tone-navy" aria-hidden="true">
                <Wallet size={20} />
              </span>
              <b style={{ fontSize: "1.2rem" }}>{fmt(revenue)}</b>
              <span>{t("admin.statRevenue")}</span>
            </div>
            <div className="card kpi">
              <span className="icon-tile tone-red" aria-hidden="true">
                <Clock size={20} />
              </span>
              <b>{pending}</b>
              <span>{t("admin.statPending")}</span>
            </div>
            <div className="card kpi">
              <span className="icon-tile tone-green" aria-hidden="true">
                <Users size={20} />
              </span>
              <b>{users.length}</b>
              <span>{t("admin.statUsers")}</span>
            </div>
          </div>

          <section className="card panel" style={{ marginBottom: 26 }} aria-labelledby="admin-bookings">
            <div className="panel-head">
              <h2 id="admin-bookings" style={{ fontSize: "1.15rem" }}>
                {t("admin.bookingsTitle")}
              </h2>
              <div className="row">
                <label className="sr-only" htmlFor="admin-filter">
                  {t("admin.filterStatus")}
                </label>
                <select id="admin-filter" className="select select-compact" value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">{t("admin.allStatuses")}</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`status.${s}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {shown.length === 0 ? (
              <div className="panel-body muted">{t("admin.noBookings")}</div>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th scope="col">{t("bookings.code")}</th>
                      <th scope="col">{t("admin.customer")}</th>
                      <th scope="col">{t("vendor.dates")}</th>
                      <th scope="col">{t("admin.vendorName")}</th>
                      <th scope="col" className="num">{t("bookings.total")}</th>
                      <th scope="col">{t("common.status")}</th>
                      <th scope="col">{t("admin.setStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((b) => {
                      const dates = Array.from(new Set(b.lines.map((l) => l.eventDate))).sort();
                      const vendorsOnOrder = Array.from(new Set(b.lines.map((l) => vendorName.get(l.vendorId) ?? "")));
                      return (
                        <tr key={b.id}>
                          <td>
                            <strong>{b.code}</strong>
                            <div className="hint">{formatDate(b.createdAt.slice(0, 10))}</div>
                          </td>
                          <td>
                            {b.customer.fullName}
                            <div className="hint">{b.customer.phone}</div>
                          </td>
                          <td>{dates.map((d) => formatDate(d)).join(", ")}</td>
                          <td>{vendorsOnOrder.join(", ")}</td>
                          <td className="num">
                            <strong>{fmt(b.total)}</strong>
                          </td>
                          <td>
                            <StatusBadge status={b.status} />
                          </td>
                          <td>
                            <select className="select select-compact" aria-label={`${t("admin.setStatus")} ${b.code}`} value={b.status} onChange={(e) => setStatus(b.id, e.target.value as BookingStatus)}>
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {t(`status.${s}`)}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="dash-layout dash-split">
            <section className="card panel" aria-labelledby="admin-users">
              <div className="panel-head">
                <h2 id="admin-users" style={{ fontSize: "1.15rem" }}>
                  {t("admin.usersTitle")}
                </h2>
                <span className="badge badge-neutral">{users.length}</span>
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th scope="col">{t("common.name")}</th>
                      <th scope="col">{t("common.email")}</th>
                      <th scope="col">{t("admin.role")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                          <div className="hint">{formatPhone(u.phone)}</div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === "admin" ? "badge-navy" : u.role === "vendor" ? "badge-green" : "badge-blue"}`}>
                            {t(u.role === "admin" ? "admin.roleAdmin" : u.role === "vendor" ? "admin.roleVendor" : "admin.roleCustomer")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card panel" aria-labelledby="admin-vendors">
              <div className="panel-head">
                <h2 id="admin-vendors" style={{ fontSize: "1.15rem" }}>
                  {t("admin.statVendors")}
                </h2>
                <Store size={18} aria-hidden="true" />
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th scope="col">{t("common.name")}</th>
                      <th scope="col">{t("common.city")}</th>
                      <th scope="col">{t("common.rating")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <strong>{v.name}</strong>
                        </td>
                        <td>{text(v.city)}</td>
                        <td>★ {v.rating.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="card panel" style={{ marginTop: 26 }} aria-labelledby="admin-products">
            <div className="panel-head">
              <div>
                <h2 id="admin-products" style={{ fontSize: "1.15rem", display: "flex", gap: 8, alignItems: "center" }}>
                  <Boxes size={18} aria-hidden="true" />
                  {t("admin.productsTitle")}
                </h2>
                <p>{t("vendor.listingsText")}</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th scope="col">{t("vendor.item")}</th>
                    <th scope="col">{t("common.category")}</th>
                    <th scope="col">{t("common.vendor")}</th>
                    <th scope="col">{t("vendor.pricePerDay")} · {t("vendor.deliveryFee")} · {t("vendor.installFee")} · {t("vendor.stock")}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{text(p.name)}</strong>
                        <div className="hint">{p.active ? t("common.active") : t("common.inactive")}</div>
                      </td>
                      <td>{categoryById.get(p.categoryId) ? text(categoryById.get(p.categoryId)!.name) : "—"}</td>
                      <td>{vendorName.get(p.vendorId)}</td>
                      <td style={{ minWidth: 360 }}>
                        <ProductEditor product={p} showActive />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
