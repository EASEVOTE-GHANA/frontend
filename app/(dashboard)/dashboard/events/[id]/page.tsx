import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import { notFound } from "next/navigation";
import { AdminEventManager } from "@/app/components/events/AdminEventManager";

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

  // Provide robust fallbacks for nested objects to prevent runtime errors
  const event = {
    ...eventData,
    organizer: eventData.organizer ||
      eventData.organizerId || {
        name: "Unknown Organizer",
        email: "",
        phone: "",
      },
    stats: eventData.stats || {
      revenue: 0,
      votes: 0,
      ticketsSold: 0,
      candidatesCount: 0,
      ticketTypesCount: 0,
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
      role="ADMIN"
      backUrl="/dashboard/events"
    />
  );
}
