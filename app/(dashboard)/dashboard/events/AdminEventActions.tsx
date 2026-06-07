"use client";

import { api } from "@/lib/api-client";
import { CheckCircle, XCircle, AlertCircle, PauseCircle, Send, Trash2, Zap, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { useModal } from "@/components/providers/ModalProvider";
import toast from "react-hot-toast";

type Props = {
  eventId: string;
  eventCode?: string;
  eventType?: string;
  status: string;
  role?: "ADMIN" | "SUPER_ADMIN" | "ORGANIZER";
  onStatusChange?: (status: string) => void;
};

export default function AdminEventActions({ eventId, eventCode, eventType, status, role, onStatusChange }: Props) {
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isOrganizer = role === "ORGANIZER";
  const router = useRouter();
  const modal = useModal();
  const [isPending, startTransition] = useTransition();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleShare = async () => {
    try {
      const isTicketing = eventType === "TICKETING";
      const basePath = isTicketing ? "/events/tickets" : "/events";
      const url = `${window.location.origin}${basePath}/${eventCode || eventId}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };


  const handleAction = async (action: string) => {
    const actionLabels: Record<string, { title: string; message: string; variant: "danger" | "warning" | "info" }> = {
      approve: { title: "Approve Event", message: "Are you sure you want to approve this event? It will go live.", variant: "info" },
      suspend: { title: "Suspend Event", message: "Are you sure you want to suspend this event? It will be paused for all users.", variant: "warning" },
      resume: { title: "Resume Event", message: "Are you sure you want to resume this event? It will go live again.", variant: "info" },
      submit: { title: "Submit for Review", message: "Are you sure you want to submit this event for review? You won't be able to edit some core details while it's under review.", variant: "info" },
      delete: { title: "Delete Event", message: "Are you sure you want to PERMANENTLY delete this event? This action is irreversible and all data will be lost.", variant: "danger" },
      publish: { title: "Publish Event", message: "Publish this event? If the voting start time has already passed, it will go live immediately. Otherwise it will go live automatically at the scheduled time.", variant: "info" },
    };

    const config = actionLabels[action] || { title: `${action} Event`, message: `Are you sure you want to ${action} this event?`, variant: "warning" as const };
    const confirmed = await modal.confirm({
      title: config.title,
      message: config.message,
      variant: config.variant,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
    });
    if (!confirmed) return;

    setLoadingAction(action);
    startTransition(async () => {
      let newStatus = "";
      switch (action) {
        case "approve":
          newStatus = "APPROVED";
          break;
        case "reject":
          newStatus = "CANCELLED";
          break;
        case "suspend":
          newStatus = "PAUSED";
          break;
        case "resume":
          newStatus = "LIVE";
          break;
        case "submit":
          newStatus = "PENDING_REVIEW";
          break;
        case "publish":
          newStatus = "PUBLISHED";
          break;
        case "delete":
          newStatus = "DELETED";
          break;
      }

      if (newStatus) {
        try {
          if (action === "approve") {
            await api.patch(`/events/${eventId}/approve`, {});
          } else if (action === "suspend") {
            await api.patch(`/events/${eventId}/suspend`, {});
          } else if (action === "resume") {
            const res = await api.patch(`/events/${eventId}/resume`, {});
            newStatus = res.status || newStatus;
          } else if (action === "submit") {
            await api.patch(`/events/${eventId}/submit`, {});
          } else if (action === "publish") {
            await api.patch(`/events/${eventId}/publish`, {});
          } else if (action === "delete") {
            await api.delete(`/events/${eventId}`);
            router.push("/dashboard/events");
            return;
          } else {
            await api.put(`/events/${eventId}`, { status: newStatus });
          }
          setCurrentStatus(newStatus);
          onStatusChange?.(newStatus);
          router.refresh();
        } catch (error: any) {
          await modal.alert({
            title: "Action Failed",
            message: error.message || "Failed to update status",
            variant: "danger",
          });
        }
      }
      setLoadingAction(null);
    });
  };

  if (currentStatus === "DRAFT") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 text-sm font-medium transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
        {isOrganizer && (
          <button
            disabled={isPending}
            onClick={() => handleAction("submit")}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loadingAction === "submit" ? (
              "Submitting..."
            ) : (
              <>
                <Send className="w-4 h-4" /> Submit for Review
              </>
            )}
          </button>
        )}

        <button
          disabled={isPending}
          onClick={() => handleAction("delete")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {loadingAction === "delete" ? (
            "Deleting..."
          ) : (
            <>
              <Trash2 className="w-4 h-4" /> Delete Draft
            </>
          )}
        </button>
      </div>
    );
  }

  if (currentStatus === "PENDING_REVIEW") {
    return (
      <div className="flex items-center gap-2">
        {isAdmin && (
          <>
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
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg cursor-not-allowed text-sm font-medium transition-colors"
              title="Rejection endpoint is currently being finalized"
            >
              <XCircle className="w-4 h-4" /> Reject (Planned)
            </button>
          </>
        )}

        <button
          disabled={isPending}
          onClick={() => handleAction("delete")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {loadingAction === "delete" ? "Deleting..." : "Delete"}
        </button>
      </div>
    );
  }

  if (currentStatus === "APPROVED") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 text-sm font-medium transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
        {isOrganizer && (
          <button
            disabled={isPending}
            onClick={() => handleAction("publish")}
            className="flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loadingAction === "publish" ? "Publishing..." : "Publish"}
          </button>
        )}

        <button
          disabled={isPending}
          onClick={() => handleAction("delete")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {loadingAction === "delete" ? "Deleting..." : "Delete"}
        </button>
      </div>
    );
  }  if (currentStatus === "PUBLISHED") {
    return (
      <div className="flex items-center gap-2">
        <button
          disabled={isPending}
          onClick={() => handleAction("suspend")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {loadingAction === "suspend" ? "Suspending..." : "Suspend"}
        </button>
      </div>
    );
  }

  if (currentStatus === "LIVE") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share Event
        </button>
        <button
          disabled={isPending}
          onClick={() => handleAction("suspend")}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-primary-200 text-primary-600 rounded-lg hover:bg-primary-50 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {loadingAction === "suspend" ? (
            "Processing..."
          ) : (
            <>
              <PauseCircle className="w-4 h-4" /> Suspend Event
            </>
          )}
        </button>
      </div>
    );
  }

  if (currentStatus === "PAUSED") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share Event
        </button>
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
      </div>
    );
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all font-bold"
    >
      <Share2 className="w-5 h-5" /> Share Event
    </button>
  );

  return null;
}
