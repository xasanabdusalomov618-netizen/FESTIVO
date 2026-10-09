// Read-only catalogue selectors used by server components.
import { readDb } from "./db";
import type { Category, Product, Vendor } from "./types";

export interface CatalogSnapshot {
  products: Product[];
  categories: Category[];
  vendors: Vendor[];
}

export function loadCatalog(): CatalogSnapshot {
  const db = readDb();
  return {
    products: db.products.filter((p) => p.active),
    categories: db.categories,
    vendors: db.vendors,
  };
}
