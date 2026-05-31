"use client";

import { useState } from "react";
import { getSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { 
  FileSpreadsheet, 
  Download, 
  BarChart3, 
  History, 
  Users, 
  ShieldCheck,
  Calendar,
  Loader2
} from "lucide-react";
import { clsx } from "clsx";

interface ReportCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  endpoint: string;
}

export default function ReportsClient() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const reportCards: ReportCard[] = [
    {
      title: "Transactions Ledger",
      description: "Complete historical record of all successful, pending, and failed payment attempts across the platform.",
      icon: <History className="h-5 w-5" />,
      color: "bg-slate-50 text-slate-700",
      endpoint: "/admin/reports/export/transactions"
    },
    {
      title: "Payouts History",
      description: "Detailed breakdown of all organizer withdrawals, including bank details, amounts, and settlement statuses.",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      color: "bg-slate-50 text-slate-700",
      endpoint: "/admin/reports/export/payouts"
    },
    {
      title: "Organizer Directory",
      description: "Full directory of registered organizers with contact information, business details, and verification metrics.",
      icon: <Users className="h-5 w-5" />,
      color: "bg-slate-50 text-slate-700",
      endpoint: "/admin/reports/export/organizers"
    },
    {
      title: "Event Intelligence",
      description: "Complete performance catalog of all events, featuring live status, voter engagement, and ticketing revenue stats.",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "bg-slate-50 text-slate-700",
      endpoint: "/admin/reports/export/events"
    },
    {
      title: "Nomination Analytics",
      description: "Detailed record of all candidate nominations across categories, including status, registration dates, and IDs.",
      icon: <Users className="h-5 w-5" />,
      color: "bg-slate-50 text-slate-700",
      endpoint: "/admin/reports/export/nominations"
    }
  ];

  const handleDownload = async (report: ReportCard) => {
    setDownloadingId(report.title);
    const loadingToast = toast.loading(`Preparing ${report.title}...`);

    try {
      const session = await getSession();
      if (!session?.accessToken) {
        toast.error("You must be logged in to download reports.", { id: loadingToast });
        window.location.href = `/sign-in?callbackUrl=${window.location.pathname}`;
        return;
      }

      // Fetch from frontend Next.js secure proxy, passing the Authorization header
      const res = await fetch(`/api/proxy${report.endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "ngrok-skip-browser-warning": "true"
        }
      });

      if (!res.ok) {
        let errorMessage = "Failed to compile the report.";
        try {
          const jsonErr = await res.json();
          errorMessage = jsonErr.message || errorMessage;
        } catch {
          // fallback if response isn't JSON
        }
        throw new Error(errorMessage);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.toLowerCase().replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`${report.title} downloaded successfully!`, { id: loadingToast });
    } catch (error: any) {
      console.error("[Report Download Error]:", error);
      toast.error(error.message || "An error occurred during download.", { id: loadingToast });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* EXPORT CARDS */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((report, idx) => {
          const isDownloading = downloadingId === report.title;

          return (
            <div 
              key={idx} 
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm", report.color)}>
                  {report.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{report.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-medium mb-8">
                  {report.description}
                </p>
              </div>
              
              <button 
                onClick={() => handleDownload(report)}
                disabled={downloadingId !== null}
                className={clsx(
                  "flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-primary-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                  isDownloading 
                    ? "bg-slate-800 text-white" 
                    : "bg-primary-700 hover:bg-primary-800 text-white hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    Download CSV
                  </>
                )}
              </button>
            </div>
          );
        })}

        {/* UPCOMING REPORT PLACEHOLDER */}
        <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 border border-slate-100 italic font-black text-slate-300">
            +
          </div>
          <h3 className="text-sm font-bold text-slate-400">Custom Reports</h3>
          <p className="text-[10px] text-slate-400 font-medium px-4 mt-1 leading-tight">
            Extended analytics and category-specific exports coming soon.
          </p>
        </div>
      </div>

      {/* TIPS & INFO */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <Calendar className="h-8 w-8 text-slate-900 mb-6" />
            <h3 className="text-xl font-bold mb-4 leading-tight text-slate-900">Periodic Reconciliation</h3>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
              We recommend downloading your transaction and payout ledgers at the end of every business week for offline reconciliation.
            </p>
            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Platform Policy</span>
              <ShieldCheck size={16} className="text-slate-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Supported Formats</h3>
          <div className="space-y-4">
            {[
              { name: "CSV (Comma Separated)", status: "Active", color: "bg-emerald-500" },
              { name: "Excel (.xlsx)", status: "Coming Soon", color: "bg-slate-300" },
              { name: "PDF Summary", status: "In Dev", color: "bg-slate-300" }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{item.name}</span>
                <div className="flex items-center gap-1.5">
                  <div className={clsx("w-1.5 h-1.5 rounded-full", item.color)}></div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
