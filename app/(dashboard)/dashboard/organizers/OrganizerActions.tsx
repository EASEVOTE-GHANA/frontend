"use client";

import { useTransition } from "react";
import { api } from "@/lib/api-client";
import { CheckCircle, XCircle, RotateCcw, RefreshCw } from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";

interface OrganizerActionProps {
  id: string;
  verified: boolean;
  isDeleted?: boolean;
  user: {
    id: string;
    status: string;
  };
}

export default function OrganizerActions({
  organizer,
}: {
  organizer: OrganizerActionProps;
}) {
  const [isPending, startTransition] = useTransition();
  const modal = useModal();

  const handleApprove = async () => {
    const confirmed = await modal.confirm({
      title: "Approve Organizer",
      message: "Approve this organizer account? They will be able to create events.",
      variant: "info",
      confirmText: "Approve",
    });
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await api.patch(`/admin/approve-organizer/${organizer.id}`);
        await modal.alert({
          title: "Organizer Approved",
          message: "Organizer approved successfully! They can now create events.",
          variant: "info",
        });
        window.location.reload();
      } catch (error: any) {
        modal.alert({
          title: "Approval Failed",
          message: error.message || "Failed to approve organizer",
          variant: "danger",
        });
      }
    });
  };

  const handleReject = async () => {
    const confirmed = await modal.confirm({
      title: "Reject Organizer",
      message: "Reject this organizer account? They will lose access to create events.",
      variant: "danger",
      confirmText: "Reject",
    });
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await api.put(`/users/${organizer.user.id}`, { status: "DISABLED" });
        await modal.alert({
          title: "Organizer Rejected",
          message: "Organizer account has been rejected.",
          variant: "info",
        });
        window.location.reload();
      } catch (error: any) {
        modal.alert({
          title: "Rejection Failed",
          message: error.message || "Failed to reject organizer",
          variant: "danger",
        });
      }
    });
  };

  const handleDelete = async () => {
    const confirmed = await modal.confirm({
      title: "Delete Organizer",
      message: "Are you sure you want to soft-delete this organizer? They will no longer be able to log in or manage their events.",
      variant: "danger",
      confirmText: "Delete",
    });
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await api.delete(`/users/${organizer.user.id}`);
        await modal.alert({
          title: "Organizer Deleted",
          message: "Organizer has been removed successfully.",
          variant: "info",
        });
        window.location.reload();
      } catch (error: any) {
        modal.alert({
          title: "Deletion Failed",
          message: error.message || "Failed to delete organizer",
          variant: "danger",
        });
      }
    });
  };

  const handleRestore = async () => {
    const confirmed = await modal.confirm({
      title: "Restore Organizer",
      message: "Restore this organizer account? They will regain access to their account.",
      variant: "info",
      confirmText: "Restore",
    });
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await api.patch(`/users/${organizer.user.id}/restore`);
        await modal.alert({
          title: "Organizer Restored",
          message: "Organizer has been restored successfully.",
          variant: "info",
        });
        window.location.reload();
      } catch (error: any) {
        modal.alert({
          title: "Restoration Failed",
          message: error.message || "Failed to restore organizer",
          variant: "danger",
        });
      }
    });
  };

  const handleSyncStats = async () => {
    const confirmed = await modal.confirm({
      title: "Sync Statistics",
      message: "Recalculate all event statistics for this organizer from the purchase ledger? This will fix any discrepancies in revenue or vote/ticket counts.",
      variant: "info",
      confirmText: "Sync Now",
    });
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await api.post(`/reconciliation/sync-organizer/${organizer.id}`);
        await modal.alert({
          title: "Synchronization Complete",
          message: "All organizer statistics have been successfully updated to match the transaction ledger.",
          variant: "info",
        });
        window.location.reload();
      } catch (error: any) {
        modal.alert({
          title: "Sync Failed",
          message: error.message || "Failed to synchronize statistics",
          variant: "danger",
        });
      }
    });
  };

  return (
    <div className="flex gap-2">
      {organizer.isDeleted ? (
        <button
          onClick={handleRestore}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-600 focus-visible:ring-offset-1 transition-all duration-150 text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          {isPending ? "Restoring..." : "Restore Account"}
        </button>
      ) : (
        <>
          {!organizer.verified ? (
            <>
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                {isPending ? "Processing..." : "Approve"}
              </button>
              <button
                onClick={handleReject}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          ) : (
            <span className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Account Approved
            </span>
          )}

          <button
            onClick={handleSyncStats}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-100 rounded-lg hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-600 focus-visible:ring-offset-1 transition-all duration-150 text-sm font-medium"
          >
            <RefreshCw className={isPending ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            {isPending ? "Syncing..." : "Sync Stats"}
          </button>

          <button
            onClick={handleDelete}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-all text-sm font-medium"
          >
            <XCircle className="w-4 h-4" />
            Delete
          </button>
        </>
      )}
    </div>
  );
}
