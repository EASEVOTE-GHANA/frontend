import { createServerApiClient } from "@/lib/api-client";
import EventsBrowseClient from "./EventsBrowseClient";

export const dynamic = "force-dynamic";

export default async function VotingEventsPage() {
  const apiClient = createServerApiClient();
  let allEvents: any[] = [];
  
  try {
    const res = await apiClient.get<any>("/events?limit=100").catch(() => null);
    if (res) {
      const events = res.data || res.events || res;
      if (Array.isArray(events)) {
        // Naturally allow the backend to decide which events are visible, 
        // but we still filter by type on the frontend to ensure this is the 'Voting' page.
        allEvents = events.filter((e: any) => e.type === "VOTING" || e.type === "HYBRID");
      }
    }
  } catch (error) {
    console.error("Failed to fetch voting events:", error);
  }

  const clientEvents = allEvents.map((event: any) => ({
    id: event._id || event.id,
    title: event.title,
    eventCode: event.eventCode,
    category: event.type || "General",
    image: event.imageUrl || event.coverImage || event.image || "https://images.unsplash.com/photo-1540039155733-d730a53bf30c?q=80&w=2667&auto=format&fit=crop",
    date: event.startDate || event.date,
    status: event.status,
    location: event.location || "Online",
    votePrice: event.costPerVote || event.votePrice || 0,
    allowPublicNominations: !!event.allowPublicNominations,
    // Explicit properties for direct getEventStatus support
    votingStartTime: event.votingStartsAt || event.votingStartTime,
    votingEndTime: event.votingEndsAt || event.votingEndTime,
    nominationStartTime: event.nominationStartsAt || event.nominationStartTime,
    nominationEndTime: event.nominationEndsAt || event.nominationEndTime,
    startDate: event.startDate,
    endDate: event.endDate,
  }));

  return <EventsBrowseClient initialEvents={clientEvents} />;
}
