import { loadCatalog } from "@/lib/catalog-data";
import { todayIso } from "@/lib/dates";
import { CheckoutView } from "@/views/CheckoutView";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const { products, categories, vendors } = loadCatalog();
  return <CheckoutView products={products} categories={categories} vendors={vendors} today={todayIso()} />;
}
