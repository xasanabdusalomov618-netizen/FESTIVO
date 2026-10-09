import { loadCatalog } from "@/lib/catalog-data";
import { todayIso } from "@/lib/dates";
import { PlanView } from "@/views/PlanView";

export const dynamic = "force-dynamic";

export default function PlanPage() {
  const { products } = loadCatalog();
  return <PlanView products={products} today={todayIso()} />;
}
