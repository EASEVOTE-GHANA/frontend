"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { russoOne } from "../ui/fonts";
import SearchBar from "../ui/SearchBar";
import { getEventStatus } from "@/lib/utils/event-status";

export default function LiveTickets({ events }: { events: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6); // default desktop

  // Detect mobile and set itemsPerPage = 2
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(2); // mobile
      } else {
        setItemsPerPage(6); // desktop
      }
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const handleSearchChange = (newQuery: string) => {
    setSearchQuery(newQuery);
    setCurrentPage(1);
  };

  const filteredTickets = (events || []).filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.venue &&
        ticket.venue.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      document
        .getElementById("ticketing")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="ticketing"
      className="py-24 bg-primary-700 text-white relative overflow-hidden"
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-[1000px] h-[1000px] rounded-full border-100p border-white/20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="text-brand-bright font-bold tracking-widest text-sm uppercase">
            Upcoming Experiences
          </span>
          <h2
            className={`${russoOne.className} text-4xl md:text-5xl text-white font-display mt-2 mb-6`}
            style={{ color: "inherit" }}
          >
            Event Tickets & Concerts
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg mb-5">
            Secure your spot at the hottest concerts and shows in Ghana. Buy
            Your Tickets easily and experience unforgettable live events!
          </p>

          <div className="flex justify-center">
            <div className="w-full max-w-md text-slate-900">
              <SearchBar value={searchQuery} onChange={handleSearchChange} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedTickets.map((ticket) => (
            <div
              key={ticket._id || ticket.id || ticket.eventCode}
              className="group relative bg-slate-900 rounded-2xl overflow-hidden hover:transform hover:scale-[1.02] transition-all duration-300 shadow-2xl shadow-black/50 flex flex-col"
              style={{
                clipPath:
                  "polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 95%, 10px 90%, 0 85%, 10px 80%, 0 75%, 10px 70%, 0 65%, 10px 60%, 0 55%, 10px 50%, 0 45%, 10px 40%, 0 35%, 10px 30%, 0 25%, 10px 20%, 0 15%, 10px 10%, 0 5%)",
              }}
            >
              {/* Image Section */}
              <div className="relative h-48 bg-gray-800">
                {(() => {
                  const urls = [ticket.imageUrl, ticket.coverImage, ticket.image];
                  const validUrl = urls.find(url =>
                    url &&
                    typeof url === 'string' &&
                    !["null", "undefined", "cloudinary.com/example/"].some(str => url.toLowerCase().includes(str))
                  );
                  const finalSrc = validUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop";

                  return (
                    <img
                      src={finalSrc}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      alt={ticket.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop";
                      }}
                    />
                  );
                })()}

                <div className="absolute top-4 left-4 flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm text-white ${getEventStatus(ticket).color
                      } ${getEventStatus(ticket).isActive ? "animate-pulse" : ""}`}
                  >
                    {getEventStatus(ticket).label}
                  </span>
                </div>

                {ticket.ticketTypes && ticket.ticketTypes.length > 0 && (
                  <div className="absolute top-4 right-4 bg-brand-bright text-white text-sm font-bold pl-3 px-3 py-1 rounded-md font-bold text-sm">
                    GHS {ticket.ticketTypes[0].price}.00
                  </div>
                )}
              </div>

              {/* Stub Details - The "Rip-off" effect using a border-dashed line */}
              <div className="relative bg-white text-slate-900 p-6 flex-1">
                {/* Visual rip line */}
                <div className="absolute -top-2 left-0 w-full h-4 bg-slate-900 ticket-stub-mask rotate-180 z-10"></div>

                <div className="pt-2">
                  <h3 className="text-xl font-bold mb-2">{ticket.title}</h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-slate-600 text-sm">
                      <Calendar size={16} className="mr-2 text-magenta-600" />
                      <span>
                        {new Date(
                          ticket.startDate || ticket.date,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center text-slate-600 text-sm">
                      <MapPin size={16} className="mr-2 text-magenta-600" />
                      <span>{ticket.venue}</span>
                    </div>
                  </div>

                  <Link
                    href={`/events/tickets/${ticket._id || ticket.id}`}
                    className="w-full py-3 bg-secondary-700 text-white! font-bold rounded-lg hover:bg-primary-800 transition-colors flex items-center justify-center group/btn"
                  >
                    Get Tickets
                    <ArrowRight
                      size={16}
                      className="ml-2 transform group-hover/btn:translate-x-1 transition-transform"
                    />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-full border transition-colors ${currentPage === 1
                ? "border-white/10 text-white/30 cursor-not-allowed"
                : "border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-sm font-medium text-white/70">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-full border transition-colors ${currentPage === totalPages
                ? "border-white/10 text-white/30 cursor-not-allowed"
                : "border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                }`}
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/events/ticketing"
            className="inline-block border-b border-white/30 text-white hover:text-brand-bright hover:border-brand-bright pb-1 transition-all"
          >
            View All Events
          </Link>
        </div>
      </div>
    </section>
  );
}
