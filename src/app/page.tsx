import { loadCatalog } from "@/lib/catalog-data";
import { addDaysIso, todayIso } from "@/lib/dates";
import { HomeView } from "@/views/HomeView";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const { products, categories, vendors } = loadCatalog();
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const pick = (featured.length ? featured : products).slice(0, 4);
  return (
    <HomeView
      categories={categories}
      productCount={products.length}
      vendorCount={vendors.length}
      featured={pick.map((p) => ({
        product: p,
        category: categories.find((c) => c.id === p.categoryId),
        vendor: vendors.find((v) => v.id === p.vendorId),
      }))}
      previewDate={addDaysIso(todayIso(), 6)}
    />
  );
}
