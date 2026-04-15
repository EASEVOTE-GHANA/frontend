import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import UserGrowthChart from "./UserGrowthChart";
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Activity, 
  PieChart as PieChartIcon,
  Filter,
  User
} from "lucide-react";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

export default async function UserAnalyticsPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken as string | undefined);
  
  const res = await apiClient.get("/admin/stats/users").catch(() => null);
  const stats = res?.data;

  if (!stats) {
    return (
        <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center">
                <User size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">User Data Unavailable</h2>
            <p className="text-slate-500 max-w-sm">
                Growth and funnel statistics could not be loaded at this time.
            </p>
        </div>
    );
  }

  const kpis = [
    {
        title: "Total Registered Users",
        value: stats.totalUsers.toLocaleString(),
        icon: <Users className="h-5 w-5" />,
        color: "bg-blue-50 text-blue-600"
    },
    {
        title: "Verified Organizers",
        value: stats.funnelData.find((d: any) => d.name === "Active Organizers")?.value || 0,
        icon: <ShieldCheck className="h-5 w-5" />,
        color: "bg-emerald-50 text-emerald-600"
    },
    {
        title: "Email Verified",
        value: stats.funnelData.find((d: any) => d.name === "Email Verified")?.value || 0,
        icon: <UserCheck className="h-5 w-5" />,
        color: "bg-indigo-50 text-indigo-600"
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Analytics</h1>
          <p className="text-sm text-slate-500 font-medium">
            Growth trends, verification funnels, and user activity mapping
          </p>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 text-slate-900 rounded-xl">
                        {kpi.icon}
                    </div>
                    <div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{kpi.title}</div>
                        <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* GROWTH CHART */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <UserGrowthChart data={stats.growthTrend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Verification Funnel */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-900">Verification Funnel</h3>
                </div>
           </div>
           <ChartCard
            title=""
            type="bar"
            data={stats.funnelData}
            dataKey="value"
            xAxisKey="name"
            height={300}
            colors={["#4f46e5"]}
          />
        </div>

        {/* Recently Active Users */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Recently Active
              Users
            </h3>
          </div>
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {stats.topActive.map((user: any) => (
              <div
                key={user.id}
                className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden text-xs font-bold text-white shadow-lg shadow-slate-200">
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
                    <div className="font-bold text-slate-900 text-sm tracking-tight uppercase">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{user.role}</div>
                  </div>
                </div>
                <div className="text-right">
                    <div className="text-[11px] font-bold text-slate-900 italic">
                        {new Date(user.lastActivity).toLocaleDateString()}
                    </div>
                </div>
              </div>
            ))}
            {stats.topActive.length === 0 && (
              <div className="p-10 text-center text-slate-400 font-medium italic">
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
