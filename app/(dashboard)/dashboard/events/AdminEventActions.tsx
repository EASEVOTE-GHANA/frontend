"use client";

import { api } from "@/lib/api-client";
import { CheckCircle, XCircle, AlertCircle, PauseCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  eventId: string;
  status: string;
};

export default function AdminEventActions({ eventId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    if (!confirm(`Are you sure you want to ${action} this event?`)) return;

    setLoadingAction(action);
    startTransition(async () => {
      let newStatus = "";
      switch (action) {
        case "approve":
          newStatus = "APPROVED";
          break;
        case "reject":
          newStatus = "CANCELLED"; // Or REJECTED if enum exists, usually CANCELLED or stays PENDING with note. Schema has CANCELLED.
          break;
        case "suspend":
          newStatus = "PAUSED"; // Schema has PAUSED.
          break;
        case "resume":
          newStatus = "LIVE";
          break;
      }

      if (newStatus) {
        let endpoint = `/events/${eventId}/status`; // Fallback
        
        if (action === "approve") {
          endpoint = `/events/${eventId}/approve`;
        } else if (action === "resume") {
            endpoint = `/events/${eventId}/publish`;
        }

        try {
          const result = await api.patch(endpoint, { status: newStatus });
          if (!result.success && !result.id && !result._id) {
            alert(`Failed to ${action} event. The server may not support this action yet.`);
          } else {
            router.refresh();
          }
        } catch (error: any) {
            alert(`Error: ${error.message || "Failed to update status"}`);
        }
      }
      setLoadingAction(null);
    });
  };

  if (status === "PENDING_REVIEW") {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled={isPending}
          onClick={() => handleAction("approve")}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {loadingAction === "approve" ? (
            "Processing..."
          ) : (
            <>
              <CheckCircle className="w-4 h-4" /> Approve
            </>
          )}
        </button>
        {/* Reject endpoint not confirmed in latest API collection - hiding for safety */}
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg cursor-not-allowed text-sm font-medium transition-colors"
          title="Rejection endpoint is currently being finalized"
        >
          <XCircle className="w-4 h-4" /> Reject (Planned)
        </button>
      </div>
    );
  }

  if (status === "LIVE" || status === "APPROVED") {
    return (
      <button
        disabled={isPending}
        onClick={() => handleAction("suspend")}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        {loadingAction === "suspend" ? (
          "Processing..."
        ) : (
          <>
            <PauseCircle className="w-4 h-4" /> Suspend Event
          </>
        )}
      </button>
    );
  }

  if (status === "PAUSED") {
    return (
      <button
        disabled={isPending}
        onClick={() => handleAction("resume")}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        {loadingAction === "resume" ? (
          "Processing..."
        ) : (
          <>
            <CheckCircle className="w-4 h-4" /> Resume Event
          </>
        )}
      </button>
    );
  }

  return null;
}
