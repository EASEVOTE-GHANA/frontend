"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { api } from "@/lib/api-client";
import { DataTable } from "@/components/dashboard";
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Vote,
  Ticket,
  Calendar,
  Building2,
  Ban,
  PauseCircle,
  Search,
  Filter,
  X,
  RefreshCw,
  Archive,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { clsx } from "clsx";

// ... existing types ...

type AdminEvent = {
  id: string;
  eventCode: string;
  title: string;
  organizer: {
    name: string;
    avatar: string;
  };
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  stats: {
    votes?: number;
    revenue?: number;
    ticketsSold?: number;
  };
};

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  PENDING_REVIEW: {
    label: "Pending",
    color: "text-amber-700",
    bg: "bg-amber-100",
    icon: AlertCircle,
  },
  APPROVED: {
    label: "Approved",
    color: "text-blue-700",
    bg: "bg-blue-100",
    icon: CheckCircle,
  },
  LIVE: {
    label: "Live",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: CheckCircle,
  },
  ENDED: {
    label: "Ended",
    color: "text-slate-600",
    bg: "bg-slate-100",
    icon: CheckCircle,
  },
  ARCHIVED: {
    label: "Archived",
    color: "text-gray-500",
    bg: "bg-gray-100",
    icon: Archive,
  },
  DRAFT: {
    label: "Draft",
    color: "text-slate-500",
    bg: "bg-slate-100",
    icon: MoreHorizontal,
  },
  PAUSED: {
    label: "Paused",
    color: "text-orange-700",
    bg: "bg-orange-100",
    icon: PauseCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-100",
    icon: Ban,
  },
};

const typeConfig: Record<string, { label: string; icon: any; color: string }> =
  {
    VOTING: { label: "Voting", icon: Vote, color: "text-purple-600" },
    TICKETING: { label: "Ticketing", icon: Ticket, color: "text-blue-600" },
    HYBRID: { label: "Hybrid", icon: Calendar, color: "text-orange-600" },
  };

const STATUS_FILTER = {
  label: "Status",
  key: "status",
  options: [
    { label: "Draft", value: "DRAFT" },
    { label: "Pending Review", value: "PENDING_REVIEW" },
    { label: "Approved", value: "APPROVED" },
    { label: "Live", value: "LIVE" },
    { label: "Ended", value: "ENDED" },
    { label: "Paused", value: "PAUSED" },
    { label: "Archived", value: "ARCHIVED" },
  ],
};

const TYPE_FILTER = {
  label: "Type",
  key: "type",
  options: [
    { label: "Voting", value: "VOTING" },
    { label: "Ticketing", value: "TICKETING" },
  ],
};

type EventsTableProps = {
  events: AdminEvent[];
  showFilters?: ("type" | "status")[];
};

