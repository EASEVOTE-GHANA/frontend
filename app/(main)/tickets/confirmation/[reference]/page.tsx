import { createServerApiClient } from "@/lib/api-client";
import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Ticket Confirmed! | EaseVote Ghana",
  description: "Your ticket has been confirmed. Save or print your QR code for entry.",
  robots: { index: false, follow: false },
};
import {
  CheckCircle,
  Calendar,
  MapPin,
  Ticket as TicketIcon,
} from "lucide-react";
import Link from "next/link";
import PrintButton from "./PrintButton";

export default async function TicketConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  // Public page — no auth token needed
  const apiClient = createServerApiClient();

  // GET /tickets/confirmation/:reference returns transaction with event and tickets
  const transaction = await apiClient.get(`/tickets/confirmation/${reference}`).catch(() => null);

  if (!transaction) {
    return notFound();
  }

  // Handle PENDING State
  if (transaction.status === "PENDING") {
    return (
      <div className="min-h-screen bg-slate-900 pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Calendar size={40} className="text-yellow-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Processing Payment...
          </h1>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            We are confirming your payment. This usually takes a few seconds.
            Please refresh the page if it doesn't update automatically.
          </p>
          <div className="p-4 bg-slate-800 rounded-xl inline-block text-left mb-8">
            <p className="text-sm text-slate-400">Transaction Ref</p>
            <p className="font-mono text-white text-lg">{reference}</p>
          </div>
          <div>
            <Link
              href={`/tickets/confirmation/${reference}`} // Simple refresh link
              className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Check Status Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle FAILED State
  if (transaction.status === "FAILED") {
    return (
      <div className="min-h-screen bg-slate-900 pt-24 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-red-500 rotate-45" />{" "}
            {/* X Icon via rotated check */}
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Payment Failed
          </h1>
          <p className="text-slate-400 mb-8">
            Unfortunately, we could not process your payment.
          </p>
          <Link
            href="/events/ticketing"
            className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  const { event, tickets } = transaction;

  return (
    <div className="min-h-screen bg-slate-900 pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
          <CheckCircle size={40} className="text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
          Your tickets are ready!
        </h1>
        <p className="text-slate-400 mb-10">
          Transaction Reference:{" "}
          <span className="text-white font-mono">{reference}</span>
        </p>

        {/* Tickets Grid */}
        <div className="space-y-8">
          {tickets.map((ticket: any, index: number) => (
            <div
              key={ticket.id}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 transition-all"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex flex-col md:flex-row">
                {/* Left Side: Ticket Info */}
                <div className="flex-1 p-8 text-left border-b md:border-b-0 md:border-r border-dashed border-gray-200">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {ticket.ticketType?.name || ticket.ticketTypeName}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">
                      #{ticket.ticketCode.split("-")[1]}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    {event.title}
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Calendar size={18} className="text-primary-600" />
                      <span className="text-sm">
                        {new Date(event.startDate).toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin size={18} className="text-primary-600" />
                      <span className="text-sm">
                        {event.venue || event.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <TicketIcon size={18} className="text-primary-600" />
                      <span className="text-sm font-medium">
                        {ticket.holderName || "Guest"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: QR Code */}
                <div className="bg-gray-50 p-8 flex flex-col items-center justify-center min-w-[200px]">
                  <div className="bg-white p-3 rounded-2xl shadow-sm mb-4">
                    <Image
                      width={128}
                      height={128}
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        JSON.stringify({ t: ticket.ticketCode, e: event.id })
                      )}`}
                      alt="Ticket QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Scan to Check-in
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/events/ticketing"
            className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all"
          >
            Back to Events
          </Link>
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
