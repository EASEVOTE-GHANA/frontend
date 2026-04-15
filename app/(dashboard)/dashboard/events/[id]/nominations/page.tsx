import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import NominationsTable from "./NominationsTable";
import Link from "next/link";
import { Settings } from "lucide-react";
import { PaginationControls } from "@/components/ui/PaginationControls";

export default async function NominationsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = searchParams.page
    ? parseInt(searchParams.page as string, 10)
    : 1;
  const limit = 20;

  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(
    session?.accessToken as string | undefined,
  );

  let nominations = [];
  let totalPages = 1;

  try {
    const result = await apiClient.get(
      `/nominations/events/${params.id}?page=${page}&limit=${limit}`,
    );
    nominations = result.data || result.nominations || result || [];
    totalPages =
      result.pagination?.pages ||
      Math.ceil((result.total || nominations.length) / limit) ||
      1;
  } catch (err) {
    nominations = [];
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Nominations
          </h1>
          <p className="text-gray-500">
            Manage and review candidate applications.
          </p>
        </div>
        <Link
          href={`/dashboard/events/${params.id}/nominations/settings`}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-bold border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Settings size={18} /> Settings & Form
        </Link>
      </div>

      <NominationsTable nominations={nominations} eventId={params.id} />

      <div className="mt-4">
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          basePath={`/dashboard/events/${params.id}/nominations`}
        />
      </div>
    </div>
  );
}
