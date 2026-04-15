"use client";

import { useTransition } from "react";
import { api } from "@/lib/api-client";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminActionProps {
  id: string;
  status: string;
  name: string;
}

export default function AdminActions({ admin }: { admin: AdminActionProps }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRemove = () => {
    if (
      confirm(
        `Are you sure you want to PERMANENTLY remove admin "${admin.name}"? This cannot be undone.`,
      )
    ) {
      startTransition(async () => {
        const result = await api.delete(`/users/${admin.id}`);
        if (result.success) {
          router.push("/dashboard/admins");
        } else {
          alert(result.message);
        }
      });
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleRemove}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" />
        Remove
      </button>
    </div>
  );
}
