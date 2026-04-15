import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerApiClient } from "@/lib/api-client";
import OrganizerPayoutsClient from "@/app/(dashboard)/dashboard/payouts/OrganizerPayoutsClient";
import AdminPayoutsClient from "@/app/(dashboard)/dashboard/payouts/AdminPayoutsClient";

export default async function PayoutsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/sign-in");
  }

  const role = session.user?.role;
  const apiClient = createServerApiClient(session.accessToken as string | undefined);

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    // Admin View: Fetch all payout requests
    const res = await apiClient.get("/payouts/admin/all").catch(() => ({ data: [] }));
    return <AdminPayoutsClient initialPayouts={res.data || []} />;
  }

  // Organizer View: Fetch personal balance and history
  const [balanceRes, historyRes] = await Promise.all([
    apiClient.get("/payouts/balance").catch(() => ({ data: {} })),
    apiClient.get("/payouts/me").catch(() => ({ data: [] })),
  ]);

  return (
    <OrganizerPayoutsClient 
      stats={{
        balance: balanceRes.data?.availableBalance || 0,
        totalRevenue: balanceRes.data?.netRevenue || 0,
        totalWithdrawn: balanceRes.data?.totalWithdrawn || 0,
      }}
      initialPayouts={historyRes.data || []}
    />
  );
}
