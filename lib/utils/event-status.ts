export type EventPhase = "UPCOMING" | "NOMINATION" | "VOTING" | "ENDED";

export type EventStatusInfo = {
  label: string;
  phase: EventPhase;
  color: string;
  isActive: boolean;
  isVotingOpen: boolean;
  isNominationOpen: boolean;
};

export function getEventStatus(event: {
  status: string;
  startDate?: string | Date;
  endDate?: string | Date;
  votingStartTime?: string | Date;
  votingEndTime?: string | Date;
}): EventStatusInfo {
  const now = new Date();
  const backendStatus = event.status?.toUpperCase();

  // Helper to parse dates safely
  const parseDate = (d?: string | Date) => d ? new Date(d) : null;
  
  const vStart = parseDate(event.votingStartTime);
  const vEnd = parseDate(event.votingEndTime);
  const eStart = parseDate(event.startDate);
  const eEnd = parseDate(event.endDate);

  // 1. Terminal Statuses
  if (backendStatus === "ENDED") {
    return { label: "Ended", phase: "ENDED", color: "bg-slate-600", isActive: false, isVotingOpen: false, isNominationOpen: false };
  }
  if (backendStatus === "CANCELLED") {
    return { label: "Cancelled", phase: "ENDED", color: "bg-red-700", isActive: false, isVotingOpen: false, isNominationOpen: false };
  }

  // 2. Date-based Ended check (if past either general or voting end)
  if ((vEnd && now > vEnd) || (eEnd && now > eEnd)) {
    return { label: "Ended", phase: "ENDED", color: "bg-slate-600", isActive: false, isVotingOpen: false, isNominationOpen: false };
  }

  // 3. Upcoming Phase
  const primaryStart = vStart || eStart;
  if (primaryStart && now < primaryStart) {
    return { label: "Coming Soon", phase: "UPCOMING", color: "bg-amber-500", isActive: false, isVotingOpen: false, isNominationOpen: false };
  }

  // 4. Live / Paused Statuses
  if (backendStatus === "PAUSED") {
    return { label: "Paused", phase: "VOTING", color: "bg-orange-600", isActive: false, isVotingOpen: false, isNominationOpen: false };
  }
  
  if (backendStatus === "LIVE") {
    return { label: "Live", phase: "VOTING", color: "bg-green-600", isActive: true, isVotingOpen: true, isNominationOpen: false };
  }

  // Default Fallback
  return { label: "Upcoming", phase: "UPCOMING", color: "bg-slate-400", isActive: false, isVotingOpen: false, isNominationOpen: false };
}
