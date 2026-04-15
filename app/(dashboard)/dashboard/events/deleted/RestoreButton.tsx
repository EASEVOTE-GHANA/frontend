"use client";

import React, { useTransition } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

interface RestoreButtonProps {
  eventId: string;
}

export default function RestoreButton({ eventId }: RestoreButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRestore = async () => {
    if (!confirm("Are you sure you want to restore this event?")) return;

    startTransition(async () => {
      try {
        const res = await api.post(`/events/${eventId}/restore`);
        if (res) {
          router.refresh();
        }
      } catch (error: any) {
        console.error("Failed to restore event:", error);
        alert(error.message || "Failed to restore event. Please try again.");
      }
    });
  };

  return (
    <button
      onClick={handleRestore}
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
        isPending
          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
      }`}
      title="Restore this event to active state"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RotateCcw className="h-4 w-4" />
      )}
      {isPending ? "Restoring..." : "Restore"}
    </button>
  );
}
