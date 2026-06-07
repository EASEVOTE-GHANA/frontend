import { notFound } from "next/navigation";
import { Metadata } from "next";
import VoteClient from "./VoteClient";
import { createServerApiClient } from "@/lib/api-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventCode: string; candidateId: string }>;
}): Promise<Metadata> {
  const { eventCode, candidateId } = await params;
  const apiClient = createServerApiClient();
  const res = await apiClient.get<any>(`/events/${eventCode}`).catch(() => null);
  const event = res?.data || res?.event || res;
  let candidateName = "";
  for (const cat of event?.categories || []) {
    const c = cat.candidates?.find((c: any) => (c._id || c.id) === candidateId);
    if (c) { candidateName = c.name; break; }
  }
  let candidateImage = "";
  if (candidateName) {
    for (const cat of event?.categories || []) {
      const c = cat.candidates?.find((c: any) => (c._id || c.id) === candidateId);
      if (c) {
        candidateImage = c.imageUrl || c.image || "";
        break;
      }
    }
  }

  const title = candidateName && event?.title
    ? `Vote for ${candidateName} — ${event.title} | EaseVote`
    : "Cast Your Vote | EaseVote Ghana";
  const description = candidateName ? `Support ${candidateName} by casting your vote on EaseVote Ghana.` : "Cast your vote securely on EaseVote.";
  const image = candidateImage || event?.imageUrl || event?.coverImage || "/easevote.svg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/events/${eventCode}/vote/${candidateId}`,
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ eventCode: string; candidateId: string }>;
}) {
  const { eventCode, candidateId } = await params;

  const apiClient = createServerApiClient();
  let event = null;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(eventCode);

  if (isObjectId) {
    const res = await apiClient.get<any>(`/events/${eventCode}`).catch(() => null);
    event = res?.data || res?.event || res;
  } else {
    // Lookup by short eventCode
    const res = await apiClient.get<any>(`/events?eventCode=${eventCode}`).catch(() => null);
    if (res) {
      const eventsList = res.data || res.events || (Array.isArray(res) ? res : []);
      event = eventsList.find((e: any) => 
        (e.eventCode || "").toUpperCase() === eventCode.toUpperCase()
      );
    }
  }

  if (!event) return notFound();

  // Find the category AND the candidate
  let categoryId = null;
  let candidate = null;

  for (const cat of event.categories || []) {
    const found = cat.candidates?.find((c: any) => (c._id || c.id) === candidateId);
    if (found) {
      candidate = found;
      categoryId = cat._id || cat.id;
      break;
    }
  }

  if (!candidate) return notFound();

  const clientEvent = {
    ...event,
    location: event.location || "Accra, Ghana",
  };

  return (
    <VoteClient
      event={clientEvent as any}
      candidate={{ 
        ...candidate, 
        image: candidate.imageUrl || candidate.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=fce7f3&color=db2777&size=256`,
        categoryId: categoryId 
      }}
    />
  );
}
