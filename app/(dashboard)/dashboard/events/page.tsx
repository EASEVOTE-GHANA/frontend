import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import EventsTable from "./EventsTable";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminEventsPage(props: Props) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const apiClient = createServerApiClient(session?.accessToken);

  const searchParams = await props.searchParams;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const type =
    typeof searchParams.type === "string" ? searchParams.type : undefined;
  const query =
    typeof searchParams.query === "string" ? searchParams.query : undefined;

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set("limit", "200");
  if (type) queryParams.set("type", type);
  if (query) queryParams.set("query", query);

  // Determine endpoint based on role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const endpoint = isAdmin 
    ? `/events/admin/all?${queryParams.toString()}`
    : `/events/my/events?${queryParams.toString()}`;

  // Fetch events using appropriate endpoint
  const result = await apiClient.get(endpoint).catch(() => ({ data: [] }));

  // Handle both { data: [...] } and direct array responses
  const rawEvents = result.data || result.events || (Array.isArray(result) ? result : []);

  // Clean up and map the raw MongoDB events to the expected frontend schema
  const mappedEvents = rawEvents.map((e: any) => {
    // Manual summation fallback for votes
    let totalVotes = Number(e.totalVotes ?? e.votes) || 0;
    if (totalVotes === 0 && e.categories) {
      e.categories.forEach((cat: any) => {
        cat.candidates?.forEach((c: any) => {
          totalVotes += Number(c.votes ?? c.voteCount) || 0;
        });
      });
    }

    // Manual summation fallback for tickets
    let ticketsSold = Number(e.totalTicketsSold ?? e.stats?.ticketsSold) || 0;
    if (ticketsSold === 0 && e.ticketTypes) {
      e.ticketTypes.forEach((tt: any) => {
        ticketsSold += Number(tt.sold ?? tt.soldCount) || 0;
      });
    }

    // Manual revenue calculation fallback
    let totalRevenue = Number(e.totalRevenue ?? e.revenue ?? e.stats?.revenue) || 0;
    if (totalRevenue === 0) {
      if (e.type === "VOTING") {
        totalRevenue = totalVotes * (Number(e.costPerVote ?? e.votePrice ?? e.price) || 0);
      } else if (e.type === "TICKETING" || e.type === "HYBRID") {
        if (e.ticketTypes) {
          e.ticketTypes.forEach((tt: any) => {
            totalRevenue += (Number(tt.sold ?? tt.soldCount) || 0) * (Number(tt.price) || 0);
          });
        }
      }
    }

    return {
      id: e._id,
      eventCode: e.eventCode || e._id?.substring(0, 8) || "N/A",
      title: e.title || "Untitled Event",
      organizer: {
        name:
          typeof e.organizerId === "object"
            ? e.organizerId?.businessName || e.organizerId?.fullName || "Unspecified Organizer"
            : role === "ORGANIZER" ? (session?.user?.name || "My Business") : "Unknown Organizer",
        avatar: typeof e.organizerId === "object" ? e.organizerId?.logo || "" : "",
      },
      type: e.type || "UNKNOWN",
      status: e.status || "DRAFT",
      startDate: e.startDate || new Date().toISOString(),
      endDate: e.endDate || new Date().toISOString(),
      stats: {
        votes: totalVotes,
        revenue: totalRevenue,
        ticketsSold: ticketsSold,
      },
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdmin ? "Events Management" : "My Events"}
          </h1>
          <p className="text-slate-500">
            {isAdmin 
              ? "Monitor and manage all events across the platform."
              : "Manage and track the performance of your events."}
          </p>
        </div>
        <a
          href="/dashboard/events/new"
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white! px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Event
        </a>
      </div>

      <EventsTable events={mappedEvents} />
    </div>
  );
}
