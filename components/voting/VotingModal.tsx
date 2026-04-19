"use client";

import React, { useState } from "react";
import { X, Minus, Plus, CreditCard, CheckCircle } from "lucide-react";
import { Event, Candidate } from "@/types";

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  candidate: Candidate;
}

export const VotingModal: React.FC<VotingModalProps> = ({
  isOpen,
  onClose,
  event,
  candidate,
}) => {
  const [voteCount, setVoteCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const pricePerVote = event.votePrice ?? 1;
  const totalAmount = voteCount * pricePerVote;

  const handleVote = async () => {
    setIsProcessing(true);

    // ⏳ Simulate payment + vote submission
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
  };

  const resetAndClose = () => {
    setVoteCount(1);
    setIsProcessing(false);
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-display font-bold text-slate-900">
            Cast Your Vote
          </h2>
          <button
            onClick={resetAndClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="p-6 space-y-6">
          {!isSuccess ? (
            <>
              {/* Candidate Info */}
              <div className="flex items-center gap-4">
                <img
                  src={candidate.image}
                  alt={candidate.name}
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <div>
                  <p className="text-xs font-bold text-magenta-600 uppercase tracking-wide">
                    {candidate.category}
                  </p>
                  <h3 className="text-lg font-bold text-slate-900">
                    {candidate.name}
                  </h3>
                </div>
              </div>

              {/* Vote Counter */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <span className="font-medium text-slate-600">
                  Number of Votes
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVoteCount((v) => Math.max(1, v - 1))}
                    className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-lg w-6 text-center">
                    {voteCount}
                  </span>
                  <button
                    onClick={() => setVoteCount((v) => v + 1)}
                    className="w-8 h-8 rounded-full bg-white border flex items-center justify-center hover:bg-gray-100"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Price per vote</span>
                  <span className="font-bold">
                    GHS {pricePerVote.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-magenta-600">
                    GHS {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleVote}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-slate-900 text-white! font-bold hover:bg-magenta-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? (
                  "Processing..."
                ) : (
                  <>
                    <CreditCard size={18} />
                    Confirm & Pay
                  </>
                )}
              </button>
            </>
          ) : (
            /* ================= SUCCESS STATE ================= */
            <div className="text-center py-10">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
                Vote Successful 🎉
              </h3>
              <p className="text-slate-500 mb-6">
                You’ve successfully voted for{" "}
                <span className="font-bold">{candidate.name}</span>
              </p>

              <button
                onClick={resetAndClose}
                className="w-full py-3 rounded-xl bg-magenta-600 text-white! font-bold hover:bg-magenta-700 transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
