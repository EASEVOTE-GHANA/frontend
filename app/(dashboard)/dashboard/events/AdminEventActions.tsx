"use client";

import { api } from "@/lib/api-client";
import { CheckCircle, XCircle, AlertCircle, PauseCircle, Send, Trash2, Zap, Share2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleShare = async () => {
    setIsOpen(false);
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
    setIsOpen(false);
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

  const getActions = () => {
    const actions = [];
    
    if (currentStatus === "DRAFT") {
      actions.push({ label: "Share", icon: Share2, onClick: handleShare, color: "text-slate-700" });
      if (isOrganizer) {
        actions.push({ label: "Submit for Review", icon: Send, onClick: () => handleAction("submit"), color: "text-primary-600" });
      }
      actions.push({ label: "Delete Draft", icon: Trash2, onClick: () => handleAction("delete"), color: "text-red-600" });
    } else if (currentStatus === "PENDING_REVIEW") {
      if (isAdmin) {
        actions.push({ label: "Approve", icon: CheckCircle, onClick: () => handleAction("approve"), color: "text-green-600" });
      }
      actions.push({ label: "Delete", icon: Trash2, onClick: () => handleAction("delete"), color: "text-red-600" });
    } else if (currentStatus === "APPROVED") {
      actions.push({ label: "Share", icon: Share2, onClick: handleShare, color: "text-slate-700" });
      if (isOrganizer) {
        actions.push({ label: "Publish", icon: Send, onClick: () => handleAction("publish"), color: "text-primary-600" });
      }
      actions.push({ label: "Delete", icon: Trash2, onClick: () => handleAction("delete"), color: "text-red-600" });
    } else if (currentStatus === "PUBLISHED") {
      actions.push({ label: "Share", icon: Share2, onClick: handleShare, color: "text-slate-700" });
      actions.push({ label: "Suspend", icon: PauseCircle, onClick: () => handleAction("suspend"), color: "text-amber-600" });
      actions.push({ label: "Delete", icon: Trash2, onClick: () => handleAction("delete"), color: "text-red-600" });
    } else if (currentStatus === "LIVE") {
      actions.push({ label: "Share Event", icon: Share2, onClick: handleShare, color: "text-slate-700" });
      actions.push({ label: "Suspend Event", icon: PauseCircle, onClick: () => handleAction("suspend"), color: "text-amber-600" });
      actions.push({ label: "Delete Event", icon: Trash2, onClick: () => handleAction("delete"), color: "text-red-600" });
    } else if (currentStatus === "PAUSED") {
      actions.push({ label: "Share Event", icon: Share2, onClick: handleShare, color: "text-slate-700" });
      actions.push({ label: "Resume Event", icon: CheckCircle, onClick: () => handleAction("resume"), color: "text-green-600" });
      actions.push({ label: "Delete Event", icon: Trash2, onClick: () => handleAction("delete"), color: "text-red-600" });
    } else if (currentStatus === "ENDED" || currentStatus === "COMPLETED") {
      actions.push({ label: "Share Event", icon: Share2, onClick: handleShare, color: "text-slate-700" });
      actions.push({ label: "Delete Event", icon: Trash2, onClick: () => handleAction("delete"), color: "text-red-600" });
    } else {
      actions.push({ label: "Share Event", icon: Share2, onClick: handleShare, color: "text-slate-700" });
    }

    return actions;
  };

  const actions = getActions();

  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingAction !== null || isPending}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 text-sm font-medium"
      >
        {loadingAction ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin inline-block w-4 h-4 border-[2px] border-current border-t-transparent text-primary-600 rounded-full" />
            Processing...
          </span>
        ) : (
          <>
            Actions <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors text-left ${action.color}`}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
