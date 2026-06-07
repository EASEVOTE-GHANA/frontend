import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import Link from "next/link";
import TicketManagementClient from "../../ticketing/TicketManagementClient";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminTicketingPage(props: Props) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const apiClient = createServerApiClient(session?.accessToken);

  const searchParams = await props.searchParams;
  const query =
    typeof searchParams.query === "string" ? searchParams.query : undefined;
  const status =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  // Build query string for events
  const eventsParams = new URLSearchParams();
  eventsParams.set("limit", "200");
  eventsParams.set("type", "TICKETING");
  if (query) eventsParams.set("query", query);
  if (status) eventsParams.set("status", status);

  // Determine endpoint based on role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const endpoint = isAdmin 
    ? `/events/admin/all?${eventsParams.toString()}`
    : `/events/my/events?${eventsParams.toString()}`;

  // Fetch ticketing events
  const eventsRes = await apiClient.get(endpoint).catch(() => ({ data: [] }));

  const rawEvents = eventsRes.data || eventsRes.events || (Array.isArray(eventsRes) ? eventsRes : []);

  // Local Aggregation Logic
  let ticketsSoldCount = 0;
  let totalRevenueCount = 0;
  let activeEventsCount = 0;

  const events = rawEvents.map((e: any) => {
    // Calculate tickets sold and revenue for this specific event
    let eventTicketsSold = 0;
    let eventRevenue = 0;

    if (e.ticketTypes && Array.isArray(e.ticketTypes)) {
      e.ticketTypes.forEach((tt: any) => {
        const sold = Number(tt.sold || 0);
        const price = Number(tt.price || 0);
        eventTicketsSold += sold;
        eventRevenue += sold * price;
      });
    }

    // Aggregate globals
    ticketsSoldCount += eventTicketsSold;
    totalRevenueCount += eventRevenue;
    if (e.status === "LIVE") activeEventsCount++;

    return {
      id: e._id,
      eventCode: e.eventCode || e._id?.substring(0, 8) || "N/A",
      title: e.title || "Untitled Event",
      organizer: {
        name:
          typeof e.organizerId === "object"
            ? e.organizerId?.fullName || e.organizerId?.businessName || "Unspecified Organizer"
            : role === "ORGANIZER" ? (session?.user?.name || "My Business") : "Unknown Organizer",
      },
      type: e.type || "UNKNOWN",
      status: e.status || "DRAFT",
      startDate: e.startDate || new Date().toISOString(),
      endDate: e.endDate || new Date().toISOString(),
      stats: {
        ticketsSold: eventTicketsSold,
        revenue: eventRevenue,
      },
      imageUrl: e.imageUrl || e.coverImage || e.image || "",
    };
  });

  const stats = {
    ticketsSold: ticketsSoldCount,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isAdmin ? "Ticketing Management" : "My Ticketing Events"}
          </h1>
          <p className="text-slate-500">
            {isAdmin 
              ? "Monitor ticket sales and manage ticketing events."
              : "Track ticket sales and manage your events."}
          </p>
        </div>
        <Link
          href="/dashboard/events/new?type=TICKETING"
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white! px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Ticketing Event
        </Link>
      </div>

      {/* Ticket Management Interface */}
      <TicketManagementClient events={events} />
    </div>
  );
}
