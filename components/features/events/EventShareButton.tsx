"use client";

import React from "react";
import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

interface EventShareButtonProps {
  eventTitle: string;
  className?: string;
  shareUrl?: string;
}

export const EventShareButton = ({ eventTitle, className, shareUrl }: EventShareButtonProps) => {
  const handleShare = async () => {
    const finalUrl = shareUrl || window.location.href;
    const shareData = {
      title: eventTitle,
      text: `Join me at ${eventTitle} on EaseVote!`,
      url: finalUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(finalUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Sharing failed. Link copied as fallback!");
        await navigator.clipboard.writeText(finalUrl);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={className || "flex items-center gap-2 text-sm font-bold bg-white text-slate-900 px-6 py-3 rounded-full hover:bg-primary-700 hover:text-white transition-colors"}
    >
      <Share2 size={16} /> Share Event
    </button>
  );
};
