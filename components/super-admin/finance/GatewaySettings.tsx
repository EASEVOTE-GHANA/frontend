"use client";

import { api } from "@/lib/api-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Globe, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw, 
  Power,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";
import { clsx } from "clsx";

type GatewayProvider = "paystack" | "flutterwave" | "appsmobile";
type GatewayType = "WEB" | "USSD";

type GatewayConfig = {
  provider: GatewayProvider;
  type: GatewayType;
  isEnabled: boolean;
  isPrimary: boolean;
  failureCount: number;
  lastFailure: Date | null;
};

export default function GatewaySettings({
  configs,
}: {
  configs: GatewayConfig[];
}) {
  const router = useRouter();
  const [loadingObj, setLoadingObj] = useState<string | null>(null);

  async function handleSetActive(provider: string, type: string) {
    if (
        !confirm(
          `Switch PRIMARY ${type} gateway to ${provider}? this will take effect immediately.`
        )
      )
        return;
      const id = `${provider}-${type}`;
      setLoadingObj(id);
      try {
          await api.post("/admin/gateways/primary", { provider, type });
          router.refresh();
      } catch (error) {
          console.error("Failed to switch gateway:", error);
      } finally {
          setLoadingObj(null);
      }
  }

  async function handleReset(provider: string, type: string) {
    const id = `${provider}-${type}-reset`;
    setLoadingObj(id);
    try {
        await api.post("/admin/gateways/reset", { provider, type });
        router.refresh();
    } catch (error) {
        console.error("Failed to reset gateway stats:", error);
    } finally {
        setLoadingObj(null);
    }
  }

  const webGateways = configs.filter(c => c.type === "WEB");
  const ussdGateways = configs.filter(c => c.type === "USSD");

  const GatewayCard = ({ config }: { config: GatewayConfig }) => {
    const isLoading = loadingObj === `${config.provider}-${config.type}`;
    const isResetting = loadingObj === `${config.provider}-${config.type}-reset`;

    return (
        <div 
            className={clsx(
                "group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden",
                config.isPrimary 
                    ? "border-primary-600 shadow-lg shadow-primary-50 ring-1 ring-primary-100" 
                    : "border-slate-200 hover:border-slate-300 shadow-sm"
            )}
        >
            {config.isPrimary && (
                <div className="absolute top-0 right-0 p-3">
                    <div className="bg-primary-600 text-white rounded-full p-1 shadow-md">
                        <ShieldCheck size={14} />
                    </div>
                </div>
            )}

            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        config.isPrimary ? "bg-primary-900 text-white" : "bg-slate-50 text-slate-500 group-hover:bg-slate-100"
                    )}>
                        <Zap size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                            {config.provider}
                        </h4>
                        <div className="flex items-center gap-1.5">
                            <span className={clsx(
                                "w-2 h-2 rounded-full",
                                config.isEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                            )}></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {config.isEnabled ? "Ready" : "Maintenance"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-medium">
                        <span className="text-slate-400 uppercase tracking-widest">Health Monitor</span>
                        <span className={clsx(
                            "px-2 py-0.5 rounded-full font-black",
                            config.failureCount === 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                            {config.failureCount === 0 ? "OPTIMAL" : `${config.failureCount} ERRORS`}
                        </span>
                    </div>

                    <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div 
                            className={clsx(
                                "h-full transition-all duration-1000",
                                config.failureCount === 0 ? "bg-emerald-500 w-full" : "bg-red-500 w-1/3"
                            )}
                        ></div>
                    </div>

                    {config.lastFailure && (
                        <div className="flex items-center gap-2 text-[10px] text-red-500 font-bold bg-red-50/50 p-2 rounded-lg">
                            <AlertCircle size={12} />
                            LAST FAILURE: {new Date(config.lastFailure).toLocaleString()}
                        </div>
                    )}
                </div>

                <div className="mt-8 flex items-center gap-3">
                    {!config.isPrimary ? (
                        <button
                            onClick={() => handleSetActive(config.provider, config.type)}
                            disabled={loadingObj !== null}
                            className="flex-1 py-2.5 bg-primary-700 !text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-800 transition-all shadow-md shadow-primary-50 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <RefreshCcw size={14} className="animate-spin text-white" /> : <Power size={14} className="text-white" />}
                            {isLoading ? "Provisioning..." : "Set Primary"}
                        </button>
                    ) : (
                        <div className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-100">
                            <CheckCircle2 size={14} />
                            ACTIVE GATEWAY
                        </div>
                    )}

                    {config.failureCount > 0 && (
                        <button
                            onClick={() => handleReset(config.provider, config.type)}
                            disabled={loadingObj !== null}
                            className="p-2.5 border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50"
                            title="Reset Monitors"
                        >
                            {isResetting ? <RefreshCcw size={14} className="animate-spin" /> : <Activity size={14} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) => (
    <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-sm">
            <Icon size={24} />
        </div>
        <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{title}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-16">
      <section>
        <SectionHeader 
            icon={Globe} 
            title="Web Payment Engine" 
            subtitle="Channel configuration for web-based checkouts and payouts" 
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {webGateways.map((config) => (
                <GatewayCard key={`${config.provider}-${config.type}`} config={config} />
            ))}
        </div>
      </section>

      <section className="pt-6">
        <SectionHeader 
            icon={Smartphone} 
            title="USSD Payment Hub" 
            subtitle="Provider routing for offline mobile-money integrations" 
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ussdGateways.map((config) => (
                <GatewayCard key={`${config.provider}-${config.type}`} config={config} />
            ))}
        </div>
      </section>
    </div>
  );
}
