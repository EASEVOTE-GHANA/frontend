"use client";

import { getEventStatus } from "@/lib/utils/event-status";
import { formatEventDate } from "@/lib/utils/date-format";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Ticket, Trophy } from "lucide-react";

import { getCloudinaryOptimizedUrl } from "@/lib/utils/image-loader";

export default function EventCard({ event }: { event: any }) {
  const statusInfo = getEventStatus(event);

  const buttonText = event.type === "TICKETING" ? "Buy Ticket" : "Vote Now";
  const priceLabel = event.type === "TICKETING"
    ? (event.ticketTypes?.[0]?.price ? `GHS ${event.ticketTypes[0].price}.00` : "TBA")
    : (event.costPerVote || event.votePrice ? `GHS ${event.costPerVote || event.votePrice}/vote` : "GHS 1.00/vote");

  const rawImageSrc = event.imageUrl || event.coverImage || event.image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop";
  const optimizedImageSrc = getCloudinaryOptimizedUrl(rawImageSrc, 475, 267);

  const eventUrl = `/events/${event.eventCode || event.id || event._id}`;

  return (
    <Link
      href={eventUrl}
      className="snap-center shrink-0 w-[85vw] md:w-auto group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 border border-gray-100 flex flex-col h-full cursor-pointer"
    >
      <div className="relative h-64 overflow-hidden">
        <Image
          src={optimizedImageSrc}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        <div className="absolute top-4 left-4 flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-sm uppercase tracking-wider ${statusInfo.color
              } ${statusInfo.isActive ? "animate-pulse" : ""}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg shadow-sm border border-white/20">
          <span className="text-xs font-bold text-slate-900">
            {priceLabel}
          </span>
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60" />
      </div>

      <div className="p-6 relative flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 mb-2">
          {event.type === "TICKETING" ? (
            <Ticket size={12} className="text-secondary-600" />
          ) : (
            <Trophy size={12} className="text-secondary-600" />
          )}
          <p className="text-[10px] font-bold text-secondary-600 uppercase tracking-widest">
            {event.type === "VOTING" && event.categories?.length > 0
              ? `${event.categories.length} Categories`
              : event.type || "EVENT"}
          </p>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-1 group-hover:text-primary-700 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <MapPin size={14} className="text-primary-500" />
            <span className="line-clamp-1">{event.location || event.venue || "Tamale, Ghana"}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-400"></div>
            <span>{formatEventDate(event.endDate || event.startDate || event.date)}</span>
          </div>
        </div>

        <div
          className="mt-auto block w-full text-center py-3 rounded-xl bg-primary-800 text-white! font-bold hover:bg-primary-900 transition-all shadow-lg shadow-primary-900/10"
        >
          {buttonText}
        </div>
      </div>
    </Link>
  );
}

