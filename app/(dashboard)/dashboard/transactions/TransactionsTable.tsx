"use client";

import { DataTable } from "@/components/dashboard";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  RotateCw,
  XCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

type Transaction = {
  id: string;
  reference: string;
  type: string;
  amount: number;
  status: string;
  payer: string;
  event: string;
  date: Date;
};

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  SUCCESS: {
    label: "Success",
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
    icon: RotateCw,
  },
  FAILED: {
    label: "Failed",
    color: "text-red-700",
    bg: "bg-red-100",
    icon: XCircle,
  },
  REFUNDED: {
    label: "Refunded",
    color: "text-purple-700",
    bg: "bg-purple-100",
    icon: RotateCw,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-slate-700",
    bg: "bg-slate-100",
    icon: XCircle,
  },
};

const typeLabelMap: Record<string, string> = {
  VOTE: "Vote Cast",
  TICKET: "Ticket Sale",
  NOMINATION_FEE: "Nomination Fee",
};

export default function TransactionsTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredTransactions = transactions.filter((tx) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      tx.reference.toLowerCase().includes(query) ||
      tx.payer.toLowerCase().includes(query) ||
      tx.event.toLowerCase().includes(query);

    const matchStatus = statusFilter === "ALL" || tx.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: "reference",
      header: "Reference",
      render: (tx: Transaction) => (
        <div className="font-mono text-xs text-slate-500">{tx.reference}</div>
      ),
      sortable: true,
    },
    {
      key: "payer",
      header: "User / Payer",
      render: (tx: Transaction) => (
        <div className="text-sm font-medium text-slate-900">{tx.payer}</div>
      ),
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      render: (tx: Transaction) => (
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {typeLabelMap[tx.type] || tx.type}
        </span>
      ),
      sortable: true,
    },
    {
      key: "amount",
      header: "Amount",
      render: (tx: Transaction) => (
        <span className="font-medium text-slate-900">
          {new Intl.NumberFormat("en-GH", {
            style: "currency",
            currency: "GHS",
          }).format(tx.amount)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "event",
      header: "Event Context",
      render: (tx: Transaction) => (
        <div
          className="text-xs text-slate-500 max-w-[150px] truncate"
          title={tx.event}
        >
          {tx.event}
        </div>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      render: (tx: Transaction) => {
        const config = statusConfig[tx.status] || {
          label: tx.status,
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
      key: "date",
      header: "Date",
      render: (tx: Transaction) => (
        <span className="text-xs text-slate-500">
          {new Date(tx.date).toLocaleString()}
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reference, payer, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="ALL">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      <DataTable
        data={filteredTransactions}
        columns={columns}
        searchable={false}
      />
    </div>
  );
}
