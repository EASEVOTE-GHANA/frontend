import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { createServerApiClient } from "@/lib/api-client";

import VoteVerifyPolling from "./VoteVerifyPolling";

export default async function VoteConfirmationPage({
  params,
}: {
  params: Promise<{ transactionRef: string }>;
}) {
  const { transactionRef } = await params;

  // Public page — no auth token needed
  const apiClient = createServerApiClient();
  const apiRes = await apiClient.get<any>(`/purchases/verify/${transactionRef}`).catch(() => null);
  
  // Keep the full response so we don't lose eventTitle/candidateName
  const transactionResponse = apiRes?.data || apiRes || {};
  const purchase = transactionResponse.purchase || (transactionResponse.status ? transactionResponse : null);

  const isSuccess = purchase?.status === "PAID" || purchase?.status === "SUCCESS" || purchase?.status === "COMPLETED";

  // Auto-Correction: If this was actually a ticket, redirect to the ticket confirmation
  if (purchase && purchase.type === "TICKET") {
    const redirectUrl = `/tickets/confirm/${transactionRef}`;
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mb-4 mx-auto" size={32} />
          <p className="text-slate-500 font-medium">Redirecting to ticket confirmation...</p>
          <meta httpEquiv="refresh" content={`0;url=${redirectUrl}`} />
        </div>
      </div>
    );
  }

  if (!purchase || !isSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Loader2 size={40} className="animate-spin" />
        </div>
        <h1 className="text-2xl font-bold mb-2 text-slate-900">Checking Payment Status...</h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          We're verifying your transaction with Paystack. Please stay on this page while we confirm your votes.
        </p>

        <VoteVerifyPolling 
          transactionRef={transactionRef} 
          initialStatus={purchase?.status || "PENDING"} 
          eventCode={purchase?.eventCode || ""}
        />

        <Link
          href="/"
          className="mt-8 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          Return Home
        </Link>
      </div>
    );
  }

  // Data resolution: Handle both the raw Purchase object and the enriched response
  const meta: any = purchase.metadata || {};
  
  const candidateName = transactionResponse.candidateName || meta.candidateName || 'your selected candidate';
  const eventTitle = transactionResponse.eventTitle || meta.eventTitle || 'the event';
  const eventCode = transactionResponse.eventCode || meta.eventCode || purchase.eventCode;
  
  // Try different field names for flexibility
  const voteCount = purchase.voteCount || meta.voteCount || meta.quantity || 1;
  const paymentRef = purchase.paymentReference || purchase.reference || 'N/A';

  return (
    <div className="min-h-[80vh] py-24 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={40} />
      </div>
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-3 tracking-tight">Vote Successful!</h1>
      <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
        You have successfully cast your support for <span className="font-bold text-primary-700">{candidateName}</span>. Your contribution has been recorded in real-time.
      </p>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-8 w-full max-w-sm shadow-sm mx-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-left">Transaction Details</p>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm text-left">
            <span className="text-slate-500">Amount Paid</span>
            <span className="font-bold text-slate-900">GHS {Number(purchase.amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-left">
            <span className="text-slate-500">Votes Cast</span>
            <span className="font-bold text-slate-900">{voteCount}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-slate-50 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Reference</span>
            <span className="font-mono text-[11px] text-slate-600 select-all">{paymentRef}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs mx-auto mt-4 mb-20">
        <Link
          href={eventCode ? `/events/${eventCode}` : "/events/voting"}
          className="text-primary-600 font-bold hover:text-primary-700 underline underline-offset-4 transition-colors"
        >
          {eventTitle !== 'the event' ? `Back to ${eventTitle}` : "View Other Events"}
        </Link>
      </div>
    </div>
  );
}
