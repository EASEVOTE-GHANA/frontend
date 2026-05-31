"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function TicketConfirmationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Couldn&apos;t load your ticket
          </h1>
          <p className="text-slate-400 text-sm">
            Your payment was processed but we couldn&apos;t display your ticket. Please check your email for the ticket or contact support.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-700 text-white rounded-xl text-sm font-bold hover:bg-primary-800 transition-colors"
          >
            <RefreshCw size={16} /> Try again
          </button>
          <Link
            href="/contact"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
