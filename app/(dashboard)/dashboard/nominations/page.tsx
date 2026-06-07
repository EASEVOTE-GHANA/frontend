import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createServerApiClient } from "@/lib/api-client";
import NominationsDashboardClient from "./NominationsDashboardClient";

export default async function NominationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizerId) {
    redirect("/sign-in");
  }

  const apiClient = createServerApiClient(session?.accessToken as string | undefined);

  // Fetch data: Nominations and Events for filtering
  const [nominations, events] = await Promise.all([
    apiClient.get("/nominations").catch(() => []),
    apiClient.get(
      session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN"
        ? "/events/admin/all?limit=500"
        : "/events/my/events?limit=100"
    ).catch(() => []),
  ]);

  const nominationList = Array.isArray(nominations) ? nominations : [];
  const eventsList = (Array.isArray(events) ? events : events?.data || []).map((e: any) => ({
    id: e._id || e.id,
    title: e.title,
  }));

  // Calculate Stats
  const stats = {
    total: nominationList.length,
    pending: nominationList.filter((n: any) => n.status === "PENDING").length,
    approved: nominationList.filter((n: any) => n.status === "APPROVED").length,
    rejected: nominationList.filter((n: any) => n.status === "REJECTED").length,
  };

  // Serialize dates and build field label maps for client component
  const localizedNominations = nominationList.map((n: any) => {
    // Create a map of custom field keys to labels for this nomination's event
    const fieldMap: Record<string, string> = {};
    if (n.event?.nominationForm?.fields) {
      n.event.nominationForm.fields.forEach((f: any) => {
        fieldMap[f.key] = f.label;
      });
    }

    return {
      ...n,
      categoryName: n.categoryName || n.category?.name || "Unknown",
      reason: n.bio,
      createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : null,
      reviewedAt: n.reviewedAt ? new Date(n.reviewedAt).toISOString() : null,
      updatedAt: n.updatedAt ? new Date(n.updatedAt).toISOString() : null,
      fieldLabels: fieldMap,
    };
  });

  return (
    <NominationsDashboardClient
      initialNominations={localizedNominations}
      stats={stats}
      eventsList={eventsList}
    />
  );
}
