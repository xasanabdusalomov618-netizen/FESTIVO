import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { VendorView, type VendorOrder } from "@/views/VendorView";

export const dynamic = "force-dynamic";

export default async function VendorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/vendor");
  if (user.role !== "vendor" || !user.vendorId) {
    return <VendorView isVendor={false} vendorName="" products={[]} orders={[]} />;
  }
  const db = readDb();
  const vendor = db.vendors.find((v) => v.id === user.vendorId);
  const products = db.products.filter((p) => p.vendorId === user.vendorId);
  const orders: VendorOrder[] = db.bookings
    .filter((b) => b.lines.some((l) => l.vendorId === user.vendorId))
    .map((b) => {
      const lines = b.lines.filter((l) => l.vendorId === user.vendorId);
      return {
        id: b.id,
        code: b.code,
        status: b.status,
        createdAt: b.createdAt,
        customerName: b.customer.fullName,
        customerPhone: b.customer.phone,
        address: b.customer.address,
        lines,
        vendorTotal: lines.reduce((s, l) => s + l.lineTotal, 0),
        counted: b.status !== "cancelled",
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <VendorView isVendor vendorName={vendor?.name ?? user.name} products={products} orders={orders} />;
}
