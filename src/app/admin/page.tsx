import { redirect } from "next/navigation";
import { getCurrentUser, toPublicUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { AdminView } from "@/views/AdminView";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") return <AdminView isAdmin={false} bookings={[]} users={[]} products={[]} vendors={[]} categories={[]} />;
  const db = readDb();
  return (
    <AdminView
      isAdmin
      bookings={[...db.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
      users={db.users.map((u) => toPublicUser(u))}
      products={db.products}
      vendors={db.vendors}
      categories={db.categories}
    />
  );
}
