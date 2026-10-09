import { loadCatalog } from "@/lib/catalog-data";
import { todayIso } from "@/lib/dates";
import { CatalogView } from "@/views/CatalogView";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function EquipmentPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { products, categories, vendors } = loadCatalog();
  const days = Number(first(sp.days));
  return (
    <CatalogView
      products={products}
      categories={categories}
      vendors={vendors}
      today={todayIso()}
      initial={{
        q: first(sp.q),
        category: categories.some((c) => c.id === first(sp.category)) ? first(sp.category) : "all",
        price: ["any", "u200", "200-500", "o500"].includes(first(sp.price)) ? first(sp.price) : "any",
        sort: ["featured", "asc", "desc", "name"].includes(first(sp.sort)) ? first(sp.sort) : "featured",
        stock: first(sp.stock) === "1",
        date: /^\d{4}-\d{2}-\d{2}$/.test(first(sp.date)) ? first(sp.date) : "",
        days: Number.isInteger(days) && days >= 1 && days <= 7 ? days : 1,
      }}
    />
  );
}
