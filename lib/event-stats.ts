/**
 * Compute event stats from the actual embedded data — no cached fields.
 * Works for both voting and ticketing events.
 */
export function computeEventStats(event: any) {
  // 0. Use Live Ledger Stats if provided by the backend (Source of Truth)
  if (event.ledgerStats) {
    return {
      votes: event.ledgerStats.votes || 0,
      ticketsSold: event.ledgerStats.ticketsSold || 0,
      revenue: event.ledgerStats.revenue || 0
    };
  }

  // Fallback to calculation from embedded fields or ledger
  const totalVotes = event.ledgerStats?.votes ?? 
    (event.categories || []).reduce((sum: number, cat: any) => sum + (cat.votes || cat.totalVotes || 0), 0);
  const ticketsSold = event.ledgerStats?.ticketsSold ?? 
    (event.ticketTypes || []).reduce((sum: number, tt: any) => sum + (tt.sold || 0), 0);
  const revenue = event.ledgerStats?.revenue ?? (
    event.type === "VOTING" 
      ? totalVotes * (Number(event.costPerVote ?? event.votePrice ?? 0))
      : (event.ticketTypes || []).reduce((sum: number, tt: any) => sum + ((tt.sold || 0) * (tt.price || 0)), 0)
  );

  return { votes: totalVotes, ticketsSold, revenue };
}
