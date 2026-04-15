import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerApiClient } from "@/lib/api-client";
import ResultsDashboardClient from "./ResultsDashboardClient";

export default async function VoteResultsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizerId) {
    redirect("/sign-in");
  }

  const apiClient = createServerApiClient(session?.accessToken as string | undefined);

  // Fetch Voting & Hybrid Events with full hierarchy (categories + candidates)
  // GET /dashboard/events returns all organizer events; filter by type on client
  const events = await apiClient.get("/events/admin/all").catch(() => []);

  // Filter to only VOTING and HYBRID events, then serialize
  const serializedEvents = (Array.isArray(events) ? events : [])
    .filter((event: any) => event.type === "VOTING" || event.type === "HYBRID")
    .map((event: any) => ({
      ...event,
      totalRevenue: Number(event.totalRevenue ?? 0),
    }));

  return <ResultsDashboardClient events={serializedEvents} />;
}
