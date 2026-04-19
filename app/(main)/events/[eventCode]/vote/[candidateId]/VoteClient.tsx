"use client";

import { useState, useEffect } from "react";
import { Event as EventData, Candidate } from "@/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Check, Copy, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-client";
import Image from "next/image";
import toast from "react-hot-toast";

interface VoteClientProps {
  event: EventData;
  candidate: Candidate;
}

export default function VoteClient({ event, candidate }: VoteClientProps) {
  const router = useRouter();

  // Form States
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [voteCount, setVoteCount] = useState("1");
  const [isCopied, setIsCopied] = useState(false);
  const [validationError, setValidationError] = useState("");
  
  // Payment States
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Derived Data
  const minimalVotePrice = event.costPerVote || 1.0;
  const currentVoteCount = parseInt(voteCount) || 0;
  const totalAmount = (currentVoteCount * minimalVotePrice).toFixed(2);



  const handlePayment = async () => {
    const minVotes = event.minVotesPerPurchase || 1;
    const maxVotes = event.maxVotesPerPurchase || Infinity;
    const currentCount = parseInt(voteCount) || 0;
    
    if (currentCount < minVotes) {
      setValidationError(`Minimum of ${minVotes} votes required.`);
      return;
    }
    if (currentCount > maxVotes) {
      setValidationError(`Maximum of ${maxVotes} votes allowed per transaction.`);
      return;
    }
    setValidationError("");

    setIsLoading(true);
    setInitError(null);
    try {
      // Guide: POST /api/purchases/votes/initialize
      const eventId = event.id || (event as any)._id;
      const candidateId = candidate.id || (candidate as any)._id;
      const categoryId = (candidate as any).categoryId;

      const payload = {
        eventId: eventId,
        candidateId: candidateId,
        categoryId: categoryId,
        voteCount: parseInt(voteCount) || 0,
        customerName: fullName || undefined,
        customerEmail: email || undefined,
        customerPhone: phoneNumber || undefined,
      };

      console.log("[VoteClient] Initializing unified vote purchase:", payload);

      const res = await api.post("/purchases/votes/initialize", payload);
      
      const result = res.data || res;
      // Guide suggests 'authorizationUrl', maintaining 'paymentUrl' as fallback
      const paymentUrl = result.authorizationUrl || result.paymentUrl;
      const reference = result.paymentReference || result.reference || result.transactionRef;

      if (paymentUrl) {
        // Redirect in-place as per plan
        window.location.href = paymentUrl;
      } else if (reference) {
        router.push(`/vote/confirm/${reference}`);
      } else {
        console.error("[VoteClient] No redirect information found in response:", res);
        toast.error("Initialization successful, but no payment link was found.");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      // Extra resilience: Parse error message safely
      let msg = error.message || "An unexpected error occurred.";
      if (msg.includes("HTTP 500")) {
        msg = "Payment server is currently unavailable. Please try again shortly.";
      }
      setInitError(msg);
      toast.error(msg);
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Vote for ${candidate.name}`,
      text: `Support ${candidate.name} in ${event.title}!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setIsCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error("Sharing failed. Link copied as fallback!");
        await navigator.clipboard.writeText(shareData.url);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row">
        {/* LEFT COLUMN: Image */}
        <div className="md:w-1/2 h-96 md:h-auto relative bg-gray-100 overflow-hidden">
          {(() => {
            const url = candidate.image;
            const isValid = url && typeof url === 'string' && !url.includes('example/image/upload') && !url.includes('null') && !url.includes('undefined');
            
            return isValid ? (
              <Image
                src={url}
                alt={candidate.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full min-h-[24rem] bg-primary-900 flex items-center justify-center">
                <span className="text-[8rem] font-black text-white! uppercase select-none leading-none">
                  {candidate.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </span>
              </div>
            );
          })()}
        </div>

        {/* RIGHT COLUMN: Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
            <>
              <Link
                href={`/events/${(event as any).eventCode}`}
            className="absolute top-6 left-8 md:left-12 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft size={18} /> Back
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="absolute top-6 right-8 md:right-12 flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors bg-primary-50 px-3 py-1.5 rounded-full"
          >
            {isCopied ? (
              <>
                <Check size={16} /> Copied!
              </>
            ) : (
              <>
                <Share2 size={16} /> Share
              </>
            )}
          </button>

          <div className="text-center md:text-left mb-8 mt-6">
            <h1 className="text-2xl font-bold text-primary-900 mb-2">
              Vote for {candidate.name}{" "}
              <span className="text-primary-700">({candidate.code})</span>
            </h1>
            <p className="text-gray-500 text-sm mb-4">
              Support {candidate.name} by submitting your vote. You can also
              vote via USSD by dialing{" "}
              <span className="font-bold text-gray-700">*920*195#</span>
            </p>
          </div>

          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-700 bg-gray-50/50"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voter@example.com"
                className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-700 bg-gray-50/50"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="024 XXX XXXX"
                className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-700 bg-gray-50/50"
              />
            </div>

            {/* Votes */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Number of Votes (GHS {minimalVotePrice.toFixed(2)})
              </label>
              <input
                type="number"
                min="1"
                value={voteCount}
                onChange={(e) => {
                  let val = e.target.value;
                  // Strip leading zeros for numeric fields (but allow 0.5 etc, though votes are integers)
                  if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                    val = val.replace(/^0+/, "");
                  }
                  setVoteCount(val);
                }}
                className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-gray-700 bg-gray-50/50"
              />
            </div>

            {/* Total Price Display */}
            <div className="bg-primary-50/50 rounded-2xl p-4 border border-primary-100 flex items-center justify-between">
              <div className="text-xs font-bold text-primary-700 uppercase tracking-wider">Total Summary</div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">GHS {minimalVotePrice.toFixed(2)} × {currentVoteCount}</span>
                <span className="text-lg font-display font-bold text-primary-900">
                  GHS {totalAmount}
                </span>
              </div>
            </div>

            {validationError && (
              <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-2 rounded-lg border border-red-100 animate-in fade-in zoom-in-95">
                {validationError}
              </p>
            )}

            {initError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-in border-l-4 border-l-red-500">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 p-2 rounded-xl text-red-600">
                    <AlertCircle size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-900 leading-tight">Payment initialization failed</p>
                    <p className="text-xs text-red-700 mt-1 font-medium">{initError}</p>
                    <button 
                      onClick={() => { setInitError(null); handlePayment(); }}
                      className="mt-3 text-xs font-bold text-red-800 hover:text-red-900 flex items-center gap-1.5 bg-red-100 px-3 py-1.5 rounded-full transition-colors"
                    >
                      <RefreshCw size={12} /> Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handlePayment}
              disabled={currentVoteCount < 1 || isLoading}
              className="w-full bg-primary-900 text-white font-bold py-4 rounded-3xl shadow-lg hover:bg-primary-800 transition-all hover:-translate-y-0.5 active:translate-y-0 mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Initializing payment...
                </>
              ) : (
                `Confirm Vote & Pay GHS ${totalAmount}`
              )}
            </button>
          </div>
          </>
        </div>
      </div>
    </div>
  );
}
