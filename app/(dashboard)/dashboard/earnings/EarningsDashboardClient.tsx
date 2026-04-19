"use client";

import { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Download,
  DollarSign,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Zap,
  ArrowRight
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";

type Transaction = {
  id: string;
  reference: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  eventName: string;
  customerName: string;
  paymentMethod: string;
};

interface DashboardProps {
  stats: {
    balance: number;
    totalRevenue: number;
    grossRevenue: number;
    totalWithdrawn: number;
    unverifiedRevenue?: number;
    hasGaps?: boolean;
  };
  transactions: Transaction[];
}

export default function EarningsDashboardClient({
  stats,
  transactions,
}: DashboardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Payout Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({
    method: "momo" as "momo" | "bank",
    accountName: "",
    accountNumber: "",
    bankOrNetwork: "MTN"
  });
  const [error, setError] = useState("");
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileSuccess, setReconcileSuccess] = useState(false);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter =
      filter === "ALL" ||
      (filter === "INFLOW" && ["VOTE", "TICKET"].includes(tx.type)) ||
      (filter === "OUTFLOW" && ["PAYOUT", "REFUND"].includes(tx.type));

    const matchesSearch =
      tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.eventName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const amount = parseFloat(payoutAmount);
      if (amount <= 0) throw new Error("Amount must be greater than 0");
      if (amount > stats.balance) throw new Error("Insufficient balance");
      if (!paymentDetails.accountNumber) throw new Error("Account number is required");

      await api.post("/payouts/request", {
        amount,
        paymentDetails
      });

      setIsModalOpen(false);
      setPayoutAmount("");
      router.refresh(); // Refresh server stats
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReconcileAll = async () => {
    setIsReconciling(true);
    setError("");
    try {
      // 1. Get gaps
      const gapsRes = await api.get("/reconciliation/gaps");
      const gaps = gapsRes.data || [];
      
      if (gaps.length === 0) {
        setReconcileSuccess(true);
        setTimeout(() => setReconcileSuccess(false), 3000);
        return;
      }

      // 2. Reconcile each
      for (const gap of gaps) {
        await api.post(`/reconciliation/reconcile/${gap.eventId}`);
      }

      setReconcileSuccess(true);
      setTimeout(() => setReconcileSuccess(false), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to reconcile revenue");
    } finally {
      setIsReconciling(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      PAID: "bg-green-100 text-green-700 border-green-200",
      COMPLETED: "bg-green-100 text-green-700 border-green-200",
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
      PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
      REJECTED: "bg-red-100 text-red-700 border-red-200",
      FAILED: "bg-red-100 text-red-700 border-red-200",
    };
    const style =
      styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700";

    return (
      <span
        className={clsx(
          "px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-tighter",
          style
        )}
      >
        {status.toLowerCase()}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Earnings & Payouts
          </h1>
          <p className="text-slate-500 font-medium">
            Track your revenue and financial history.
          </p>
        </div>
        <div className="flex gap-2">
        </div>
      </div>

      {/* Reconciliation Alert */}
      {stats.hasGaps && (
        <div className="bg-primary-50 border border-primary-100 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl text-primary-600 shadow-sm">
              <Zap size={24} className="fill-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Revenue Update Available</h3>
              <p className="text-sm text-slate-600 font-medium">
                We detected <span className="font-bold text-primary-700">GHS {stats.unverifiedRevenue?.toFixed(2)}</span> in revenue from your events (e.g. Sample Data) that isn't in your balance yet.
              </p>
            </div>
          </div>
          <button 
            onClick={handleReconcileAll}
            disabled={isReconciling}
            className={clsx(
                "flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all shadow-md active:scale-95 whitespace-nowrap",
                reconcileSuccess ? "bg-green-500 text-white" : "bg-primary-600 text-white hover:bg-primary-700"
            )}
          >
            {isReconciling ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Verifying...
              </>
            ) : reconcileSuccess ? (
              <>
                <CheckCircle2 size={20} /> Verified & Synced
              </>
            ) : (
              <>
                Verify & Sync Now <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Wallet & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Wallet Card */}
        <div className="md:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-[80px]"></div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 font-bold mb-1 uppercase text-xs tracking-widest">
                  Withdrawable Balance
                </p>
                <h2 className="text-5xl font-black tracking-tighter">
                  GHS {stats.balance.toFixed(2)}
                </h2>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <Wallet size={32} className="text-primary-400" />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-8">
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={stats.balance <= 0}
                className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-primary-50 transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                Request Payout <ArrowUpRight size={20} />
              </button>
              <div className="flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                 <div className="text-left">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Withdrawn</p>
                    <p className="font-bold">GHS {stats.totalWithdrawn.toFixed(2)}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-50 text-primary-700 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <div>
              <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest block">Total Verified Revenue</span>
              <p className="font-bold text-slate-900">GHS {stats.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <span className="text-slate-500 font-black uppercase text-xs tracking-widest">Organizer Net Share</span>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">
              GHS{" "}
              {stats.totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             <p className="text-xs text-slate-500 font-medium">Verified Earnings (After Commission)</p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Payout History
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Status of your withdrawal requests.</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-48 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[11px] uppercase text-slate-400 font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Reference</th>
                <th className="px-8 py-5">Payment Details</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-900 mb-1">{tx.reference}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Manual Process</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-700 text-sm">{tx.customerName}</div>
                    <div className="text-xs text-slate-500 font-medium">{tx.paymentMethod.toUpperCase()}</div>
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                    {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    })}
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 italic">
                    GHS {tx.amount.toFixed(2)}
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                            <Clock size={32} />
                         </div>
                         <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No payout requests found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                onClick={() => !isSubmitting && setIsModalOpen(false)}
            ></div>
            
            {/* Modal Content */}
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-scale-in">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Request Payout</h3>
                        <p className="text-slate-500 text-sm font-medium">Funds will be manually processed within 24-48 hours.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleRequestPayout} className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Amount to Withdraw (GHS)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold text-lg"
                                max={stats.balance}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 pl-1 italic">Maximum available: GHS {stats.balance.toFixed(2)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Method</label>
                            <select 
                                value={paymentDetails.method}
                                onChange={(e) => setPaymentDetails({...paymentDetails, method: e.target.value as any})}
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat"
                            >
                                <option value="momo">Mobile Money</option>
                                <option value="bank">Bank Account</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">{paymentDetails.method === 'momo' ? 'Network' : 'Bank Name'}</label>
                            <input 
                                type="text"
                                placeholder={paymentDetails.method === 'momo' ? 'e.g. MTN' : 'e.g. GCB'}
                                required
                                value={paymentDetails.bankOrNetwork}
                                onChange={(e) => setPaymentDetails({...paymentDetails, bankOrNetwork: e.target.value})}
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Account Holder Name</label>
                        <input 
                            type="text"
                            placeholder="Exact name on account"
                            required
                            value={paymentDetails.accountName}
                            onChange={(e) => setPaymentDetails({...paymentDetails, accountName: e.target.value})}
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Account / Phone Number</label>
                        <input 
                            type="text"
                            placeholder={paymentDetails.method === 'momo' ? '024XXXXXXXX' : 'Account Number'}
                            required
                            value={paymentDetails.accountNumber}
                            onChange={(e) => setPaymentDetails({...paymentDetails, accountNumber: e.target.value})}
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-primary-700 text-white rounded-3xl font-black text-lg hover:bg-primary-800 transition-all hover:scale-[1.02] shadow-xl shadow-primary-700/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="animate-spin" size={24} /> Submitting Request...</>
                        ) : (
                            <><CheckCircle2 size={24} /> Submit Payout Request</>
                        )}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
