import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import { ChartCard } from "@/components/dashboard/ChartCard";
import TopPerformers from "./TopPerformers";
import { 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  CreditCard,
  BarChart3,
  Activity
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);
  
  const res = await apiClient.get("/admin/stats/revenue").catch(() => null);
  const stats = res?.data;

  if (!stats) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <Activity className="animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Revenue Data Unavailable</h2>
        <p className="text-slate-500 max-w-sm">
          We couldn't retrieve the financial statistics at this time. Please check your backend connection.
        </p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
        maximumFractionDigits: 0
    }).format(val);
  };

  const kpis = [
    {
        title: "Total Gross Volume",
        value: formatCurrency(stats.totalRevenue || 0),
        subtitle: "Total transaction value",
        icon: <DollarSign className="h-5 w-5" />
    },
    {
        title: "Platform Revenue",
        value: formatCurrency(stats.netCommission || 0),
        subtitle: "10% Platform Profit",
        icon: <TrendingUp className="h-5 w-5" />
    },
    {
        title: "Organizer Payouts",
        value: formatCurrency(stats.organizerEarnings || 0),
        subtitle: "90% Share distributed",
        icon: <Wallet className="h-5 w-5" />
    },
    {
        title: "Success Transactions",
        value: (stats.totalTransactions || 0).toLocaleString(),
        subtitle: "Verified purchases",
        icon: <CreditCard className="h-5 w-5" />
    }
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-50">
              <BarChart3 className="h-6 w-6" />
          </div>
          <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Revenue Analytics
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                  Global platform performance and financial overview
              </p>
          </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">{kpi.title}</span>
                    <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                        {kpi.icon}
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{kpi.value}</h3>
                    <p className="text-slate-500 text-[11px] mt-1">{kpi.subtitle}</p>
                </div>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue Trend"
            subtitle="Gross volume (last 30 days)"
            type="bar"
            data={stats.trend || []}
            dataKey="revenue"
            xAxisKey="date"
            height={400}
            colors={["#0f172a"]} 
          />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
           <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Stream Breakdown</h3>
                <p className="text-xs text-slate-500 mb-6">Revenue distribution by type</p>
                <div className="h-[250px]">
                    <ChartCard
                        title=""
                        type="pie"
                        data={stats.byType || []}
                        dataKey="value"
                        xAxisKey="name"
                        height={250}
                        colors={["#0f172a", "#c026d3"]}
                    />
                </div>
           </div>
           
           <div className="space-y-3 pt-6 border-t border-slate-100">
             {(stats.byType || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? "bg-slate-900" : "bg-magenta-600"}`}></div>
                        <span className="text-xs font-medium text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(item.value)}</span>
                </div>
             ))}
           </div>
        </div>
      </div>

      <TopPerformers
        events={stats.topEvents || []}
        organizers={stats.topOrganizers || []}
      />
    </div>
  );
}
