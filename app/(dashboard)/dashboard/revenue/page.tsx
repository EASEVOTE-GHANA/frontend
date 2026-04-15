import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import { ChartCard } from "@/components/dashboard/ChartCard";
import TopPerformers from "./TopPerformers";
import { DollarSign, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);
  const { data: stats } = await apiClient.get("/admin/stats/revenue");

  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-500">
        Failed to load revenue data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
          <DollarSign className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Revenue Analytics
          </h1>
          <p className="text-slate-500">
            Financial performance overview and trends
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-sm font-medium mb-1">
            Total Revenue (All Time)
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {new Intl.NumberFormat("en-GH", {
              style: "currency",
              currency: "GHS",
            }).format(stats.totalRevenue)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue Trend (Last 30 Days)"
            type="bar"
            data={stats.trend}
            dataKey="revenue"
            xAxisKey="date"
            height={350}
            colors={["#10b981"]}
          />
        </div>
        <div>
          <ChartCard
            title="Revenue by Event Type"
            type="pie"
            data={stats.byType}
            dataKey="value"
            xAxisKey="name"
            height={350}
          />
        </div>
      </div>

      <TopPerformers
        events={stats.topEvents}
        organizers={stats.topOrganizers}
      />
    </div>
  );
}
