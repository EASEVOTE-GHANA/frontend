"use client";

import React, { useTransition } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useModal } from "@/components/providers/ModalProvider";

interface RestoreButtonProps {
  eventId: string;
}

export default function RestoreButton({ eventId }: RestoreButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const modal = useModal();

  const handleRestore = async () => {
    const confirmed = await modal.confirm({
      title: "Restore Event",
      message: "Are you sure you want to restore this event?",
      variant: "info",
      confirmText: "Restore",
    });
    if (!confirmed) return;

    startTransition(async () => {
      try {
        const res = await api.post(`/events/${eventId}/restore`);
        if (res) {
          router.refresh();
        }
      } catch (error: any) {
        modal.alert({
          title: "Restore Failed",
          message: error.message || "Failed to restore event. Please try again.",
          variant: "danger",
        });
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
          : "bg-primary-50 text-primary-700 hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-600 focus-visible:ring-offset-1"
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
