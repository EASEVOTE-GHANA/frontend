"use client";

import React, { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useModal } from "@/components/providers/ModalProvider";

interface PermanentDeleteButtonProps {
  eventId: string;
}

export default function PermanentDeleteButton({ eventId }: PermanentDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const modal = useModal();

  const handleDelete = async () => {
    const confirmed = await modal.confirm({
      title: "Permanently Delete Event",
      message: "Are you sure you want to permanently delete this event? This action cannot be undone and all associated data will be lost.",
      variant: "danger",
      confirmText: "Delete Permanently",
    });
    if (!confirmed) return;

    startTransition(async () => {
      try {
        const res = await api.delete(`/events/${eventId}/permanent`);
        if (res) {
          router.refresh();
        }
      } catch (error: any) {
        modal.alert({
          title: "Deletion Failed",
          message: error.message || "Failed to permanently delete event. Please try again.",
          variant: "danger",
        });
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
        isPending
          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
          : "bg-red-50 text-red-700 hover:bg-red-100"
      }`}
      title="Permanently delete this event"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      {isPending ? "Deleting..." : "Permanent Delete"}
    </button>
  );
}
