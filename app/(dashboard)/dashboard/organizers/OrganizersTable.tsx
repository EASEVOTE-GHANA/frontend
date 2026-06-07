"use client";

import Image from "next/image";
import { DataTable } from "@/components/dashboard";
import {
  CheckCircle,
  Clock,
  XCircle,
  RefreshCcw,
  Trash2,
  Mail,
  Eye,
  ArchiveRestore,
  Trash,
} from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import toast from "react-hot-toast";
import { useModal } from "@/components/providers/ModalProvider";
import { api } from "@/lib/api-client";

// Updated Type
type Organizer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  verificationStatus: string;
  userStatus: string;
  eventsCount: number;
  totalRevenue: number;
  balance: number;
  joinedAt: Date;
  isDeleted: boolean;
};

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  VERIFIED: {
    label: "Verified",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: CheckCircle,
  },
  PENDING: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-100",
    icon: Clock,
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-700",
    bg: "bg-red-100",
    icon: XCircle,
  },
  DELETED: {
    label: "Deleted",
    color: "text-slate-700",
    bg: "bg-slate-200",
    icon: XCircle,
  },
};

export default function OrganizersTable({
  organizers,
}: {
  organizers: Organizer[];
}) {
  const router = useRouter();
  const modal = useModal();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "DELETED">("ACTIVE");

  const filteredOrganizers = organizers.filter(org =>
    activeTab === "ACTIVE" ? !org.isDeleted : org.isDeleted
  );

  const handleDelete = async (orgId: string, name: string) => {
    const confirmed = await modal.confirm({
      title: "Remove Organizer",
      message: `Are you sure you want to remove organizer "${name}"?`,
      variant: "danger",
      confirmText: "Remove Organizer",
    });
    if (!confirmed) return;

    try {
      await toast.promise(api.delete(`/users/${orgId}`), {
        loading: "Removing organizer...",
        success: "Organizer removed successfully",
        error: (err: any) => err.message || "Failed to delete organizer",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      // Error is handled by toast
    }
  };

  const handlePermanentDelete = async (orgId: string, name: string) => {
    const confirmed = await modal.confirm({
      title: "Permanently Delete Organizer",
      message: `Are you sure you want to PERMANENTLY delete organizer "${name}"? This action absolutely cannot be undone.`,
      variant: "danger",
      confirmText: "Delete Permanently",
    });
    if (!confirmed) return;

    try {
      await toast.promise(api.delete(`/users/${orgId}/permanent`), {
        loading: "Permanently deleting organizer...",
        success: "Organizer permanently deleted",
        error: (err: any) => err.message || "Failed to permanently delete organizer",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      // Error is handled by toast
    }
  };

  const handleRestore = async (orgId: string, name: string) => {
    const confirmed = await modal.confirm({
      title: "Restore Organizer",
      message: `Are you sure you want to restore organizer "${name}"?`,
      confirmText: "Restore Organizer",
    });
    if (!confirmed) return;

    try {
      await toast.promise(api.patch(`/users/${orgId}/restore`), {
        loading: "Restoring organizer...",
        success: "Organizer restored successfully",
        error: (err: any) => err.message || "Failed to restore organizer",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      // Error is handled by toast
    }
  };

  const handleResendVerification = async (orgId: string) => {
    try {
      await toast.promise(api.post(`/users/${orgId}/resend-verification`), {
        loading: "Sending email...",
        success: "Verification email resent successfully",
        error: (err: any) => err.message || "Failed to resend verification",
      });
    } catch (err) {
      // Error is handled by toast
    }
  };

  const columns = [
    {
      key: "name",
      header: "Organizer",
      render: (org: Organizer) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden">
            {org.avatar?.startsWith("http") ? (
              <Image
                width={40}
                height={40}
                src={org.avatar}
                alt={org.name}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              (org.name || "??").substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="font-medium text-slate-900">{org.name}</div>
            <div className="text-xs text-slate-500">{org.email}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "verificationStatus",
      header: "Verification",
      render: (org: Organizer) => {
        const config = statusConfig[org.verificationStatus] || {
          label: org.verificationStatus,
          color: "text-slate-600",
          bg: "bg-slate-100",
          icon: Clock,
        };
        return (
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              config.bg,
              config.color
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {config.label}
          </span>
        );
      },
      sortable: true,
    },
    {
      key: "totalRevenue",
      header: "Revenue",
      render: (org: Organizer) => (
        <span className="font-medium text-slate-900">
          {new Intl.NumberFormat("en-GH", {
            style: "currency",
            currency: "GHS",
          }).format(org.totalRevenue)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "eventsCount",
      header: "Events",
      render: (org: Organizer) => (
        <div className="text-sm font-medium text-slate-900">
          {org.eventsCount}
        </div>
      ),
      sortable: true,
    },
    {
      key: "userStatus",
      header: "Account",
      render: (org: Organizer) => {
        if (org.isDeleted) {
          return (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
              DELETED
            </span>
          );
        }
        return (
          <span
            className={clsx(
              "text-xs font-medium px-2 py-0.5 rounded",
              org.userStatus === "ACTIVE"
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            )}
          >
            {org.userStatus}
          </span>
        );
      },
    },
    {
      key: "joinedAt",
      header: "Joined",
      render: (org: Organizer) => (
        <span className="text-sm text-slate-500">
          {new Date(org.joinedAt).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <div>
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={clsx(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "ACTIVE"
              ? "border-primary-600 text-primary-600 bg-primary-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          )}
        >
          Active Organizers
        </button>
        <button
          onClick={() => setActiveTab("DELETED")}
          className={clsx(
            "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
            activeTab === "DELETED"
              ? "border-red-600 text-red-600 bg-red-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          )}
        >
          Deleted Organizers
        </button>
      </div>
      <DataTable
        data={filteredOrganizers}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search organizers..."
        filters={[
          {
            label: "Status",
            key: "userStatus",
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Pending", value: "PENDING" },
              { label: "Disabled", value: "DISABLED" },
            ],
          },
          {
            label: "Verification",
            key: "verificationStatus",
            options: [
              { label: "Verified", value: "VERIFIED" },
              { label: "Pending", value: "PENDING" },
              { label: "Rejected", value: "REJECTED" },
            ],
          },
        ]}
        actions={(org) => (
          <div className="flex items-center gap-1">
            {!org.isDeleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/organizers/${org.id}`);
                }}
                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-150"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            {!org.isDeleted && org.verificationStatus !== "VERIFIED" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResendVerification(org.id);
                }}
                disabled={isPending}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Resend Verification Email"
              >
                <Mail className="w-4 h-4" />
              </button>
            )}

            {org.isDeleted ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(org.id, org.name);
                  }}
                  disabled={isPending}
                  className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Restore Organizer"
                >
                  <ArchiveRestore className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePermanentDelete(org.id, org.name);
                  }}
                  disabled={isPending}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Permanently Delete"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(org.id, org.name);
                }}
                disabled={isPending}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove Organizer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        rowClassName={(org) => org.isDeleted ? "bg-slate-50/80 text-slate-500" : ""}
        onRowClick={(org) => !org.isDeleted && router.push(`/dashboard/organizers/${org.id}`)}
      />
    </div>
  );
}
