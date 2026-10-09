import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { homeForRole, safeNext } from "@/lib/roles";
import { AuthView } from "@/views/AuthView";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(safeNext(sp.next, homeForRole(user.role)));
  return <AuthView mode="register" next={safeNext(sp.next, "")} />;
}
