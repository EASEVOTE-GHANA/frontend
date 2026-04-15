"use client";

import { DataTable } from "@/components/dashboard";
import {
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";

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
};

export default function OrganizersTable({
  organizers,
}: {
  organizers: Organizer[];
}) {
  const router = useRouter();

  const columns = [
    {
      key: "name",
      header: "Organizer",
      render: (org: Organizer) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold overflow-hidden">
            {org.avatar?.startsWith("http") ? (
              <img
                src={org.avatar}
                alt={org.name}
                className="h-full w-full object-cover"
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
      render: (org: Organizer) => (
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
      ),
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
    <DataTable
      data={organizers}
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
      onRowClick={(org) => router.push(`/dashboard/organizers/${org.id}`)}
    />
  );
}
