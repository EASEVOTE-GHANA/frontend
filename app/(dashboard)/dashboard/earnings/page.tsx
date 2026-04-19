import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerApiClient } from "@/lib/api-client";
import EarningsDashboardClient from "./EarningsDashboardClient";

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizerId) {
    redirect("/sign-in");
  }

  const apiClient = createServerApiClient(
    session?.accessToken as string | undefined,
  );

  // Fetch real-time balance from our new PayoutService
  const balanceRes = await apiClient.get("/payouts/balance").catch(() => null);
  const stats = {
    balance: Number(balanceRes?.data?.availableBalance ?? 0),
    totalRevenue: Number(balanceRes?.data?.netRevenue ?? 0),
    grossRevenue: Number(balanceRes?.data?.grossRevenue ?? 0),
    totalWithdrawn: Number(balanceRes?.data?.totalWithdrawn ?? 0),
    unverifiedRevenue: Number(balanceRes?.data?.unverifiedRevenue ?? 0),
    hasGaps: Boolean(balanceRes?.data?.hasGaps),
  };

  // Fetch payout/transaction history via /api/payouts/me
  const historyRes = await apiClient.get("/payouts/me").catch(() => ({ data: [] }));
  const transactionList = Array.isArray(historyRes.data) ? historyRes.data : [];

  const formattedTransactions = transactionList.map((tx: any) => ({
    id: tx._id,
    reference: tx.reference,
    type: "PAYOUT", // Since this is the payout history
    amount: Number(tx.amount ?? 0),
    status: tx.status,
    createdAt: tx.createdAt,
    eventName: "N/A",
    customerName: tx.paymentDetails?.accountName || "System",
    paymentMethod: tx.paymentDetails?.method || "N/A",
  }));

  return (
    <EarningsDashboardClient
      stats={stats}
      transactions={formattedTransactions}
    />
  );
}
