import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ShieldAlert, Activity, Filter, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SystemLogsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken as string | undefined);
  
  const page = searchParams.page || "1";
  const res = await apiClient.get(`/admin/logs?page=${page}`).catch(() => null);
  const logResponse = res;

  if (!logResponse || !logResponse.data) {
    return (
        <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                <ShieldAlert size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Audit Logs Offline</h2>
            <p className="text-slate-500 max-w-sm">
                System event streaming is momentarily unavailable.
            </p>
        </div>
    );
  }

  const formattedLogs = logResponse.data.map((log: any) => ({
    id: log._id,
    title: log.action.replace(/_/g, " "),
    description: `Action initiated by ${log.user?.fullName || "System"} (${log.user?.role || "Core"})${log.entityType ? ` on ${log.entityType.toLowerCase()}` : ""}`,
    time: new Date(log.createdAt).toLocaleString(),
    user: {
      name: log.user?.fullName || "System Server",
      avatar: log.user?.avatar,
    },
    metadata: log.metadata
  }));

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
            <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Trail</h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">
                Chronological record of platform activities and security events
            </p>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">
                <Filter size={18} />
            </button>
            <button className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                <RefreshCw size={18} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-100/30 overflow-hidden">
          <ActivityFeed
            title="Comprehensive Event Stream"
            activities={formattedLogs}
            maxItems={50}
          />
        </div>

        {/* Pagination logic here if needed */}
        {logResponse.pages > 1 && (
            <div className="flex justify-center pt-8">
                <div className="flex items-center gap-2">
                    {[...Array(logResponse.pages)].map((_, i) => (
                        <a
                            key={i}
                            href={`?page=${i + 1}`}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                                Number(page) === i + 1 
                                ? "bg-slate-900 text-white shadow-lg" 
                                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                            {i + 1}
                        </a>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
