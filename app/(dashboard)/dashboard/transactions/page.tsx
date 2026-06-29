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

export default async function AdminTransactionsPage(props: {
  searchParams: Promise<{ page?: string; eventId?: string; status?: string; type?: string; gateway?: string; channel?: string; date?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isOrganizer = role === "ORGANIZER";
  const apiClient = createServerApiClient(session?.accessToken);

  const page = parseInt(searchParams.page || "1");
  const eventId = searchParams.eventId || "";
  const status = searchParams.status || "ALL";
  const type = searchParams.type || "ALL";
  const gateway = searchParams.gateway || "ALL";
  const channel = searchParams.channel || "ALL";
  const date = searchParams.date || "";

  // Build query string for API
  const queryStr = `page=${page}&limit=20${eventId ? `&eventId=${eventId}` : ""}${status !== "ALL" ? `&status=${status}` : ""}${type !== "ALL" ? `&type=${type}` : ""}${gateway !== "ALL" ? `&gateway=${gateway}` : ""}${channel !== "ALL" ? `&channel=${channel}` : ""}${date ? `&date=${date}` : ""}`;

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
    const [statsRes, platformRes, transactionsRes, eventsRes] = await Promise.all([
      apiClient.get("/admin/stats/revenue").catch(() => ({
        data: { totalVolume: 0, netRevenue: 0, successRate: 0, pendingCount: 0 },
      })),
      apiClient.get("/admin/stats/platform").catch(() => ({
        data: { overview: {} },
      })),
      apiClient.get(`/admin/transactions?${queryStr}`).catch(() => ({ data: [], pagination: {} })),
      apiClient.get("/events/admin/all?limit=500").catch(() => ({ data: [] })),
    ]);

    const rawStats = statsRes.data || statsRes || {};
    const pulseData = platformRes.data || platformRes || {};
    const overview = pulseData.overview || {};

    stats = {
      totalVolume: rawStats.totalVolume || rawStats.totalRevenue || 0,
      netRevenue: rawStats.netRevenue || rawStats.netCommission || 0,
      totalVotes: overview.totalVotesCast || rawStats.totalVotes || 0,
      totalTickets: overview.ticketsSold || rawStats.totalTickets || 0,
      successRate: rawStats.successRate || 0,
      pendingCount: rawStats.pendingCount || 0,
    };

    transactionsData = transactionsRes;
    eventsList = (eventsRes.data || eventsRes || []).filter((e: any) => e.status !== 'DELETED').map((e: any) => ({ id: e._id, title: e.title }));
  }

  const rawTransactions = transactionsData.data || transactionsData.purchases || (Array.isArray(transactionsData) ? transactionsData : []);
  const rawPagination = transactionsData.pagination || {};
  const pagination = {
    totalPages: rawPagination.totalPages || 1,
    currentPage: rawPagination.currentPage || 1,
    totalResults: rawPagination.totalItems ?? rawPagination.totalResults ?? rawTransactions.length,
  };

  const transactions = rawTransactions.map((tx: any) => ({
    id: tx._id,
    reference: tx.paymentReference,
    type: tx.type,
    amount: tx.amount,
    status: tx.status === "PAID" ? "SUCCESS" : tx.status,
    payer: tx.customerName || tx.customerEmail || "Anonymous",
    phone: tx.customerPhone || "N/A",
    event: tx.eventId?.title || "Unknown Event",
    date: tx.paidAt || tx.createdAt,
    // New fields for the "Units" column
    voteCount: tx.voteCount || 0,
    ticketQuantity: tx.ticketQuantity || 0,
    gateway: tx.provider || tx.paymentProvider || tx.gateway || tx.paymentGateway || "N/A",
    channel: (tx.channel || tx.paymentChannel || tx.source || "WEB").toUpperCase(),
    candidate: (tx.candidate || tx.candidateId) ? {
      name: tx.candidate?.name || tx.candidateId?.name || "Unknown",
      code: tx.candidate?.code || tx.candidateId?.code || "Unknown",
      categoryName: tx.categoryName ||
                    tx.categoryId?.name || 
                    tx.category?.name || 
                    tx.candidate?.categoryId?.name ||
                    tx.candidate?.category?.name || 
                    tx.candidateId?.categoryId?.name ||
                    tx.candidateId?.category?.name ||
                    (typeof tx.metadata === 'string' ? ((): string => { try { return JSON.parse(tx.metadata).categoryName || "" } catch(e) { return "" } })() : tx.metadata?.categoryName) || 
                    (typeof tx.candidate?.category === 'string' ? tx.candidate.category : null) ||
                    (typeof tx.candidateId?.category === 'string' ? tx.candidateId.category : null) ||
                    "",
      category: tx.candidate?.category || null,
    } : null
  }));

  // Helper for compact GHS formatting
  const fmtGHS = (amount: number) => {
    if (amount >= 1_000_000) return `GHS ${parseFloat((amount / 1_000_000).toFixed(3))}M`;
    if (amount >= 1_000) return `GHS ${parseFloat((amount / 1_000).toFixed(3))}K`;
    return `GHS ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper for compact count formatting
  const fmtCount = (count: number = 0) => {
    const validCount = Number(count) || 0;
    if (validCount >= 1_000_000) return `${parseFloat((validCount / 1_000_000).toFixed(2))}M`;
    if (validCount >= 1_000) return `${parseFloat((validCount / 1_000).toFixed(2))}K`;
    return validCount.toLocaleString();
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
          key={`tx-table-${eventId}-${status}-${type}-${gateway}-${channel}-${date}-${page}`}
          transactions={transactions} 
          pagination={pagination} 
          eventsList={eventsList}
          currentFilters={{ eventId, status, type, gateway, channel, date }}
          isOrganizer={isOrganizer}
        />
      </div>
    </div>
  );
}
