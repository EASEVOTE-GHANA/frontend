"use client";

import { use } from "react";
import { EventForm } from "@/app/components/events/EventForm";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <EventForm eventId={id} backUrl={`/dashboard/events/${id}`} />;
}
