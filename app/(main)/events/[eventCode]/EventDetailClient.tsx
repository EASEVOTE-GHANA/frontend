"use client";

import { useState, useEffect } from "react";
import { VotingEvent } from "@/types";
import { api } from "@/lib/api-client";
import toast from "react-hot-toast";

import {
  ArrowLeft,
  Calendar,
  MapPin,
  Share2,
  Clock,
  Search,
  Trophy,
  Info,
  Users,
  Grid as GridIcon,
  PenTool,
  Ticket,
  ChevronRight,
} from "lucide-react";
import CountUp from "react-countup";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TicketCheckoutModal } from "@/components/features/checkout/TicketCheckoutModal";
import { getEventStatus } from "@/lib/utils/event-status";
import Image from "next/image";

interface EventDetailProps {
  event: any;
  onNominate?: (event: any) => void;
}

import { BackButton } from "@/components/ui/BackButton";

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                   */
/* -------------------------------------------------------------------------- */

export default function EventDetailClient({
  event,
  onNominate,
}: EventDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "vote" | "tickets" | "overview" | "results"
  >(() => {
    const status = getEventStatus(event);
    const resultsEnabled = event.liveResults !== false && event.showLiveResults !== false;
    
    if (status.phase === "ENDED" && resultsEnabled) return "results";
    return event.type === "TICKETING" ? "tickets" : "vote";
  });
  const router = useRouter();

  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `Join me at ${event.title} on EaseVote!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Sharing failed. Link copied as fallback!");
        await navigator.clipboard.writeText(window.location.href);
      }
    }
  };

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const [votingStep, setVotingStep] = useState<"categories" | "nominees">(
    "categories",
  );

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Live Results State
  const [resultsData, setResultsData] = useState<any>(null);
  const [isResultsForbidden, setIsResultsForbidden] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Polling for Results
  useEffect(() => {
    const status = getEventStatus(event);
    if (activeTab !== "results" || !event.showLiveResults || status.phase === "ENDED") return;

    const fetchResults = async () => {
      try {
        const res = await api.get(`/votes/events/${event.id}/results`);
        setResultsData(res.data || res);
        setIsResultsForbidden(false);
      } catch (err: any) {
        if (err.message?.includes("403")) {
          setIsResultsForbidden(true);
        }
        console.error("[ResultsPolling] Error:", err);
      }
    };

    fetchResults(); // Initial fetch

    const interval = setInterval(fetchResults, 15000);
    return () => clearInterval(interval);
  }, [activeTab, event.id, event.showLiveResults]);

  /* ---------------------------------------------------------------------- */
  /* DERIVED DATA                                                            */
  /* ---------------------------------------------------------------------- */

  const allCandidates = event.categories
    ? event.categories.flatMap((cat: any) =>
      cat.candidates.map((c: any) => ({
        ...c,
        image: (c.imageUrl && c.imageUrl !== "null" && c.imageUrl !== "undefined" && !c.imageUrl.includes("cloudinary.com/example/")) ? c.imageUrl :
          (c.image && c.image !== "null" && c.image !== "undefined" && !c.image.includes("cloudinary.com/example/")) ? c.image :
            null,
        category: cat.name, // Ensure category name is attached
        voteCount: c.voteCount ?? c.votes ?? 0,
      })),
    )
    : [];

  const categoriesMap = allCandidates.reduce(
    (acc: any, c: any) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const categories = Object.entries(categoriesMap).map(([name, count]) => ({
    name,
    count,
  }));

  const filteredCandidates = allCandidates.filter(
    (c: any) =>
      c.category === selectedCategory &&
      (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const totalVotes =
    event.totalVotes ||
    allCandidates.reduce((sum: number, c: any) => sum + (c.voteCount || 0), 0);

  /* ---------------------------------------------------------------------- */

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ================= HERO / BANNER ================= */}

      <div className="bg-slate-900 text-white relative">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={event.imageUrl || event.coverImage || event.image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop"}
            alt="Hero Background"
            fill
            className="object-cover opacity-30 blur-sm"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 relative z-10">
          <button
            onClick={() => window.history.length > 2 ? router.back() : router.push("/events/voting")}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={20} /> Back to Events
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-end">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl shrink-0 bg-slate-800 relative">
              <Image
                src={event.imageUrl || event.coverImage || event.image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop"}
                alt="Event Logo"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white! ${getEventStatus(event).color}`}>
                  {getEventStatus(event).label}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wide">
                  {event.type}
                </span>
              </div>
              <h1 className="text-3xl text-white! md:text-5xl font-display font-bold mb-4">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-6 text-sm md:text-base text-white/80 font-medium mb-6">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-primary-700" />
                  {event.date}
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-primary-700" />
                    {event.location}
                  </div>
                )}
                {(event.timelineEnd ||
                  getEventStatus(event).isActive) && (
                    <div className="flex items-center gap-2">
                      <Clock size={18} className="text-primary-700" />
                      {event.timelineEnd ? (
                        <Countdown endTime={event.timelineEnd} />
                      ) : (
                        <span>Happening Now</span>
                      )}
                    </div>
                  )}
              </div>

              {/* Actions Bar */}
              {/* Share Button */}
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 text-sm font-bold bg-white text-slate-900 px-6 py-3 rounded-full hover:bg-primary-700 hover:text-white transition-colors"
                >
                  <Share2 size={16} /> Share Event
                </button>
                {/* Nominate Button */}
                {/* Nominate Button - Only show if Nomination is Open AND Voting is NOT Open */}
                {event.isNominationOpen && !event.isVotingOpen && (
                  <button
                    onClick={() =>
                      router.push(
                        `/events/nominate?eventCode=${event.eventCode}`,
                      )
                    }
                    className="flex items-center gap-2 text-sm font-bold bg-transparent border-2 border-white/30 text-white px-6 py-3 rounded-full hover:bg-white hover:text-primary-700 transition-colors"
                  >
                    <PenTool size={16} /> File Nomination
                  </button>
                )}
              </div>
            </div>

            {/* Event Code */}
            <div className="hidden lg:flex flex-col items-end gap-4">
              <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 text-center">
                <span className="block text-xs uppercase text-white/60 font-bold mb-1">
                  Event Code
                </span>
                <span className="block text-2xl font-mono font-bold tracking-wider">
                  {event.eventCode || "EV-2025"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30 shadow-primary-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              ...(event.type === "VOTING" || event.type === "HYBRID"
                ? getEventStatus(event).phase !== "ENDED"
                  ? [{ id: "vote", label: "Vote", icon: Trophy }]
                  : []
                : []),
              ...(event.type === "TICKETING" || event.type === "HYBRID"
                ? [{ id: "tickets", label: "Tickets", icon: Ticket }]
                : []),
              // Show Results tab for Voting/Hybrid events only if enabled
              ...(event.type === "VOTING" || event.type === "HYBRID"
                ? (event.liveResults !== false && event.showLiveResults !== false)
                  ? [{ id: "results", label: "Results", icon: Trophy }]
                  : []
                : []),
              { id: "overview", label: "About", icon: Info },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as "vote" | "tickets" | "overview" | "results",
                  )
                }
                className={`py-4 flex items-center gap-2 font-bold border-b-2 ${activeTab === tab.id
                    ? "border-primary-200 text-primary-700"
                    : "border-transparent text-slate-500"
                  }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ---------------- VOTE TAB ---------------- */}
        {activeTab === "vote" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* STEP 1: Categories View */}
            {votingStep === "categories" && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">
                      Select a Category
                    </h2>
                    <p className="text-slate-500">
                      Choose a category to view nominees and cast your vote.
                    </p>
                  </div>

                  {/* Phase Indicator */}
                  {(() => {
                    const status = getEventStatus(event);
                    return (
                      <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 self-start sm:self-center ${status.isActive
                          ? (status.phase === "VOTING" ? "bg-green-50 border-green-100 text-green-700" : "bg-blue-50 border-blue-100 text-blue-700")
                          : "bg-slate-50 border-slate-100 text-slate-700"
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${status.phase === "VOTING" ? "bg-green-500 animate-pulse" :
                            status.phase === "NOMINATION" ? "bg-blue-500" :
                              "bg-slate-400"
                          }`}></span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {status.phase === "VOTING" ? "Voting is Live" :
                            status.phase === "NOMINATION" ? "Nominations Open" :
                              status.phase === "ENDED" ? "Voting Ended" :
                                "Voting Starting Soon"}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((cat: any) => (
                    <div
                      key={cat.name}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setVotingStep("nominees");
                      }}
                      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-500 hover:-translate-y-1 transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                          <GridIcon size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary-800 transition-colors">
                            {cat.name}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Users size={14} /> {cat.count} Nominees
                          </div>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Nominees View */}
            {votingStep === "nominees" && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-gray-100 pb-6">
                  <div>
                    <button
                      onClick={() => setVotingStep("categories")}
                      className="text-sm font-bold text-slate-500 hover:text-primary-600 flex items-center gap-1 mb-3 transition-colors"
                    >
                      <ArrowLeft size={16} /> Back to Categories
                    </button>
                    <h2 className="text-3xl font-display font-bold text-slate-900">
                      {selectedCategory}
                    </h2>
                  </div>

                  {/* Search Bar (Specific to Nominees now) */}
                  <div className="relative w-full md:w-80">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search nominee name or code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    />
                  </div>
                </div>

                {/* Candidates Grid */}
                {filteredCandidates.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {filteredCandidates.map((candidate: any) => (
                      <div
                        key={candidate._id || candidate.id}
                        className="bg-white rounded-4xl p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
                      >
                        <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-4 bg-gray-100">
                          {candidate.image ? (
                            <Image
                              src={candidate.image}
                              alt={candidate.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary-900 flex items-center justify-center text-white font-bold text-6xl uppercase font-display transition-transform duration-500 group-hover:scale-110">
                              {candidate.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-mono font-bold">
                            {candidate.code}
                          </div>
                        </div>
                        <div className="px-2 flex-1 flex flex-col text-center">
                          <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-1">
                            {candidate.category}
                          </p>
                          <h3 className="text-xl font-display font-bold text-slate-900 mb-4">
                            {candidate.name}
                          </h3>

                          {/* Conditional Vote Count Display */}
                          {event.showVoteCount !== false && (
                            <div className="mb-4 text-slate-500 font-medium">
                              {(
                                (candidate.voteCount || 0) as number
                              ).toLocaleString()}{" "}
                              votes
                            </div>
                          )}

                          {getEventStatus(event).phase === "ENDED" ? (
                            <div className="mt-auto w-full bg-slate-200 text-slate-500 py-3 rounded-xl font-bold text-center cursor-not-allowed">
                              Voting Closed
                            </div>
                          ) : (
                            <Link
                              href={`/events/${event.eventCode}/vote/${candidate._id || candidate.id}`}
                              className="mt-auto w-full bg-primary-800 hover:bg-primary-900 text-white! py-3 rounded-xl font-bold hover:-translate-y-1 transition-all shadow-lg shadow-primary-900/20 flex items-center justify-center"
                            >
                              Vote
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-slate-500 font-medium">
                      No nominees found matching &quot;{searchQuery}&quot; in{" "}
                      {selectedCategory}.
                    </p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-2 text-primary-600 font-bold hover:underline"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ---------------- TICKETS TAB ---------------- */}
        {activeTab === "tickets" &&
          (event.type === "TICKETING" || event.type === "HYBRID") && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">
                  Get Tickets
                </h2>
                <p className="text-slate-500">
                  Secure your spot at this event by purchasing tickets below.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {event.ticketTypes &&
                  event.ticketTypes.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col hover:border-primary-500 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">
                            {ticket.name}
                          </h3>
                          <p className="text-sm font-medium text-slate-500 mt-1">
                            {ticket.quantity - (ticket.soldCount || 0)}{" "}
                            available
                          </p>
                        </div>
                        <span className="bg-brand-bright text-white px-3 py-1 rounded-full text-sm font-bold">
                          GHS {ticket.price}.00
                        </span>
                      </div>

                      {/* Future Buy Modal Trigger */}
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setCheckoutModalOpen(true);
                        }}
                        className="mt-auto w-full py-3 bg-primary-700 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-md"
                      >
                        Purchase Ticket
                      </button>
                    </div>
                  ))}
                {(!event.ticketTypes || event.ticketTypes.length === 0) && (
                  <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-slate-500">
                      No tickets are currently available for this event.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* ---------------- RESULTS TAB ---------------- */}
        {activeTab === "results" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 relative">
              {isResultsForbidden && getEventStatus(event).phase !== "ENDED" ? (
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                  <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-amber-900 mb-2">Results are Hidden</h2>
                  <p className="text-amber-700 text-sm">
                    The organizer has hidden live results. Final tallies will be revealed once voting ends.
                  </p>
                </div>
              ) : (
                <>
                  {getEventStatus(event).phase !== "ENDED" && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-4">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                      <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Refreshing Live</span>
                    </div>
                  )}
                  <h2 className="text-3xl font-bold font-display text-slate-900 mb-2">
                    {getEventStatus(event).phase === "ENDED" ? "Final Results" : "Live Results"}
                  </h2>
                  <p className="text-slate-500">
                    {getEventStatus(event).phase === "ENDED"
                      ? "Official final tallies for all categories."
                      : "Top performing candidates across all categories."
                    }
                  </p>
                </>
              )}
            </div>

            {!isResultsForbidden && (
              <div className="space-y-12">
                {(resultsData?.categories || event.categories).map((category: any) => {
                  const sortedCandidates = [...category.candidates].sort(
                    (a: any, b: any) => (b.voteCount ?? b.votes ?? 0) - (a.voteCount ?? a.votes ?? 0),
                  );

                  if (sortedCandidates.length === 0) return null;

                  const categoryTotalVotes =
                    category.totalVotes ||
                    sortedCandidates.reduce(
                      (acc, c) => acc + (c.voteCount ?? c.votes ?? 0),
                      0,
                    );

                  return (
                    <div
                      key={category.id}
                      className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900">
                          {category.name}
                        </h3>
                        <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                          {event.showVoteCount
                            ? `${categoryTotalVotes.toLocaleString()} votes`
                            : `${sortedCandidates.length} candidates`}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50/30 text-slate-500 text-xs uppercase tracking-wider font-bold">
                              <th className="px-6 py-4 w-16 text-center">Rank</th>
                              <th className="px-6 py-4">Candidate</th>
                              <th className="px-6 py-4 text-right">Votes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {sortedCandidates.map((candidate, index) => (
                              <tr
                                key={candidate._id || candidate.id}
                                className="hover:bg-gray-50/50 transition-colors"
                              >
                                <td className="px-6 py-4 text-center">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto ${index === 0
                                        ? "bg-yellow-100 text-yellow-700"
                                        : index === 1
                                          ? "bg-gray-100 text-slate-600"
                                          : index === 2
                                            ? "bg-orange-100 text-orange-700"
                                            : "bg-transparent text-slate-400"
                                      }`}
                                  >
                                    {index + 1}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 relative shrink-0">
                                      {(() => {
                                        const url = candidate.imageUrl || candidate.image;
                                        const isValid = url && typeof url === 'string' && !url.includes('example/image/upload') && !url.includes('null');
                                        
                                        return isValid ? (
                                          <Image
                                            src={url}
                                            alt={candidate.name}
                                            fill
                                            className="object-cover"
                                            sizes="40px"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold uppercase text-xs">
                                            {candidate.name.charAt(0)}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900">
                                        {candidate.name}
                                      </div>
                                      <div className="text-xs text-slate-500 font-mono">
                                        {candidate.code}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="font-bold text-slate-900">
                                    {event.showVoteCount
                                      ? (
                                        candidate.voteCount ?? candidate.votes ?? 0
                                      ).toLocaleString()
                                      : "---"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- OVERVIEW TAB ---------------- */}
        {activeTab === "overview" && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">About Event</h2>
            <p className="text-slate-600">
              {event.description ||
                "This is one of Ghana’s most prestigious voting events."}
            </p>
          </div>
        )}
      </div>
      {/* ================= MODAL ================= */}
      {checkoutModalOpen && selectedTicket && (
        <TicketCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          event={event}
          ticket={selectedTicket}
        />
      )}
    </div>
  );
}

function Countdown({ endTime }: { endTime: string }) {
  const calc = () => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return { d, h, m, s };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (!time) return <span>Ended</span>;

  if (time.d > 0) return <>Ends in {time.d}d {time.h}h {time.m}m</>;
  if (time.h > 0) return <>Ends in {time.h}h {time.m}m {time.s}s</>;
  return <>Ends in {time.m}m {time.s}s</>;
}
