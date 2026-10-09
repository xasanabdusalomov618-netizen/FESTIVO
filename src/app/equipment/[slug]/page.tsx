import { notFound } from "next/navigation";
import { loadCatalog } from "@/lib/catalog-data";
import { addDaysIso, todayIso } from "@/lib/dates";
import { ProductView } from "@/views/ProductView";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { products, categories, vendors } = loadCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const category = categories.find((c) => c.id === product.categoryId);
  const vendor = vendors.find((v) => v.id === product.vendorId);
  const related = products
    .filter((p) => p.id !== product.id && (p.categoryId === product.categoryId || p.vendorId === product.vendorId))
    .slice(0, 3)
    .map((p) => ({
      product: p,
      category: categories.find((c) => c.id === p.categoryId),
      vendor: vendors.find((v) => v.id === p.vendorId),
    }));

  return (
    <ProductView
      product={product}
      category={category ?? null}
      vendor={vendor ?? null}
      related={related}
      today={todayIso()}
      defaultDate={addDaysIso(todayIso(), 7)}
    />
  );
}
