import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import { SuperAdminOverview } from "@/components/dashboard/SuperAdminOverview";
import { OrganizerOverview } from "@/components/dashboard/OrganizerOverview";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/sign-in");
  }

  const role = session.user?.role;
  const apiClient = createServerApiClient(session?.accessToken as string | undefined);

  // ─── 1. Super Admin / Admin View ───────────────────────────────
  if (role === "SUPER_ADMIN" || role === "ADMIN") {
    // Fetch from REAL endpoints only, tolerate partial failures
    const [usersRes, eventsRes, statsRes] = await Promise.allSettled([
      apiClient.get("/users"),
      apiClient.get("/events/admin/all?limit=200"),
      apiClient.get("/admin/stats/revenue"),
    ]);

    // ── Users ──
    const usersRaw = usersRes.status === "fulfilled" ? usersRes.value : [];
    const users: any[] = Array.isArray(usersRaw) ? usersRaw : usersRaw?.data ?? [];
    const totalUsers = users.length;
    const totalOrganizers = users.filter((u: any) => u.role === "ORGANIZER").length;

    // ── Events ──
    const eventsRaw = eventsRes.status === "fulfilled" ? eventsRes.value : { data: [] };
    const events: any[] = Array.isArray(eventsRaw) ? eventsRaw : eventsRaw?.data ?? [];
    const activeEvents = events.filter((e) => 
      ["LIVE", "Live", "PUBLISHED", "APPROVED", "Upcoming"].includes(e.status)
    ).length;

    // ── Derive other stats from event data ──
    let totalVotes = 0;
    let ticketsSold = 0;
    let derivedPlatformRevenue = 0;

    events.forEach((e) => {
      totalVotes += Number(e.totalPaidVotes ?? 0);
      ticketsSold += Number(e.totalTicketsSold ?? 0);

      // 3. Accumulate Verified Revenue
      derivedPlatformRevenue += Number(e.totalRevenue ?? 0);
    });

    // ── Transaction Stats (New Source of Truth) ──
    const statsRaw = statsRes.status === "fulfilled" ? statsRes.value : { data: {} };
    const statsData = statsRaw.data || statsRaw || {};
    
    let totalRevenue = statsData.totalVolume || statsData.totalRevenue || 0;
    if (totalRevenue === 0) {
      totalRevenue = derivedPlatformRevenue;
    }
    const platformFee = statsData.netRevenue || statsData.netCommission || (totalRevenue * 0.1); // Fallback to 10% if missing
    const pendingPayouts = totalRevenue - platformFee;

    // ── Event type distribution ──
    const votingCount = events.filter((e) => e.type === "VOTING").length;
    const ticketingCount = events.filter((e) => e.type === "TICKETING").length;
    const otherCount = Math.max(0, events.length - votingCount - ticketingCount);
    const eventTypeData = [
      { name: "Voting Events", value: votingCount },
      { name: "Ticketed Events", value: ticketingCount },
      { name: "Other Events", value: otherCount },
    ].filter((d) => d.value > 0);

    // ── Monthly revenue (bucketed by event createdAt as proxy) ──
    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const revenueByMonth: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      revenueByMonth[MONTH_NAMES[d.getMonth()]] = 0;
    }
    events.forEach((e) => {
      if (!e.createdAt) return;
      const key = MONTH_NAMES[new Date(e.createdAt).getMonth()];
      if (key in revenueByMonth) {
        revenueByMonth[key] += Number(e.totalRevenue || 0);
      }
    });
    const revenueData = Object.entries(revenueByMonth).map(([name, revenue]) => ({
      name,
      revenue: Math.round(revenue),
    }));

    // ── Top events by votes ──
    const topEvents = [...events]
      .map((e) => ({ ...e, _computedVotes: Number(e.totalPaidVotes || 0) }))
      .sort((a, b) => b._computedVotes - a._computedVotes)
      .slice(0, 4);

    // ── Recent events as activity proxy ──
    const recentActivities = [...events]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((e, i) => ({
        id: e._id || String(i),
        title: e.title || "Event",
        description: `${e.type || "Event"} · ${e.status}`,
        time: e.createdAt
          ? new Date(e.createdAt).toLocaleString("en-GH", { dateStyle: "short", timeStyle: "short" })
          : "Recently",
        user: {
          name:
            typeof e.organizerId === "object"
              ? e.organizerId?.fullName || "Organizer"
              : "Organizer",
        },
      }));

    return (
      <SuperAdminOverview
        data={{
          totalUsers,
          activeEvents,
          totalVotes,
          totalOrganizers,
          ticketsSold,
          totalRevenue,
          platformFee,
          pendingPayouts,
          revenueData,
          eventTypeData,
          topEvents,
          recentActivities,
        }}
      />
    );
  }

  // ─── 2. Organizer View ─────────────────────────────────────────
  if (role === "ORGANIZER") {
    // Correct endpoint: GET /api/events/my/events
    const eventsRes = await apiClient.get("/events/my/events?limit=100").catch(() => ({ data: [] }));
    const rawEvents: any[] = Array.isArray(eventsRes) ? eventsRes : eventsRes?.data ?? [];

    // Aggregate from real event data
    let totalRevenue = 0;
    let totalVotes = 0;
    rawEvents.forEach((e: any) => {
      totalVotes += Number(e.totalPaidVotes || 0);
      totalRevenue += Number(e.totalRevenue || 0);
    });

    const activeEvents = rawEvents.filter((e: any) => e.status === "LIVE" || e.status === "PUBLISHED").length;

    return (
      <OrganizerOverview
        data={{
          events: rawEvents.slice(0, 5),
          analytics: {
            totalRevenue,
            totalVotes,
            activeEvents,
          },
        }}
      />
    );
  }

  // Fallback for other roles
  redirect("/");
}
