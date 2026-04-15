import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import FormBuilder from "./FormBuilder";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NominationSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken as string | undefined);
  
  // Fetch both the form configuration and the main event object
  const [form, event] = await Promise.all([
    apiClient.get(`/nominations/events/${id}/form`).catch(() => null),
    apiClient.get(`/events/${id}`).catch(() => null)
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6">
      <div>
        <Link
          href={`/dashboard/events/${id}/edit`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Event Settings
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Nomination Settings
          </h1>
          <p className="text-gray-500">
            Configure how candidates apply for this event.
          </p>
        </div>
      </div>

      <FormBuilder eventId={id} initialForm={form} event={event} />
    </div>
  );
}
