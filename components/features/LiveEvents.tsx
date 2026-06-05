"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import LiveEventsHeader from "./live-events/LiveEventsHeader";
import EventFilters from "./live-events/EventFilters";
import EventGrid from "./live-events/EventGrid";

export default function LiveEvents({ events }: { events: any[] }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8); // default desktop

  // Detect mobile and set itemsPerPage = 2
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(2); // mobile
      } else {
        setItemsPerPage(8); // desktop
      }
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1);
  };

  // Simplified status-based filters
  const filters = ["All", "Live", "Nomination"];
  const { getEventStatus } = require("@/lib/utils/event-status");

  const filteredEvents = (events || []).filter((e) => {
    const status = getEventStatus(e);
    
    const matchStatus =
      filter === "All" ||
      (filter === "Live" && status.isVotingOpen) ||
      (filter === "Nomination" && status.isNominationOpen);
      
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      document.getElementById("voting")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="voting" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-6 w-full">
          <LiveEventsHeader />

          <EventFilters
            filters={filters}
            active={filter}
            onFilterChange={handleFilterChange}
            search={search}
            onSearchChange={handleSearchChange}
          />
        </div>

        <EventGrid
          events={paginatedEvents}
          searchQuery={search}
          onClear={() => {
            setSearch("");
            setFilter("All");
            setCurrentPage(1);
          }}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-full border transition-colors ${
                currentPage === 1
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-sm font-medium text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-full border transition-colors ${
                currentPage === totalPages
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
              }`}
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/events/voting"
            className="inline-block border-b border-primary-600/30 text-primary-600 hover:text-secondary-600 hover:border-secondary-600 pb-1 transition-all"
          >
            View All Events
          </Link>
        </div>
      </div>
    </section>
  );
}

