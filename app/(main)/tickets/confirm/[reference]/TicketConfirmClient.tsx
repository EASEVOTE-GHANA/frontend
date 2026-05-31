"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, ArrowRight } from "lucide-react";

interface TicketConfirmClientProps {
  reference: string;
  initialStatus: string;
  initialData?: any;
}

export default function TicketConfirmClient({
  reference,
  initialStatus,
  initialData,
}: TicketConfirmClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [ticketData, setTicketData] = useState<any>(initialData);

  useEffect(() => {
    // Perform a single check on mount if pending
    if (status !== "PENDING") return;

    const verifyTransaction = async () => {
      try {
        const res = await fetch(`/api/proxy/purchases/verify/${reference}`);
        const data = await res.json();
        const transaction = data.data || data.purchase || data;

        if (transaction.status === "PAID" || transaction.status === "SUCCESS") {
          setStatus("SUCCESS");
          setTicketData(transaction);
        } else if (transaction.status === "FAILED") {
          setStatus("FAILED");
        }
      } catch {
        // Verification poll failed — will retry
      }
    };

    verifyTransaction();
  }, [reference, status]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-md w-full p-8 text-center">
        {status === "PENDING" && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 size={40} className="animate-spin" />
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">
              Verifying Payment
            </h2>
            <p className="text-slate-500 mb-6">
              Please wait while we confirm your ticket purchase...
            </p>
          </div>
        )}

        {status === "SUCCESS" && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 border-4 border-green-500/20 rounded-full animate-ping"></div>
              <Check size={40} className="animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold font-display text-slate-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-slate-500 mb-6">
              Your tickets are secured. An email receipt has been sent to you.
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left border border-gray-100">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Transaction Details
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-sm">Reference</span>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {reference}
                  </span>
                </div>
                {ticketData?.amount && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Amount Paid</span>
                    <span className="font-bold text-slate-900">
                      GHS {ticketData.amount}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => router.push("/events/ticketing")}
              className="w-full bg-primary-700 text-white font-bold py-4 rounded-full shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Browse More Events <ArrowRight size={18} />
            </button>
          </div>
        )}

        {status === "FAILED" && (
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <X size={40} />
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-slate-500 mb-8">
              We couldn't verify your transaction. Your account has not been
              charged. Please try again or contact support if the issue
              persists.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => router.back()}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-full shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push("/events/voting")}
                className="w-full bg-white text-slate-500 font-bold py-4 rounded-full border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98]"
              >
                Return to Events
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
