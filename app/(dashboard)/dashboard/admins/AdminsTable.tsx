"use client";

import { api } from "@/lib/api-client";
import { DataTable } from "@/components/dashboard";
import Link from "next/link";
import { UserCog, Trash2, Shield, Eye } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AdminsTable({ admins }: { admins: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (adminId: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to remove admin "${name}"? This action cannot be undone.`,
      )
    ) {
      startTransition(async () => {
        const result = await api.delete(`/users/${adminId}`);
        if (!result.success) {
          alert(result.message);
        }
      });
    }
  };

  const columns = [
    {
      key: "name",
      header: "Admin",
      render: (admin: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 overflow-hidden">
            {admin.avatar?.startsWith("http") ? (
              <img
                src={admin.avatar}
                alt={admin.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserCog className="w-5 h-5" />
            )}
          </div>
          <div>
            <Link
              href={`/dashboard/admins/${admin.id}`}
              className="font-medium text-slate-900 hover:text-indigo-600 hover:underline"
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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          admin.role === "SUPER_ADMIN" 
            ? "bg-amber-100 text-amber-700" 
            : "bg-indigo-100 text-indigo-700"
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
    <DataTable
      data={admins}
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
          <Link
            href={`/dashboard/admins/${admin.id}`}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
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
        </div>
      )}
    />
  );
}
