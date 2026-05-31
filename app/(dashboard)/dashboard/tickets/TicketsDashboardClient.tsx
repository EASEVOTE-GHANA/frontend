"use client";

// Client-side dashboard for ticket sales analytics


import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Ticket,
  ChevronDown,
  Download,
  DollarSign,
  PieChart as PieChartIcon
} from "lucide-react";
import { clsx } from "clsx";

type TicketType = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
};

type Event = {
  id: string;
  title: string;
  eventCode: string;
  status: string;
  totalTicketsSold: number;
  totalRevenue: number;
  ticketTypes: TicketType[];
};

interface DashboardProps {
  events: Event[];
}

export default function TicketsDashboardClient({ events }: DashboardProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events.length > 0 ? events[0].id : "",
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  if (!selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <PieChartIcon className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-display font-bold text-gray-700">No Ticketing Events</h2>
        <p className="text-gray-500">
          You haven't created any ticketing events yet.
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Ticket Sales</h1>
          <p className="text-slate-500 font-medium">
            Monitor sales performance and inventory across your events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Event Selector */}
          <div className="relative">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-slate-700 font-bold py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer shadow-sm"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group hover:border-primary-200 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary-100/50 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
                <Ticket size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Total Sold
              </span>
            </div>
            <p className="text-4xl font-display font-bold text-slate-900 tracking-tighter">
              {(selectedEvent.totalTicketsSold || 0).toLocaleString()}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-bold">
               <TrendingUp size={14} /> Live Tracked
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group hover:border-green-200 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-100/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-green-100/50 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                <DollarSign size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Gross Revenue
              </span>
            </div>
            <p className="text-4xl font-display font-bold text-slate-900 tracking-tighter">
              {formatCurrency(selectedEvent.totalRevenue || 0)}
            </p>
            <div className="mt-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">Commission applies on payout</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-blue-100/50 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <BarChart3 size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Sales Velocity
              </span>
            </div>
            <p className="text-4xl font-display font-bold text-slate-900 tracking-tighter">
              {selectedEvent.ticketTypes.length > 0
                ? Math.round((selectedEvent.totalTicketsSold / selectedEvent.ticketTypes.reduce((acc, t) => acc + t.quantity, 0)) * 100)
                : 0}%
            </p>
            <div className="mt-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">Capacity Fill Rate</div>
          </div>
        </div>
      </div>

      {/* Ticket Types Breakdown */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center">
          <div>
              <h3 className="text-xl font-bold text-slate-800">Inventory Breakdown</h3>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Performance of individual ticket tiers.</p>
          </div>
          <span className="text-xs font-black px-4 py-2 bg-white border border-gray-200 rounded-2xl text-slate-600 shadow-sm uppercase tracking-widest">
            {selectedEvent.ticketTypes.length} Tiers
          </span>
        </div>

        <div className="p-8 space-y-8">
          {selectedEvent.ticketTypes.map((ticket) => {
            const percentage = ticket.quantity > 0 ? (ticket.sold / ticket.quantity) * 100 : 0;

            return (
              <div key={ticket.id} className="relative">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs shadow-inner">
                       {ticket.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-lg block leading-tight">
                        {ticket.name}
                      </span>
                      <span className="text-xs font-black text-primary-600 uppercase tracking-widest">
                        {formatCurrency(ticket.price)} EACH
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="font-black text-slate-900 text-2xl tracking-tighter">
                        {ticket.sold?.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        / {ticket.quantity?.toLocaleString()}
                      </span>
                    </div>
                    <span className={clsx(
                        "text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest",
                        percentage > 90 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"
                    )}>
                      {percentage > 90 ? "Almost Out" : "In Stock"}
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar Container */}
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner relative">
                  <div
                    className={clsx(
                        "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
                        percentage > 90 ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-primary-600 to-primary-600"
                    )}
                    style={{ width: `${percentage}%` }}
                  >
                    {/* Shine effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 skew-x-12 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between mt-2 px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Used</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{percentage.toFixed(1)}% Fill</span>
                </div>
              </div>
            );
          })}

          {selectedEvent.ticketTypes.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <Ticket className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
                 No ticket tiers defined for this event.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
