import { createServerApiClient } from "@/lib/api-client";
import { Metadata } from "next";
import TicketingBrowseClient from "./TicketingBrowseClient";

export const metadata: Metadata = {
  title: "Buy Event Tickets | EaseVote Ghana",
  description: "Secure your spot at Ghana's hottest concerts, shows, and events. Buy tickets easily and experience unforgettable live events.",
  alternates: { canonical: "/events/ticketing" },
  openGraph: {
    title: "Buy Event Tickets | EaseVote Ghana",
    description: "Secure your spot at Ghana's hottest concerts, shows, and events.",
    url: "/events/ticketing",
  },
};

async function getTicketingEvents() {
  const apiClient = createServerApiClient();
  let allEvents: any[] = [];
  
  try {
    const fetchEvents = async (type: string, status: string) => {
      const res = await apiClient.get<any>(`/events?type=${type}&status=${status}`).catch(() => null);
      if (res) {
        const events = res.data || res.events || res;
        if (Array.isArray(events)) allEvents.push(...events);
      }
    };

    await Promise.all([
      fetchEvents("TICKETING", "LIVE"),
      fetchEvents("TICKETING", "PUBLISHED"),
      fetchEvents("TICKETING", "APPROVED"),
      fetchEvents("HYBRID", "LIVE"),
      fetchEvents("HYBRID", "PUBLISHED"),
      fetchEvents("HYBRID", "APPROVED"),
    ]);
  } catch {
    // Ticketing events fetch failed — renders empty state
  }

  // Deduplicate by eventCode
  const uniqueEventsMap = new Map();
  allEvents.forEach(e => {
    if (e && e.eventCode) uniqueEventsMap.set(e.eventCode, e);
  });

  return Array.from(uniqueEventsMap.values()).map((event: any) => ({
    id: event._id || event.id,
    title: event.title,
    eventCode: event.eventCode,
    image: event.imageUrl || event.coverImage || event.image || "https://images.unsplash.com/photo-1540039155733-d730a53bf30c?q=80&w=2667&auto=format&fit=crop",
    date: event.startDate || event.date,
    venue: event.venue || "TBA",
    price: event.ticketTypes?.[0]?.price || event.price || "0.00",
    status: event.status,
    category: event.categories?.[0]?.name || event.type || "Event",
    // Essential dates for status utility
    votingStartsAt: event.votingStartsAt || event.votingStartTime,
    votingEndsAt: event.votingEndsAt || event.votingEndTime,
    nominationStartsAt: event.nominationStartsAt || event.nominationStartTime,
    nominationEndsAt: event.nominationEndsAt || event.nominationEndTime,
    startDate: event.startDate,
    endDate: event.endDate,
  }));
}

export const dynamic = "force-dynamic";

export default async function TicketingEventsPage() {
  const events = await getTicketingEvents();

  return <TicketingBrowseClient initialEvents={events} />;
}
