"use client";

import { DataTable } from "@/components/dashboard";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  RotateCw,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import EventFilterDropdown from "@/components/dashboard/EventFilterDropdown";

type Transaction = {
  id: string;
  reference: string;
  type: string;
  amount: number;
  status: string;
  payer: string;
  candidate?: {
    name: string;
    code: string;
    categoryName?: string;
    category?: string | null;
  } | null;
  phone?: string;
  event: string;
  date: Date;
  voteCount?: number;
  ticketQuantity?: number;
  gateway?: string;
  channel?: string;
};

const CopyableReference = ({ reference }: { reference: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="flex items-center gap-1.5 group cursor-pointer" 
      onClick={handleCopy} 
      title="Copy reference"
    >
      <div className="font-mono text-[10px] text-slate-500 max-w-[80px] truncate group-hover:text-indigo-600 transition-colors">
        {reference}
      </div>
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-indigo-500 transition-all" />
      )}
    </div>
  );
};

const formatCompactCurrency = (num: number) => {
  if (num >= 1000000) return parseFloat((num / 1000000).toFixed(2)) + "M";
  if (num >= 1000) return parseFloat((num / 1000).toFixed(2)) + "k";
  return new Intl.NumberFormat("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatCompactNumber = (num: number) => {
  if (num >= 1000000) return parseFloat((num / 1000000).toFixed(1)) + "M";
  if (num >= 1000) return parseFloat((num / 1000).toFixed(1)) + "k";
  return num.toString();
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
  VOTE: "Vote",
  TICKET: "Ticket",
  NOMINATION_FEE: "Nomination",
};

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function TransactionsTable({
  transactions,
  pagination,
  eventsList,
  currentFilters,
  isOrganizer = false,
}: {
  transactions: Transaction[];
  pagination: Pagination;
  eventsList: { id: string; title: string }[];
  currentFilters: { eventId: string; status: string; type?: string; gateway?: string; channel?: string; date?: string };
  isOrganizer?: boolean;
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
          (tx.candidate?.name?.toLowerCase().includes(query)) ||
          (tx.candidate?.code?.toLowerCase().includes(query)) ||
          (tx.phone && tx.phone.toLowerCase().includes(query)) ||
          tx.event.toLowerCase().includes(query)
        );
      })
    : transactions;

  const allColumns = [
    {
      key: "reference",
      header: "Reference",
      render: (tx: Transaction) => <CopyableReference reference={tx.reference} />,
      sortable: true,
    },
    {
      key: "candidate",
      header: "Candidate",
      render: (tx: Transaction) => (
        <div className="flex flex-col gap-0.5" title={tx.candidate ? `${tx.candidate.name}${tx.candidate.category ? ` · ${tx.candidate.category}` : ""}` : undefined}>
          {tx.candidate ? (
            <>
              <span className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">
                {tx.candidate.name}
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest truncate max-w-[200px]">
                {tx.candidate.categoryName || tx.candidate.category || "N/A"}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-slate-400">-</span>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "phone",
      header: "Phone",
      render: (tx: Transaction) => (
        <span className="text-sm font-medium text-slate-900">
          {tx.phone && tx.phone !== "N/A" ? tx.phone : "-"}
        </span>
      ),
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      render: (tx: Transaction) => (
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
          {typeLabelMap[tx.type] || tx.type}
        </span>
      ),
      sortable: true,
    },
    {
      key: "amount",
      header: "AMT",
      render: (tx: Transaction) => (
        <span className="text-sm font-medium text-slate-900">
          {formatCompactCurrency(tx.amount)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "units",
      header: "Units",
      render: (tx: Transaction) => {
        const value = tx.type === "VOTE" 
          ? tx.voteCount || 0 
          : tx.type === "TICKET" 
            ? tx.ticketQuantity || 0 
            : null;
            
        return (
          <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            {value !== null ? formatCompactNumber(value) : "-"}
          </span>
        );
      },
    },
    {
      key: "event",
      header: "Event Context",
      render: (tx: Transaction) => (
        <div
          className="text-xs text-slate-500 max-w-[120px] truncate font-medium"
          title={tx.event}
        >
          {tx.event}
        </div>
      ),
      sortable: true,
    },
    {
      key: "gateway",
      header: "Gateway",
      render: (tx: Transaction) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest w-fit">
            {tx.gateway || "N/A"}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest w-fit">
            {tx.channel || "WEB"}
          </span>
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
              "inline-flex items-center justify-center w-6 h-6 rounded-full",
              config.bg,
              config.color
            )}
            title={config.label}
          >
            <Icon className="w-3.5 h-3.5" />
          </span>
        );
      },
      sortable: true,
    },
    {
      key: "date",
      header: "Date",
      render: (tx: Transaction) => (
        <span className="text-[11px] text-slate-500 whitespace-nowrap">
          {new Date(tx.date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
      ),
      sortable: true,
    },
  ];

  const columns = allColumns.filter((col) => {
    if (isOrganizer && col.key === "gateway") return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search on current page..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <EventFilterDropdown
            value={currentFilters.eventId}
            onChange={(val) => handleParamChange("eventId", val)}
            eventsList={eventsList}
            placeholder="All Events"
          />

          <select
            value={currentFilters.type || "ALL"}
            onChange={(e) => handleParamChange("type", e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="VOTE">Vote</option>
            <option value="TICKET">Ticket</option>
          </select>

          {!isOrganizer && (
            <select
              value={currentFilters.gateway || "ALL"}
              onChange={(e) => handleParamChange("gateway", e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Gateways</option>
              <option value="PAYSTACK">Paystack</option>
              <option value="NALO">Nalo</option>
              <option value="APPSMOBILE">AppsMobile</option>
            </select>
          )}

          <select
            value={currentFilters.channel || "ALL"}
            onChange={(e) => handleParamChange("channel", e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All Channels</option>
            <option value="WEB">Web</option>
            <option value="USSD">USSD</option>
          </select>

          <select
            value={currentFilters.status}
            onChange={(e) => handleParamChange("status", e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <input
            type="date"
            value={currentFilters.date || ""}
            onChange={(e) => handleParamChange("date", e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[140px]"
          />
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
