import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import OrganizersTable from "./OrganizersTable";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOrganizersPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);
  const response = await apiClient.get("/users").catch(() => ({ data: [] }));
  const rawUsers = response.data || (Array.isArray(response) ? response : []);

  const organizers = rawUsers
    .filter((u: any) => u.role === "ORGANIZER")
    .map((user: any) => ({
      id: user._id,
      name: user.businessName || user.fullName,
      email: user.email,
      phone: user.phone || "N/A",
      avatar: "",
      verificationStatus: user.status === "ACTIVE" ? "VERIFIED" : user.status,
      userStatus: user.status,
      eventsCount: 0,
      totalRevenue: 0,
      balance: 0,
      joinedAt: new Date(user.createdAt || Date.now()),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Organizer Management
        </h1>
        <p className="text-slate-500">
          View and manage registered organizers on the platform.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            All Organizers
          </h3>
          <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {organizers.length} Total
          </span>
        </div>
        <OrganizersTable organizers={organizers} />
      </div>
    </div>
  );
}
