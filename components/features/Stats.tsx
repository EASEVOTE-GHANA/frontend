import StatsDisplay from "./StatsDisplay";
import { createServerApiClient } from "@/lib/api-client";

export default async function Stats() {
  const apiClient = createServerApiClient();
  const { getEventStatus } = require("@/lib/utils/event-status");
  
  let liveCount = 0;

  try {
    // Fetch recently active events to get a real "Live Now" count
    const res = await apiClient.get<any>("/events?limit=100").catch(() => null);
    if (res) {
      const allEvents = res.data || res.events || (Array.isArray(res) ? res : []);
      liveCount = allEvents.filter((e: any) => getEventStatus(e).isActive).length;
    }
  } catch {
    // Live count fetch failed — liveCount stays 0
  }

  const stats = [
    {
      id: "votes",
      label: "Votes Processed",
      value: 5400000, 
      suffix: "+",
      variant: "primary" as const,
      description: "Our scalable infrastructure handles millions of concurrent requests during peak moments.",
      className: "col-span-1 md:col-span-2 row-span-2 h-full min-h-[400px]",
      hasDecor: true,
    },
    {
      id: "events",
      label: "Events Hosted",
      value: 250, 
      suffix: "+",
      variant: "default" as const,
      delay: 0.2,
    },
    {
      id: "live",
      label: "Live Now",
      value: liveCount,
      suffix: "",
      variant: "emerald" as const,
      delay: 0.4,
    },
    {
      id: "payouts",
      label: "Paid to Organizers",
      value: 15,
      prefix: "GHS ",
      suffix: "M+",
      variant: "dark" as const,
      description: "Instant settlements to Bank Accounts and Mobile Money wallets.",
      className: "col-span-1 md:col-span-2 lg:col-span-2",
      delay: 0.6,
    }
  ];

  return <StatsDisplay stats={stats} />;
}
