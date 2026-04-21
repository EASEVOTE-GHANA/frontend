"use client";

import { useState } from "react";
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
  ChevronUp,
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
  role: "ADMIN" | "SUPER_ADMIN" | "ORGANIZER";
  backUrl: string;
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
    const confirmed = await modal.confirm({
      title: "Delete Event",
      message: "Are you sure you want to delete this event? This action cannot be undone. All data, including voting records and revenue history, will be permanently removed.",
      variant: "danger",
      confirmText: "Delete Event",
    });
    if (!confirmed) return;

    try {
      await api.delete(`/events/${event.id}`);
      await modal.alert({ title: "Event Deleted", message: "Event deleted successfully.", variant: "info" });
      router.push(backUrl);
    } catch (err: any) {
      console.error(err);
      modal.alert({ title: "Delete Failed", message: err.message || "An error occurred", variant: "danger" });
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
                    ? `/events/tickets/${event.eventCode || event.id}`
                    : `/events/${event.eventCode || event.id}`
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
            <AdminEventActions
              eventId={event.id}
              status={event.status}
              role={role}
              onStatusChange={setCurrentStatus}
            />

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
                              {(ticket.sold ?? ticket.soldCount ?? 0)} / {ticket.quantity || 0}
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
                                ((ticket.sold ?? ticket.soldCount ?? 0) / (ticket.quantity || 1)) * 100,
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
                  {["LIVE", "ENDED", "PAUSED", "PUBLISHED"].includes(event.status)
                    ? "Live or published events cannot be deleted to preserve data integrity."
                    : "Permanently remove this event"}
                </p>
              </div>
              <button
                onClick={handleDelete}
                disabled={["LIVE", "ENDED", "PAUSED", "PUBLISHED"].includes(event.status)}
                className={clsx(
                  "px-4 py-2 rounded-lg flex items-center gap-2 transition-colors",
                  ["LIVE", "ENDED", "PAUSED", "PUBLISHED"].includes(event.status)
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                )}
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
      await api.patch(`/events/${eventId}/toggle-vote-count`, {});
      setEnabled(newValue);
    } catch (e) {
      console.error(e);
      // Using a simple toast equivalent — VotingToggle doesn't have modal context,
      // so we'll rely on a basic console-based fallback or toast system
      console.error("Failed to update setting");
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

function CategoryAccordion({ category }: { category: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalCategoryVotes = category.candidates.reduce((sum: number, c: any) => sum + (c.votes || c.voteCount || 0), 0);

  return (
    <div className={clsx(
      "border rounded-2xl overflow-hidden transition-all duration-300",
      isExpanded ? "border-primary-200 ring-1 ring-primary-100 shadow-lg shadow-primary-50" : "border-slate-200 bg-white"
    )}>
      <button
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
        <div className={clsx(
          "w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 transition-transform duration-300",
          isExpanded && "rotate-180 bg-primary-100 text-primary-600"
        )}>
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
                categoryMaxVotes={Math.max(...category.candidates.map((c: any) => c.votes || c.voteCount || 0))} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CandidateProfileCard({ candidate, categoryMaxVotes }: { candidate: any, categoryMaxVotes: number }) {
  const votes = candidate.votes || candidate.voteCount || 0;
  const progress = categoryMaxVotes > 0 ? (votes / categoryMaxVotes) * 100 : 0;

  return (
    <div className="group relative bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:border-primary-200 hover:bg-white hover:shadow-xl hover:shadow-primary-50/50 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          {candidate.imageUrl ? (
            <div className="w-full h-full rounded-2xl overflow-hidden ring-2 ring-white ring-offset-2 ring-offset-slate-100 group-hover:ring-primary-100 transition-all">
              <img 
                src={candidate.imageUrl} 
                alt={candidate.name} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary-500 to-magenta-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-white">
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
          <span className="text-primary-600">{Math.round(progress)}% of leader</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-magenta-500 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
