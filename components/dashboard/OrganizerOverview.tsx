import Link from "next/link";
import { computeEventStats } from "@/lib/event-stats";
import { Activity, ArrowRight, BarChart3, Calendar, DollarSign, TrendingUp, Users, Vote, Zap } from "lucide-react";

interface OrganizerOverviewProps {
    data: {
        events: any[];
        analytics: {
            totalRevenue: number;
            netEarnings: number;
            totalVotes: number;
            totalTickets: number;
            activeEvents: number;
        };
    };
}

function fmtGHS(amount: number): string {
    if (amount >= 1_000_000) return `GHS ${parseFloat((amount / 1_000_000).toFixed(3))}M`;
    if (amount >= 1_000) return `GHS ${parseFloat((amount / 1_000).toFixed(3))}K`;
    return `GHS ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtCount(n: number): string {
    if (n >= 1_000_000) return `${parseFloat((n / 1_000_000).toFixed(3))}M`;
    if (n >= 1_000) return `${parseFloat((n / 1_000).toFixed(3))}K`;
    return n.toLocaleString();
}

export function OrganizerOverview({ data }: OrganizerOverviewProps) {
    const { events, analytics } = data as any;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Business Analytics</h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Real-time performance tracking for your events.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/events/new"
                        className="flex items-center gap-2 bg-primary-900 hover:bg-primary-800 text-white! px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                    >
                        Create Event
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* GROSS REVENUE */}
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign size={120} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gross Revenue</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
                        {fmtGHS(analytics.totalRevenue || 0)}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-slate-100">
                        <TrendingUp size={12} /> TOTAL COLLECTED
                    </div>
                </div>

                {/* NET EARNINGS */}
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap size={120} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Net Earnings</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
                        {fmtGHS(analytics.netEarnings || 0)}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-slate-100">
                        <Activity size={12} /> AFTER COMMISSION
                    </div>
                </div>

                {/* ENGAGEMENT */}
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
                        <Vote size={120} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Engagement</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
                        {fmtCount(analytics.totalVotes || 0)}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-slate-100">
                        <BarChart3 size={12} /> TOTAL VOTES CAST
                    </div>
                </div>

                {/* TICKETS/UNITS */}
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
                        <Users size={120} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Units Sold</p>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
                        {fmtCount(analytics.totalTickets || 0)}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-slate-100">
                        <Calendar size={12} /> TOTAL TICKETS
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">Your Recent Events</h3>
                        <Link href="/dashboard/events" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
                            View All Events <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {events.length === 0 ? (
                            <div className="bg-slate-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100">
                                <Calendar size={48} className="text-slate-200 mx-auto mb-4" />
                                <h4 className="text-lg font-bold text-slate-400">No events found</h4>
                                <p className="text-slate-400 text-sm mt-1">Create your first event to see analytics here.</p>
                            </div>
                        ) : (
                            events.map((event: any) => {
                                return (
                                    <div key={event._id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow group">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner bg-slate-100 flex-shrink-0">
                                            <img
                                                src={event.imageUrl || event.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.title || "E")}&background=f8fafc&color=0f172a&size=128`}
                                                className="w-full h-full object-cover"
                                                alt={event.title}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-2 h-2 rounded-full ${event.status === 'LIVE' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{event.status}</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900 truncate">{event.title}</h4>
                                            <p className="text-sm text-slate-500 font-medium">
                                                {(() => {
                                                    const stats = event.ledgerStats || computeEventStats(event);
                                                    const rev = Number(stats.revenue || 0);
                                                    const qty = event.type === "VOTING" ? stats.votes : stats.ticketsSold;
                                                    return `GHS ${rev.toLocaleString(undefined, { minimumFractionDigits: 2 })} earned · ${qty.toLocaleString()} ${event.type === "VOTING" ? "votes" : "tickets"}`;
                                                })()}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/dashboard/events/${event.eventCode || event._id}`}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 p-3 rounded-2xl text-slate-400 hover:text-slate-900"
                                        >
                                            <ArrowRight size={20} />
                                        </Link>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <Link href="/dashboard/events" className="p-5 bg-white rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <BarChart3 size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 text-sm">My Events</p>
                                <p className="text-xs text-slate-400 font-medium">Manage all your events</p>
                            </div>
                        </Link>
                        <Link href="/dashboard/events/new" className="p-5 bg-white rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Zap size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 text-sm">Create New Event</p>
                                <p className="text-xs text-slate-400 font-medium">Launch a voting or ticketing event</p>
                            </div>
                        </Link>
                        <Link href="/dashboard/settings" className="p-5 bg-white rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 transition-all flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 text-sm">Account Settings</p>
                                <p className="text-xs text-slate-400 font-medium">Update profile and permissions</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
