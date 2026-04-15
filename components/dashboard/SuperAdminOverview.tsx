import { Users, Calendar, DollarSign, Vote, TrendingUp, ArrowUpRight, Building2, Ticket } from "lucide-react";
import { KPICard, ChartCard, ActivityFeed } from "@/components/dashboard";
import Link from "next/link";

interface SuperAdminOverviewProps {
  data: {
    totalUsers: number;
    activeEvents: number;
    totalVotes: number;
    totalOrganizers: number;
    ticketsSold: number;
    totalRevenue: number;
    platformFee: number;
    pendingPayouts: number;
    revenueData: any[];
    eventTypeData: any[];
    topEvents: any[];
    recentActivities: any[];
  };
}

function fmtGHS(amount: number): string {
  if (amount >= 1_000_000) return `GHS ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `GHS ${(amount / 1_000).toFixed(1)}K`;
  return `GHS ${amount.toFixed(2)}`;
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function SuperAdminOverview({ data }: SuperAdminOverviewProps) {
  const {
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
  } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
          <p className="text-slate-500">
            Welcome back! Here&apos;s what&apos;s happening on EaseVote today.
          </p>
        </div>
        <Link
          href="/dashboard/analytics"
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white! px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <TrendingUp className="h-4 w-4 text-white!" />
          View Reports
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={fmtGHS(totalRevenue)}
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600"
        />
        <KPICard
          title="Active Events"
          value={fmtCount(activeEvents)}
          icon={Calendar}
          iconColor="bg-blue-100 text-blue-600"
        />
        <KPICard
          title="Total Votes Cast"
          value={fmtCount(totalVotes)}
          icon={Vote}
          iconColor="bg-purple-100 text-purple-600"
        />
        <KPICard
          title="Registered Organizers"
          value={fmtCount(totalOrganizers)}
          icon={Building2}
          iconColor="bg-amber-100 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value={fmtCount(totalUsers)}
          icon={Users}
          iconColor="bg-cyan-100 text-cyan-600"
        />
        <KPICard
          title="Tickets Sold"
          value={fmtCount(ticketsSold)}
          icon={Ticket}
          iconColor="bg-pink-100 text-pink-600"
        />
        <KPICard
          title="Platform Fee Earned"
          value={fmtGHS(platformFee)}
          icon={DollarSign}
          iconColor="bg-emerald-100 text-emerald-600"
        />
        <KPICard
          title="Pending Payouts"
          value={fmtGHS(pendingPayouts)}
          icon={ArrowUpRight}
          iconColor="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue Trend"
            subtitle="Monthly revenue over the last 6 months"
            type="line"
            data={revenueData}
            dataKey="revenue"
            xAxisKey="name"
          />
        </div>
        <div>
          <ChartCard
            title="Event Distribution"
            subtitle="By event type"
            type="pie"
            data={eventTypeData.length > 0 ? eventTypeData : [{ name: "No events", value: 1 }]}
            dataKey="value"
            xAxisKey="name"
            height={250}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Top Performing Events
              </h3>
              <Link
                href="/dashboard/events"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {topEvents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No events found
                </p>
              ) : (
                topEvents.map((event, i) => (
                  <div
                    key={event._id || event.id || i}
                    className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {event.title || event.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {typeof event.organizerId === "object" && event.organizerId?.fullName
                          ? event.organizerId.fullName
                          : "Organizer"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        {fmtCount(event._computedVotes || 0)} votes
                      </p>
                      <p className="text-sm text-slate-500">
                        {event.type === "VOTING" ? "Voting" : "Ticketing"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <ActivityFeed
          activities={recentActivities}
          title="Recent Activity"
        />
      </div>
    </div>
  );
}
