"use client";

import React from "react";
import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

interface BlogShareButtonProps {
  blogTitle: string;
  className?: string;
}

export const BlogShareButton = ({ blogTitle, className }: BlogShareButtonProps) => {
  const handleShare = async () => {
    const shareData = {
      title: blogTitle,
      text: `Read "${blogTitle}" on EaseVote Newsroom!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={className || "w-12 h-12 rounded-2xl bg-primary-700 text-white hover:bg-primary-800 transition-all flex items-center justify-center shadow-lg shadow-primary-700/20"}
      title="Share Article"
    >
      <Share2 size={20} />
    </button>
  );
};
