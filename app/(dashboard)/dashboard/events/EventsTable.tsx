"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { api } from "@/lib/api-client";
import { useModal } from "@/components/providers/ModalProvider";
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
  Send,
  Zap,
  Percent,
} from "lucide-react";
import { clsx } from "clsx";

// ... existing types ...

type AdminEvent = {
  id: string;
  eventCode: string;
  title: string;
  image?: string;
  imageUrl?: string;
  coverImage?: string;
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
  commissionRate?: number;
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
  PUBLISHED: {
    label: "Published",
    color: "text-teal-700",
    bg: "bg-teal-100",
    icon: Zap,
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
  role?: "ADMIN" | "SUPER_ADMIN" | "ORGANIZER";
  hideOrganizerColumn?: boolean;
};

export default function EventsTable({ events, showFilters = ["type", "status"], role, hideOrganizerColumn }: EventsTableProps) {
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isOrganizer = role === "ORGANIZER";
  const router = useRouter();
  const modal = useModal();
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
  
  // Commission Modal State
  const [commissionModal, setCommissionModal] = useState<{
    isOpen: boolean;
    eventId: string | null;
    currentRate: number | string;
    eventTitle: string;
  }>({ isOpen: false, eventId: null, currentRate: "", eventTitle: "" });

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

  const handleAction = async (action: string, id: string, code?: string) => {
    setActiveMenu(null); // Close menu immediately

    if (action === "view") {
      router.push(`/dashboard/events/${code || id}`);
      return;
    }

    const eventId = id;

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

    if (action === "set_commission") {
      const event = events.find((e) => e.id === id);
      setCommissionModal({
        isOpen: true,
        eventId: id,
        currentRate: event?.commissionRate ?? "",
        eventTitle: event?.title || "Event",
      });
      return;
    }

    if (action === "restore") {
      startTransition(async () => {
        try {
          await api.post(`/events/${eventId}/restore`);
          router.refresh();
        } catch (error: any) {
          modal.alert({ title: "Restore Failed", message: "Failed to restore event. Please try again.", variant: "danger" });
        }
      });
      return;
    }

    let endpoint = "";
    let payload: any = undefined;

    switch (action) {
      case "approve":
        endpoint = `/events/${eventId}/approve`;
        break;
      case "reject":
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
      case "submit":
        endpoint = `/events/${eventId}/submit`;
        break;
      case "publish":
        endpoint = `/events/${eventId}/publish`;
        break;
      case "delete":
        const eventToDelete = events.find((e) => e.id === eventId);
        const confirmedDelete = await modal.confirm({
          title: "Delete Event",
          message: `Are you sure you want to PERMANENTLY delete "${eventToDelete?.title || "this event"}"? This action cannot be undone.`,
          variant: "danger",
          confirmText: "Delete",
        });
        if (!confirmedDelete) return;
        endpoint = `/events/${eventId}`;

        startTransition(async () => {
          try {
            await api.delete(endpoint);
            router.refresh();
          } catch (error: any) {
            modal.alert({ title: "Delete Failed", message: error.message || "Failed to delete event", variant: "danger" });
          }
        });
        return;
      default:
        return;
    }

    startTransition(async () => {
      try {
        if (action === "submit" || action === "approve" || action === "publish") {
          await api.patch(endpoint, {});
        } else {
          await api.patch(endpoint, payload);
        }
        router.refresh();
      } catch (error: any) {
        modal.alert({ title: "Update Failed", message: error.message || "Failed to update event status", variant: "danger" });
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
        modal.alert({ title: "Archive Failed", message: "Failed to archive event. Please try again.", variant: "danger" });
      }
    });
  };

  const columns = [
    {
      key: "title",
      header: "Event",
      render: (event: AdminEvent) => {
        const imageSrc = event.image || event.imageUrl || event.coverImage;
        const Icon = typeConfig[event.type]?.icon || Calendar;
        return (
          <div className="flex items-center gap-3">
            {imageSrc ? (
              <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                <Image src={imageSrc} alt={event.title} width={40} height={40} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                <Icon className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="font-medium text-slate-900 line-clamp-1">{event.title}</p>
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
              <Image
                width={32}
                height={32}
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
  ].filter(col => !(col.key === "organizer" && hideOrganizerColumn));

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
        onRowClick={(event) => router.push(`/dashboard/events/${event.eventCode}`)}
        actions={(event, index) => (
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
              <div className={clsx(
                "absolute right-0 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50",
                index > 5 ? "bottom-full mb-1" : "top-full mt-1"
              )}>
                <button
                  onClick={() => handleAction("view", event.id, event.eventCode)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" /> View Details
                </button>

                {isAdmin && event.status === "PENDING_REVIEW" && (
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

                {isAdmin && (
                  <button
                    onClick={() => handleAction("set_commission", event.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 border-t border-slate-50 mt-1"
                  >
                    <Percent className="h-4 w-4" /> Set Commission
                  </button>
                )}

                {isOrganizer && event.status === "APPROVED" && (
                  <button
                    onClick={() => handleAction("publish", event.id, event.eventCode)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50"
                  >
                    Publish
                  </button>
                )}

                {isOrganizer && event.status === "DRAFT" && (
                  <button
                    onClick={() => handleAction("submit", event.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50"
                  >
                    <Send className="h-4 w-4" /> Submit for Review
                  </button>
                )}

                {isAdmin && event.status === "DRAFT" && (
                  <button
                    onClick={() => handleAction("approve", event.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4" /> Approve Draft
                  </button>
                )}

                {!["LIVE", "ENDED", "PAUSED", "PUBLISHED"].includes(event.status) && (
                  <button
                    onClick={() => handleAction("delete", event.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Event
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

      {/* Commission Modal */}
      {commissionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Set Commission Rate</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">
                Custom rate for <strong>{commissionModal.eventTitle}</strong>. 
                Leave empty or set to 0 to use global default.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                  Commission Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g. 10"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-lg"
                    value={commissionModal.currentRate}
                    onChange={(e) => setCommissionModal({ ...commissionModal, currentRate: e.target.value })}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    %
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 flex gap-3">
                <AlertCircle size={20} className="text-primary-600 shrink-0 mt-0.5" />
                <p className="text-xs text-primary-700 font-medium leading-relaxed">
                  This rate will be applied to all future revenue calculations and balance payouts for this specific event.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCommissionModal({ ...commissionModal, isOpen: false })}
                className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!commissionModal.eventId) return;
                  startTransition(async () => {
                    try {
                      await api.patch(`/events/${commissionModal.eventId}/commission`, {
                        commissionRate: Number(commissionModal.currentRate) || 0
                      });
                      setCommissionModal({ ...commissionModal, isOpen: false });
                      router.refresh();
                    } catch (error: any) {
                      modal.alert({ title: "Update Failed", message: error.message || "Failed to update commission rate", variant: "danger" });
                    }
                  });
                }}
                disabled={isPending}
                className="px-8 py-3 text-sm font-black text-white bg-primary-700 hover:bg-primary-800 rounded-2xl transition flex items-center gap-2 shadow-lg shadow-primary-200"
              >
                {isPending ? "Saving..." : "Save Rate"}
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
