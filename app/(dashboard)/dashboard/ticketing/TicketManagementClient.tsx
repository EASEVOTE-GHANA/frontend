"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Ticket as TicketIcon,
  Filter,
  User,
  Calendar,
  Undo2,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/lib/api-client";
import { toast } from "react-hot-toast";

type Ticket = {
  _id: string;
  ticketNumber: string;
  customerName?: string;
  customerEmail: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
  purchaseId?: {
    customerName: string;
    customerEmail: string;
  };
};

type Event = {
  id: string;
  title: string;
  eventCode: string;
  status: string;
  stats: {
    ticketsSold: number;
    revenue: number;
  };
};

interface Props {
  events: Event[];
}

export default function TicketManagementClient({ events }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events.length > 0 ? events[0].id : ""
  );
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "USED" | "UNUSED">("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [limit] = useState(10);

  const fetchTickets = useCallback(async (page: number = 1) => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await api.get(`/tickets/events/${selectedEventId}`, {
        params: {
          page,
          limit,
          query: searchQuery,
          status: statusFilter
        }
      });
      
      if (res && res.pagination) {
        setTickets(res.data || []);
        setPagination(res.pagination);
      } else {
        setTickets(Array.isArray(res) ? res : []);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, searchQuery, statusFilter, limit]);

  useEffect(() => {
    fetchTickets(1);
  }, [selectedEventId, searchQuery, statusFilter]);

  const handleToggleUsage = async (ticketNumber: string, currentStatus: boolean) => {
    setTogglingId(ticketNumber);
    try {
      await api.patch("/tickets/toggle-usage", { ticketNumber });
      setTickets((prev) =>
        prev.map((t) =>
          t.ticketNumber === ticketNumber
            ? { ...t, isUsed: !currentStatus, usedAt: !currentStatus ? new Date().toISOString() : undefined }
            : t
        )
      );
      toast.success(currentStatus ? "Ticket marked as unused" : "Ticket check-in successful");
    } catch {
      toast.error("Failed to update ticket status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSyncStats = async () => {
    if (!selectedEventId) return;
    setSyncing(true);
    try {
      const res = await api.post(`/reconciliation/sync-tickets/${selectedEventId}`);
      toast.success(res.message || "Statistics synchronized successfully");
      // Optional: Refresh the page to show new aggregate stats in the parent component
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to sync statistics");
    } finally {
      setSyncing(false);
    }
  };

  // Filtering is now handled on the server side
  const displayTickets = tickets;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Event Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             <TicketIcon className="text-primary-600" size={24} /> Ticket Management
          </h2>
          <p className="text-sm text-slate-500 font-medium">Select an event to validate and manage guest check-ins.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncStats}
            disabled={syncing || !selectedEventId}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-2xl font-bold transition-all disabled:opacity-50"
            title="Recalculate and sync ticket statistics from the ledger"
          >
            {syncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            <span className="hidden sm:inline">Sync Stats</span>
          </button>

          <div className="relative min-w-[250px]">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 font-bold py-3 pl-4 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer transition-all"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, email, or ticket code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <Filter size={18} className="text-slate-400 ml-2" />
          <div className="flex gap-1">
            {["ALL", "USED", "UNUSED"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f as any)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all",
                  statusFilter === f
                    ? "bg-primary-600 text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[11px] uppercase text-slate-400 font-black tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 w-16">#</th>
                <th className="px-8 py-5">Guest / Customer</th>
                <th className="px-8 py-5">Ticket Code</th>
                <th className="px-8 py-5">Purchased On</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
                    <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading ticket ledger...</p>
                  </td>
                </tr>
              ) : displayTickets.length > 0 ? (
                displayTickets.map((ticket, i) => (
                  <tr key={ticket._id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-slate-300 group-hover:text-primary-500 transition-colors">
                        {String((pagination.currentPage - 1) * limit + i + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shadow-inner">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{ticket.customerName || ticket.purchaseId?.customerName || "N/A"}</div>
                          <div className="text-xs text-slate-400 font-medium">{ticket.customerEmail || ticket.purchaseId?.customerEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <code className="text-xs font-black bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 tracking-wider group-hover:bg-primary-50 group-hover:text-primary-700 transition-colors">
                        {ticket.ticketNumber}
                      </code>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <Calendar size={14} className="text-slate-300" />
                        {new Date(ticket.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {ticket.isUsed ? (
                        <div className="flex flex-col">
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-tighter">
                            <Check size={12} strokeWidth={3} /> Used
                          </span>
                          {ticket.usedAt && (
                            <span className="text-[9px] text-slate-400 font-medium mt-1">
                              @ {new Date(ticket.usedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-tighter">
                          Valid
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => handleToggleUsage(ticket.ticketNumber, ticket.isUsed)}
                        disabled={togglingId === ticket.ticketNumber}
                        className={clsx(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 disabled:opacity-50",
                          ticket.isUsed
                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            : "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/20"
                        )}
                      >
                        {togglingId === ticket.ticketNumber ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : ticket.isUsed ? (
                          <><Undo2 size={14} /> Undo Check-in</>
                        ) : (
                          <><CheckCircle2 size={14} /> Mark as Used</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <XCircle className="w-16 h-16 text-slate-100" />
                       <div className="text-center">
                          <p className="text-slate-900 font-bold">No tickets matches your search</p>
                          <p className="text-sm text-slate-400 font-medium">Try adjusting your filters or search keywords.</p>
                       </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900 font-black">{(pagination.currentPage - 1) * limit + 1}</span> to{" "}
            <span className="text-slate-900 font-black">
              {Math.min(pagination.currentPage * limit, pagination.totalItems)}
            </span>{" "}
            of <span className="text-slate-900 font-black">{pagination.totalItems}</span> tickets
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTickets(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev || loading}
              className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => {
                  // Show current, first, last, and neighbors
                  return p === 1 || p === pagination.totalPages || Math.abs(p - pagination.currentPage) <= 1;
                })
                .map((p, idx, arr) => (
                  <div key={p} className="flex items-center">
                    {idx > 0 && p - arr[idx - 1] > 1 && (
                      <span className="px-2 text-slate-300">...</span>
                    )}
                    <button
                      onClick={() => fetchTickets(p)}
                      className={clsx(
                        "w-10 h-10 rounded-xl text-xs font-black transition-all",
                        pagination.currentPage === p
                          ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {p}
                    </button>
                  </div>
                ))}
            </div>

            <button
              onClick={() => fetchTickets(pagination.currentPage + 1)}
              disabled={!pagination.hasNext || loading}
              className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
