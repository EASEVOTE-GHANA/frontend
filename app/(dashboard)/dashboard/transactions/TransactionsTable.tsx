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
import EventFilterDropdown from "@/components/dashboard/EventFilterDropdown";

type Transaction = {
  id: string;
  reference: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  payer: string;
  customerEmail: string;
  customerPhone: string;
  source: string;
  event: string;
  eventType: string;
  date: Date;
  voteCount?: number;
  ticketQuantity?: number;
  ticketNumbers?: string[];
};

type Pagination = {
  totalPages: number;
  currentPage: number;
  totalResults: number;
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

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function TransactionsTable({
  transactions,
  pagination,
  eventsList,
  currentFilters,
}: {
  transactions: Transaction[];
  pagination: Pagination;
  eventsList: { id: string; title: string }[];
  currentFilters: { eventId: string; status: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState("");

  const handleParamChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    // Reset page on filter change
    if (name !== "page") params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const filteredTransactions = searchQuery 
    ? transactions.filter((tx) => {
        const query = searchQuery.toLowerCase();
        return (
          tx.reference.toLowerCase().includes(query) ||
          tx.payer.toLowerCase().includes(query) ||
          tx.event.toLowerCase().includes(query)
        );
      })
    : transactions;

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
        <div className="space-y-0.5">
          <div className="text-sm font-medium text-slate-900">{tx.payer}</div>
          {tx.customerEmail && tx.customerEmail !== tx.payer && (
            <div className="text-xs text-slate-400">{tx.customerEmail}</div>
          )}
          {tx.customerPhone && (
            <div className="text-xs text-slate-500 font-mono">{tx.customerPhone}</div>
          )}
        </div>
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
        <div className="space-y-0.5">
          <span className="font-medium text-slate-900">
            {new Intl.NumberFormat("en-GH", {
              style: "currency",
              currency: tx.currency || "GHS",
            }).format(tx.amount)}
          </span>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {tx.currency || "GHS"}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "units",
      header: "Units",
      render: (tx: Transaction) => (
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            {tx.type === "VOTE"
              ? `${tx.voteCount || 0} Votes`
              : tx.type === "TICKET"
              ? `${tx.ticketQuantity || 0} Tickets`
              : "-"}
          </span>
          {tx.type === "TICKET" && tx.ticketNumbers && tx.ticketNumbers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tx.ticketNumbers.map((num) => (
                <span key={num} className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                  {num}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "source",
      header: "Channel",
      render: (tx: Transaction) => (
        <span className={clsx(
          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
          tx.source === "ussd"
            ? "bg-purple-50 text-purple-700 border border-purple-100"
            : "bg-blue-50 text-blue-700 border border-blue-100"
        )}>
          {tx.source === "ussd" ? "USSD" : "Web"}
        </span>
      ),
    },
    {
      key: "event",
      header: "Event Context",
      render: (tx: Transaction) => (
        <div
          className="text-xs text-slate-500 max-w-[150px] truncate font-medium"
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
            placeholder="Search on current page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <EventFilterDropdown
            value={currentFilters.eventId}
            onChange={(val) => handleParamChange("eventId", val)}
            eventsList={eventsList}
            placeholder="All Events"
          />

          <select
            title="Filter by status"
            value={currentFilters.status}
            onChange={(e) => handleParamChange("status", e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      <DataTable
        data={filteredTransactions}
        columns={columns}
        searchable={false}
      />

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200">
          <div className="text-sm text-slate-500 font-medium">
            Showing <span className="text-slate-900">{(pagination.currentPage - 1) * 20 + 1}</span> to <span className="text-slate-900">{Math.min(pagination.currentPage * 20, pagination.totalResults)}</span> of <span className="text-slate-900">{pagination.totalResults}</span> transactions
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center px-4 bg-slate-50 rounded-lg border border-slate-100 text-sm font-bold text-slate-700">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <button
              type="button"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