export default function EventsTable({ events, showFilters = ["type", "status"] }: EventsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Archival Modal State
  const [archiveModal, setArchiveModal] = useState<{
    isOpen: boolean;
    eventId: string | null;
    eventTitle: string;
  }>({ isOpen: false, eventId: null, eventTitle: "" });
  const [pruneData, setPruneData] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("query") || "",
  );
  const statusFilter = searchParams.get("status") || "all";
  const typeFilter = searchParams.get("type") || "all";
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Debounce search update
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery !== (searchParams.get("query") || "")) {
        updateFilters("query", searchQuery);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    router.replace(pathname);
  };

  const hasActiveFilters =
    statusFilter !== "all" || typeFilter !== "all" || searchQuery;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAction = async (action: string, eventId: string) => {
    setActiveMenu(null); // Close menu immediately

    if (action === "view") {
      router.push(`/dashboard/events/${eventId}`);
      return;
    }

    if (action === "archive_prompt") {
      const event = events.find((e) => e.id === eventId);
      setArchiveModal({
        isOpen: true,
        eventId,
        eventTitle: event?.title || "Event",
      });
      setPruneData(false); // Reset default
      return;
    }

    if (action === "restore") {
      startTransition(async () => {
        try {
          await api.post(`/events/${eventId}/restore`);
          router.refresh();
        } catch (error: any) {
          alert("Failed to restore event");
        }
      });
      return;
    }

    let endpoint = "";
    let payload = undefined;

    switch (action) {
      case "approve":
        endpoint = `/events/${eventId}/approve`;
        break;
      case "reject":
        // Doc doesn't specify a standard rejected endpoint, sticking to current if generic exists or using status update
        endpoint = `/events/${eventId}/status`;
        payload = { status: "CANCELLED" };
        break;
      case "suspend":
        endpoint = `/events/${eventId}/status`;
        payload = { status: "PAUSED" };
        break;
      case "activate":
        endpoint = `/events/${eventId}/status`;
        payload = { status: "LIVE" };
        break;
      default:
        return;
    }

    startTransition(async () => {
      try {
        await api.patch(endpoint, payload);
        router.refresh();
      } catch (error: any) {
        alert(error.message || "Failed to update event status");
      }
    });
  };

  const confirmArchive = async () => {
    if (!archiveModal.eventId) return;

    startTransition(async () => {
      try {
        await api.post(`/events/${archiveModal.eventId}/archive`, {
          pruneData,
        });
        setArchiveModal({ isOpen: false, eventId: null, eventTitle: "" });
        router.refresh();
      } catch (error: any) {
        alert("Failed to archive event");
      }
    });
  };

  const columns = [
    {
      key: "title",
      header: "Event",
      render: (event: AdminEvent) => {
        const Icon = typeConfig[event.type]?.icon || Calendar;
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-slate-900">{event.title}</p>
              <p className="text-xs text-slate-500">{event.eventCode}</p>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "organizer",
      header: "Organizer",
      render: (event: AdminEvent) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white overflow-hidden">
            {event.organizer.avatar?.startsWith("http") ? (
              <img
                src={event.organizer.avatar}
                alt={event.organizer.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              (event.organizer.name || "??").substring(0, 2).toUpperCase()
            )}
          </div>
          <span className="text-sm text-slate-700 truncate max-w-[150px]">
            {event.organizer.name}
          </span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      render: (event: AdminEvent) => {
        const config = typeConfig[event.type] || {
          label: event.type,
          icon: Calendar,
          color: "text-slate-600",
        };
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-1.5">
            <Icon className={clsx("h-4 w-4", config.color)} />
            <span className="text-sm text-slate-600">{config.label}</span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "stats",
      header: "Stats",
      render: (event: AdminEvent) => (
        <div className="text-sm">
          <div className="font-medium text-slate-900">
            {formatCurrency(event.stats.revenue || 0)}
          </div>
          <div className="text-xs text-slate-500">
            {event.type === "VOTING"
              ? `${(event.stats?.votes || 0).toLocaleString()} votes`
              : event.type === "TICKETING"
                ? `${event.stats?.ticketsSold ?? 0} sold`
                : "Composite"}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      render: (event: AdminEvent) => {
        const config = statusConfig[event.status] || {
          label: event.status,
          color: "text-slate-600",
          bg: "bg-slate-100",
          icon: AlertCircle,
        };
        return (
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              config.bg,
              config.color,
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
      key: "date",
      header: "Date",
      render: (event: AdminEvent) => (
        <div className="text-sm text-slate-600">
          {new Date(event.startDate).toLocaleDateString()}
        </div>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* ... Filters Section ... */}

      {/* ... DataTable ... */}
      <DataTable
        data={events}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search events..."
        filters={[
          ...(showFilters.includes("type") ? [TYPE_FILTER] : []),
          ...(showFilters.includes("status") ? [STATUS_FILTER] : []),
        ]}
        onRowClick={(event) => router.push(`/dashboard/events/${event.id}`)}
        actions={(event) => (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === event.id ? null : event.id);
              }}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </button>

            {activeMenu === event.id && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <button
                  onClick={() => handleAction("view", event.id)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" /> View Details
                </button>

                {event.status === "PENDING_REVIEW" && (
                  <>
                    <button
                      onClick={() => handleAction("approve", event.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleAction("reject", event.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </>
                )}

                {event.status === "LIVE" && (
                  <button
                    onClick={() => handleAction("suspend", event.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
                  >
                    <AlertCircle className="h-4 w-4" /> Suspend
                  </button>
                )}

                {(event.status === "ENDED" || event.status === "LIVE") && (
                  <button
                    onClick={() => handleAction("archive_prompt", event.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <Archive className="h-4 w-4" /> Archive
                  </button>
                )}

                {event.status === "ARCHIVED" && (
                  <button
                    onClick={() => handleAction("restore", event.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                  >
                    <RotateCcw className="h-4 w-4" /> Restore
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      />

      {/* Archive Modal */}
      {archiveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full text-red-600">
                <Archive size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Archive Event?
                </h3>
                <p className="text-slate-600 mt-1">
                  Are you sure you want to archive{" "}
                  <strong>{archiveModal.eventTitle}</strong>? It will be hidden
                  from the main dashboard.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:border-red-500 checked:bg-red-500"
                    checked={pruneData}
                    onChange={(e) => setPruneData(e.target.checked)}
                  />
                  <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white opacity-0 peer-checked:opacity-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-slate-900 block text-sm">
                    Prune Vote Data (Irreversible)
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Check this to **permanently delete** all vote records for
                    this event to free up database space. Metadata stays.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() =>
                  setArchiveModal({
                    isOpen: false,
                    eventId: null,
                    eventTitle: "",
                  })
                }
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-2"
              >
                {isPending ? "Archiving..." : "Confirm Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
