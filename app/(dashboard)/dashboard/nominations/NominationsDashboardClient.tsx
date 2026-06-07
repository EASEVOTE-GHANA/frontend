"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  Calendar,
  Loader2,
} from "lucide-react";
import NominationDetailsDialog from "./NominationDetailsDialog";
import { clsx } from "clsx";
import { useModal } from "@/components/providers/ModalProvider";
import EventFilterDropdown from "@/components/dashboard/EventFilterDropdown";
import { api } from "@/lib/api-client";
import { showDismissibleToast } from "@/lib/utils/toast-helpers";

type Nomination = {
  id: string;
  categoryName: string;
  nomineeName: string;
  nomineeEmail: string | null;
  nomineePhone: string | null;
  status: string; // Prisma enum is "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string;
  event: {
    id: string;
    title: string;
    eventCode: string;
  };
  reason: string | null;
  // metadata: any; // Legacy
  customFields: any; // Correct field for form answers
  photoUrl: string | null;
  fieldLabels?: Record<string, string>; // Map of field key -> label
};

interface DashboardProps {
  initialNominations: Nomination[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  eventsList: { id: string; title: string }[];
}

export default function NominationsDashboardClient({
  initialNominations,
  stats,
  eventsList
}: DashboardProps) {
  const router = useRouter();
  const modal = useModal();
  const [nominations, setNominations] = useState(initialNominations);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* State for Detail Modal */
  const [selectedNomination, setSelectedNomination] =
    useState<Nomination | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredNominations = nominations.filter((nom) => {
    const matchesStatus = statusFilter === "ALL" || nom.status === statusFilter;
    const matchesEvent = eventFilter === "ALL" || nom.event?.id === eventFilter;
    const matchesSearch =
      nom.nomineeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nom.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nom.event?.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesEvent && matchesSearch;
  });

  /* Logic: Review Nomination */
  const handleReview = async (
    id: string,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    const isApprove = newStatus === "APPROVED";
    
    // Safety confirmation
    const confirmed = await modal.confirm({
      title: isApprove ? "Confirm Approval" : "Confirm Rejection",
      message: isApprove 
        ? "Are you sure you want to approve this nomination? This will officially add them as a candidate and notify them via SMS/Email."
        : "Are you sure you want to reject this nomination? This action cannot be easily undone.",
      confirmText: isApprove ? "Approve" : "Reject",
      variant: isApprove ? "info" : "danger",
    });

    if (!confirmed) return;

    setProcessingId(id);
    try {
      // Use authenticated API client for approve/reject
      const action = newStatus === "APPROVED" ? "approve" : "reject";
      const body = newStatus === "REJECTED" ? { reason: "Rejected by organizer" } : undefined;
      const result = await api.patch(`/nominations/${id}/${action}`, body);

      // Surface duplicate-phone deduplication so the organizer knows why no
      // new candidate appeared even though the nomination was approved.
      if (
        isApprove &&
        typeof result?.message === "string" &&
        result.message.includes("already exists")
      ) {
        showDismissibleToast(
          "Nomination approved — but a candidate with the same phone number already exists in this category, so no duplicate was created.",
          { icon: "ℹ️" }
        );
      }

      {
        // Optimistic update
        setNominations((prev) =>
          prev.map((n) => (n.id === id ? { ...n, status: newStatus } : n))
        );

        // Also update the selected modal if it's open
        if (selectedNomination && selectedNomination.id === id) {
          setSelectedNomination((prev) =>
            prev ? { ...prev, status: newStatus } : null
          );
          setIsDetailOpen(false); 
        }

        router.refresh(); // Refresh server stats
      }
    } catch (error) {
      modal.alert({
        title: "Update Failed",
        message: "Failed to update status. Please try again.",
        variant: "danger"
      });
    } finally {
      setProcessingId(null);
    }
  };

  /* Logic: Export CSV */
  const handleExportCSV = () => {
    if (nominations.length === 0) return;

    // Defines headers
    const headers = [
      "ID",
      "Nominee Name",
      "Email",
      "Phone",
      "Category",
      "Event",
      "Status",
      "Submitted Date",
      "Description/Bio",
    ];

    // Convert data to CSV rows
    const csvRows = candidatesToCSV(filteredNominations, headers);

    // Create and trigger download
    const blob = new Blob([csvRows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nominations_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const candidatesToCSV = (data: Nomination[], headers: string[]) => {
    const rows = data.map((nom) => [
      nom.id,
      `"${nom.nomineeName.replace(/"/g, '""')}"`,
      nom.nomineeEmail || "",
      nom.nomineePhone || "",
      `"${nom.categoryName.replace(/"/g, '""')}"`,
      `"${nom.event.title.replace(/"/g, '""')}"`,
      nom.status,
      new Date(nom.createdAt).toLocaleDateString(),
      `"${(nom.reason || "").replace(/"/g, '""')}"`,
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      PENDING: "bg-primary-50 text-primary-700 border-primary-100",
      APPROVED: "bg-green-100 text-green-700 border-green-200",
      REJECTED: "bg-red-100 text-red-700 border-red-200",
    };
    const icons = {
      PENDING: Clock,
      APPROVED: CheckCircle,
      REJECTED: XCircle,
    };

    // Fallback for unknown status
    const style =
      styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700";
    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border",
          style
        )}
      >
        <Icon size={12} />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nominations</h1>
          <p className="text-slate-500">Manage pending applications.</p>
        </div>
        <div className="flex gap-2">
          {/* Export functionality */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-gray-50 transition"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
              <Users size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500">
              Total Applications
            </span>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">
            {stats.total}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Clock size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500">Pending</span>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">
            {stats.pending}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500">Approved</span>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">
            {stats.approved}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <XCircle size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500">Rejected</span>
          </div>
          <p className="text-3xl font-display font-bold text-slate-900">
            {stats.rejected}
          </p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm">
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 w-full md:w-80">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search nominees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400"
              />
            </div>

            <EventFilterDropdown 
              value={eventFilter}
              onChange={setEventFilter}
              eventsList={eventsList}
              placeholder="All Events"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={clsx(
                  "px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap",
                  statusFilter === status
                    ? "bg-primary-600 text-white"
                    : "bg-gray-50 text-slate-600 hover:bg-gray-100"
                )}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 bg-gray-50/50">
                <th className="px-6 py-4 font-bold">Nominee</th>
                <th className="px-6 py-4 font-bold">Category / Event</th>
                <th className="px-6 py-4 font-bold">Submitted</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredNominations.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <FileText
                      className="mx-auto mb-3 text-gray-300"
                      size={48}
                    />
                    <p className="font-bold">No nominations found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredNominations.map((nom, idx) => (
                  <tr
                    key={nom.id || `nom-${idx}`}
                    className="group hover:bg-gray-50/50 transition cursor-pointer"
                    onClick={() => {
                      setSelectedNomination(nom);
                      setIsDetailOpen(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {nom.nomineeName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {nom.nomineeEmail ||
                          nom.nomineePhone ||
                          "No contact info"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-700">
                        {nom.categoryName}
                      </div>
                      <div className="text-xs text-primary-600">
                        {nom.event?.title || "No Event"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(nom.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={nom.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {nom.status === "PENDING" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReview(nom.id, "APPROVED");
                              }}
                              disabled={!!processingId}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition disabled:opacity-50 cursor-pointer"
                              title="Approve"
                            >
                              {processingId === nom.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Check size={18} />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReview(nom.id, "REJECTED");
                              }}
                              disabled={!!processingId}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50 cursor-pointer"
                              title="Reject"
                            >
                              {processingId === nom.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <X size={18} />
                              )}
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNomination(nom);
                            setIsDetailOpen(true);
                          }}
                          className="text-sm text-primary-600 font-bold hover:underline ml-2"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <NominationDetailsDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        nomination={selectedNomination}
        onReview={handleReview}
        processing={!!processingId}
      />
    </div>
  );
}
