import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  AlertOctagon,
} from "lucide-react";
import TransactionsTable from "./TransactionsTable";
import AdminStatCard from "@/components/admin/AdminStatCard";

export default async function AdminTransactionsPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);

  const [statsRes, transactionsRes] = await Promise.all([
    apiClient.get("/admin/stats/transactions").catch(() => ({
      data: {
        totalVolume: 0,
        netRevenue: 0,
        successRate: 0,
        pendingCount: 0,
      },
    })),
    apiClient.get("/admin/transactions").catch(() => ({ data: [] })),
  ]);

  // Robust extraction for stats and transactions
  const stats = statsRes.data || statsRes || { totalVolume: 0, netRevenue: 0, successRate: 0, pendingCount: 0 };
  const rawTransactions = transactionsRes.data || transactionsRes.purchases || (Array.isArray(transactionsRes) ? transactionsRes : []);

  // Map backend Purchase model to frontend Transaction UI type
  const transactions = rawTransactions.map((tx: any) => ({
    id: tx._id,
    reference: tx.paymentReference,
    type: tx.type,
    amount: tx.amount,
    status: tx.status === "PAID" ? "SUCCESS" : tx.status,
    payer: tx.customerName || tx.customerEmail || "Anonymous",
    event: tx.eventId?.title || "Unknown Event",
    date: tx.paidAt || tx.createdAt,
  }));

  return (
    <div className="space-y-8 p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">
          Transactions
        </h1>
        <p className="text-slate-500 mt-2">
          Monitor all financial activities, revenue, and payment statuses.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          title="Total Volume"
          value={new Intl.NumberFormat("en-GH", {
            style: "currency",
            currency: "GHS",
          }).format(stats.totalVolume)}
          icon={Activity}
          trend="Gross processed"
          trendDirection="neutral"
        />
        <AdminStatCard
          title="Net Revenue"
          value={new Intl.NumberFormat("en-GH", {
            style: "currency",
            currency: "GHS",
          }).format(stats.netRevenue)}
          icon={DollarSign}
          trend="Fees & Commissions"
          trendDirection="up"
        />
        <AdminStatCard
          title="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          icon={TrendingUp}
          trend="Completion Rate"
          trendDirection={stats.successRate > 90 ? "up" : "down"}
        />
        <AdminStatCard
          title="Pending Actions"
          value={stats.pendingCount}
          icon={AlertOctagon}
          trend="Needs Attention"
          trendDirection="neutral"
          color="amber"
        />
      </div>

      {/* Transactions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Recent Transactions
          </h2>
        </div>
        <TransactionsTable transactions={transactions} />
      </div>
    </div>
  );
}
