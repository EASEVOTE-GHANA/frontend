"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalProvider";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Calendar,
  MapPin,
  Vote,
  Ticket,
  Users,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  PauseCircle,
  Ban,
  Mail,
  Phone,
  DollarSign,
  Settings as SettingsIcon,
  LayoutDashboard,
  Edit,
  List,
  Trash2,
  ExternalLink,
  Share2,
  ChevronDown,
  Percent,
  Plus,
} from "lucide-react";
import { clsx } from "clsx";
import { EventForm } from "./EventForm";
import { CategoriesManager } from "./CategoriesManager";
import AdminEventActions from "@/app/(dashboard)/dashboard/events/AdminEventActions";
import Image from "next/image";
import { ImageWithPreview } from "@/components/ui/ImageWithPreview";

type EventDetails = {
  id: string;
  eventCode: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string | null;
  venue: string | null;
  coverImage: string | null;
  type: "VOTING" | "TICKETING" | "HYBRID";
  createdAt: string;
  organizer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
  };
  stats: {
    revenue: number;
    votes?: number;
    ticketsSold?: number;
    candidatesCount?: number;
    ticketTypesCount?: number;
  };
  categories?: any[];
  ticketTypes?: any[];
  costPerVote?: number | null;
  minVotesPerPurchase?: number;
  maxVotesPerPurchase?: number | null;
  allowPublicNominations?: boolean;
  imageUrl?: string | null;
  organizerId: string;
  showVoteCount?: boolean;
  showSalesEnd?: boolean;
  commissionRate?: number;
};

interface AdminEventManagerProps {
  event: EventDetails;
  role: "ADMIN" | "SUPER_ADMIN" | "ORGANIZER";
  backUrl: string;
}

type Tab = "overview" | "edit" | "categories" | "settings";

const TAB_META: Record<Tab, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  overview:   { label: "Overview",     icon: LayoutDashboard },
  edit:       { label: "Edit Details", icon: Edit },
  categories: { label: "Categories",  icon: List },
  settings:   { label: "Settings",    icon: SettingsIcon },
};

function getAvailableTabs(status: string, type: string): { primary: Tab[]; secondary: Tab[] } {
  const isVoting = type === "VOTING" || type === "HYBRID";
  const all: Tab[] = ["overview", "edit"];
  if (isVoting) all.push("categories");
  all.push("settings");

  let primary: Tab[];
  switch (status) {
    case "DRAFT":
      primary = isVoting ? ["edit", "categories", "settings"] : ["edit", "settings"];
      break;
    case "PENDING_REVIEW":
    case "APPROVED":
      primary = isVoting ? ["overview", "edit", "categories"] : ["overview", "edit", "settings"];
      break;
    case "LIVE":
    case "PUBLISHED":
    case "PAUSED":
      primary = isVoting ? ["overview", "categories", "settings"] : ["overview", "settings"];
      break;
    case "ENDED":
    case "CANCELLED":
      primary = ["overview", "settings"];
      break;
    default:
      primary = isVoting ? ["overview", "edit", "categories"] : ["overview", "edit", "settings"];
  }

  const secondary = all.filter((t) => !primary.includes(t));
  return { primary, secondary };
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  PENDING_REVIEW: {
    label: "Pending Review",
    color: "text-primary-700",
    bg: "bg-primary-100",
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
    icon: CheckCircle,
  },
  PAUSED: {
    label: "Paused",
    color: "text-primary-700",
    bg: "bg-primary-100",
    icon: PauseCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-100",
    icon: Ban,
  },
};

