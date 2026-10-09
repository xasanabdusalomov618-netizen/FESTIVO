import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { BookingsView } from "@/views/BookingsView";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/bookings");
  const db = readDb();
  const bookings = db.bookings
    .filter((b) => b.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const notifications = db.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);
  return <BookingsView user={user} bookings={bookings} notifications={notifications} />;
}
