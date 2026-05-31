import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { createServerApiClient } from "@/lib/api-client";
import NominationWrapper from "../../events/nominate/NominationWrapper";

export const metadata: Metadata = {
  title: "Submit a Nomination | EaseVote Ghana",
  description: "Nominate your favourite candidate for an award event on EaseVote Ghana.",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function PublicNominationPage({ params }: PageProps) {
  const { code: eventCode } = await params;

  if (!eventCode) {
    redirect("/events");
  }

  const apiClient = createServerApiClient();
  let event = null;

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(eventCode);

  if (isObjectId) {
    const res = await apiClient.get<any>(`/events/${eventCode}`).catch(() => null);
    event = res?.data || res?.event || res;
  } else {
    // Lookup by short eventCode
    const res = await apiClient.get<any>(`/events?eventCode=${eventCode}`).catch(() => null);
    const eventsList = res?.data || res?.events || (Array.isArray(res) ? res : []);
    
    if (Array.isArray(eventsList)) {
      event = eventsList.find((e: any) => 
        e.eventCode?.toUpperCase() === eventCode.toUpperCase()
      );
    }
  }

  if (!event) {
    return notFound();
  }

  // Fetch the nomination form configuration
  const eventId = event._id || event.id;
  const formConfigRes = await apiClient.get<any>(`/nominations/events/${eventId}/form`).catch(() => null);
  const formConfig = formConfigRes?.data || formConfigRes;

  // Serialize event for client
  const clientEvent: any = {
    ...event,
    votePrice: event.votePrice ? Number(event.votePrice) : 0,
    totalRevenue: Number(event.totalRevenue),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NominationWrapper event={clientEvent} formConfig={formConfig} />
    </div>
  );
}
