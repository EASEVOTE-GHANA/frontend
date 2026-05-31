import { Metadata } from "next";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Info,
  MapPin,
  Ticket,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}): Promise<Metadata> {
  const { eventCode } = await params;
  const { createServerApiClient } = await import("@/lib/api-client");
  const apiClient = createServerApiClient();
  const res = await apiClient.get<any>(`/events/${eventCode}`).catch(() => null);
  const event = res?.data || res?.event || res;
  const title = event?.title ? `Tickets — ${event.title} | EaseVote` : "Buy Tickets | EaseVote Ghana";
  const image = event?.imageUrl || event?.coverImage;
  return {
    title,
    description: event?.title ? `Buy tickets for ${event.title}. Secure, fast, and easy ticketing powered by EaseVote Ghana.` : "Buy event tickets on EaseVote Ghana.",
    alternates: { canonical: `/events/tickets/${eventCode}` },
    openGraph: { title, url: `/events/tickets/${eventCode}`, images: image ? [{ url: image, alt: event.title }] : [] },
  };
}
import { EventShareButton } from "@/components/features/events/EventShareButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerApiClient } from "@/lib/api-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PreviewBanner } from "@/components/preview/PreviewBanner";
import { BackButton } from "@/components/ui/BackButton";

export default async function TicketEventDetailPage({
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

  // Preview Mode Logic
  let showPreviewBanner = false;

  const isPubliclyVisible = ["LIVE", "PUBLISHED", "APPROVED", "ENDED"].includes(event.status);
  
  if (!isPubliclyVisible) {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    const organizerId = session?.user?.organizerId;

    const eventOrganizerId = typeof event.organizerId === 'object' ? event.organizerId?._id : event.organizerId;
    const isOwner = organizerId === eventOrganizerId;
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

    if (!session || (!isOwner && !isAdmin)) {
      // Not authorized to view draft/private event
      return notFound();
    }

    showPreviewBanner = true;
  }

  // Map API data to Page UI expectations
  const pageEvent = {
    ...event,
    image: event.imageUrl || event.coverImage || "/placeholder-event.jpg",
    category: event.type,
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
    minPrice:
      event.ticketTypes.length > 0 ? event.ticketTypes[0].price : 0,
    ticketTypes: event.ticketTypes.map((t: any) => ({
      ...t,
      price: Number(t.price),
    })),
  };

  return (
    <>
      {showPreviewBanner && <PreviewBanner status={event.status} />}
      <div className="bg-white min-h-screen pb-24">
        {/* Cinematic Hero */}
        <div className="relative h-[40vh] bg-slate-900">
          <Image
            fill
            priority
            sizes="100vw"
            src={pageEvent.image}
            alt={pageEvent.title}
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-linear-to-t from-primary-900 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-linear-to-t from-primary-900 via-transparent to-transparent"></div>
          <div className="absolute top-0 left-0 w-full p-6 z-30">
            <BackButton fallback="/events/ticketing" />
          </div>
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="inline-block px-3 py-1 bg-primary-700 text-white text-xs font-bold uppercase tracking-wide rounded-md mb-4">
                  {pageEvent.category}
                </span>
                <h1 className="text-4xl md:text-6xl font-display font-bold text-white! mb-4 leading-tight">
                  {pageEvent.title}
                </h1>
                <div className="flex flex-wrap gap-6 text-white/90 font-medium">
                  <span className="flex items-center gap-2">
                    <Calendar size={18} className="text-primary-500" />
                    {pageEvent.date}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock size={18} className="text-primary-500" />{" "}
                    {pageEvent.time}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin size={18} className="text-primary-500" />
                    {pageEvent.venue}
                  </span>
                </div>
              </div>

              {/* Event Code */}
              <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 text-center shrink-0">
                <span className="block text-xs uppercase text-white/60 font-bold mb-1">
                  Event Code
                </span>
                <span className="block text-2xl font-mono font-bold tracking-wider text-white">
                  {pageEvent.eventCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <div className="prose prose-lg prose-slate max-w-none">
              <h3 className="font-display font-bold text-slate-900 text-2xl mb-4">
                Event Description
              </h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {pageEvent.description ||
                  "Join us for an unforgettable experience. This event brings together the best talent and atmosphere in Ghana. Don't miss out on what promises to be the highlight of the year."}
              </p>

              <h3 className="font-display font-bold text-slate-900 text-2xl mt-8 mb-4">
                Important Info
              </h3>
              <ul className="space-y-2 list-none pl-0">
                <li className="flex gap-3 text-slate-600">
                  <Info size={20} className="text-primary-600 shrink-0" />
                  Doors open 2 hours before the event starts.
                </li>
                <li className="flex gap-3 text-slate-600">
                  <Ticket size={20} className="text-primary-600 shrink-0" />
                  Tickets are scanned at the gate via QR code.
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-24">
              <h3 className="font-bold text-slate-900 text-lg mb-4">
                Tickets Starting From
              </h3>
              <div className="text-3xl font-display font-bold text-slate-900 mb-6">
                GHS {Number(pageEvent.minPrice).toFixed(2)}
              </div>

              <Link
                href={`/events/tickets/${eventCode}/select`}
                className="w-full bg-primary-700 text-white! py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-transform hover:scale-[1.02] shadow-lg mb-4 flex items-center justify-center gap-2"
              >
                Get Tickets <Ticket size={20} />
              </Link>

              <EventShareButton 
                eventTitle={pageEvent.title} 
                className="w-full bg-white text-slate-700 border border-gray-200 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              />



              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-slate-400 text-center">
                  Secured by EaseVote. 100% Buyer Guarantee.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
