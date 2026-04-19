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
  const role = session?.user?.role;

  // Determine endpoint based on role
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const endpoint = isAdmin ? "/events/admin/all" : "/events/my/events";

  // Fetch Voting & Hybrid Events with full hierarchy (categories + candidates)
  // GET /dashboard/events returns all organizer events; filter by type on client
  const eventsResult = await apiClient.get(endpoint).catch(() => []);
  const events = eventsResult.data || eventsResult.events || (Array.isArray(eventsResult) ? eventsResult : []);

  // Filter to only VOTING and HYBRID events, then serialize with manual aggregation fallback
   const serializedEvents = (Array.isArray(events) ? events : [])
    .filter((event: any) => event.type === "VOTING" || event.type === "HYBRID")
    .map((event: any) => {
      // Build category data with per-candidate vote counts for progress bars
      const populatedCategories = (event.categories || []).map((cat: any) => {
        const catVotes = (cat.candidates || []).reduce(
          (sum: number, c: any) => sum + (Number(c.votes || c.voteCount) || 0), 
          0
        );
        return { ...cat, totalVotes: catVotes };
      });

      return {
        ...event,
        id: event.id || event._id,
        categories: populatedCategories,
        // STRICT: Only use verified paid votes for the summary KPI
        totalVotes: Number(event.totalPaidVotes ?? 0),
        totalRevenue: Number(event.totalRevenue ?? 0),
      };
    });

  return <ResultsDashboardClient events={serializedEvents} />;
}
