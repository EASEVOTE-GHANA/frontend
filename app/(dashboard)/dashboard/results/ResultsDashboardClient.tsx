"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  ChevronDown,
  Download,
} from "lucide-react";
import { clsx } from "clsx";

type Candidate = {
  id: string;
  name: string;
  code: string;
  voteCount: number;
  image: string | null;
};

type Category = {
  id: string;
  name: string;
  totalVotes: number;
  candidates: Candidate[];
};

type Event = {
  id: string;
  title: string;
  eventCode: string;
  status: string;
  totalVotes: number;
  totalRevenue: number;
  categories: Category[];
};

interface DashboardProps {
  events: Event[];
}

export default function ResultsDashboardClient({ events }: DashboardProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events.length > 0 ? events[0].id : "",
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  if (!selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <BarChart3 className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">No Voting Events</h2>
        <p className="text-gray-500">
          You haven't created any voting events yet.
        </p>
      </div>
    );
  }

  // Find Top Candidate
  const allCandidates = selectedEvent.categories.flatMap((c) => c.candidates);
  const topCandidate = allCandidates.reduce(
    (max, c) => (c.voteCount > max.voteCount ? c : max),
    allCandidates[0],
  );

  return (
    <div className="space-y-8">
      {/* Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vote Results</h1>
          <p className="text-slate-500">
            Real-time election outcomes and analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Event Selector */}
          <div className="relative">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="appearance-none bg-white border border-gray-200 text-slate-700 font-bold py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer shadow-sm"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-sm">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                <Users size={20} />
              </div>
              <span className="text-sm font-bold text-slate-500">
                Total Votes
              </span>
            </div>
            <p className="text-4xl font-display font-bold text-slate-900">
              {(selectedEvent.totalVotes || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <span className="text-sm font-bold text-slate-500">
                Total Revenue
              </span>
            </div>
            <p className="text-4xl font-display font-bold text-slate-900">
              GHS {(selectedEvent.totalRevenue || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                <Award size={20} />
              </div>
              <span className="text-sm font-bold text-slate-500">
                Leading Candidate
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900 truncate">
              {topCandidate?.name || "N/A"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              With {(topCandidate?.voteCount || 0).toLocaleString()} votes
            </p>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="space-y-6">
        {selectedEvent.categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {category.name}
              </h3>
              <span className="text-xs font-bold px-3 py-1 bg-white border border-gray-200 rounded-full text-slate-600">
                {(category.totalVotes || 0).toLocaleString()} Votes
              </span>
            </div>

            <div className="p-6 space-y-4">
              {category.candidates.map((candidate) => {
                const percentage =
                  category.totalVotes > 0
                    ? (candidate.voteCount / category.totalVotes) * 100
                    : 0;

                return (
                  <div key={candidate.id} className="relative">
                    <div className="flex justify-between items-end mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 text-sm">
                          {candidate.name}
                        </span>
                        <span className="text-xs text-slate-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {candidate.code}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 text-sm">
                          {(candidate.voteCount || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                        style={{ width: `${percentage}%` }}
                      >
                        {/* Shine effect */}
                        <div className="absolute top-0 left-0 w-full h-full bg-white/20"></div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {category.candidates.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">
                  No candidates in this category.
                </p>
              )}
            </div>
          </div>
        ))}

        {selectedEvent.categories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No categories found for this event.
          </div>
        )}
      </div>
    </div>
  );
}
