"use client";

import Image from "next/image";
import { api } from "@/lib/api-client";
import { useModal } from "@/components/providers/ModalProvider";
import { DataTable } from "@/components/dashboard";
import Link from "next/link";
import { UserCog, Trash2, Shield, Eye, ArchiveRestore, Trash, Mail } from "lucide-react";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminsTable({ admins }: { admins: any[] }) {
  const router = useRouter();
  const modal = useModal();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "DELETED">("ACTIVE");

  const filteredAdmins = admins.filter(admin =>
    activeTab === "ACTIVE" ? !admin.isDeleted : admin.isDeleted
  );

  const handleDelete = async (adminId: string, name: string) => {
    const confirmed = await modal.confirm({
      title: "Remove Admin",
      message: `Are you sure you want to remove admin "${name}"?`,
      variant: "danger",
      confirmText: "Remove Admin",
    });
    if (!confirmed) return;

    try {
      await toast.promise(api.delete(`/users/${adminId}`), {
        loading: "Removing admin...",
        success: "Admin removed successfully",
        error: (err: any) => err.message || "Failed to delete admin",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      // Error is handled by toast
    }
  };

  const handlePermanentDelete = async (adminId: string, name: string) => {
    const confirmed = await modal.confirm({
      title: "Permanently Delete Admin",
      message: `Are you sure you want to PERMANENTLY delete admin "${name}"? This action absolutely cannot be undone.`,
      variant: "danger",
      confirmText: "Delete Permanently",
    });
    if (!confirmed) return;

    try {
      await toast.promise(api.delete(`/users/${adminId}/permanent`), {
        loading: "Permanently deleting admin...",
        success: "Admin permanently deleted",
        error: (err: any) => err.message || "Failed to permanently delete admin",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      // Error is handled by toast
    }
  };

  const handleRestore = async (adminId: string, name: string) => {
    const confirmed = await modal.confirm({
      title: "Restore Admin",
      message: `Are you sure you want to restore admin "${name}"?`,
      confirmText: "Restore Admin",
    });
    if (!confirmed) return;

    try {
      await toast.promise(api.patch(`/users/${adminId}/restore`), {
        loading: "Restoring admin...",
        success: "Admin restored successfully",
        error: (err: any) => err.message || "Failed to restore admin",
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      // Error is handled by toast
    }
  };

  const handleResendInvite = async (admin: any) => {
    try {
      await toast.promise(
        api.post("/admin/invite", {
          fullName: admin.name,
          email: admin.email,
          phone: admin.phone,
        }),
        {
          loading: "Sending invitation email...",
          success: "Invitation email resent",
          error: (err: any) => err.message || "Failed to resend invitation",
        }
      );
    } catch (err) {
      // Error is handled by toast
    }
  };

  const columns = [
    {
      key: "name",
      header: "Admin",
      render: (admin: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 overflow-hidden">
            {admin.avatar?.startsWith("http") ? (
              <Image
                width={40}
                height={40}
                src={admin.avatar}
                alt={admin.name}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <UserCog className="w-5 h-5" />
            )}
          </div>
          <div>
            <Link
              href={`/dashboard/admins/${admin.id}`}
              className="font-medium text-slate-900 hover:text-primary-600 transition-colors duration-150"
            >
              {admin.name}
            </Link>
            <div className="text-xs text-slate-500">{admin.email}</div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "role",
      header: "Role",
      render: (admin: any) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${admin.role === "SUPER_ADMIN"
            ? "bg-amber-100 text-amber-700"
            : "bg-primary-100 text-primary-700"
          }`}>
          <Shield className="w-3 h-3" />
          {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
        </span>
      ),
    },
    {
      key: "joinedAt",
      header: "Joined",
      render: (admin: any) => (
        <span className="text-sm text-slate-500">
          {new Date(admin.createdAt).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (admin: any) => (
        <span className="text-sm text-slate-500">
          {admin.lastLoginAt
            ? new Date(admin.lastLoginAt).toLocaleDateString()
            : "Never"}
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
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "ACTIVE"
              ? "border-primary-600 text-primary-600 bg-primary-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
        >
          Active Admins
        </button>
        <button
          onClick={() => setActiveTab("DELETED")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "DELETED"
              ? "border-red-600 text-red-600 bg-red-50/50"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
        >
          Deleted Admins
        </button>
      </div>
      <DataTable
        data={filteredAdmins}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search admins..."
        filters={[
          {
            label: "Role",
            key: "role",
            options: [
              { label: "Admin", value: "ADMIN" },
              { label: "Super Admin", value: "SUPER_ADMIN" },
            ],
          },
        ]}
        actions={(admin) => (
          <div className="flex items-center gap-1">
            {!admin.isDeleted && (
              <Link
                href={`/dashboard/admins/${admin.id}`}
                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-150"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </Link>
            )}

            {admin.status === "PENDING" && !admin.isDeleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResendInvite(admin);
                }}
                disabled={isPending}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Resend Invitation"
              >
                <Mail className="w-4 h-4" />
              </button>
            )}

            {admin.isDeleted ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(admin.id, admin.name);
                  }}
                  disabled={isPending}
                  className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Restore Admin"
                >
                  <ArchiveRestore className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePermanentDelete(admin.id, admin.name);
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
                  handleDelete(admin.id, admin.name);
                }}
                disabled={isPending}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove Admin"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        rowClassName={(admin) => admin.isDeleted ? "bg-slate-50/80 text-slate-500" : ""}
      />
    </div>
  );
}
