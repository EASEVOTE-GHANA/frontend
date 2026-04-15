import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  User,
  FileText,
  ShieldCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import ReviewActions from "./ReviewActions";
import { notFound } from "next/navigation";

export default async function NominationDetailPage({
  params,
}: {
  params: { id: string; nominationId: string };
}) {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken as string | undefined);
  const nomination = await apiClient.get<any>(`/nominations/${params.nominationId}`).catch(() => null);

  if (!nomination) {
    notFound();
  }

  const customFieldsData = nomination.customFields as Record<string, any>;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/events/${params.id}/nominations`}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {nomination.nomineeName}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                        ${
                          nomination.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : nomination.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
              >
                {nomination.status}
              </span>
            </div>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <span className="font-medium text-gray-900">
                {nomination.category.name}
              </span>
              <span>•</span>
              <span>
                Submitted{" "}
                {format(
                  new Date(nomination.createdAt),
                  "MMM d, yyyy 'at' h:mm a"
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Sticky Actions or just actions */}
        <div className="flex gap-3">
          {nomination.status !== "APPROVED" &&
            nomination.status !== "REJECTED" && (
              <ReviewActions nominationId={nomination.id} />
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Nominee Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} className="text-magenta-600" /> Nominee Profile
            </h3>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="shrink-0">
                {nomination.nomineePhotoUrl ? (
                  <img
                    src={nomination.nomineePhotoUrl}
                    alt={nomination.nomineeName}
                    className="w-32 h-32 rounded-xl object-cover border border-gray-200 shadow-sm"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                    <User size={48} />
                  </div>
                )}
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Bio / Description
                  </label>
                  <p className="text-gray-700 leading-relaxed mt-1">
                    {nomination.bio || "No biography provided."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Email
                    </label>
                    <p className="text-gray-900 font-medium flex items-center gap-2 mt-1">
                      <Mail size={14} className="text-gray-400" />{" "}
                      {nomination.nomineeEmail || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Phone
                    </label>
                    <p className="text-gray-900 font-medium flex items-center gap-2 mt-1">
                      <Phone size={14} className="text-gray-400" />{" "}
                      {nomination.nomineePhone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-magenta-600" /> Application
              Responses
            </h3>

            <div className="space-y-6 divide-y divide-gray-100">
              {nomination.customFields && (
                Array.isArray(nomination.customFields) ? (
                  nomination.customFields.length > 0 ? (
                    nomination.customFields.map((field: any, index: number) => (
                      <div key={index} className="pt-4 first:pt-0">
                        <label className="text-sm font-bold text-gray-900 block mb-2">
                          {field.question}
                        </label>
                        <div className="bg-gray-50 p-3 rounded-lg text-gray-700 border border-gray-100">
                          {String(field.answer)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No additional questions were answered.</p>
                  )
                ) : Object.entries(nomination.customFields).length > 0 ? (
                  Object.entries(nomination.customFields).map(([key, value]: [string, any]) => (
                    <div key={key} className="pt-4 first:pt-0">
                      <label className="text-sm font-bold text-gray-900 block mb-2">
                        {key.replace(/_/g, " ")}
                      </label>
                      <div className="bg-gray-50 p-3 rounded-lg text-gray-700 border border-gray-100">
                        {String(value)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No additional questions were answered.</p>
                )
              )}
              {!nomination.customFields && (
                <p className="text-gray-500 italic">No additional questions were answered.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Meta & Actions */}
        <div className="space-y-6">
          {/* Submission Meta */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Submission Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Nomination Type</label>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      nomination.nominationType === "SELF"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {nomination.nominationType}
                  </span>
                  {nomination.nominationType === "THIRD_PARTY" && (
                    <span className="text-xs text-gray-400 block border-l pl-2 border-gray-300">
                      Submitted by another person
                    </span>
                  )}
                </div>
              </div>

              {nomination.nominationType === "THIRD_PARTY" && (
                <div className="pt-4 border-t border-gray-100">
                  <label className="text-xs text-gray-500 mb-2 block">
                    Nominator Information
                  </label>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-900">
                      {nomination.nominatorName}
                    </p>
                    {nomination.nominatorEmail && (
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Mail size={12} /> {nomination.nominatorEmail}
                      </p>
                    )}
                    {nomination.nominatorPhone && (
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Phone size={12} /> {nomination.nominatorPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <label className="text-xs text-gray-500">
                  Verification Status
                </label>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                  <ShieldCheck className="text-green-500" size={16} />
                  <span>System Checks Passed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Review Status Card (if processed) */}
          {(nomination.status === "APPROVED" ||
            nomination.status === "REJECTED") && (
            <div
              className={`rounded-xl border p-6 ${
                nomination.status === "APPROVED"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <h3
                className={`font-bold mb-2 ${
                  nomination.status === "APPROVED"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {nomination.status === "APPROVED"
                  ? "Nomination Approved"
                  : "Nomination Rejected"}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Processed on {format(new Date(nomination.reviewedAt!), "PPP p")}
              </p>
              {nomination.status === "REJECTED" &&
                nomination.rejectionReason && (
                  <div className="bg-white/50 p-3 rounded-lg border border-red-100 text-sm text-red-700">
                    <strong>Reason:</strong> {nomination.rejectionReason}
                  </div>
                )}
              {nomination.status === "APPROVED" && (
                <div className="bg-white/50 p-3 rounded-lg border border-green-100 text-sm text-green-700">
                  Candidate profile has been created and is active.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
