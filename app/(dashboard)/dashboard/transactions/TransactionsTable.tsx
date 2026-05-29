"use client";

import {
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  RotateCw,
  XCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
} from "lucide-react";
import { clsx } from "clsx";
import { useState, Fragment } from "react";
import EventFilterDropdown from "@/components/dashboard/EventFilterDropdown";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
  candidateName: string;
  categoryName: string;
  ticketTypeName?: string;
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
          tx.customerPhone.toLowerCase().includes(query) ||
          tx.event.toLowerCase().includes(query) ||
          tx.candidateName.toLowerCase().includes(query) ||
          tx.categoryName.toLowerCase().includes(query)
        );
      })
    : transactions;

  const hasDetail = (tx: Transaction) =>
    !!(tx.customerEmail || tx.customerPhone || tx.source ||
      (tx.type === "TICKET" && tx.ticketNumbers?.length) ||
      (tx.type === "VOTE" && (tx.candidateName || tx.categoryName)));

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reference, payer, event, candidate…"
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

      {/* Custom Transaction Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="w-8 px-3 py-3" />
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Payer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Context</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-slate-400 text-sm">
                    No transactions found.
                  </td>
                </tr>
              )}

              {filteredTransactions.map((tx) => {
                const isOpen = expandedIds.has(tx.id);
                const showChevron = hasDetail(tx);
                const statusCfg = statusConfig[tx.status] || {
                  label: tx.status,
                  color: "text-slate-600",
                  bg: "bg-slate-100",
                  icon: AlertCircle,
                };
                const StatusIcon = statusCfg.icon;

                return (
                  <Fragment key={tx.id}>
                    {/* Primary row */}
                    <tr className={clsx("transition-colors", isOpen ? "bg-slate-50" : "hover:bg-slate-50/60")}>
                      {/* Expand Toggle Chevron */}
                      <td className="px-3 py-3 text-center">
                        {showChevron && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(tx.id)}
                            aria-label={isOpen ? "Collapse details" : "Expand details"}
                            className="text-slate-300 hover:text-slate-600 transition-colors focus:outline-none"
                          >
                            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </td>

                      {/* Reference + Channel Badge */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-slate-600 leading-tight">{tx.reference}</div>
                        <span className={clsx(
                          "mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                          tx.source === "ussd"
                            ? "bg-purple-50 text-purple-700 border border-purple-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        )}>
                          {tx.source === "ussd" ? "USSD" : "Web"}
                        </span>
                      </td>

                      {/* Payer — name only */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900 whitespace-nowrap">{tx.payer}</div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3">
                        <span className={clsx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
                          tx.type === "VOTE"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            : tx.type === "TICKET"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-slate-50 text-slate-700 border border-slate-100"
                        )}>
                          {typeLabelMap[tx.type] || tx.type}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-slate-900">
                          {new Intl.NumberFormat("en-GH", {
                            style: "currency",
                            currency: tx.currency || "GHS",
                          }).format(tx.amount)}
                        </div>
                      </td>

                      {/* Units — count only */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 whitespace-nowrap">
                          {tx.type === "VOTE"
                            ? `${tx.voteCount || 0} Votes`
                            : tx.type === "TICKET"
                              ? `${tx.ticketQuantity || 0} Tickets`
                              : "—"}
                        </span>
                      </td>

                      {/* Context — event + sub-metadata */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <div
                          className="text-xs font-medium text-slate-700 truncate"
                          title={tx.event}
                        >
                          {tx.event}
                        </div>
                        {tx.type === "VOTE" && tx.candidateName ? (
                          <div
                            className="text-xs text-slate-400 truncate"
                            title={`${tx.candidateName}${tx.categoryName ? ` · ${tx.categoryName}` : ""}`}
                          >
                            {tx.candidateName}{tx.categoryName ? ` · ${tx.categoryName}` : ""}
                          </div>
                        ) : tx.type === "TICKET" && tx.ticketTypeName ? (
                          <div
                            className="text-xs text-slate-400 truncate"
                            title={tx.ticketTypeName}
                          >
                            {tx.ticketTypeName}
                          </div>
                        ) : null}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={clsx(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap",
                          statusCfg.bg,
                          statusCfg.color
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {new Date(tx.date).toLocaleString("en-GH", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable detail row */}
                    {isOpen && (
                      <tr className="bg-indigo-50/20 border-b border-indigo-100/30">
                        <td />
                        <td colSpan={8} className="px-6 py-4">
                          <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs text-slate-600">
                            {tx.customerEmail && (
                              <div className="flex items-center gap-1.5">
                                <Mail size={12} className="text-slate-400 shrink-0" />
                                <span>{tx.customerEmail}</span>
                              </div>
                            )}
                            {tx.customerPhone && (
                              <div className="flex items-center gap-1.5">
                                <Phone size={12} className="text-slate-400 shrink-0" />
                                <span className="font-mono">{tx.customerPhone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-medium">Channel:</span>
                              <span className="capitalize font-medium text-slate-700">
                                {tx.source === "ussd" ? "USSD" : "Web / Card"}
                              </span>
                            </div>
                            {tx.type === "VOTE" && (tx.candidateName || tx.categoryName) && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-medium">Voted for:</span>
                                {tx.candidateName && <span className="font-medium text-slate-700">{tx.candidateName}</span>}
                                {tx.categoryName && <span className="text-slate-400">in {tx.categoryName}</span>}
                              </div>
                            )}
                            {tx.type === "TICKET" && tx.ticketNumbers && tx.ticketNumbers.length > 0 && (
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="text-slate-400 font-medium">Ticket IDs:</span>
                                <div className="flex flex-wrap gap-1">
                                  {tx.ticketNumbers.map((num) => (
                                    <span
                                      key={num}
                                      className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 text-[11px]"
                                    >
                                      {num}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200">
          <div className="text-sm text-slate-500 font-medium">
            Showing{" "}
            <span className="text-slate-900">
              {(pagination.currentPage - 1) * 20 + 1}
            </span>{" "}
            to{" "}
            <span className="text-slate-900">
              {Math.min(pagination.currentPage * 20, pagination.totalResults)}
            </span>{" "}
            of <span className="text-slate-900">{pagination.totalResults}</span>{" "}
            transactions
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
