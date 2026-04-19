"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { clsx } from "clsx";
import { EventForm } from "./EventForm";
import { CategoriesManager } from "./CategoriesManager";
import AdminEventActions from "@/app/(dashboard)/dashboard/events/AdminEventActions";
import Image from "next/image";

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
};

interface AdminEventManagerProps {
  event: EventDetails;
  role: "ADMIN" | "SUPER_ADMIN";
  backUrl: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  PENDING_REVIEW: {
    label: "Pending Review",
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

export function AdminEventManager({
  event,
  role,
  backUrl,
}: AdminEventManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "edit" | "categories" | "settings"
  >("overview");
  const [currentStatus, setCurrentStatus] = useState(event.status);

  const StatusIcon = statusConfig[currentStatus]?.icon || AlertCircle;
  const statusColor = statusConfig[currentStatus]?.color || "text-slate-700";
  const statusBg = statusConfig[currentStatus]?.bg || "bg-slate-100";
  const statusLabel = statusConfig[currentStatus]?.label || currentStatus;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/events/${event.id}`);
      alert("Event deleted successfully");
      router.push(backUrl);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred");
    }
  };

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
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">
                {event.title}
              </h1>
              <span
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
                  statusBg,
                  statusColor,
                )}
              >
                <StatusIcon className="w-4 h-4" />
                {statusLabel}
              </span>
              <a
                href={
                  event.type === "TICKETING"
                    ? `/events/tickets/${event.id}`
                    : `/events/${event.id}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium ml-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Page
              </a>
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />{" "}
                {(event.startDate
                  ? new Date(event.startDate)
                  : new Date()
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                -{" "}
                {(event.endDate
                  ? new Date(event.endDate)
                  : new Date()
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {event.location || "Online"}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-4">
            <AdminEventActions eventId={event.id} status={event.status} onStatusChange={setCurrentStatus} />

            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("overview")}
                className={clsx(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                  activeTab === "overview"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("edit")}
                className={clsx(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                  activeTab === "edit"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <Edit className="w-4 h-4" />
                Edit Details
              </button>
              {(event.type === "VOTING" || event.type === "HYBRID") && (
                <button
                  onClick={() => setActiveTab("categories")}
                  className={clsx(
                    "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                    activeTab === "categories"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  <List className="w-4 h-4" />
                  Categories
                </button>
              )}
              <button
                onClick={() => setActiveTab("settings")}
                className={clsx(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                  activeTab === "settings"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
            </div>
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
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
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
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Categories & Candidates
                  </h3>
                  <div className="space-y-6">
                    {event.categories.map((category: any, i: number) => (
                      <div
                        key={category.id ?? i}
                        className="border border-slate-100 rounded-lg overflow-hidden"
                      >
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                          <span className="font-medium text-slate-700">
                            {category.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {category.candidates.length} candidates
                          </span>
                        </div>
                        <div className="divide-y divide-slate-50">
                          {(category.candidates || [])
                            .slice(0, 5)
                            .map((candidate: any, idx: number) => (
                              <div
                                key={candidate?.id || idx}
                                className="px-4 py-2 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-mono text-slate-400 w-4">
                                    {idx + 1}
                                  </span>
                                  <span className="text-sm text-slate-700">
                                    {candidate?.name || "Unknown Candidate"}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-slate-900">
                                  {(candidate?.voteCount || 0).toLocaleString()}{" "}
                                  votes
                                </span>
                              </div>
                            ))}
                          {category.candidates.length > 5 && (
                            <div className="px-4 py-2 text-center text-xs text-slate-500">
                              + {category.candidates.length - 5} more candidates
                            </div>
                          )}
                        </div>
                      </div>
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
                              {ticket.soldCount || 0} / {ticket.quantity || 0}
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
                                (ticket.soldCount / ticket.quantity) * 100,
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
                <div className="w-12 h-12 rounded-full bg-slate-100 flex-shrink-0 overflow-hidden relative">
                  {event.organizer.avatar ? (
                    <Image
                      src={event.organizer.avatar}
                      alt={event.organizer.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-indigo-50 text-indigo-600">
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
                  className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600"
                >
                  <Mail className="w-4 h-4" />
                  {event.organizer.email}
                </a>
                {event.organizer.phone && (
                  <a
                    href={`tel:${event.organizer.phone}`}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600"
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
          {/* Voting Controls */}
          {(event.type === "VOTING" || event.type === "HYBRID") && (
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
                    Show the number of votes per candidate on the public results
                    page.
                  </p>
                </div>
                <VotingToggle
                  initialValue={event.showVoteCount ?? true} // Need to pass this prop from parent or assume default
                  eventId={event.id}
                />
              </div>
            </div>
          )}

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
                  Permanently remove this event
                </p>
              </div>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Event
              </button>
            </div>
          </div>
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
      // The backend uses multiple specific endpoints instead of a generic status endpoint
      // Adjusting to use event update or generic patch if available
      await api.patch(`/events/${eventId}/toggle-vote-count`, {});
      setEnabled(newValue);
    } catch (e) {
      console.error(e);
      alert("Failed to update setting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={clsx(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
        enabled ? "bg-indigo-600" : "bg-gray-200",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}
