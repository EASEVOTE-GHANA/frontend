import { Calendar, DollarSign, Vote, TrendingUp, ArrowRight, BarChart3, Users, Zap, Ticket } from "lucide-react";
import Link from "next/link";

interface OrganizerOverviewProps {
  data: {
    events: any[];
    analytics: {
      totalRevenue: number;
      totalVotes: number;
      activeEvents: number;
    };
  };
}

function fmtGHS(amount: number): string {
  return `GHS ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function OrganizerOverview({ data }: OrganizerOverviewProps) {
  const { events, analytics } = data;

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
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
                <Zap size={18} className="text-amber-400 fill-amber-400" />
                Launch Event
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
                <DollarSign size={80} />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Total Revenue Generated</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">
                {fmtGHS(analytics.totalRevenue || 0)}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm bg-slate-50 w-fit px-3 py-1 rounded-full border border-slate-100">
                <TrendingUp size={14} /> Tracking performance
            </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
                <Vote size={80} />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Engagement (Total Votes)</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">
                {(analytics.totalVotes || 0).toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm bg-slate-50 w-fit px-3 py-1 rounded-full border border-slate-100">
                <BarChart3 size={14} /> Real-time engagement
            </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
                <Calendar size={80} />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Active Live Events</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">
                {(analytics.activeEvents || 0)}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm bg-slate-50 w-fit px-3 py-1 rounded-full border border-slate-100">
                <Users size={14} /> Live event tracking
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
                    <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                        <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-slate-400">No events found</h4>
                        <p className="text-slate-400 text-sm mt-1">Create your first event to see analytics here.</p>
                    </div>
                ) : (
                    events.map((event) => {
                        // Compute votes from candidates
                        let eventVotes = 0;
                        if (event.categories) {
                          event.categories.forEach((cat: any) => {
                            cat.candidates?.forEach((c: any) => {
                              eventVotes += Number(c.votes) || 0;
                            });
                          });
                        }
                        // Compute ticket revenue
                        let eventTicketRevenue = 0;
                        if (event.ticketTypes) {
                          event.ticketTypes.forEach((tt: any) => {
                            eventTicketRevenue += (Number(tt.sold) || 0) * (Number(tt.price) || 0);
                          });
                        }
                        const eventRevenue =
                          event.type === "VOTING"
                            ? eventVotes * (Number(event.costPerVote) || 0)
                            : eventTicketRevenue;

                        return (
                          <div key={event._id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow group">
                              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-inner bg-slate-100 flex-shrink-0">
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
                                    {event.type === "VOTING"
                                      ? `GHS ${eventRevenue.toLocaleString()} earned · ${eventVotes.toLocaleString()} votes`
                                      : `GHS ${eventRevenue.toLocaleString()} earned · ${event.ticketTypes?.reduce((s: number, tt: any) => s + (Number(tt.sold) || 0), 0) || 0} tickets sold`
                                    }
                                  </p>
                              </div>
                              <Link 
                                  href={`/dashboard/events/${event._id}`}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 p-2 rounded-lg text-slate-400 hover:text-slate-900"
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
                 <Link href="/dashboard/events" className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BarChart3 size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm">My Events</p>
                        <p className="text-xs text-slate-400 font-medium">Manage all your events</p>
                    </div>
                 </Link>
                 <Link href="/dashboard/events/new" className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-pink-200 hover:bg-pink-50/30 transition-all flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm">Create New Event</p>
                        <p className="text-xs text-slate-400 font-medium">Launch a voting or ticketing event</p>
                    </div>
                 </Link>
                 <Link href="/dashboard/earnings" className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-green-200 hover:bg-green-50/30 transition-all flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <DollarSign size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm">Earnings</p>
                        <p className="text-xs text-slate-400 font-medium">View revenue and payouts</p>
                    </div>
                 </Link>
                 <Link href="/dashboard/account" className="p-4 bg-white rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
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
