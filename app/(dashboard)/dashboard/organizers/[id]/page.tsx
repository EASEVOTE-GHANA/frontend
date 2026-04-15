import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  DollarSign,
  Calendar,
  Wallet,
  ArrowLeft,
} from "lucide-react";
import OrganizerActions from "../OrganizerActions";
import EventsTable from "../../events/EventsTable";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrganizerDetailsPage(props: Props) {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);

  const params = await props.params;
  const _rawUser = await apiClient.get(`/users/${params.id}`).catch(() => null);

  if (!_rawUser) {
    notFound();
  }

  // Map the raw user back to the structure expected by the page
  const organizer = {
    id: _rawUser._id || _rawUser.id,
    businessName: _rawUser.businessName || _rawUser.fullName,
    verified: _rawUser.status === "ACTIVE",
    logo: "",
    businessEmail: _rawUser.email,
    businessPhone: _rawUser.phone,
    totalRevenue: 0,
    balance: 0,
    address: "",
    city: "",
    region: "",
    website: "",
    bankAccountName: "",
    bankName: "",
    bankAccountNumber: "",
    events: [],
    payouts: [],
    user: {
      id: _rawUser._id || _rawUser.id,
      name: _rawUser.fullName,
      email: _rawUser.email,
      status: _rawUser.status,
      createdAt: _rawUser.createdAt || new Date(),
    },
  };

  if (!organizer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/organizers"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Go Back
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-slate-100 rounded-xl flex items-center justify-center text-xl font-bold text-slate-500 overflow-hidden">
            {organizer.logo?.startsWith("http") ? (
              <img
                src={organizer.logo}
                alt={organizer.businessName}
                className="h-full w-full object-cover"
              />
            ) : (
              organizer.businessName.substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {organizer.businessName}
              {organizer.verified && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                  VERIFIED
                </span>
              )}
            </h1>
            <div className="text-slate-500 flex flex-wrap gap-x-4 gap-y-1 text-sm mt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />{" "}
                {organizer.businessEmail || organizer.user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Joined{" "}
                {new Date(organizer.user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <OrganizerActions
          organizer={{
            id: organizer.id,
            verified: organizer.verified,
            user: {
              id: organizer.user.id,
              status: organizer.user.status,
            },
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Info */}
        <div className="space-y-6">
          {/* Financial Stats */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">
              Financial Overview
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">
                    Total Revenue
                  </span>
                </div>
                <span className="font-bold text-slate-900">
                  {new Intl.NumberFormat("en-GH", {
                    style: "currency",
                    currency: "GHS",
                  }).format(organizer.totalRevenue || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">
                    Wallet Balance
                  </span>
                </div>
                <span className="font-bold text-slate-900">
                  {new Intl.NumberFormat("en-GH", {
                    style: "currency",
                    currency: "GHS",
                  }).format(organizer.balance || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">
              Profile Details
            </div>
            <div className="p-4 space-y-4 text-sm">
              {organizer.user.name && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">
                      Contact Person
                    </div>
                    <div className="text-slate-500">{organizer.user.name}</div>
                  </div>
                </div>
              )}
              {organizer.businessPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">Phone</div>
                    <div className="text-slate-500">
                      {organizer.businessPhone}
                    </div>
                  </div>
                </div>
              )}
              {(organizer.address || organizer.city || organizer.region) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">Address</div>
                    <div className="text-slate-500">
                      {[organizer.address, organizer.city, organizer.region]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                </div>
              )}
              {organizer.website && (
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">Website</div>
                    <a
                      href={organizer.website}
                      target="_blank"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {organizer.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 font-semibold text-slate-900">
              Bank Details
            </div>
            <div className="p-4 space-y-4 text-sm">
              {organizer.bankAccountName ? (
                <>
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-900">
                        {organizer.bankName || "Bank Name Not Set"}
                      </div>
                      <div className="text-slate-500">
                        {organizer.bankAccountNumber}
                      </div>
                      <div className="text-xs text-slate-400 uppercase mt-0.5">
                        {organizer.bankAccountName}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-slate-500 italic">
                  No bank details added yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Events & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Events History</h3>
            </div>
            {/* Reusing EventsTable but we need to adapt it or strip it. 
                    The `events` from `getOrganizerDetails` are compatible with `EventsTable` props roughly, 
                    but `EventsTable` expects slightly formatted data (dates as strings). 
                    Let's quick format them. 
                */}
            <EventsTable
              events={organizer.events.map((e: any) => ({
                ...e,
                startDate: e.startDate.toISOString(),
                endDate: e.endDate.toISOString(),
                votePrice: e.votePrice ? Number(e.votePrice) : null,
                totalRevenue: Number(e.totalRevenue),
                totalVotes: Number(e.totalVotes),
                stats: {
                  votes: e.totalVotes,
                  revenue: Number(e.totalRevenue),
                },
                organizer: {
                  name: organizer.businessName,
                  avatar: organizer.logo || "",
                },
              }))}
            />
          </div>

          {/* Payouts History (Simplified List) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Recent Payouts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {organizer.payouts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        No payouts found.
                      </td>
                    </tr>
                  ) : (
                    organizer.payouts.map((payout: any) => (
                      <tr key={payout.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-medium text-slate-900">
                          {new Intl.NumberFormat("en-GH", {
                            style: "currency",
                            currency: "GHS",
                          }).format(Number(payout.amount))}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payout.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : payout.status === "PENDING"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-500">
                          {payout.createdAt.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-slate-400 font-mono text-xs">
                          {payout.reference || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
