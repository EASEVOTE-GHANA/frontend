"use client";

import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function TicketEventError({
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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Couldn&apos;t load this event
          </h1>
          <p className="text-slate-500 text-sm">
            The event may not be available right now. Please try again or browse other events.
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
            href="/events/ticketing"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={16} /> Browse Events
          </Link>
        </div>
      </div>
    </div>
  );
}
