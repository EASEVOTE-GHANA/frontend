import Hero from "@/components/features/Hero";
import LiveEvents from "@/components/features/LiveEvents";
import LiveTickets from "@/components/features/LiveTickets";
import Partners from "@/components/features/Partners";
import Stats from "@/components/features/Stats";
import dynamic from "next/dynamic";
import { Metadata } from "next";

// Dynamically load components below the fold
const HowItWorks = dynamic(() => import("@/components/features/HowItWorks"));
const Testimonials = dynamic(
  () => import("@/components/features/Testimonials"),
);
const Newsletter = dynamic(() => import("@/components/features/Newsletter"));

export const metadata: Metadata = {
  title: "EaseVote Ghana | Home",
  description:
    "The easiest way to vote for your favorite contestants and buy event tickets in Ghana. Safe, fast, and 100% reliable.",
  alternates: {
    canonical: "https://easevotegh.com",
  },
};

import { createServerApiClient } from "@/lib/api-client";
import { getEventStatus } from "@/lib/utils/event-status";

export default async function Home() {
  const apiClient = createServerApiClient();
  let votingEvents: any[] = [];
  let ticketingEvents: any[] = [];
  let banners: any[] = [];

  try {
    const bannerRes = await apiClient.get<any[]>("/cms/banners", { next: { revalidate: 600 } }).catch(() => []);
    banners = Array.isArray(bannerRes) ? bannerRes : (bannerRes as any).data || [];

    const res = await apiClient.get<any>("/events?limit=100", { next: { revalidate: 60 } }).catch(() => null);
    if (res) {
      const allEvents = res.data || res.events || (Array.isArray(res) ? res : []);
      
      // Filter for PUBLICLY visible events based on backend's natural filtering
      votingEvents = allEvents.filter((e: any) => 
        (e.type === "VOTING" || e.type === "HYBRID") && 
        getEventStatus(e).isActive
      );
      
      ticketingEvents = allEvents.filter((e: any) => 
        (e.type === "TICKETING" || e.type === "HYBRID") && 
        getEventStatus(e).isActive
      );
    }
    
  } catch {
    // Frontpage events failed — renders with empty state
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Hero banners={banners} />
      <LiveEvents events={votingEvents} />
      <LiveTickets events={ticketingEvents} />
      <Partners />
      <Stats />
      <HowItWorks />
      <Testimonials />
      <Newsletter />
    </main>
  );
}
