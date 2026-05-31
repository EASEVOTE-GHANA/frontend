import { BarChart3, ShieldCheck } from "lucide-react";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="h-14 w-14 bg-primary-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-100">
            <BarChart3 className="h-7 w-7" />
        </div>
        <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Reports Center
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary-600" /> Administrative data exports and platform business intelligence
            </p>
        </div>
      </div>

      {/* Interactive client component to securely handle PDF/CSV downloads with JWT token */}
      <ReportsClient />
    </div>
  );
}
