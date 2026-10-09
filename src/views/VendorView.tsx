"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boxes, ClipboardList, Package, Wallet, ArrowRight } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { StatusBadge } from "@/components/StatusBadge";
import { ProductEditor } from "@/components/ProductEditor";
import { useToast } from "@/components/Toaster";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import type { BookingLine, BookingStatus, Product } from "@/lib/types";
import type { ErrorCode } from "@/lib/errors";

export interface VendorOrder {
  id: string;
  code: string;
  status: BookingStatus;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  address: string;
  lines: BookingLine[];
  vendorTotal: number;
  counted: boolean;
}

interface Props {
  isVendor: boolean;
  vendorName: string;
  products: Product[];
  orders: VendorOrder[];
}

const VENDOR_STATUSES: BookingStatus[] = ["confirmed", "delivering", "installed", "completed", "cancelled"];

export function VendorView({ isVendor, vendorName, products, orders }: Props) {
  const { t, text, currency, errorText } = useLang();
  const router = useRouter();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  if (!isVendor) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state" style={{ maxWidth: 620, margin: "0 auto" }}>
            <h1 style={{ fontSize: "1.5rem" }}>{t("vendor.title")}</h1>
            <p className="muted" style={{ marginTop: 8 }}>
              {t("vendor.notVendor")}
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

  const active = products.filter((p) => p.active).length;
  const openOrders = orders.filter((o) => o.status === "pending" || o.status === "confirmed" || o.status === "delivering" || o.status === "installed").length;
  const revenue = orders.filter((o) => o.counted).reduce((s, o) => s + o.vendorTotal, 0);
  const shown = orders.filter((o) => statusFilter === "all" || o.status === statusFilter);

  async function setStatus(orderId: string, status: BookingStatus) {
    const res = await fetch(`/api/bookings/${orderId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: ErrorCode };
      toast.show(errorText(data.error), "error");
      return;
    }
    toast.show(t("vendor.statusSaved"));
    router.refresh();
  }

  const fmt = (n: number) => `${formatMoney(n)} ${currency}`;

  return (
    <>
      <section className="page-head">
        <div className="container dash-head" style={{ marginBottom: 0 }}>
          <div>
            <h1>{t("vendor.title")}</h1>
            <p>
              {vendorName} — {t("vendor.subtitle")}
            </p>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="kpis">
            <div className="card kpi">
              <span className="icon-tile tone-blue" aria-hidden="true">
                <Package size={20} />
              </span>
              <b>{products.length}</b>
              <span>{t("vendor.statListings")}</span>
            </div>
            <div className="card kpi">
              <span className="icon-tile tone-green" aria-hidden="true">
                <Boxes size={20} />
              </span>
              <b>{active}</b>
              <span>{t("vendor.statActive")}</span>
            </div>
            <div className="card kpi">
              <span className="icon-tile tone-red" aria-hidden="true">
                <ClipboardList size={20} />
              </span>
              <b>{openOrders}</b>
              <span>{t("vendor.statOrders")}</span>
            </div>
            <div className="card kpi">
              <span className="icon-tile tone-navy" aria-hidden="true">
                <Wallet size={20} />
              </span>
              <b style={{ fontSize: "1.2rem" }}>{fmt(revenue)}</b>
              <span>{t("vendor.statRevenue")}</span>
            </div>
          </div>

          <section className="card panel" style={{ marginBottom: 26 }} aria-labelledby="listings-title">
            <div className="panel-head">
              <div>
                <h2 id="listings-title" style={{ fontSize: "1.15rem" }}>
                  {t("vendor.listingsTitle")}
                </h2>
                <p>{t("vendor.listingsText")}</p>
              </div>
            </div>
            {products.length === 0 ? (
              <div className="panel-body muted">{t("vendor.noListings")}</div>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th scope="col">{t("vendor.item")}</th>
                      <th scope="col">{t("vendor.pricePerDay")}</th>
                      <th scope="col">{t("vendor.deliveryFee")}</th>
                      <th scope="col">{t("vendor.installFee")}</th>
                      <th scope="col">{t("vendor.stock")}</th>
                      <th scope="col" aria-label={t("common.actions")} />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{text(p.name)}</strong>
                          <div className="hint">{p.active ? t("common.active") : t("common.inactive")}</div>
                        </td>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <div style={{ padding: 14 }}>
                            <ProductEditor product={p} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card panel" aria-labelledby="orders-title">
            <div className="panel-head">
              <div>
                <h2 id="orders-title" style={{ fontSize: "1.15rem" }}>
                  {t("vendor.ordersTitle")}
                </h2>
                <p>{t("vendor.ordersText")}</p>
              </div>
              <div className="row">
                <label className="sr-only" htmlFor="vendor-filter">
                  {t("admin.filterStatus")}
                </label>
                <select id="vendor-filter" className="select select-compact" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">{t("admin.allStatuses")}</option>
                  {(["pending", "confirmed", "delivering", "installed", "completed", "cancelled"] as BookingStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {t(`status.${s}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {shown.length === 0 ? (
              <div className="panel-body muted">{t("vendor.noOrders")}</div>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th scope="col">{t("bookings.code")}</th>
                      <th scope="col">{t("vendor.customer")}</th>
                      <th scope="col">{t("vendor.dates")}</th>
                      <th scope="col">{t("vendor.lines")}</th>
                      <th scope="col" className="num">{t("vendor.yourTotal")}</th>
                      <th scope="col">{t("common.status")}</th>
                      <th scope="col">{t("vendor.updateStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((o) => {
                      const dates = Array.from(new Set(o.lines.map((l) => l.eventDate))).sort();
                      const editable = o.status !== "cancelled" && o.status !== "completed";
                      return (
                        <tr key={o.id}>
                          <td>
                            <strong>{o.code}</strong>
                            <div className="hint">{formatDate(o.createdAt.slice(0, 10))}</div>
                          </td>
                          <td>
                            {o.customerName}
                            <div className="hint">{o.customerPhone}</div>
                            <div className="hint">{o.address}</div>
                          </td>
                          <td>{dates.map((d) => formatDate(d)).join(", ")}</td>
                          <td>
                            {o.lines.map((l, i) => (
                              <div key={i} style={{ fontSize: "0.9rem" }}>
                                {l.qty} × {text(l.nameSnapshot)}
                              </div>
                            ))}
                          </td>
                          <td className="num">
                            <strong>{fmt(o.vendorTotal)}</strong>
                          </td>
                          <td>
                            <StatusBadge status={o.status} />
                          </td>
                          <td>
                            {editable ? (
                              <select
                                className="select select-compact"
                                aria-label={`${t("vendor.updateStatus")} ${o.code}`}
                                value={o.status}
                                onChange={(e) => setStatus(o.id, e.target.value as BookingStatus)}
                              >
                                {VENDOR_STATUSES.filter((s) => s === o.status || s !== "pending").map((s) => (
                                  <option key={s} value={s}>
                                    {t(`status.${s}`)}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="hint">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <p className="hint" style={{ marginTop: 14 }}>
            <Link href="/equipment">
              {t("nav.browse")} <ArrowRight size={14} aria-hidden="true" style={{ verticalAlign: "-2px" }} />
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
