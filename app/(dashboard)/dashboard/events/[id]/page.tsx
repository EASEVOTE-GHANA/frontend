import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import { notFound } from "next/navigation";
import { AdminEventManager } from "@/components/events/AdminEventManager";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminEventDetailsPage(props: Props) {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);

  const params = await props.params;
  const rawEvent = await apiClient
    .get(`/events/${params.id}`)
    .catch(() => null);

  if (!rawEvent) {
    notFound();
  }

  const eventData = rawEvent.data || rawEvent.event || rawEvent;

  // Map _id to id if necessary
  if (eventData && !eventData.id && eventData._id) {
    eventData.id = eventData._id;
  }

  // Manual summation fallback for votes
  let totalVotes = Number(eventData.stats?.votes ?? eventData.totalVotes ?? eventData.votes) || 0;
  if (totalVotes === 0 && eventData.categories) {
    eventData.categories.forEach((cat: any) => {
      cat.candidates?.forEach((c: any) => {
        totalVotes += Number(c.votes ?? c.voteCount) || 0;
      });
    });
  }

  // Manual summation fallback for tickets
  let ticketsSold = Number(eventData.stats?.ticketsSold ?? eventData.totalTicketsSold) || 0;
  if (ticketsSold === 0 && eventData.ticketTypes) {
    eventData.ticketTypes.forEach((tt: any) => {
      ticketsSold += Number(tt.sold ?? tt.soldCount) || 0;
    });
  }

  // Manual revenue calculation fallback
  let totalRevenue = Number(eventData.stats?.revenue ?? eventData.totalRevenue ?? eventData.revenue) || 0;
  if (totalRevenue === 0) {
    if (eventData.type === "VOTING") {
      totalRevenue = totalVotes * (Number(eventData.costPerVote ?? eventData.votePrice ?? eventData.price) || 0);
    } else if (eventData.type === "TICKETING" || eventData.type === "HYBRID") {
      if (eventData.ticketTypes) {
        eventData.ticketTypes.forEach((tt: any) => {
          totalRevenue += (Number(tt.sold ?? tt.soldCount) || 0) * (Number(tt.price) || 0);
        });
      }
    }
  }

  // Provide robust fallbacks for nested objects to prevent runtime errors
  const event = {
    ...eventData,
    organizer: eventData.organizer ||
      eventData.organizerId || {
        name: "Unknown Organizer",
        email: "",
        phone: "",
      },
    stats: {
      revenue: totalRevenue,
      votes: totalVotes,
      ticketsSold: ticketsSold,
      candidatesCount: eventData.stats?.candidatesCount ?? 0,
      ticketTypesCount: eventData.stats?.ticketTypesCount ?? 0,
    },
    categories: eventData.categories || [],
    ticketTypes: eventData.ticketTypes || [],
    // Aligned fields
    costPerVote: eventData.costPerVote ?? eventData.votePrice ?? null,
    minVotesPerPurchase:
      eventData.minVotesPerPurchase ?? eventData.minVotes ?? 1,
    maxVotesPerPurchase:
      eventData.maxVotesPerPurchase ?? eventData.maxVotes ?? null,
    allowPublicNominations:
      eventData.allowPublicNominations ?? eventData.allowNominations ?? false,
    imageUrl: eventData.imageUrl ?? eventData.coverImage ?? null,
  };

  return (
    <AdminEventManager
      event={event as any}
      role={session?.user?.role as any}
      backUrl="/dashboard/events"
    />
  );
}
