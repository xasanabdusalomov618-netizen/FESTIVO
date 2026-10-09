import { loadCatalog } from "@/lib/catalog-data";
import { CartView } from "@/views/CartView";

export const dynamic = "force-dynamic";

export default function CartPage() {
  const { products, categories, vendors } = loadCatalog();
  return <CartView products={products} categories={categories} vendors={vendors} />;
}
