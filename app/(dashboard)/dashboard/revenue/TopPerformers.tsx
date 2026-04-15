import { Trophy, Building2, Calendar } from "lucide-react";

type TopEvent = {
  id: string;
  title: string;
  totalRevenue: number;
  type: string;
};

type TopOrganizer = {
  id: string;
  name: string;
  totalRevenue: number;
};

export default function TopPerformers({
  events,
  organizers,
}: {
  events: TopEvent[];
  organizers: TopOrganizer[];
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Top Events */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Top Grossing Events
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {events.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No events found
            </div>
          ) : (
            events.map((event, index) => (
              <div
                key={event.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${
                      index === 0
                        ? "bg-amber-100 text-amber-600"
                        : index === 1
                        ? "bg-slate-100 text-slate-600"
                        : index === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div
                      className="font-medium text-slate-900 line-clamp-1"
                      title={event.title}
                    >
                      {event.title}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {event.type}
                    </span>
                  </div>
                </div>
                <div className="font-bold text-slate-900">
                  {formatCurrency(event.totalRevenue)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Organizers */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Top Organizers
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {organizers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No organizers found
            </div>
          ) : (
            organizers.map((org, index) => (
              <div
                key={org.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${
                      index === 0
                        ? "bg-amber-100 text-amber-600"
                        : index === 1
                        ? "bg-slate-100 text-slate-600"
                        : index === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="font-medium text-slate-900">{org.name}</div>
                </div>
                <div className="font-bold text-slate-900">
                  {formatCurrency(org.totalRevenue)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
