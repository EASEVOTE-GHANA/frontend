"use client";

import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function NominationError({
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Nomination form unavailable
          </h1>
          <p className="text-slate-500 text-sm">
            We couldn&apos;t load the nomination form. Nominations may be closed or the link may be invalid.
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
            href="/events/voting"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={16} /> Browse Events
          </Link>
        </div>
      </div>
    </div>
  );
}
