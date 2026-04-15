import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import AdminAccountClient from "./AdminAccountClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account Settings | Admin Portal",
  description: "Manage your admin account settings",
};

export default async function AdminAccountPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);

  const userId = session?.user?.id;
  const rawRes = await apiClient.get(`/users/${userId}`).catch(() => null);
  const rawUser = rawRes?.data || rawRes;

    const user = rawUser
    ? {
        id: rawUser._id || rawUser.id || userId,
        name: rawUser.fullName || rawUser.businessName || "Admin",
        email: rawUser.email,
        phone: rawUser.phone || null,
        avatar: rawUser.avatar || null,
        role: rawUser.role || "ADMIN",
      }
    : null;

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <AdminAccountClient user={user} />
    </div>
  );
}
