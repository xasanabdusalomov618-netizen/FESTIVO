"use client";

// Client-side cart. Stored in localStorage so guests can build a cart before signing in.
import { useCallback, useSyncExternalStore } from "react";
import { MAX_DAYS, MAX_QTY, MIN_DAYS } from "./pricing";

export interface CartItem {
  id: string;
  productId: string;
  eventDate: string; // YYYY-MM-DD
  days: number;
  qty: number;
  delivery: boolean;
  installation: boolean;
}

export const CART_STORAGE_KEY = "festivo.cart.v1";
const CART_EVENT = "festivo:cart-change";
const EMPTY = "[]";

export function cartLineId(productId: string, eventDate: string, days: number, delivery: boolean, installation: boolean) {
  return `${productId}|${eventDate}|${days}|${delivery ? 1 : 0}${installation ? 1 : 0}`;
}

function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.productId !== "string" || typeof o.eventDate !== "string") continue;
    const qty = Number(o.qty);
    const days = Number(o.days);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) continue;
    if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) continue;
    const delivery = o.delivery === true;
    const installation = o.installation === true;
    out.push({
      id: cartLineId(o.productId, o.eventDate, days, delivery, installation),
      productId: o.productId,
      eventDate: o.eventDate,
      days,
      qty,
      delivery,
      installation,
    });
  }
  return out;
}

function readRaw(): string {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeItems(items: CartItem[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  window.dispatchEvent(new Event(CART_EVENT));
}

export function readCart(): CartItem[] {
  try {
    return sanitize(JSON.parse(readRaw()));
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Live cart items. Re-renders on any change in this tab or other tabs. */
export function useCart(): CartItem[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY);
  try {
    return sanitize(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function useCartCount(): number {
  const items = useCart();
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export function addCartItem(input: Omit<CartItem, "id">): CartItem {
  const id = cartLineId(input.productId, input.eventDate, input.days, input.delivery, input.installation);
  const items = readCart();
  const existing = items.find((i) => i.id === id);
  if (existing) {
    existing.qty = Math.min(MAX_QTY, existing.qty + input.qty);
    writeItems(items);
    return existing;
  }
  const item: CartItem = { ...input, id, qty: Math.min(MAX_QTY, input.qty) };
  items.push(item);
  writeItems(items);
  return item;
}

export function updateCartItem(id: string, patch: Partial<Pick<CartItem, "qty">>) {
  const items = readCart();
  const target = items.find((i) => i.id === id);
  if (!target) return;
  if (patch.qty !== undefined) target.qty = Math.max(1, Math.min(MAX_QTY, Math.floor(patch.qty)));
  writeItems(items);
}

export function removeCartItem(id: string) {
  writeItems(readCart().filter((i) => i.id !== id));
}

export function clearCart() {
  writeItems([]);
}

export function useCartActions() {
  const remove = useCallback((id: string) => removeCartItem(id), []);
  const update = useCallback((id: string, qty: number) => updateCartItem(id, { qty }), []);
  const clear = useCallback(() => clearCart(), []);
  return { remove, update, clear };
}
