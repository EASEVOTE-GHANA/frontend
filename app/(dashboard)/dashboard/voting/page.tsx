import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import EventsTable from "../events/EventsTable";
import { Vote, DollarSign, List, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminVotingPage(props: Props) {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);

  const searchParams = await props.searchParams;
  const query =
    typeof searchParams.query === "string" ? searchParams.query : undefined;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  // Build query string for events
  const eventsParams = new URLSearchParams();
  eventsParams.set("limit", "200");
  eventsParams.set("type", "VOTING");
  if (query) eventsParams.set("query", query);
  if (status) eventsParams.set("status", status);

  // Fetch voting events
  const eventsRes = await apiClient
    .get(`/events/admin/all?${eventsParams.toString()}`)
    .catch(() => ({ data: [] }));

  const rawEvents = Array.isArray(eventsRes) ? eventsRes : (eventsRes.data || []);

  // Local Aggregation Logic
  let totalVotesCount = 0;
  let totalRevenueCount = 0;
  let activeEventsCount = 0;

  const events = rawEvents.map((e: any) => {
    // Calculate total votes for this specific event
    let eventVotes = 0;
    if (e.categories) {
      e.categories.forEach((cat: any) => {
        if (cat.candidates) {
          cat.candidates.forEach((cand: any) => {
            eventVotes += Number(cand.votes || 0);
          });
        }
      });
    }

    // Calculate revenue for this specific event
    const eventRevenue = eventVotes * Number(e.costPerVote || 0);

    // Aggregate globals
    totalVotesCount += eventVotes;
    totalRevenueCount += eventRevenue;
    if (e.status === "LIVE") activeEventsCount++;

    return {
      id: e._id,
      eventCode: e.eventCode || e._id?.substring(0, 8) || "N/A",
      title: e.title || "Untitled Event",
      organizer: {
        name:
          e.organizerId?.fullName ||
          e.organizerId?.businessName ||
          "Unknown Organizer",
        avatar: e.organizerId?.logo || "",
      },
      type: e.type || "UNKNOWN",
      status: e.status || "DRAFT",
      startDate: e.startDate || new Date().toISOString(),
      endDate: e.endDate || new Date().toISOString(),
      stats: {
        votes: eventVotes,
        revenue: eventRevenue,
      },
    };
  });

  const stats = {
    totalVotes: totalVotesCount,
    totalRevenue: totalRevenueCount,
    activeEvents: activeEventsCount,
    totalEvents: rawEvents.length,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Voting Management</h1>
        <p className="text-slate-500">
          Monitor voting activity and manage elections.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {stats.totalVotes.toLocaleString()}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Voting Revenue
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(stats.totalRevenue)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Active Voting Events
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.activeEvents}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <List className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Total Voting Events
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.totalEvents}
          </div>
        </div>
      </div>

      {/* Events Table (Filtered for Voting) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Voting Events</h3>
        </div>
        <EventsTable events={events} showFilters={["status"]} />
      </div>
    </div>
  );
}
