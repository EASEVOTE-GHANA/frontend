"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  ChevronDown
} from "lucide-react";
import { clsx } from "clsx";

interface ReportCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  endpoint: string;
  supportsEventFilter: boolean;
}

export default function ReportsClient() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Record<string, string>>({
    "Transactions Ledger": "ALL",
    "Nomination Analytics": "ALL"
  });

  // Fetch all events on the platform for filtering options
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const session = await getSession();
        if (!session?.accessToken) return;

        const res = await fetch("/api/proxy/events/admin/all", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "ngrok-skip-browser-warning": "true"
          }
        });

        if (res.ok) {
          const data = await res.json();
          // Normalize responses (some list directly, some wrap in data)
          const list = Array.isArray(data) ? data : data.data || [];
          setEvents(list);
        }
      } catch (err) {
        console.error("[ReportsClient] Failed to load events:", err);
      }
    };

    fetchEvents();
  }, []);

  const reportCards: ReportCard[] = [
    {
      title: "Transactions Ledger",
      description: "Complete historical record of all successful, pending, and failed payment attempts across the platform.",
      icon: <History className="h-5 w-5" />,
      color: "bg-slate-50 text-slate-700",
      endpoint: "/admin/reports/export/transactions",
      supportsEventFilter: true
    },
    {
      title: "Payouts History",
      description: "Detailed breakdown of all organizer withdrawals, including bank details, amounts, and settlement statuses.",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      color: "bg-slate-50 text-slate-700",
      endpoint: "/admin/reports/export/payouts",
      supportsEventFilter: false
    },
    {
      title: "Organizer Directory",
      description: "Full directory of registered organizers with contact information, business details, and verification metrics.",
      icon: <Users className="h-5 w-5" />,
      color: "bg-slate-50 text-slate-700",
      endpoint: "/admin/reports/export/organizers",
      supportsEventFilter: false
    },
    {
      title: "Event Intelligence",
      description: "Complete performance catalog of all events, featuring live status, voter engagement, and ticketing revenue stats.",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "bg-slate-50 text-slate-700",
      endpoint: "/admin/reports/export/events",
      supportsEventFilter: false
    },
    {
      title: "Nomination Analytics",
      description: "Detailed record of all candidate nominations across categories, including status, registration dates, and IDs.",
      icon: <Users className="h-5 w-5" />,
      color: "bg-slate-50 text-slate-700",
      endpoint: "/admin/reports/export/nominations",
      supportsEventFilter: true
    }
  ];

  const handleDownload = async (report: ReportCard) => {
    const selectedEventId = selectedEvents[report.title] || "ALL";
    const selectedEvent = events.find(e => e._id === selectedEventId);
    
    // Premium loading notifications
    const targetScope = selectedEvent ? `for "${selectedEvent.title}"` : "for All Events";
    setDownloadingId(report.title);
    const loadingToast = toast.loading(`Preparing ${report.title} ${targetScope}...`);

    try {
      // 1. Enforce active admin session
      const session = await getSession();
      if (!session?.accessToken) {
        toast.error("You must be logged in to download reports.", { id: loadingToast });
        window.location.href = `/sign-in?callbackUrl=${window.location.pathname}`;
        return;
      }

      // Special handling for Nomination Analytics event-specific downloads
      if (report.title === "Nomination Analytics" && selectedEventId !== "ALL") {
        toast.error(
          `Platform nominations report does not contain Event headers. To export nominations for "${selectedEvent.title}", please visit: Dashboard > Events > Manage Nominations > Export CSV.`,
          { id: loadingToast, duration: 6000 }
        );
        setDownloadingId(null);
        return;
      }

      // 2. Fetch raw CSV payload via local secure proxy
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
        } catch {}
        throw new Error(errorMessage);
      }

      let blob: Blob;
      let filenameSuffix = "all_events";

      // 3. Perform client-side CSV parsing if a specific event is selected for Transactions
      if (report.title === "Transactions Ledger" && selectedEventId !== "ALL" && selectedEvent) {
        const rawCsvText = await res.text();
        const lines = rawCsvText.split("\n");
        if (lines.length > 0) {
          const headers = lines[0].split(",");
          // Find "Event" index by removing double-quotes
          const eventIdx = headers.map(h => h.replace(/"/g, '').trim()).indexOf("Event");
          
          if (eventIdx !== -1) {
            const filteredRows = lines.slice(1).filter(row => {
              const cells = row.split(",");
              const eventVal = (cells[eventIdx] || "").replace(/"/g, '').trim();
              return eventVal.toLowerCase() === selectedEvent.title.toLowerCase();
            });
            
            const filteredCsv = [lines[0], ...filteredRows].join("\n");
            blob = new Blob([filteredCsv], { type: "text/csv;charset=utf-8;" });
            filenameSuffix = selectedEvent.title.toLowerCase().replace(/\s+/g, "_");
          } else {
            // Fallback to full file if header mismatch occurs
            blob = new Blob([rawCsvText], { type: "text/csv;charset=utf-8;" });
          }
        } else {
          blob = new Blob([rawCsvText], { type: "text/csv;charset=utf-8;" });
        }
      } else {
        // Platform wide export
        blob = await res.blob();
      }

      // 4. Download file in browser
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.toLowerCase().replace(/\s+/g, "_")}_${filenameSuffix}_${
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

  const handleEventChange = (title: string, eventId: string) => {
    setSelectedEvents(prev => ({ ...prev, [title]: eventId }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* EXPORT CARDS */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((report, idx) => {
          const isDownloading = downloadingId === report.title;
          const currentEventId = selectedEvents[report.title] || "ALL";

          return (
            <div 
              key={idx} 
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-100/80 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm", report.color)}>
                  {report.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{report.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-medium mb-6">
                  {report.description}
                </p>

                {/* Event Filter Selection (If Supported) */}
                {report.supportsEventFilter && (
                  <div className="mb-6 space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">
                      Scope / Filter by Event
                    </label>
                    <div className="relative">
                      <select
                        value={currentEventId}
                        onChange={(e) => handleEventChange(report.title, e.target.value)}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 pl-3 pr-8 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer shadow-inner transition-colors"
                      >
                        <option value="ALL">All Platform Events</option>
                        {events.map((e) => (
                          <option key={e._id} value={e._id}>
                            {e.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                  </div>
                )}
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
