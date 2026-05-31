"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";

/**
 * PaymentCallbackHandler
 * This page handles the incoming redirect from Paystack after a successful payment.
 * It extracts the reference from query parameters and routes the user to the proper confirmation page.
 */
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  // Paystack typically sends both 'reference' and 'trxref'
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  useEffect(() => {
    if (!reference) {
      router.replace("/");
      return;
    }

    const resolveAndRedirect = async () => {
      try {
        // Use the verify endpoint to get the purchase type
        const res = await api.get(`/purchases/verify/${reference}`);
        const transaction = res.data || res.purchase || res;

        if (transaction.type === "TICKET") {
          router.replace(`/tickets/confirm/${reference}`);
        } else {
          // Default to vote confirmation
          router.replace(`/vote/confirm/${reference}`);
        }
      } catch {
        // Fallback to home if we can't resolve it
        setError("We couldn't determine your purchase details. Redirecting home in a few seconds...");
        setTimeout(() => router.replace("/"), 3000);
      }
    };

    resolveAndRedirect();
  }, [reference, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-100 flex flex-col items-center space-y-6 max-w-sm w-full text-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
              <AlertCircle size={32} />
            </div>
            <div>
               <h1 className="text-xl font-bold text-slate-900 mb-2">Resolution Error</h1>
               <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <div className="w-20 h-20 bg-indigo-50 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-slate-900 mb-2 tracking-tight">Finalizing Purchase</h1>
              <p className="text-slate-500 text-sm leading-relaxed px-4">Securely connecting to our servers to verify your transaction status.</p>
            </div>
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50/50 px-4 py-1.5 rounded-full border border-indigo-100/50">
                Type Verification...
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
