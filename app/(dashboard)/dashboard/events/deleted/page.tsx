import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import { Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import RestoreButton from "./RestoreButton";

export const dynamic = "force-dynamic";

export default async function DeletedEventsPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);

  const result = await apiClient
    .get("/events/admin/deleted")
    .catch(() => ({ data: [] }));

  // Handle both { data: [...] } wrapped responses and direct array responses
  const deletedEvents = result.data || result.events || (Array.isArray(result) ? result : []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/events"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Active Events
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Trash2 className="h-7 w-7 text-red-500" />
            Deleted Events (Trash)
          </h1>
          <p className="text-slate-500">
            View and restore soft-deleted events.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {deletedEvents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500">Trash is empty. No deleted events found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900">Event Title</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900">Type</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900">Deleted Date</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deletedEvents.map((event: any) => (
                  <tr key={event._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{event.title}</div>
                      <div className="text-xs text-slate-500 font-mono">{event.eventCode || event._id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-600">
                        {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(event.deletedAt || event.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <RestoreButton eventId={event._id || event.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
