"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  ChevronDown,
  Eye,
  X,
  CreditCard,
  Building2,
  Phone,
  Calendar,
  AlertCircle,
  MoreVertical
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/lib/api-client";
import { useModal } from "@/components/providers/ModalProvider";
import { useRouter } from "next/navigation";

interface AdminPayoutsClientProps {
  initialPayouts: any[];
}

export default function AdminPayoutsClient({ initialPayouts }: AdminPayoutsClientProps) {
  const router = useRouter();
  const modal = useModal();
  const [payouts, setPayouts] = useState(initialPayouts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Modal state
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [stagedStatus, setStagedStatus] = useState<string>("PENDING");

  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch = 
      p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organizerId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organizerId?.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paymentDetails?.accountName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (payoutId: string, status: string) => {
    const notes = await modal.prompt({
      title: "Update Payout Status",
      message: `You are marking this payout as "${status}". Enter any notes for this update (optional):`,
      variant: status === "REJECTED" ? "danger" : "info",
      confirmText: `Mark as ${status}`,
      placeholder: "Admin notes (optional)...",
    });
    // notes === null means user cancelled
    if (notes === null) return;
    setProcessingId(payoutId);
    
    try {
      await api.patch(`/payouts/admin/${payoutId}`, {
        status,
        adminNotes: notes || ""
      });
      router.refresh();
      // Optimistic update
      setPayouts(prev => prev.map(p => p._id === payoutId ? { ...p, status } : p));
      
      // Update selected payout if modal is open
      if (selectedPayout && selectedPayout._id === payoutId) {
          setSelectedPayout((prev: any) => ({ ...prev, status }));
      }
    } catch (err: any) {
      modal.alert({ title: "Update Failed", message: err.message || "Failed to update payout status", variant: "danger" });
    } finally {
      setProcessingId(null);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      PAID: "bg-green-100 text-green-700 border-green-200",
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
      PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
      REJECTED: "bg-red-100 text-red-700 border-red-200",
    };
    const style = styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700";

    return (
      <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-black border capitalize tracking-widest whitespace-nowrap", style)}>
        {status.toLowerCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payout Management</h1>
        <p className="text-sm text-slate-500 font-medium">Review and process withdrawal requests from organizers.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-200 w-full sm:w-72 shadow-sm">
                <Search size={16} className="text-slate-400" />
                <input
                    type="text"
                    placeholder="Search ref, name, or business..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs w-full font-medium"
                />
             </div>
             <div className="relative group">
                <button className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition shadow-sm font-bold text-xs">
                    <Filter size={14} />
                    <span className="hidden sm:inline">{filterStatus === "ALL" ? "All Statuses" : filterStatus}</span>
                    <span className="sm:hidden">{filterStatus === "ALL" ? "All" : filterStatus}</span>
                    <ChevronDown size={14} />
                </button>
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-10 p-1.5">
                    {["ALL", "PENDING", "PROCESSING", "PAID", "REJECTED"].map(s => (
                        <button 
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={clsx(
                                "w-full text-left px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition",
                                filterStatus === s ? "text-primary-700 bg-primary-50" : "text-slate-600"
                            )}
                        >
                            {s === "ALL" ? "All Statuses" : s}
                        </button>
                    ))}
                </div>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50/80 text-[10px] uppercase text-slate-400 font-black tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Ref / Date</th>
                <th className="px-6 py-4">Organizer</th>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4 whitespace-nowrap">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredPayouts.map((p) => (
                <tr key={p._id} className="group hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 align-top">
                    <div className="font-bold text-slate-900 text-xs mb-0.5 uppercase tracking-wide">{p.reference}</div>
                    <div className="text-[10px] text-slate-500 font-medium">
                        {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top max-w-[180px]">
                    <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-400 mt-0.5">
                            <User size={14} />
                        </div>
                        <div className="overflow-hidden">
                            <div className="font-bold text-slate-900 text-xs truncate">{p.organizerId?.fullName || "Deleted User"}</div>
                            <div className="text-[10px] text-slate-500 font-medium truncate">{p.organizerId?.businessName || p.organizerId?.email}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top max-w-[180px]">
                    <div className="font-bold text-slate-900 text-xs truncate" title={p.eventId?.title}>{p.eventId?.title || "N/A"}</div>
                    <div className="text-[9px] text-slate-400 font-black tracking-widest uppercase truncate">{p.eventId?.eventCode || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 align-top whitespace-nowrap">
                    <div className="font-black text-slate-900 text-xs">GHS {p.amount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-4 align-top text-right">
                     <div className="flex items-center justify-end gap-1.5">
                        {processingId === p._id ? (
                            <div className="p-1.5"><Loader2 className="animate-spin text-slate-400" size={16} /></div>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPayout(p);
                                    setStagedStatus(p.status);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex items-center gap-1.5"
                                title="View Details"
                            >
                                <Eye size={14} /> View Details
                            </button>
                        )}
                     </div>
                  </td>
                </tr>
              ))}
              {filteredPayouts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No payout requests found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedPayout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedPayout(null)}></div>
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                              Payout Details
                          </h3>
                          <p className="text-xs font-bold text-slate-500 font-mono mt-1 uppercase tracking-widest">{selectedPayout.reference}</p>
                      </div>
                      <button onClick={() => setSelectedPayout(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                              <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Building2 size={12}/> Event Info</p>
                                  <p className="text-sm font-bold text-slate-900">{selectedPayout.eventId?.title}</p>
                                  <p className="text-xs font-medium text-slate-500">{selectedPayout.eventId?.eventCode}</p>
                              </div>
                              <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><User size={12}/> Organizer Info</p>
                                  <p className="text-sm font-bold text-slate-900">{selectedPayout.organizerId?.fullName}</p>
                                  <p className="text-xs font-medium text-slate-500">{selectedPayout.organizerId?.email}</p>
                                  <p className="text-xs font-medium text-slate-500">{selectedPayout.organizerId?.phone || 'No phone'}</p>
                              </div>
                          </div>
                          
                          <div className="space-y-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                              <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><CreditCard size={12}/> Payment Details</p>
                                  <p className="text-sm font-bold text-slate-900">{selectedPayout.paymentDetails?.method?.toUpperCase()} • {selectedPayout.paymentDetails?.bankOrNetwork}</p>
                                  <div className="mt-2 space-y-1">
                                      <p className="text-xs font-medium text-slate-600 flex justify-between"><span>Account Name:</span> <span className="font-bold text-slate-900 text-right">{selectedPayout.paymentDetails?.accountName}</span></p>
                                      <p className="text-xs font-medium text-slate-600 flex justify-between"><span>Account No:</span> <span className="font-bold text-slate-900 text-right">{selectedPayout.paymentDetails?.accountNumber}</span></p>
                                  </div>
                              </div>
                              <div className="pt-3 border-t border-slate-200">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested Amount</p>
                                  <p className="text-2xl font-black text-slate-900">GHS {selectedPayout.amount.toFixed(2)}</p>
                                  <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                                      <Calendar size={10} /> Requested on {new Date(selectedPayout.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                  </p>
                              </div>
                          </div>
                      </div>
                      
                      {selectedPayout.adminNotes && (
                          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><AlertCircle size={12}/> Admin Notes</p>
                              <p className="text-xs font-medium text-amber-900">{selectedPayout.adminNotes}</p>
                          </div>
                      )}
                      
                      <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Update Status</p>
                              <p className="text-xs font-medium text-slate-500">Select a new status to update the payout.</p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                              <div className="flex bg-slate-100 p-1.5 rounded-full border border-slate-200">
                                  {["PENDING", "PROCESSING", "PAID", "REJECTED"].map((status) => (
                                      <button
                                          key={status}
                                          onClick={() => setStagedStatus(status)}
                                          disabled={processingId === selectedPayout._id}
                                          className={clsx(
                                              "px-4 py-1.5 text-[10px] sm:text-xs font-black rounded-full transition-all capitalize tracking-widest disabled:opacity-50",
                                              stagedStatus === status
                                                  ? status === "PAID" ? "bg-green-100 text-green-700 shadow-sm border border-green-200"
                                                  : status === "PROCESSING" ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                                                  : status === "PENDING" ? "bg-yellow-100 text-yellow-700 shadow-sm border border-yellow-200"
                                                  : "bg-red-100 text-red-700 shadow-sm border border-red-200"
                                                  : "text-slate-500 hover:text-slate-900 border border-transparent"
                                          )}
                                      >
                                          {status.toLowerCase()}
                                      </button>
                                  ))}
                              </div>
                              <button
                                  onClick={() => handleUpdateStatus(selectedPayout._id, stagedStatus)}
                                  disabled={processingId === selectedPayout._id || stagedStatus === selectedPayout.status}
                                  className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-full transition-all shadow-md disabled:shadow-none"
                              >
                                  {processingId === selectedPayout._id ? (
                                      <><Loader2 size={14} className="animate-spin" /> Saving</>
                                  ) : (
                                      "Save"
                                  )}
                              </button>
                          </div>
                      </div>
                      
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
