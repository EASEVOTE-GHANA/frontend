import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import {
  Check,
  X,
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  AlignLeft,
  Image as ImageIcon,
} from "lucide-react";

type Nomination = {
  id: string;
  categoryName: string;
  nomineeName: string;
  nomineeEmail: string | null;
  nomineePhone: string | null;
  status: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    eventCode: string;
  };
  reason: string | null;
  customFields: any;
  nomineePhotoUrl: string | null;
  fieldLabels?: Record<string, string>;
};

interface NominationDetailsDialogProps {
  nomination: Nomination | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReview: (id: string, status: "APPROVED" | "REJECTED") => Promise<void>;
  processing?: boolean;
}

export default function NominationDetailsDialog({
  nomination,
  open,
  onOpenChange,
  onReview,
  processing,
}: NominationDetailsDialogProps) {
  if (!nomination) return null;

  // Use the correct field for custom answers
  const customFields = nomination.customFields || {};
  const hasCustomFields = Object.keys(customFields).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-xl font-bold">
              Nomination Details
            </DialogTitle>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                nomination.status === "APPROVED"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : nomination.status === "REJECTED"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
              }`}
            >
              {nomination.status === "PENDING"
                ? "PENDING REVIEW"
                : nomination.status}
            </span>
          </div>
          <DialogDescription>
            Reviewing application for <strong>{nomination.categoryName}</strong>{" "}
            in {nomination.event.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6 py-4">
            {/* Profile Header */}
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                {nomination.nomineePhotoUrl ? (
                  <img
                    src={nomination.nomineePhotoUrl}
                    alt={nomination.nomineeName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {nomination.nomineeName}
                </h3>
                <div className="flex flex-col gap-1 mt-1 text-sm text-slate-500">
                  {nomination.nomineeEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {nomination.nomineeEmail}
                    </div>
                  )}
                  {nomination.nomineePhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {nomination.nomineePhone}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Submitted:{" "}
                    {new Date(nomination.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio / Reason */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <AlignLeft className="w-4 h-4" /> Reason / Bio
              </h4>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-slate-700 leading-relaxed text-sm">
                {nomination.reason || "No description provided."}
              </div>
            </div>

            {/* Custom Fields (Dynamic) */}
            {hasCustomFields && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileTextIcon className="w-4 h-4" /> Additional Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(customFields).map(([key, value]) => {
                    const label =
                      nomination.fieldLabels?.[key] || key.replace(/_/g, " ");
                    return (
                      <div
                        key={key}
                        className="p-3 border border-slate-200 rounded-lg"
                      >
                        <span className="text-xs font-semibold text-slate-500 block mb-1 uppercase">
                          {label}
                        </span>
                        <span className="text-sm text-slate-900 font-medium">
                          {String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {nomination.status === "PENDING" && (
            <>
              <Button
                variant="destructive"
                onClick={() => onReview(nomination.id, "REJECTED")}
                disabled={processing}
                className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <X className="w-4 h-4" /> Reject
              </Button>
              <Button
                onClick={() => onReview(nomination.id, "APPROVED")}
                disabled={processing}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4" /> Approve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
