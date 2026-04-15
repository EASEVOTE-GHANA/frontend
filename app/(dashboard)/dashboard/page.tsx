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
      apiClient.get("/admin/stats/transactions"),
    ]);

    // ── Users ──
    const usersRaw = usersRes.status === "fulfilled" ? usersRes.value : [];
    const users: any[] = Array.isArray(usersRaw) ? usersRaw : usersRaw?.data ?? [];
    const totalUsers = users.length;
    const totalOrganizers = users.filter((u: any) => u.role === "ORGANIZER").length;

    // ── Events ──
    const eventsRaw = eventsRes.status === "fulfilled" ? eventsRes.value : { data: [] };
    const events: any[] = Array.isArray(eventsRaw) ? eventsRaw : eventsRaw?.data ?? [];
    const activeEvents = events.filter((e) => e.status === "LIVE" || e.status === "PUBLISHED" || e.status === "APPROVED").length;

    // ── Transaction Stats (New Source of Truth) ──
    const statsRaw = statsRes.status === "fulfilled" ? statsRes.value : { data: { totalVolume: 0, netRevenue: 0 } };
    const stats = statsRaw.data || statsRaw;

    const totalRevenue = stats.totalVolume || 0;
    const platformFee = stats.netRevenue || 0;
    const pendingPayouts = totalRevenue - platformFee;

    // ── Derive other stats from event data ──
    // totalVotes: sum votes across all candidates in all categories
    let totalVotes = 0;
    let ticketsSold = 0;
    events.forEach((e) => {
      if (e.categories) {
        e.categories.forEach((cat: any) => {
          if (cat.candidates) {
            cat.candidates.forEach((c: any) => {
              totalVotes += Number(c.votes) || 0;
            });
          }
        });
      }
      if (e.ticketTypes) {
        e.ticketTypes.forEach((tt: any) => {
          ticketsSold += Number(tt.sold) || 0;
        });
      }
    });

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
        let eventRevenue = 0;
        if (e.type === "VOTING" && e.categories) {
          let ev = 0;
          e.categories.forEach((cat: any) => {
            cat.candidates?.forEach((c: any) => { ev += Number(c.votes) || 0; });
          });
          eventRevenue = ev * (Number(e.costPerVote) || 0);
        }
        if (e.ticketTypes) {
          e.ticketTypes.forEach((tt: any) => {
            eventRevenue += (Number(tt.sold) || 0) * (Number(tt.price) || 0);
          });
        }
        revenueByMonth[key] += eventRevenue;
      }
    });
    const revenueData = Object.entries(revenueByMonth).map(([name, revenue]) => ({
      name,
      revenue: Math.round(revenue),
    }));

    // ── Top events by votes ──
    const topEvents = [...events]
      .map((e) => {
        let evVotes = 0;
        if (e.categories) {
          e.categories.forEach((cat: any) => {
            cat.candidates?.forEach((c: any) => { evVotes += Number(c.votes) || 0; });
          });
        }
        return { ...e, _computedVotes: evVotes };
      })
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
      if (e.type === "VOTING" && e.categories) {
        let ev = 0;
        e.categories.forEach((cat: any) => {
          cat.candidates?.forEach((c: any) => { ev += Number(c.votes) || 0; });
        });
        totalVotes += ev;
        totalRevenue += ev * (Number(e.costPerVote) || 0);
      }
      if (e.ticketTypes) {
        e.ticketTypes.forEach((tt: any) => {
          totalRevenue += (Number(tt.sold) || 0) * (Number(tt.price) || 0);
        });
      }
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
