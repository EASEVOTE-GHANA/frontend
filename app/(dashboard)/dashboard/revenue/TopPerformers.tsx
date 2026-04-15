import { 
  Trophy, 
  Users, 
  ArrowUpRight, 
  TrendingUp,
  User,
  Calendar
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";

interface TopPerformersProps {
  events: any[];
  organizers: any[];
}

export default function TopPerformers({ events, organizers }: TopPerformersProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
        maximumFractionDigits: 0
    }).format(val);
  };

  const maxEventRevenue = Math.max(...events.map(e => e.revenue), 1);
  const maxOrgRevenue = Math.max(...organizers.map(o => o.revenue), 1);

  const LeaderboardSection = ({ title, data, type }: { title: string, data: any[], type: 'events' | 'organizers' }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white border border-slate-200 text-slate-900 rounded-lg shadow-sm">
                    {type === 'events' ? <Trophy size={18} /> : <TrendingUp size={18} />}
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-none">{title}</h3>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Platform Performance</p>
                </div>
            </div>
            <Link 
                href={type === 'events' ? "/dashboard/events" : "/dashboard/organizers"} 
                className="text-[10px] font-bold text-slate-900 hover:text-slate-600 flex items-center gap-1 uppercase tracking-widest"
            >
                View All <ArrowUpRight size={12} />
            </Link>
        </div>

        <div className="p-6 space-y-6">
            {data.map((item, idx) => (
                <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 w-4">#{idx + 1}</span>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 line-clamp-1 uppercase tracking-tight">
                                    {type === 'events' ? item.title : (item.businessName || item.name)}
                                </h4>
                                <div className="flex items-center gap-3 mt-1">
                                     {type === 'events' ? (
                                        <span className={clsx(
                                            "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                                            item.type === "VOTING" ? "bg-magenta-50 text-magenta-600 border-magenta-100" : "bg-slate-50 text-slate-600 border-slate-100"
                                        )}>
                                            {item.type}
                                        </span>
                                     ) : (
                                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                            <Calendar size={10} /> {item.eventCount} Events
                                        </span>
                                     )}
                                     <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                         <Users size={10} /> {type === 'events' ? item.count : 'Multiple'} Transactions
                                     </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">{formatCurrency(item.revenue)}</div>
                        </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={clsx(
                                "h-full rounded-full transition-all duration-1000", 
                                type === 'events' && item.type === "VOTING" ? "bg-magenta-500" : "bg-slate-900"
                            )}
                            style={{ width: `${(item.revenue / (type === 'events' ? maxEventRevenue : maxOrgRevenue)) * 100}%` }}
                        ></div>
                    </div>
                </div>
            ))}
            {data.length === 0 && <p className="text-center py-10 text-slate-400 text-sm italic">No data available.</p>}
        </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <LeaderboardSection title="Top Performing Events" data={events} type="events" />
      <LeaderboardSection title="MVP Organizers" data={organizers} type="organizers" />
    </div>
  );
}
