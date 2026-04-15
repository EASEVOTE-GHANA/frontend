import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import { notFound } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
} from "lucide-react";
import AdminActions from "../AdminActions";
import Link from "next/link"; // For breadcrumb if needed

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminDetailsPage(props: Props) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(
    session?.accessToken as string | undefined,
  );
  const rawData = await apiClient.get(`/users/${params.id}`).catch(() => null);
  const rawAdmin = rawData?.data || rawData;
  const admin = rawAdmin
    ? {
        ...rawAdmin,
        id: rawAdmin._id,
        name: rawAdmin.fullName || rawAdmin.businessName || "Unknown Admin",
      }
    : null;

  if (!admin) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          href="/dashboard/admins"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Admins
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-sm overflow-hidden">
            {admin.avatar?.startsWith("http") ? (
              <img
                src={admin.avatar}
                alt={admin.name || "Admin"}
                className="h-full w-full object-cover"
              />
            ) : (
              (admin.name || "A").substring(0, 1).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {admin.name}
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                <Shield className="w-3 h-3" />
                PLATFORM ADMIN
              </span>
            </h1>
            <div className="text-slate-500 flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {admin.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Joined{" "}
                {new Date(admin.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <AdminActions
          admin={{
            id: admin.id,
            status: admin.status,
            name: admin.name || "Admin",
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">
              Account Details
            </div>
            <div className="p-4 space-y-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-slate-500">Status</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    admin.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {admin.status}
                </span>
              </div>

              {admin.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">Phone</div>
                    <div className="text-slate-500">{admin.phone}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">Last Login</div>
                  <div className="text-slate-500">
                    {admin.lastLoginAt
                      ? new Date(admin.lastLoginAt).toLocaleString()
                      : "Never logged in"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-slate-900">
                    Email Verified
                  </div>
                  <div className="text-slate-500">
                    {admin.emailVerified ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Placeholder for future Activity Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Placeholder for future phases */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 border-dashed p-8 text-center">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900">
              Activity Logs
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-1">
              Detailed audit logs of actions performed by this admin will appear
              here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
