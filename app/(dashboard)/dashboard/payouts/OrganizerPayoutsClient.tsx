"use client";

import { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  Search,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Clock
} from "lucide-react";
import { clsx } from "clsx";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface OrganizerPayoutsClientProps {
  stats: {
    balance: number;
    totalRevenue: number;
    totalWithdrawn: number;
  };
  initialPayouts: any[];
}

export default function OrganizerPayoutsClient({
  stats,
  initialPayouts,
}: OrganizerPayoutsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({
    method: "momo" as "momo" | "bank",
    accountName: "",
    accountNumber: "",
    bankOrNetwork: ""
  });
  const [error, setError] = useState("");

  const filteredPayouts = initialPayouts.filter((p) =>
    p.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      router.refresh(); 
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
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
      <span className={clsx("px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-tighter", style)}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payout History</h1>
        <p className="text-slate-500 font-medium">Manage your requests and track your available balance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-magenta-500/20 rounded-full blur-[80px]"></div>
          <div className="relative z-10">
            <p className="text-slate-400 font-bold mb-1 uppercase text-xs tracking-widest">Available Balance</p>
            <h2 className="text-5xl font-black tracking-tighter mb-8">GHS {stats.balance.toFixed(2)}</h2>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={stats.balance <= 0}
                className="flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-magenta-50 transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                Request Payout <ArrowUpRight size={20} />
              </button>
              <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Withdrawn</p>
                 <p className="font-bold">GHS {stats.totalWithdrawn.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-50 text-primary-700 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <span className="text-slate-500 font-black uppercase text-xs tracking-widest">Total Revenue</span>
          </div>
          <p className="text-4xl font-black text-slate-900 tracking-tighter">GHS {stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 justify-between items-center">
          <h3 className="text-xl font-black text-slate-900">Withdrawal History</h3>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[11px] uppercase text-slate-400 font-black tracking-widest">
              <tr>
                <th className="px-8 py-5">Reference</th>
                <th className="px-8 py-5">Method</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayouts.map((p) => (
                <tr key={p._id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 font-bold text-slate-900">{p.reference}</td>
                  <td className="px-8 py-6 capitalize font-medium text-slate-600">
                    {p.paymentDetails.method} • {p.paymentDetails.bankOrNetwork}
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-500 font-medium">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 italic">GHS {p.amount.toFixed(2)}</td>
                  <td className="px-8 py-6"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
              {filteredPayouts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                    No payout records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Request Payout</h3>
                        <p className="text-slate-500 text-sm font-medium">Available: GHS {stats.balance.toFixed(2)}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"><X size={24} /></button>
                </div>
                <form onSubmit={handleRequestPayout} className="p-8 space-y-6">
                    {error && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"><AlertCircle size={18} />{error}</div>}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Amount (GHS)</label>
                        <input 
                            type="number" step="0.01" placeholder="0.00" required value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all font-bold text-lg"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Method</label>
                            <select 
                                value={paymentDetails.method}
                                onChange={(e) => setPaymentDetails({...paymentDetails, method: e.target.value as any})}
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold outline-none"
                            >
                                <option value="momo">Momo</option>
                                <option value="bank">Bank</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Bank/Network</label>
                            <input 
                                type="text" placeholder="e.g. MTN" required value={paymentDetails.bankOrNetwork}
                                onChange={(e) => setPaymentDetails({...paymentDetails, bankOrNetwork: e.target.value})}
                                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Account Holder Name</label>
                        <input 
                            type="text" placeholder="Full legal name" required value={paymentDetails.accountName}
                            onChange={(e) => setPaymentDetails({...paymentDetails, accountName: e.target.value})}
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Account Number</label>
                        <input 
                            type="text" placeholder="Account or Phone number" required value={paymentDetails.accountNumber}
                            onChange={(e) => setPaymentDetails({...paymentDetails, accountNumber: e.target.value})}
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold outline-none"
                        />
                    </div>
                    <button
                        type="submit" disabled={isSubmitting}
                        className="w-full py-5 bg-primary-700 text-white rounded-3xl font-black text-lg hover:bg-primary-800 transition-all hover:scale-[1.02] shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? <><Loader2 className="animate-spin" size={24} /> Processing...</> : <><CheckCircle2 size={24} /> Submit Request</>}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
