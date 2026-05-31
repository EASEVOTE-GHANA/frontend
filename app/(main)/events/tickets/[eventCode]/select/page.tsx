import { createServerApiClient } from "@/lib/api-client";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketSelectionClient } from "./TicketSelectionClient";

export const metadata: Metadata = {
  title: "Select Tickets | EaseVote Ghana",
  description: "Choose your ticket type and complete your purchase securely on EaseVote.",
  robots: { index: false, follow: false },
};

export default async function TicketSelectionPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;

  const apiClient = createServerApiClient();
  let event = null;
  // The backend's GET /events/:id supports both MongoDB ObjectIds and short 2-letter event codes.
  const res = await apiClient.get<any>(`/events/${eventCode}`).catch(() => null);
  event = res?.data || res?.event || res;

  if (!event) return notFound();

  const pageEvent = {
    id: event.id || event._id,
    title: event.title,
    eventCode: event.eventCode,
    image: event.imageUrl || event.coverImage || "/placeholder-event.jpg",
    category: event.type as any,
    date: new Date(event.startDate).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: new Date(event.startDate).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    venue: event.venue || event.location || "TBA",
    organizer: event.organizer?.businessName || event.organizer?.user?.name || "Organizer",
    description: event.description || "",
    ticketTypes: (event.ticketTypes || []).map((t: any) => ({
      id: t.id || t._id,
      name: t.name,
      price: Number(t.price),
      available: t.available ?? (t.quantity - t.soldCount),
      description: t.description || "",
    })),
  };

  return <TicketSelectionClient event={pageEvent as any} />;
}
