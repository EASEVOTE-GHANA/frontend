"use client";

import { useTransition } from "react";
import { api } from "@/lib/api-client";
import { CheckCircle, XCircle, Ban, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

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

  const handleApprove = () => {
    if (
      confirm(
        "Approve this organizer account? They will be able to create events.",
      )
    ) {
      startTransition(async () => {
        try {
          await api.patch(`/admin/approve-organizer/${organizer.id}`);
          alert("Organizer approved successfully!");
          window.location.reload();
        } catch (error: any) {
          alert(error.message || "Failed to approve organizer");
        }
      });
    }
  };

  return (
    <div className="flex gap-2">
      {!organizer.verified ? (
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          <CheckCircle className="w-4 h-4" />
          {isPending ? "Approving..." : "Approve Account"}
        </button>
      ) : (
        <span className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Account Approved
        </span>
      )}
    </div>
  );
}
