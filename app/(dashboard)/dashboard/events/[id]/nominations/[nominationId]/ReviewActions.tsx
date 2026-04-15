"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ReviewActions({
  nominationId,
}: {
  nominationId: string;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const router = useRouter();

  const handleApprove = async () => {
    if (
      !confirm(
        "Are you sure you want to approve this nomination? A candidate profile will be created immediately.",
      )
    )
      return;

    setIsProcessing(true);
    try {
      const result = await api.patch(`/nominations/${nominationId}/approve`);
      if (result.success !== false) {
        // Because sometimes success is not explicitly returned as boolean on 200
        toast.success("Nomination Approved");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to approve");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await api.patch(`/nominations/${nominationId}/reject`, {
        reason: rejectReason,
      });
      if (result.success !== false) {
        toast.success("Nomination Rejected");
        setShowRejectModal(false);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to reject");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowRejectModal(true)}
        disabled={isProcessing}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
      >
        <XCircle size={18} /> Reject
      </button>
      <button
        onClick={handleApprove}
        disabled={isProcessing}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
      >
        {isProcessing ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <CheckCircle size={18} />
        )}{" "}
        Approve
      </button>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-bold text-xl text-gray-900 mb-2">
              Reject Nomination
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Please specify a reason for rejecting this nomination. This may be
              visible to admins for audit purposes.
            </p>

            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none"
              placeholder="e.g. Incomplete documentation, ineligible candidate..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
