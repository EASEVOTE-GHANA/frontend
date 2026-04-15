import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import PayoutsTable from "@/components/super-admin/finance/PayoutsTable";

export const dynamic = "force-dynamic";

export default async function SuperAdminPayoutsPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken as string | undefined);
  const payouts = await apiClient.get("/admin/payouts").catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payout Requests</h1>
          <p className="text-sm text-gray-500">
            Manage organizer withdrawal requests.
          </p>
        </div>
      </div>

      <div className="bg-white p-1 rounded-lg shadow-sm border border-gray-100">
        <PayoutsTable payouts={payouts} />
      </div>
    </div>
  );
}
