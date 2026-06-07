import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import EventDetailClient from "./EventDetailClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PreviewBanner } from "@/components/preview/PreviewBanner";

import { createServerApiClient } from "@/lib/api-client";
import { getEventStatus } from "@/lib/utils/event-status";

interface PageProps {
  params: Promise<{ eventCode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventCode } = await params;
  const apiClient = createServerApiClient();
  let event = null;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(eventCode);

  if (isObjectId) {
    const res = await apiClient.get<any>(`/events/${eventCode}`).catch(() => null);
    event = res?.data || res?.event || res;
  } else {
    const res = await apiClient.get<any>(`/events?eventCode=${eventCode}`).catch(() => null);
    if (res) {
      const eventsList = res.data || res.events || (Array.isArray(res) ? res : []);
      event = eventsList.find((e: any) =>
        (e.eventCode || "").toUpperCase() === eventCode.toUpperCase()
      );
    }
  }

  if (!event) return { title: "Event | EaseVote Ghana" };

  // Note: We intentionally do NOT redirect inside generateMetadata anymore.
  // Some crawlers (like Telegram) refuse to follow 307 redirects for OpenGraph tags
  // and will show fallback metadata. Instead, we generate the proper tags right here
  // and let the actual Page component handle the user redirection.

  if (!event?.title) return { title: "Event | EaseVote Ghana" };

  const description = event.description || `Vote, nominate, and participate in ${event.title} on EaseVote.`;
  const image = event.imageUrl || event.coverImage;

  return {
    title: `${event.title} | EaseVote Ghana`,
    description,
    alternates: { canonical: `/events/${eventCode}` },
    openGraph: {
      title: event.title,
      description,
      url: `/events/${eventCode}`,
      images: image ? [{ url: image, alt: event.title }] : [],
    },
    twitter: { card: "summary_large_image", title: event.title, description, images: image ? [image] : [] },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { eventCode } = await params;
  const session = await getServerSession(authOptions);

  const apiClient = createServerApiClient(session?.accessToken as string);
  let event = null;

  // Check if eventCode is a MongoDB ObjectId (24 hex characters)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(eventCode);

  if (isObjectId) {
    const res = await apiClient.get<any>(`/events/${eventCode}`).catch(() => null);
    event = res?.data || res?.event || res;
  } else {
    // Lookup by short eventCode
    // The backend now handles natural filtering, so we just pass the code.
    const res = await apiClient.get<any>(`/events?eventCode=${eventCode}`).catch(() => null);

    if (res) {
      const eventsList = res.data || res.events || (Array.isArray(res) ? res : []);
      event = eventsList.find((e: any) =>
        (e.eventCode || "").toUpperCase() === eventCode.toUpperCase()
      );
    }
  }

  if (!event) return notFound();

  // Redirect TICKETING-only events to the proper ticketing route
  if (event.type === "TICKETING") {
    redirect(`/events/tickets/${event.eventCode || eventCode}`);
  }

  // Permissions Check for Visibility
  let isAuthorized = false;
  if (session) {
    const userRole = session.user?.role;
    const userId = session.user?.id;
    const eventOrganizerId = typeof event.organizerId === 'object' ? event.organizerId?._id : event.organizerId;
    const isOwner = !!userId && userId === eventOrganizerId;
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
    isAuthorized = isOwner || isAdmin;
  }

  // Preview Mode Logic
  let showPreviewBanner = false;
  const isPublished = event.status === "PUBLISHED" || event.status === "LIVE" || event.status === "APPROVED" || event.status === "ENDED";
  if (!isPublished) {
    if (!isAuthorized) return notFound();
    showPreviewBanner = true;
  }

  // --- Unified Status & Phase Evaluation ---
  const statusInfo = getEventStatus(event);
  const { phase, isVotingOpen, isNominationOpen } = statusInfo;
  
  const now = new Date().getTime();
  const endDate = new Date(event.endDate).getTime();

  // Timeline Display Logic
  let timelineLabel = statusInfo.label;
  let timelineEnd: Date | null = null;

  if (phase === "VOTING") {
    const gmtDate = new Date(event.endDate);
    timelineLabel = `Voting ends ${gmtDate.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })}`;
    timelineEnd = gmtDate;
  } else if (phase === "ENDED") {
    timelineLabel = "Event Ended";
  } else {
    const gmtDate = new Date(event.startDate);
    timelineLabel = `Starts ${gmtDate.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })}`;
    timelineEnd = gmtDate;
  }

  let visibleCategories = event.categories;
  if (!isAuthorized && !isVotingOpen && !event.showLiveResults) {
    visibleCategories = event.categories.map((cat: any) => ({ ...cat, candidates: [] }));
  }

  const eventId = event._id || event.id;
  const isEventIdValid = /^[0-9a-fA-F]{24}$/.test(eventId);
  
  let hasNominationForm = false;
  if (isEventIdValid) {
    try {
      const formRes = await apiClient.get<any>(`/nominations/events/${eventId}/form`);
      const form = formRes?.data || formRes;
      hasNominationForm = !!form;
    } catch {
      // Form may not exist — this is expected
    }
  }

  const clientEvent: any = {
    ...event,
    isVotingOpen,
    isNominationOpen,
    phase,
    date: timelineLabel,
    timelineEnd: timelineEnd?.toISOString() || null,
    categories: visibleCategories,
    hasNominationForm,
  };

  return (
    <>

      {showPreviewBanner && <PreviewBanner status={event.status} />}
      <EventDetailClient event={clientEvent} />
    </>
  );
}
