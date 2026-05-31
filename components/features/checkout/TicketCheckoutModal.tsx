import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/providers/ModalProvider";
import { AppsnCheckoutModal } from "@/components/payment/AppsnCheckoutModal";
import { api } from "@/lib/api-client";

interface TicketCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  ticket: any;
}

export function TicketCheckoutModal({
  isOpen,
  onClose,
  event,
  ticket,
}: TicketCheckoutModalProps) {
  const router = useRouter();
  const modal = useModal();
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Appsn Modal States
  const [showAppsnCheckout, setShowAppsnCheckout] = useState(false);
  const [checkoutRef, setCheckoutRef] = useState("");

  if (!isOpen) return null;

  const totalAmount = quantity * ticket.price;

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        eventId: event.id,
        ticketTypeId: ticket.id,
        customerName: buyerName,
        customerEmail: buyerEmail,
        customerPhone: buyerPhone,
        quantity,
      };

      const res = await api.post("/purchases/tickets/initialize", payload);
      
      const result = res.data || res;

      if (result.success) {
        const { authorizationUrl, paymentUrl, reference, gateway, transactionRef } = result.data || result;
        const redirectUrl = authorizationUrl || paymentUrl;

        // APPSN simulated intercept
        if (
          (gateway === "APPSN" && redirectUrl && redirectUrl.includes("appsn")) ||
          (transactionRef && transactionRef.startsWith("TICKET-"))
        ) {
          setCheckoutRef(reference || transactionRef);
          setShowAppsnCheckout(true);
          return;
        }

        // External Gateway Redirect
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else if (reference || transactionRef) {
          router.push(`/tickets/confirm/${reference || transactionRef}`);
        }
      }
    } catch (error: any) {
      modal.alert({ title: "Purchase Error", message: error.message || "An unexpected error occurred while initiating the purchase.", variant: "danger" });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h3 className="text-xl font-bold text-slate-900">
              Purchase Ticket
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {/* Ticket Info */}
            <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-primary-900">
                  {ticket.name}
                </span>
                <span className="font-bold text-primary-700">
                  GHS {ticket.price}.00
                </span>
              </div>
              <p className="text-sm text-primary-600">Event: {event.title}</p>
            </div>

            {/* Form */}
            <form
              id="ticket-checkout-form"
              onSubmit={handlePurchase}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="e.g. 024 XXX XXXX"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center font-bold text-slate-600 hover:bg-gray-50 hover:border-gray-300"
                  >
                    -
                  </button>
                  <span className="text-lg font-bold w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        Math.min(
                          ticket.quantity - (ticket.soldCount || 0),
                          quantity + 1,
                        ),
                      )
                    }
                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center font-bold text-slate-600 hover:bg-gray-50 hover:border-gray-300"
                    disabled={
                      quantity >= ticket.quantity - (ticket.soldCount || 0)
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 sticky bottom-0 z-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-medium">Total Payment</span>
              <span className="text-2xl font-bold font-display text-slate-900">
                GHS {totalAmount.toFixed(2)}
              </span>
            </div>
            <button
              type="submit"
              form="ticket-checkout-form"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary-700 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </button>
          </div>
        </div>
      </div>

      {showAppsnCheckout && (
        <AppsnCheckoutModal
          reference={checkoutRef}
          onClose={() => {
            setShowAppsnCheckout(false);
            setIsSubmitting(false);
          }}
          onSuccess={(ref) => router.push(`/tickets/confirm/${ref}`)}
        />
      )}
    </>
  );
}
