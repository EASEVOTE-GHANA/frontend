import { redirect } from "next/navigation";
import { Metadata } from "next";
import TicketConfirmClient from "./TicketConfirmClient";
import { createServerApiClient } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Confirming Your Ticket | EaseVote Ghana",
  description: "Your ticket payment is being confirmed. Please wait.",
  robots: { index: false, follow: false },
};

export default async function TicketConfirmPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  if (!reference) {
    redirect("/");
  }

  const apiClient = createServerApiClient();

  try {
    const res = await apiClient.get<any>(`/purchases/verify/${reference}`).catch(() => null);
    const transaction = res?.data || res?.purchase || res;

    // Auto-Correction: If this was actually a vote, redirect to the vote confirmation
    if (transaction && transaction.type === "VOTE") {
      const redirectUrl = `/vote/confirm/${reference}`;
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin text-indigo-600 mb-4 mx-auto" size={32} />
            <p className="text-slate-500 font-medium">Redirecting to vote confirmation...</p>
            <meta httpEquiv="refresh" content={`0;url=${redirectUrl}`} />
          </div>
        </div>
      );
    }

    return (
      <TicketConfirmClient
        reference={reference}
        initialStatus={ (transaction?.status === "PAID" || transaction?.status === "SUCCESS") ? "SUCCESS" : (transaction?.status || "PENDING") }
        initialData={transaction}
      />
    );
  } catch {
    // Backend not ready yet — default to pending state
    return (
      <TicketConfirmClient reference={reference} initialStatus="PENDING" />
    );
  }
}
