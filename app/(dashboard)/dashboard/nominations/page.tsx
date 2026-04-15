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

  // Fetch all nominations for events owned by this organizer
  // GET /dashboard/nominations returns nominations with category and event info
  const nominations = await apiClient.get("/nominations").catch(() => []);

  const nominationList = Array.isArray(nominations) ? nominations : [];

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
      categoryName: n.category?.name || n.categoryName || "Unknown",
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
    />
  );
}
