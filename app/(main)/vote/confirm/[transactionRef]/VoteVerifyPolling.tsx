"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

interface VoteVerifyPollingProps {
  transactionRef: string;
  initialStatus: string;
  eventCode: string;
}

export default function VoteVerifyPolling({
  transactionRef,
}: VoteVerifyPollingProps) {
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get(`/purchases/verify/${transactionRef}`);
        const transaction = res.data || res.purchase || res;
        const status = (transaction.status || "").toUpperCase();

        if (status === "PAID" || status === "SUCCESS" || status === "COMPLETED" || status === "FAILED") {
          router.refresh();
        }
      } catch {
        // Poll error — will retry on next interval
      }
    };

    checkStatus();
  }, [transactionRef, router]);

  // Component is now invisible as requested
  return null;
}
