import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import UserGrowthChart from "./UserGrowthChart";
import { Users, UserCheck, ShieldCheck, Activity } from "lucide-react";
import { ChartCard } from "@/components/dashboard/ChartCard";

export const dynamic = "force-dynamic";

export default async function UserAnalyticsPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken as string | undefined);
  const stats = await apiClient.get("/admin/stats/users").catch(() => null);

  if (!stats) {
    return <div>Failed to load user analytics.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Analytics</h1>
          <p className="text-slate-500">
            Growth trends, verification funnels, and user activity
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-slate-500 text-sm font-medium">
                Total Users
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.totalUsers}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-slate-500 text-sm font-medium">
                Verified Organizers
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.funnelData.find((d: any) => d.name === "Verified")?.value ||
                  0}
              </div>
            </div>
          </div>
        </div>
      </div>

      <UserGrowthChart data={stats.growthTrend} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Funnel */}
        <div>
          <ChartCard
            title="Verification Funnel"
            subtitle="Conversion from signup to verification"
            type="bar"
            data={stats.funnelData}
            dataKey="value"
            xAxisKey="name"
            height={300}
            colors={["#6366f1"]}
          />
        </div>

        {/* Top Active Users */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" /> Recently Active
              Users
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.topActive.map((user: any) => (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-xs font-bold text-slate-500">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 text-sm">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(user.lastLoginAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {stats.topActive.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-sm">
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
