import type { Database, Product, PublicUser } from "./types";
import type { ErrorCode } from "./errors";

export type ProductPatch = Partial<Pick<Product, "pricePerDay" | "stock" | "active" | "deliveryFee" | "installFee">>;

type Result<T> = { ok: true; value: T } | { ok: false; error: ErrorCode; field?: string };

const isNonNegInt = (v: unknown, max: number) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;

export function updateProduct(db: Database, user: PublicUser, productId: string, body: Record<string, unknown>): Result<Product> {
  const product = db.products.find((p) => p.id === productId);
  if (!product) return { ok: false, error: "not_found" };
  if (user.role === "customer") return { ok: false, error: "forbidden" };
  if (user.role === "vendor" && product.vendorId !== user.vendorId) return { ok: false, error: "forbidden" };

  const patch: ProductPatch = {};
  if ("pricePerDay" in body) {
    if (!isNonNegInt(body.pricePerDay, 100_000_000) || (body.pricePerDay as number) < 1000) return { ok: false, error: "price_invalid", field: "pricePerDay" };
    patch.pricePerDay = body.pricePerDay as number;
  }
  if ("deliveryFee" in body) {
    if (!isNonNegInt(body.deliveryFee, 100_000_000)) return { ok: false, error: "price_invalid", field: "deliveryFee" };
    patch.deliveryFee = body.deliveryFee as number;
  }
  if ("installFee" in body) {
    if (!isNonNegInt(body.installFee, 100_000_000)) return { ok: false, error: "price_invalid", field: "installFee" };
    patch.installFee = body.installFee as number;
  }
  if ("stock" in body) {
    if (!isNonNegInt(body.stock, 100_000)) return { ok: false, error: "stock_invalid", field: "stock" };
    patch.stock = body.stock as number;
  }
  if ("active" in body) {
    if (typeof body.active !== "boolean") return { ok: false, error: "generic", field: "active" };
    patch.active = body.active;
  }
  Object.assign(product, patch);
  return { ok: true, value: product };
}
