import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import GatewaySettings from "@/components/super-admin/finance/GatewaySettings";
import { Settings as SettingsIcon, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken as string | undefined);
  
  // Fetch from the new correct admin endpoint
  const gateways = await apiClient.get("/admin/gateways").catch(() => []);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <SettingsIcon className="h-7 w-7" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    Gateway Control
                </h1>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary-600" /> Infrastructure routing and provider health monitoring
                </p>
            </div>
        </div>
      </div>

      <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
        <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-50">
            <GatewaySettings configs={gateways} />
        </div>
      </div>
    </div>
  );
}