export function AdminEventManager({
  event,
  role,
  backUrl,
}: AdminEventManagerProps) {
  const router = useRouter();
  const modal = useModal();

  const defaultTab: Tab = event.status === "DRAFT" ? "edit" : "overview";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [currentStatus, setCurrentStatus] = useState(event.status);
  const [commissionRate, setCommissionRate] = useState<string>(
    event.commissionRate?.toString() || ""
  );
  const [isSavingCommission, setIsSavingCommission] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Ticket type management state
  const [localTicketTypes, setLocalTicketTypes] = useState<any[]>(event.ticketTypes || []);
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [ticketForm, setTicketForm] = useState({ name: "", description: "", price: "", quantity: "" });
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) {
        setIsMobileNavOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { primary: primaryTabs, secondary: secondaryTabs } = getAvailableTabs(
    currentStatus,
    event.type
  );

  const StatusIcon = statusConfig[currentStatus]?.icon || AlertCircle;
  const statusColor = statusConfig[currentStatus]?.color || "text-slate-700";
  const statusBg = statusConfig[currentStatus]?.bg || "bg-slate-100";
  const statusLabel = statusConfig[currentStatus]?.label || currentStatus;

  const publicHref =
    event.type === "TICKETING"
      ? `/events/tickets/${event.eventCode || event.id}`
      : `/events/${event.eventCode || event.id}`;

  const ActiveTabIcon = TAB_META[activeTab].icon;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async () => {
    const confirmed = await modal.confirm({
      title: "Delete Event",
      message:
        "Are you sure you want to delete this event? This action cannot be undone. All data, including voting records and revenue history, will be permanently removed.",
      variant: "danger",
      confirmText: "Delete Event",
    });
    if (!confirmed) return;

    try {
      await api.delete(`/events/${event.id}`);
      await modal.alert({
        title: "Event Deleted",
        message: "Event deleted successfully.",
        variant: "info",
      });
      router.push(backUrl);
    } catch (err: any) {
      modal.alert({
        title: "Delete Failed",
        message: err.message || "An error occurred",
        variant: "danger",
      });
    }
  };

  const handleUpdateCommission = async () => {
    setIsSavingCommission(true);
    try {
      await api.patch(`/events/${event.id}/commission`, {
        commissionRate: commissionRate ? parseFloat(commissionRate) : 0,
      });
      toast.success("Commission rate updated successfully");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update commission rate");
    } finally {
      setIsSavingCommission(false);
    }
  };

  const handleShareNomination = () => {
    const url = `${window.location.origin}/nominations/${event.eventCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Nomination link copied to clipboard!");
  };

  const startEditTicket = (ticket: any) => {
    const tid = ticket._id || ticket.id;
    setEditingTicketId(tid);
    setIsAddingTicket(false);
    setTicketForm({
      name: ticket.name || "",
      description: ticket.description || "",
      price: String(ticket.price ?? ""),
      quantity: String(ticket.quantity ?? ""),
    });
  };

  const cancelTicketEdit = () => {
    setEditingTicketId(null);
    setIsAddingTicket(false);
    setTicketForm({ name: "", description: "", price: "", quantity: "" });
  };

  const handleSaveTicket = async () => {
    if (!ticketForm.name.trim()) return toast.error("Ticket name is required");
    if (!ticketForm.price || parseFloat(ticketForm.price) < 0) return toast.error("A valid price is required");
    if (!ticketForm.quantity || parseInt(ticketForm.quantity) < 1) return toast.error("Quantity must be at least 1");

    setIsSavingTicket(true);
    try {
      const payload = {
        name: ticketForm.name.trim(),
        description: ticketForm.description.trim() || null,
        price: parseFloat(ticketForm.price),
        quantity: parseInt(ticketForm.quantity),
      };

      if (editingTicketId) {
        const res = await api.put(`/events/${event.id}/ticket-types/${editingTicketId}`, payload);
        const updated = res.ticketType || res.data || { ...payload, _id: editingTicketId };
        setLocalTicketTypes((prev) =>
          prev.map((t) => (t._id || t.id) === editingTicketId ? { ...t, ...updated } : t)
        );
        toast.success("Ticket type updated");
      } else {
        const res = await api.post(`/events/${event.id}/ticket-types`, payload);
        const created = res.ticketType || res.data || payload;
        setLocalTicketTypes((prev) => [...prev, created]);
        toast.success("Ticket type added");
      }
      cancelTicketEdit();
    } catch (err: any) {
      toast.error(err.message || "Failed to save ticket type");
    } finally {
      setIsSavingTicket(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    const confirmed = await modal.confirm({
      title: "Delete Ticket Type",
      message: "Are you sure you want to delete this ticket type? This cannot be undone.",
      variant: "danger",
      confirmText: "Delete",
    });
    if (!confirmed) return;
    try {
      await api.delete(`/events/${event.id}/ticket-types/${ticketId}`);
      setLocalTicketTypes((prev) => prev.filter((t) => (t._id || t.id) !== ticketId));
      toast.success("Ticket type deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete ticket type");
    }
  };

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    setIsMoreOpen(false);
    setIsMobileNavOpen(false);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <Link
          href={backUrl}
          className="text-sm text-slate-500 hover:text-slate-900 mb-4 inline-flex items-center gap-1"
        >
          ← Back to Events
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Title + meta */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-3xl font-bold text-slate-900 truncate">
                {event.title}
              </h1>
              <span
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium shrink-0",
                  statusBg,
                  statusColor
                )}
              >
                <StatusIcon className="w-4 h-4" />
                {statusLabel}
              </span>

              {/* View public page — icon only */}
              <a
                href={publicHref}
                target="_blank"
                rel="noopener noreferrer"
                title="View public page"
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-600 focus-visible:ring-offset-1 shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              {event.allowPublicNominations && (
                <button
                  type="button"
                  onClick={handleShareNomination}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 text-xs font-bold transition-all border border-primary-100 shadow-sm shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share Form
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-slate-500 text-sm flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />{" "}
                {(event.startDate ? new Date(event.startDate) : new Date()).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "short", year: "numeric" }
                )}{" "}
                –{" "}
                {(event.endDate ? new Date(event.endDate) : new Date()).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "short", year: "numeric" }
                )}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {event.location || "Online"}
              </span>
            </div>
          </div>

          {/* Status actions */}
          <div className="shrink-0">
            <AdminEventActions
              eventId={event.id}
              eventCode={event.eventCode}
              eventType={event.type}
              status={event.status}
              role={role}
              onStatusChange={setCurrentStatus}
            />
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div className="mt-5 border-b border-slate-200">
          {/* Mobile: accordion-style selector */}
          <div className="md:hidden relative" ref={mobileNavRef}>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
            >
              <span className="flex items-center gap-2">
                <ActiveTabIcon className="w-4 h-4 text-primary-600" />
                {TAB_META[activeTab].label}
              </span>
              <ChevronDown
                className={clsx(
                  "w-4 h-4 text-slate-400 transition-transform duration-200",
                  isMobileNavOpen && "rotate-180"
                )}
              />
            </button>

            {isMobileNavOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20">
                {[...primaryTabs, ...secondaryTabs].map((tab) => {
                  const { label, icon: Icon } = TAB_META[tab];
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => selectTab(tab)}
                      className={clsx(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                        activeTab === tab
                          ? "bg-primary-50 text-primary-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop: pill tabs + More dropdown */}
          <div className="hidden md:flex items-center gap-1 -mb-px">
            {primaryTabs.map((tab) => {
              const { label, icon: Icon } = TAB_META[tab];
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => selectTab(tab)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === tab
                      ? "border-primary-600 text-primary-700"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}

            {secondaryTabs.length > 0 && (
              <div className="relative ml-1" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen((v) => !v)}
                  className={clsx(
                    "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    secondaryTabs.includes(activeTab)
                      ? "border-primary-600 text-primary-700"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  )}
                >
                  More
                  <ChevronDown
                    className={clsx(
                      "w-3.5 h-3.5 transition-transform duration-150",
                      isMoreOpen && "rotate-180"
                    )}
                  />
                </button>

                {isMoreOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 min-w-40">
                    {secondaryTabs.map((tab) => {
                      const { label, icon: Icon } = TAB_META[tab];
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => selectTab(tab)}
                          className={clsx(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                            activeTab === tab
                              ? "bg-primary-50 text-primary-700 font-semibold"
                              : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image & Description */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="h-64 bg-slate-100 w-full relative">
                {event.imageUrl || event.coverImage ? (
                  <Image
                    src={event.imageUrl || event.coverImage || "/placeholder-event.png"}
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    <Calendar className="w-16 h-16 opacity-20" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  About Event
                </h3>
                <p className="text-slate-600 whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-500">
                    Total Revenue
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(event.stats?.revenue || 0)}
                </div>
              </div>

              {event.type === "VOTING" || event.type === "HYBRID" ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                      <Vote className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">
                      Total Votes
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {(event.stats?.votes || 0).toLocaleString()}
                  </div>
                </div>
              ) : null}

              {event.type === "TICKETING" || event.type === "HYBRID" ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">
                      Tickets Sold
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {(event.stats?.ticketsSold || 0).toLocaleString()}
                  </div>
                </div>
              ) : null}

              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-500">
                    {event.type === "VOTING" ? "Candidates" : "Ticket Types"}
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {event.type === "VOTING"
                    ? event.stats?.candidatesCount || 0
                    : event.stats?.ticketTypesCount || 0}
                </div>
              </div>
            </div>

            {/* Detailed Lists */}
            {(event.type === "VOTING" || event.type === "HYBRID") &&
              event.categories && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      Categories & Candidates
                    </h3>
                  </div>
                  <div className="grid gap-4">
                    {event.categories.map((category: any, i: number) => (
                      <CategoryAccordion key={category.id ?? i} category={category} />
                    ))}
                  </div>
                </div>
              )}

            {(event.type === "TICKETING" || event.type === "HYBRID") &&
              event.ticketTypes && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Ticket Types
                  </h3>
                  <div className="space-y-4">
                    {event.ticketTypes.map((ticket: any, i: number) => (
                      <div
                        key={ticket.id ?? i}
                        className="border border-slate-100 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-slate-900">
                              {ticket.name}
                            </div>
                            <div className="text-sm text-slate-500">
                              {formatCurrency(Number(ticket.price))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900">
                              {ticket.sold ?? ticket.soldCount ?? 0} /{" "}
                              {ticket.quantity || 0}
                            </div>
                            <div className="text-xs text-slate-500">sold</div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                ((ticket.sold ?? ticket.soldCount ?? 0) /
                                  (ticket.quantity || 1)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Organizer
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 shrink-0 overflow-hidden relative">
                  {event.organizer.avatar ? (
                    <Image
                      src={event.organizer.avatar}
                      alt={event.organizer.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold bg-primary-50 text-primary-700">
                      {(event.organizer?.name || "Unknown")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-slate-900">
                    {event.organizer.name}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">
                    Organizer
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <a
                  href={`mailto:${event.organizer.email}`}
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600"
                >
                  <Mail className="w-4 h-4" />
                  {event.organizer.email}
                </a>
                {event.organizer.phone && (
                  <a
                    href={`tel:${event.organizer.phone}`}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600"
                  >
                    <Phone className="w-4 h-4" />
                    {event.organizer.phone}
                  </a>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Details</h3>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500 text-sm">Event Code</span>
                <span className="font-medium text-slate-900 text-sm">
                  {event.eventCode}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500 text-sm">Type</span>
                <span className="font-medium text-slate-900 text-sm capitalize">
                  {event.type.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500 text-sm">Created At</span>
                <span className="font-medium text-slate-900 text-sm">
                  {(event.createdAt
                    ? new Date(event.createdAt)
                    : new Date()
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "edit" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EventForm
            eventId={event.id}
            currentStatus={currentStatus}
            backUrl={backUrl}
          />
        </div>
      )}

      {activeTab === "categories" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CategoriesManager
            key="cat-manager"
            eventId={event.id}
            backUrl={backUrl}
          />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* ── VOTING-specific settings ── */}
          {(event.type === "VOTING" || event.type === "HYBRID") && (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Nomination Form
                </h3>
                <div className="flex items-center justify-between py-4 border-b border-slate-50">
                  <div>
                    <h4 className="font-medium text-slate-900">
                      Configure Nomination Form
                    </h4>
                    <p className="text-sm text-slate-500">
                      Set up custom questions and manage common nomination
                      settings.
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/events/${event.id}/nominations/settings`}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-bold hover:bg-primary-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Open Builder
                  </Link>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h4 className="font-medium text-slate-900">
                      Review Nominations
                    </h4>
                    <p className="text-sm text-slate-500">
                      View, approve, or reject candidate nominations for this event.
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/events/${event.id}/nominations`}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-primary-200 text-primary-600 rounded-lg font-bold hover:bg-primary-50 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    View Nominations
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Voting Configuration
                </h3>
                <div className="flex items-center justify-between py-4 border-b border-slate-50">
                  <div>
                    <h4 className="font-medium text-slate-900">
                      Public Vote Counts
                    </h4>
                    <p className="text-sm text-slate-500">
                      Show the number of votes per candidate on the public
                      results page.
                    </p>
                  </div>
                  <VotingToggle
                    initialValue={event.showVoteCount ?? true}
                    eventId={event.id}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── TICKETING-specific settings ── */}
          {(event.type === "TICKETING" || event.type === "HYBRID") && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Ticket Types</h3>
                {!isAddingTicket && !editingTicketId && (
                  <button
                    type="button"
                    onClick={() => { setIsAddingTicket(true); setTicketForm({ name: "", description: "", price: "", quantity: "" }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-bold hover:bg-primary-100 transition-colors border border-primary-100"
                  >
                    <Plus className="w-4 h-4" />
                    Add Type
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {localTicketTypes.map((ticket: any) => {
                  const tid = ticket._id || ticket.id;
                  const isEditing = editingTicketId === tid;
                  return (
                    <div key={tid} className="border border-slate-100 rounded-lg overflow-hidden">
                      {isEditing ? (
                        <div className="p-4 space-y-3 bg-slate-50">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
                              <input
                                type="text"
                                value={ticketForm.name}
                                onChange={(e) => setTicketForm((f) => ({ ...f, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="e.g. VIP, Regular"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Price (GHS) *</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={ticketForm.price}
                                onChange={(e) => setTicketForm((f) => ({ ...f, price: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity *</label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={ticketForm.quantity}
                                onChange={(e) => setTicketForm((f) => ({ ...f, quantity: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="100"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                              <input
                                type="text"
                                value={ticketForm.description}
                                onChange={(e) => setTicketForm((f) => ({ ...f, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Optional description"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleSaveTicket}
                              disabled={isSavingTicket}
                              className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm font-bold hover:bg-primary-800 transition-colors disabled:opacity-50"
                            >
                              {isSavingTicket ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelTicketEdit}
                              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900">{ticket.name}</div>
                            <div className="text-sm text-slate-500 mt-0.5">
                              {formatCurrency(Number(ticket.price))} &middot; {ticket.sold ?? ticket.soldCount ?? 0} / {ticket.quantity} sold
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-4">
                            <button
                              type="button"
                              onClick={() => startEditTicket(ticket)}
                              className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTicket(tid)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {localTicketTypes.length === 0 && !isAddingTicket && (
                  <p className="text-sm text-slate-400 text-center py-4">No ticket types yet. Add one above.</p>
                )}

                {/* Add new ticket type form */}
                {isAddingTicket && (
                  <div className="border border-primary-100 rounded-lg overflow-hidden">
                    <div className="p-4 space-y-3 bg-primary-50/30">
                      <p className="text-xs font-bold text-primary-700 uppercase tracking-widest">New Ticket Type</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Name *</label>
                          <input
                            type="text"
                            value={ticketForm.name}
                            onChange={(e) => setTicketForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                            placeholder="e.g. VIP, Regular"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Price (GHS) *</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ticketForm.price}
                            onChange={(e) => setTicketForm((f) => ({ ...f, price: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity *</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={ticketForm.quantity}
                            onChange={(e) => setTicketForm((f) => ({ ...f, quantity: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                            placeholder="100"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                          <input
                            type="text"
                            value={ticketForm.description}
                            onChange={(e) => setTicketForm((f) => ({ ...f, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                            placeholder="Optional description"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSaveTicket}
                          disabled={isSavingTicket}
                          className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm font-bold hover:bg-primary-800 transition-colors disabled:opacity-50"
                        >
                          {isSavingTicket ? "Adding..." : "Add Ticket Type"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelTicketEdit}
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Finance & Commission — all event types, SUPER_ADMIN only ── */}
          {role === "SUPER_ADMIN" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                  <Percent className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Finance & Commission
                </h3>
              </div>
              <div className="bg-primary-50/50 rounded-xl p-5 border border-primary-100/50">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2 ml-1">
                      Custom Commission Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        placeholder="Global Default"
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-lg"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                        %
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdateCommission}
                    disabled={isSavingCommission}
                    className="px-8 py-3.5 bg-primary-700 text-white rounded-xl font-bold hover:bg-primary-800 transition-all disabled:opacity-50 shadow-lg shadow-primary-100 shrink-0"
                  >
                    {isSavingCommission ? "Saving..." : "Update Rate"}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-3 ml-1">
                  This custom rate overrides the global platform commission
                  for this specific event. Leave empty to revert to default.
                </p>
              </div>
            </div>
          )}

          {/* ── Danger Zone — DRAFT only ── */}
          {event.status === "DRAFT" && (
            <div className="bg-white rounded-xl border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Danger Zone
              </h3>
              <p className="text-sm text-red-600 mb-6">
                Deleting an event is irreversible. All data, including voting
                records and revenue history, will be permanently removed.
              </p>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <h4 className="font-medium text-red-900">Delete Event</h4>
                  <p className="text-sm text-red-600">
                    Permanently remove this draft event
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors bg-red-600 hover:bg-red-700 text-white shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Event
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { api } from "@/lib/api-client";

function VotingToggle({
  initialValue,
  eventId,
}: {
  initialValue: boolean;
  eventId: string;
}) {
  const [enabled, setEnabled] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const newValue = !enabled;

    try {
      await api.patch(`/events/${eventId}/toggle-vote-count`, {});
      setEnabled(newValue);
    } catch {
      // Setting toggle failed silently
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={enabled ? "Disable public vote counts" : "Enable public vote counts"}
      onClick={toggle}
      disabled={loading}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-600 focus-visible:ring-offset-2",
        enabled ? "bg-primary-700" : "bg-neutral-300"
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function CategoryAccordion({ category }: { category: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalCategoryVotes = category.totalVotes || 0;

  return (
    <div
      className={clsx(
        "border rounded-2xl overflow-hidden transition-all duration-300",
        isExpanded
          ? "border-primary-200 ring-1 ring-primary-100 shadow-lg shadow-primary-50"
          : "border-slate-200 bg-white"
      )}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900">{category.name}</h4>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {category.candidates?.length || 0} Candidates
              </span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="flex items-center gap-1 font-medium text-primary-600">
                <Vote className="w-3.5 h-3.5" />
                {totalCategoryVotes.toLocaleString()} Total Votes
              </span>
            </div>
          </div>
        </div>
        <div
          className={clsx(
            "w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 transition-transform duration-300",
            isExpanded && "rotate-180 bg-primary-100 text-primary-600"
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {isExpanded && (
        <div className="p-6 bg-white border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.candidates.map((candidate: any, idx: number) => (
              <CandidateProfileCard
                key={candidate.id || idx}
                candidate={candidate}
                categoryMaxVotes={category.maxVotes || 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CandidateProfileCard({
  candidate,
  categoryMaxVotes,
}: {
  candidate: any;
  categoryMaxVotes: number;
}) {
  const votes = candidate.votes || candidate.voteCount || 0;
  const progress = categoryMaxVotes > 0 ? (votes / categoryMaxVotes) * 100 : 0;

  return (
    <div className="group relative bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:border-primary-200 hover:bg-white hover:shadow-xl hover:shadow-primary-50/50 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="relative w-16 h-16 shrink-0">
          {candidate.imageUrl ? (
            <div className="w-full h-full rounded-2xl overflow-hidden ring-2 ring-white ring-offset-2 ring-offset-slate-100 group-hover:ring-primary-100 transition-all">
              <ImageWithPreview
                width={64}
                height={64}
                src={candidate.imageUrl}
                alt={candidate.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-2xl bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-white">
              {candidate.name.substring(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h5 className="text-base font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors">
            {candidate.name}
          </h5>
          <div className="mt-1 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[10px] font-bold uppercase tracking-wider">
              {candidate.code || "N/A"}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {votes.toLocaleString()} Votes
            </span>
          </div>
        </div>
      </div>

      {(candidate.bio || candidate.description) && (
        <div className="mt-4">
          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
            {candidate.bio || candidate.description}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Performance</span>
          <span className="text-primary-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-primary-500 to-primary-500 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
