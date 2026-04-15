import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import EventsTable from "../events/EventsTable";
import { AlertCircle, Vote, Ticket, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminApprovalsPage(props: Props) {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);

  const searchParams = await props.searchParams;
  const query =
    typeof searchParams.query === "string" ? searchParams.query : undefined;

  // Always filter by PENDING_REVIEW and ignore any status param from URL for the main table data
  // effectively locking this page to approvals.

  // Build query string for events
  const eventsParams = new URLSearchParams();
  if (query) eventsParams.set("query", query);
  eventsParams.set("status", "PENDING_REVIEW");
  const eventsQuery = eventsParams.toString()
    ? `?${eventsParams.toString()}`
    : "";

  // Fetch pending review events list
  const eventsRes = await apiClient
    .get(`/events${eventsQuery}`)
    .catch(() => ({ data: [] }));

  const rawEvents = eventsRes.data || [];

  // Local Aggregation Logic
  let votingPendingCount = 0;
  let ticketingPendingCount = 0;

  const events = rawEvents.map((e: any) => {
    // Basic aggregation by type
    if (e.type === "VOTING") votingPendingCount++;
    if (e.type === "TICKETING") ticketingPendingCount++;

    // Calculate sub-stats if needed for the table display
    let subStats = {};
    if (e.type === "VOTING" || e.type === "HYBRID") {
      let totalVotes = 0;
      e.categories?.forEach((cat: any) => {
        cat.candidates?.forEach((cand: any) => {
          totalVotes += Number(cand.votes || 0);
        });
      });
      subStats = { votes: totalVotes };
    } else if (e.type === "TICKETING") {
      let totalSold = 0;
      e.ticketTypes?.forEach((tt: any) => {
        totalSold += Number(tt.sold || 0);
      });
      subStats = { ticketsSold: totalSold };
    }

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
      status: e.status || "PENDING_REVIEW",
      startDate: e.startDate || new Date().toISOString(),
      endDate: e.endDate || new Date().toISOString(),
      stats: subStats,
    };
  });

  const stats = {
    totalPending: rawEvents.length,
    votingPending: votingPendingCount,
    ticketingPending: ticketingPendingCount,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-slate-500">
          Review and approve new event submissions.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Total Pending
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.totalPending}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Vote className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Voting Events
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.votingPending}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Ticket className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-500">
              Ticketing Events
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.ticketingPending}
          </div>
        </div>
      </div>

      {/* Events Table (Filtered for Pending Reviews) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">
            Events Awaiting Review
          </h3>
        </div>
        <EventsTable events={events} />
      </div>
    </div>
  );
}
