"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  MapPin,
  ArrowRight,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { getEventStatus } from "@/lib/utils/event-status";
import { formatEventDate } from "@/lib/utils/date-format";

interface ClientTicket {
  id: string;
  title: string;
  eventCode: string;
  category: string;
  image: string;
  date: string;
  status: string;
  venue: string;
  price: string | number;
}

interface TicketingBrowseClientProps {
  initialEvents: ClientTicket[];
}

export default function TicketingBrowseClient({
  initialEvents,
}: TicketingBrowseClientProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Dynamically extract unique categories from events
  const categoriesSet = new Set<string>();
  categoriesSet.add("All");
  initialEvents.forEach((e) => {
    if (e.category) categoriesSet.add(e.category);
  });
  const categories = Array.from(categoriesSet);

  const filteredTickets = initialEvents.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.eventCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.venue?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" || t.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-primary-900 min-h-screen pb-20">
      {/* Header */}
      <div className="border-b border-primary-600 pb-8 pt-6 bg-primary-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Event Tickets & Concerts
          </h1>
          <p className="text-primary-200">
            Secure your spot at the best events. Fast, easy, and reliable ticketing.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="bg-primary-800 p-4 rounded-2xl shadow-xl border border-primary-700 mb-8 flex flex-col lg:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full lg:w-96">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search events, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary-600 bg-primary-900 text-white placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-brand-bright transition-all"
            />
          </div>

          <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
             <select
              title="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-primary-600 bg-primary-900 text-white font-medium focus:outline-none focus:border-brand-bright cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 border-l border-primary-700 pl-4">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-xl transition-colors ${
                viewMode === "grid"
                  ? "bg-brand-bright text-white"
                  : "text-primary-400 hover:text-white"
              }`}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 rounded-xl transition-colors ${
                viewMode === "list"
                  ? "bg-brand-bright text-white"
                  : "text-primary-400 hover:text-white"
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Results */}
        {filteredTickets.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                : "flex flex-col gap-6"
            }
          >
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`group relative bg-slate-900 rounded-2xl overflow-hidden hover:transform hover:scale-[1.01] transition-all duration-300 shadow-2xl flex ${
                  viewMode === "list" ? "flex-row h-64" : "flex-col"
                }`}
                style={{
                  clipPath: viewMode === "grid" ? "polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 95%, 10px 90%, 0 85%, 10px 80%, 0 75%, 10px 70%, 0 65%, 10px 60%, 0 55%, 10px 50%, 0 45%, 10px 40%, 0 35%, 10px 30%, 0 25%, 10px 20%, 0 15%, 10px 10%, 0 5%)" : "none"
                }}
              >
                <div className={`relative bg-gray-800 ${viewMode === "list" ? "w-72" : "h-48"}`}>
                  <img
                    src={ticket.image}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    alt={ticket.title}
                  />
                  <div className="absolute top-4 left-4">
                     <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm text-white ${
                        getEventStatus(ticket as any).color
                      } ${getEventStatus(ticket as any).isActive ? "animate-pulse" : ""}`}
                    >
                      {getEventStatus(ticket as any).label}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-brand-bright text-white text-sm font-bold px-3 py-1 rounded-md">
                    GHS {ticket.price}
                  </div>
                </div>

                <div className="relative bg-white text-slate-900 p-6 flex-1 flex flex-col justify-between">
                   {viewMode === "grid" && <div className="absolute -top-2 left-0 w-full h-4 bg-slate-900 ticket-stub-mask rotate-180 z-10"></div>}
                  
                  <div>
                    <h3 className="text-xl font-bold mb-3">{ticket.title}</h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-slate-600 text-sm font-medium">
                        <Calendar size={16} className="mr-2 text-primary-600" />
                        <span>{formatEventDate(ticket.date)}</span>
                      </div>
                      <div className="flex items-center text-slate-600 text-sm font-medium">
                        <MapPin size={16} className="mr-2 text-primary-600" />
                        <span>{ticket.venue}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/events/tickets/${ticket.eventCode}`}
                    className="w-full py-3 bg-primary-700 text-white! font-bold rounded-lg hover:bg-primary-800 transition-colors flex items-center justify-center gap-2"
                  >
                    Get Tickets <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-primary-800 rounded-3xl border border-dashed border-primary-600">
            <Ticket className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <p className="text-primary-200 text-xl font-medium">No tickets found</p>
            <button
              onClick={() => {setSearchQuery(""); setCategoryFilter("All");}}
              className="mt-4 text-brand-bright font-bold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
