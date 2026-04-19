import { useState } from "react";
import { getEventStatus } from "@/lib/utils/event-status";
import Link from "next/link";
import Image from "next/image";

export default function EventCard({ event }: { event: any }) {
  const statusInfo = getEventStatus(event);

  const buttonText = event.type === "TICKETING" ? "Buy Ticket" : "Vote Now";

  return (
    <div className="snap-center shrink-0 w-[85vw] md:w-auto group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-2">
      <div className="relative h-64 overflow-hidden">
        <Image
          src={event.imageUrl || event.coverImage || event.image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop"}
          alt={event.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />


        <div className="absolute top-4 left-4 flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${statusInfo.color
              } ${statusInfo.isActive ? "animate-pulse" : ""}`}
          >
            {statusInfo.label}
          </span>
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60" />
      </div>

      <div className="p-6 relative">
        <p className="text-xs font-bold text-brand-bright uppercase mb-2">
          {event.categories && event.categories.length > 0
            ? event.categories[0].name
            : event.type || event.category}
        </p>

        <h3 className="text-xl font-bold text-brand-deep mb-1">
          {event.title}
        </h3>

        <p className="text-sm text-brand-bright mb-6">
          {event.startDate
            ? new Date(event.startDate).toLocaleDateString()
            : event.date}
        </p>

        <Link
          href={`/events/${event.id || event._id}`}
          className="block w-full text-center py-3 rounded-xl bg-slate-50 font-bold hover:bg-brand-bright hover:text-white! transition"
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
}
