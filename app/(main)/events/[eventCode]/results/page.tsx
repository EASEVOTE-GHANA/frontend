import { createServerApiClient } from "@/lib/api-client";
import { notFound } from "next/navigation";
import Image from "next/image";
import { BarChart, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ eventCode: string }>;
}) {
  const { eventCode } = await params;

  // Public page — no auth token needed
  const apiClient = createServerApiClient();

  // GET /votes/results/:eventCode returns live voting results
  const data = await apiClient.get(`/votes/results/${eventCode}`).catch(() => null);

  if (!data) return notFound();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Hero section for Results */}
      <div className="bg-[#091D34] text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-0"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Link 
            href={`/events/${eventCode}`}
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Event
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{data.title}</h1>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  LIVE RESULTS
                </span>
                <span className="text-slate-400 text-sm italic">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <Trophy className="text-yellow-400" size={32} />
                <div>
                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Impact</div>
                    <div className="text-xl font-bold">Official Count</div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10 pb-8 space-y-8">
        {data.showVoteCount === false && (
          <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-2xl text-center font-medium shadow-sm">
            Vote counts are currently hidden by the organizer. Only rankings are shown.
          </div>
        )}

        {data.results.map((category: any) => (
          <div
            key={category.id}
            className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
          >
            <div className="bg-slate-50 px-8 py-5 border-b flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                 <BarChart className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-bold text-xl text-slate-800">{category.name}</h2>
            </div>

            <div className="divide-y divide-slate-50">
              {category.candidates.map((candidate: any, index: number) => {
                const totalVotesInCategory = category.candidates.reduce(
                  (acc: number, c: any) => acc + (Number(c.votes) || 0),
                  0
                );
                const percentage =
                    totalVotesInCategory > 0
                    ? ((Number(candidate.votes) || 0) / totalVotesInCategory) * 100
                    : 0;

                const isWinner = index === 0 && totalVotesInCategory > 0;

                return (
                  <div
                    key={candidate.id}
                    className="p-6 sm:p-8 hover:bg-slate-50/50 transition-all flex items-center gap-6 group"
                  >
                    <div className={`flex-shrink-0 font-black text-2xl w-10 text-center ${
                      index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-400" : index === 2 ? "text-amber-700" : "text-slate-300"
                    }`}>
                      {index + 1}
                    </div>

                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border-2 border-white shadow-md transition-transform group-hover:scale-105">
                      {candidate.image ? (
                        <Image
                          src={candidate.image}
                          alt={candidate.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                          <span className="text-sm font-bold text-slate-400">{candidate.code}</span>
                        </div>
                      )}
                      {isWinner && (
                        <div className="absolute top-0 right-0 bg-yellow-400 p-1 rounded-bl-lg shadow-sm">
                           <Trophy size={12} className="text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-lg sm:text-xl text-slate-900 truncate">
                            {candidate.name}
                          </h3>
                        </div>
                        {data.showVoteCount !== false && (
                          <div className="text-right">
                            <span className="block font-black text-xl text-slate-900">
                              {(Number(candidate.votes) || 0).toLocaleString()}
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar Container */}
                      <div className="relative pt-1">
                        <div className="flex items-center justify-between mb-1">
                             <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                                    isWinner ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-slate-300"
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                             </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
