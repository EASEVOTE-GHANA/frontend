"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Loader2,
  User,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface AdminPayoutsClientProps {
  initialPayouts: any[];
}

export default function AdminPayoutsClient({ initialPayouts }: AdminPayoutsClientProps) {
  const router = useRouter();
  const [payouts, setPayouts] = useState(initialPayouts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch = 
      p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organizerId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.organizerId?.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (payoutId: string, status: string) => {
    const notes = window.prompt("Enter any notes for this status update (optional):");
    setProcessingId(payoutId);
    
    try {
      await api.patch(`/payouts/admin/${payoutId}`, {
        status,
        adminNotes: notes || ""
      });
      router.refresh();
      // Optimistic update
      setPayouts(prev => prev.map(p => p._id === payoutId ? { ...p, status } : p));
    } catch (err: any) {
      alert(err.message || "Failed to update payout status");
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
      <span className={clsx("px-2 py-1 rounded text-[10px] font-black border uppercase tracking-widest", style)}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payout Management</h1>
        <p className="text-slate-500 font-medium">Review and process withdrawal requests from organizers.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-100 w-full md:w-80 shadow-sm">
                <Search size={18} className="text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by ref or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-full font-medium"
                />
             </div>
             <div className="relative group">
                <button className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition shadow-sm font-bold text-sm">
                    <Filter size={18} />
                    {filterStatus === "ALL" ? "All Statuses" : filterStatus}
                    <ChevronDown size={16} />
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-10 p-2">
                    {["ALL", "PENDING", "PROCESSING", "PAID", "REJECTED"].map(s => (
                        <button 
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={clsx(
                                "w-full text-left px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition",
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
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-[11px] uppercase text-slate-400 font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Organizer</th>
                <th className="px-8 py-5">Payout Details</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayouts.map((p) => (
                <tr key={p._id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-900">{p.organizerId?.fullName || "Deleted User"}</div>
                            <div className="text-xs text-slate-500 font-medium">{p.organizerId?.businessName || p.organizerId?.email}</div>
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-700 text-sm mb-1">{p.paymentDetails.method.toUpperCase()} • {p.paymentDetails.bankOrNetwork}</div>
                    <div className="text-[10px] text-slate-400 font-black tracking-widest">{p.paymentDetails.accountNumber}</div>
                    <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">{p.paymentDetails.accountName}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-900 italic">GHS {p.amount.toFixed(2)}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">{p.reference}</div>
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-8 py-6 text-right">
                    {p.status === "PAID" || p.status === "REJECTED" ? (
                        <div className="text-xs text-slate-400 font-bold uppercase italic px-4 py-2">Finalized</div>
                    ) : (
                        <div className="flex items-center justify-end gap-2">
                             {processingId === p._id ? (
                                <Loader2 className="animate-spin text-slate-400" size={20} />
                             ) : (
                                <>
                                    <button 
                                        onClick={() => handleUpdateStatus(p._id, "PAID")}
                                        className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all title-paid"
                                        title="Mark as Paid"
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(p._id, "PROCESSING")}
                                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                                        title="Mark as Processing"
                                    >
                                        <Loader2 size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleUpdateStatus(p._id, "REJECTED")}
                                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                                        title="Reject"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </>
                             )}
                        </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPayouts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                    No payout requests to manage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
