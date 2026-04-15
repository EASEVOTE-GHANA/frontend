"use client";

import { DataTable } from "@/components/dashboard";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Wallet,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";
import { useState, useTransition } from "react";
import { api } from "@/lib/api-client";

type Payout = {
  id: string;
  amount: number;
  status: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  organizerName: string;
  organizerEmail: string;
  date: Date;
  reference: string;
};

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  COMPLETED: {
    label: "Completed",
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
  PROCESSING: {
    label: "Processing",
    color: "text-blue-700",
    bg: "bg-blue-100",
    icon: Loader2,
  },
  FAILED: {
    label: "Failed",
    color: "text-red-700",
    bg: "bg-red-100",
    icon: AlertCircle,
  },
};

export default function PayoutsTable({ payouts }: { payouts: Payout[] }) {
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this payout as ${newStatus}?`))
      return;

    startTransition(async () => {
      await api.patch(`/admin/payouts/${id}/status`, { status: newStatus });
    });
  };

  const columns = [
    {
      key: "organizerName",
      header: "Organizer",
      render: (item: Payout) => (
        <div>
          <div className="font-medium text-slate-900">{item.organizerName}</div>
          <div className="text-xs text-slate-500">{item.organizerEmail}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "amount",
      header: "Amount",
      render: (item: Payout) => (
        <span className="font-bold text-slate-900">
          {new Intl.NumberFormat("en-GH", {
            style: "currency",
            currency: "GHS",
          }).format(item.amount)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "bankName",
      header: "Bank Details",
      render: (item: Payout) => (
        <div className="text-sm">
          <div className="font-medium text-slate-700">{item.bankName}</div>
          <div className="text-slate-500">{item.accountNumber}</div>
          <div className="text-xs text-slate-400">{item.accountName}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Payout) => {
        const config = statusConfig[item.status] || {
          label: item.status,
          color: "text-slate-600",
          bg: "bg-slate-100",
          icon: AlertCircle,
        };
        const Icon = config.icon;
        return (
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              config.bg,
              config.color
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </span>
        );
      },
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item: Payout) => (
        <div className="flex items-center gap-2">
          {/* Simple Actions for now - could be a dropdown */}
          {item.status === "PENDING" && (
            <button
              disabled={isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate(item.id, "PROCESSING");
              }}
              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-medium"
            >
              Mark Processing
            </button>
          )}
          {item.status === "PROCESSING" && (
            <button
              disabled={isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate(item.id, "COMPLETED");
              }}
              className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 font-medium"
            >
              Complete
            </button>
          )}
        </div>
      ),
    },
    {
      key: "date",
      header: "Request Date",
      render: (item: Payout) => (
        <span className="text-xs text-slate-500">
          {new Date(item.date).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={payouts}
        columns={columns}
        searchable={false} // Payouts usually not searched heavily, can add later
      />
    </div>
  );
}
