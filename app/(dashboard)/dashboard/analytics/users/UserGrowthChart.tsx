"use client";

import { ChartCard } from "@/components/dashboard/ChartCard";

export default function UserGrowthChart({ data }: { data: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ChartCard
          title="User Growth (Last 30 Days)"
          type="line"
          data={data}
          dataKey="users"
          xAxisKey="date"
          height={350}
          colors={["#3b82f6"]}
        />
      </div>
      <div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 h-full flex flex-col justify-center items-center text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Growth Insight
          </h3>
          <p className="text-slate-500 text-sm">
            New signups are tracking with a positive trend over the last 30
            days.
          </p>
        </div>
      </div>
    </div>
  );
}
