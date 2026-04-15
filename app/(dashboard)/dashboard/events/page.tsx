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

  // Fetch all events using the administrative consolidated endpoint
  const result = await apiClient
    .get(`/events/admin/all?${queryParams.toString()}`)
    .catch(() => ({ data: [] }));

  // Handle both { data: [...] } and direct array responses
  const rawEvents = result.data || result.events || (Array.isArray(result) ? result : []);

  // Clean up and map the raw MongoDB events to the expected frontend schema
  const mappedEvents = rawEvents.map((e: any) => ({
    id: e._id,
    eventCode: e.eventCode || e._id?.substring(0, 8) || "N/A",
    title: e.title || "Untitled Event",
    organizer: {
      name:
        e.organizerId?.businessName ||
        e.organizerId?.fullName ||
        "Unknown Organizer",
      avatar: e.organizerId?.logo || "",
    },
    type: e.type || "UNKNOWN",
    status: e.status || "DRAFT",
    startDate: e.startDate || new Date().toISOString(),
    endDate: e.endDate || new Date().toISOString(),
    stats: {
      votes: e.totalVotes || 0,
      revenue: e.totalRevenue || 0,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Events Management
          </h1>
          <p className="text-slate-500">
            Monitor and manage all events across the platform.
          </p>
        </div>
      </div>

      <EventsTable events={mappedEvents} />
    </div>
  );
}
