import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  AlertOctagon,
  Zap,
  Vote,
  BarChart3,
  Users,
  Calendar,
} from "lucide-react";
import TransactionsTable from "./TransactionsTable";
import AdminStatCard from "@/components/admin/AdminStatCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string; eventId?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isOrganizer = role === "ORGANIZER";
  const apiClient = createServerApiClient(session?.accessToken);

  const page = parseInt(searchParams.page || "1");
  const eventId = searchParams.eventId || "";
  const status = searchParams.status || "ALL";

  // Build query string for API
  const queryStr = `page=${page}&limit=20${eventId ? `&eventId=${eventId}` : ""}${status !== "ALL" ? `&status=${status}` : ""}`;

  let stats, transactionsData, eventsList = [];

  if (isOrganizer) {
    // Organizer-specific data
    const [balanceRes, purchasesRes, eventsRes, statsRes] = await Promise.all([
      apiClient.get("/payouts/balance").catch(() => null),
      apiClient.get(`/purchases/organizer?${queryStr}`).catch(() => ({ data: [], pagination: {} })),
      apiClient.get("/events/my/events?limit=100").catch(() => ({ data: [] })),
      apiClient.get("/events/my/stats").catch(() => ({ data: {} })),
    ]);

    const balanceData = balanceRes?.data || {};
    const pulseData = statsRes?.data || {};

    stats = {
      totalVolume: balanceData.grossRevenue || pulseData.grossRevenue || 0,
      netRevenue: balanceData.netRevenue || pulseData.totalRevenue || 0,
      totalVotes: pulseData.totalVotes || 0,
      totalTickets: pulseData.totalTickets || 0,
      successRate: 100,
      pendingCount: balanceData.totalWithdrawn ? 1 : 0,
    };

    transactionsData = purchasesRes;
    eventsList = (eventsRes.data || eventsRes || []).map((e: any) => ({ id: e._id, title: e.title }));
  } else {
    // Admin-specific data
    const [statsRes, transactionsRes, eventsRes] = await Promise.all([
      apiClient.get("/admin/stats/revenue").catch(() => ({
        data: { totalVolume: 0, netRevenue: 0, successRate: 0, pendingCount: 0 },
      })),
      apiClient.get(`/admin/transactions?${queryStr}`).catch(() => ({ data: [], pagination: {} })),
      apiClient.get("/events/admin/all?limit=500").catch(() => ({ data: [] })),
    ]);

    const rawStats = statsRes.data || statsRes || {};
    stats = {
      totalVolume: rawStats.totalVolume || rawStats.totalRevenue || 0,
      netRevenue: rawStats.netRevenue || rawStats.netCommission || 0,
      successRate: rawStats.successRate || 0,
      pendingCount: rawStats.pendingCount || 0,
    };

    transactionsData = transactionsRes;
    eventsList = (eventsRes.data || eventsRes || []).filter((e: any) => e.status !== 'DELETED').map((e: any) => ({ id: e._id, title: e.title }));
  }

  const rawTransactions = transactionsData.data || transactionsData.purchases || (Array.isArray(transactionsData) ? transactionsData : []);
  const pagination = transactionsData.pagination || { totalPages: 1, currentPage: 1, totalResults: rawTransactions.length };

  // Resolve candidate and category names for VOTE purchases.
  // candidateId and categoryId are embedded subdocument IDs inside the Event
  // document — the backend does not populate them, so we fetch each unique
  // event once and build a cross-reference map client-side.
  type EventLookup = { categories: Record<string, string>; candidates: Record<string, string> };
  const eventLookup: Record<string, EventLookup> = {};

  const voteEventIds: string[] = [
    ...new Set(
      rawTransactions
        .filter((tx: any) => tx.type === "VOTE" && tx.eventId)
        .map((tx: any) => (tx.eventId._id || tx.eventId).toString())
    ),
  ];

  await Promise.allSettled(
    voteEventIds.map(async (eid: string) => {
      try {
        const res = await apiClient.get(`/events/${eid}`);
        const ev = res.data || res.event || res;
        const categories: Record<string, string> = {};
        const candidates: Record<string, string> = {};
        for (const cat of ev.categories || []) {
          const catId = (cat._id || cat.id)?.toString();
          if (catId) categories[catId] = cat.name;
          for (const cand of cat.candidates || []) {
            const candId = (cand._id || cand.id)?.toString();
            if (candId) candidates[candId] = cand.name;
          }
        }
        eventLookup[eid] = { categories, candidates };
      } catch {
        // event deleted or inaccessible — names stay blank
      }
    })
  );

  const transactions = rawTransactions.map((tx: any) => {
    const eid = (tx.eventId?._id || tx.eventId)?.toString() ?? "";
    const lookup = eventLookup[eid];
    const candId = tx.candidateId?.toString();
    const catId  = tx.categoryId?.toString();
    return {
      id: tx._id,
      reference: tx.paymentReference,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency || "GHS",
      status: tx.status === "PAID" ? "SUCCESS" : tx.status,
      payer: tx.customerName || tx.customerEmail || "Anonymous",
      customerEmail: tx.customerEmail || "",
      customerPhone: tx.customerPhone || "",
      source: tx.source || "web",
      event: tx.eventId?.title || "Unknown Event",
      eventType: tx.eventId?.type || "",
      date: tx.paidAt || tx.createdAt,
      voteCount: tx.voteCount || 0,
      ticketQuantity: tx.ticketQuantity || 0,
      ticketNumbers: (tx.ticketNumbers as string[]) || [],
      candidateName: (candId && lookup?.candidates[candId]) || "",
      categoryName:  (catId  && lookup?.categories[catId])  || "",
    };
  });

  // Helper for compact GHS formatting
  const fmtGHS = (amount: number) => {
    if (amount >= 1_000_000) return `GHS ${parseFloat((amount / 1_000_000).toFixed(3))}M`;
    if (amount >= 1_000) return `GHS ${parseFloat((amount / 1_000).toFixed(3))}K`;
    return `GHS ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper for compact count formatting
  const fmtCount = (count: number) => {
    if (count >= 1_000_000) return `${parseFloat((count / 1_000_000).toFixed(2))}M`;
    if (count >= 1_000) return `${parseFloat((count / 1_000).toFixed(2))}K`;
    return count.toLocaleString();
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Event Transactions</h1>
        <p className="text-slate-500 mt-1 font-medium italic">
          Monitor all financial activities and payment statuses for your events.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* GROSS REVENUE */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
                <DollarSign size={120} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gross Revenue</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
               {fmtGHS(stats.totalVolume)}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-slate-100">
                <TrendingUp size={12} /> TOTAL COLLECTED
            </div>
        </div>

        {/* NET EARNINGS */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
                <Zap size={120} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Net Earnings</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
               {fmtGHS(stats.netRevenue)}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-slate-100">
                <Activity size={12} /> AFTER COMMISSION
            </div>
        </div>

        {/* ENGAGEMENT */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
             <div className="absolute -top-4 -right-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
                <Vote size={120} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Engagement</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
                {fmtCount(stats.totalVotes)}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-slate-100">
                <BarChart3 size={12} /> TOTAL VOTES CAST
            </div>
        </div>

        {/* UNITS SOLD */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
             <div className="absolute -top-4 -right-4 text-slate-50 opacity-10 group-hover:scale-110 transition-transform">
                <Users size={120} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Units Sold</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">
                {fmtCount(stats.totalTickets)}
            </h2>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-slate-100">
                <Calendar size={12} /> TOTAL TICKETS
            </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {isOrganizer ? "Event Sales" : "Platform Transactions"}
          </h2>
        </div>
        <TransactionsTable 
          key={`tx-table-${eventId}-${status}-${page}`}
          transactions={transactions} 
          pagination={pagination} 
          eventsList={eventsList}
          currentFilters={{ eventId, status }}
        />
      </div>
    </div>
  );
}
