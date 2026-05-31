import { createServerApiClient } from "@/lib/api-client";
import LiveEvents from "@/components/features/LiveEvents";
import LiveTickets from "@/components/features/LiveTickets";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "All Events | EaseVote Ghana",
  description: "Browse all upcoming voting and ticketing events on EaseVote.",
};

async function EventsContent() {
  const apiClient = createServerApiClient();
  let votingEvents = [];
  let ticketingEvents = [];

  try {
    const votingRes = await apiClient.get("/events?type=VOTING&status=LIVE");
    votingEvents = Array.isArray(votingRes.data)
      ? votingRes.data
      : votingRes.events || [];

    const ticketingRes = await apiClient.get(
      "/events?type=TICKETING&status=LIVE",
    );
    ticketingEvents = Array.isArray(ticketingRes.data)
      ? ticketingRes.data
      : ticketingRes.events || [];

    const hybridRes = await apiClient.get("/events?type=HYBRID&status=LIVE");
    const hybridEvents = Array.isArray(hybridRes.data)
      ? hybridRes.data
      : hybridRes.events || [];

    votingEvents = [...votingEvents, ...hybridEvents];
    ticketingEvents = [...ticketingEvents, ...hybridEvents];
  } catch (err) {
    console.error("Failed to fetch all public events:", err);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pt-20">
      {/* Directory Header */}
      <section className="bg-primary-700 py-16 px-4 md:px-8 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white!">
          Discover Live Events
        </h1>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          Browse the latest verified awards, pageants, and local concerts
          happening right now.
        </p>
      </section>

      {/* Embedded Client Grids */}
      <LiveEvents events={votingEvents} />
      <LiveTickets events={ticketingEvents} />
    </div>
  );
}

export default function EventsDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
