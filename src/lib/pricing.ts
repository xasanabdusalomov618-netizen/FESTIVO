// Pure pricing helpers. Used by both the browser (live price preview) and the
// server (authoritative recalculation when a booking is created).
import type { Product } from "./types";

export const MIN_DAYS = 1;
export const MAX_DAYS = 7;
export const MAX_QTY = 500;

export interface PricedLine {
  rentalTotal: number;
  deliveryTotal: number;
  installationTotal: number;
  lineTotal: number;
}

export interface PriceInput {
  qty: number;
  days: number;
  delivery: boolean;
  installation: boolean;
}

export function priceLine(product: Pick<Product, "pricePerDay" | "deliveryFee" | "installFee" | "installable">, input: PriceInput): PricedLine {
  const qty = Math.max(0, Math.floor(input.qty));
  const days = Math.max(0, Math.floor(input.days));
  const rentalTotal = product.pricePerDay * qty * days;
  const deliveryTotal = input.delivery ? product.deliveryFee : 0;
  const installationTotal = input.installation && product.installable ? product.installFee * qty : 0;
  return {
    rentalTotal,
    deliveryTotal,
    installationTotal,
    lineTotal: rentalTotal + deliveryTotal + installationTotal,
  };
}

export function sumTotals(lines: Array<Pick<PricedLine, "rentalTotal" | "deliveryTotal" | "installationTotal" | "lineTotal">>) {
  return lines.reduce(
    (acc, l) => ({
      subtotal: acc.subtotal + l.rentalTotal,
      deliveryTotal: acc.deliveryTotal + l.deliveryTotal,
      installationTotal: acc.installationTotal + l.installationTotal,
      total: acc.total + l.lineTotal,
    }),
    { subtotal: 0, deliveryTotal: 0, installationTotal: 0, total: 0 },
  );
}

/** Formats UZS amounts with space thousands separators, e.g. 1 200 000. */
export function formatMoney(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
