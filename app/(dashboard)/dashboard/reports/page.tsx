import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import {
  RevenueChart,
  UserGrowthChart,
} from "@/components/admin/AnalyticsCharts";
import { Download, FileSpreadsheet } from "lucide-react";

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);

  const [revenueRes, growthRes] = await Promise.all([
    apiClient.get("/analytics/revenue?days=7"),
    apiClient.get("/analytics/user-growth?days=7"),
  ]);
  const revenueData = revenueRes.data;
  const growthData = growthRes.data;

  return (
    <div className="space-y-8 p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">
            Reports & Analytics
          </h1>
          <p className="text-slate-500 mt-2">
            Visual insights and data exports for system performance.
          </p>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
            <RevenueChart data={revenueData} />
          </div>
        </div>

        {/* Growth Chart */}
        <div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full">
            <UserGrowthChart data={growthData} />
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Export Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Export Card 1 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-100 text-green-700 w-fit rounded-lg mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Transactions Report
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Download a complete CSV of all successful, pending, and failed
              transactions.
            </p>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700">
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>

          {/* Export Card 2 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-100 text-blue-700 w-fit rounded-lg mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Payouts History
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Export detailed records of all organizer payouts and bank
              transfers.
            </p>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700">
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>

          {/* Export Card 3 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
            <div className="p-3 bg-indigo-100 text-indigo-700 w-fit rounded-lg mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">
              Organizer Directory
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Get a list of all registered organizers including contact info and
              verification status.
            </p>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700">
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
