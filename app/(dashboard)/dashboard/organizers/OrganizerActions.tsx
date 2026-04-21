"use client";

import { useTransition } from "react";
import { api } from "@/lib/api-client";
import { CheckCircle, XCircle } from "lucide-react";
import { useModal } from "@/components/providers/ModalProvider";

interface OrganizerActionProps {
  id: string;
  verified: boolean;
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
        await api.patch(`/users/${organizer.user.id}/status`, { status: "SUSPENDED" });
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

  return (
    <div className="flex gap-2">
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
    </div>
  );
}
