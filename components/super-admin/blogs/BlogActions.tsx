"use client";

import { Eye, Edit3, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useModal } from "@/components/providers/ModalProvider";

interface BlogActionsProps {
  blogId: string;
  slug: string;
  status: string;
}

export default function BlogActions({ blogId, slug, status }: BlogActionsProps) {
  const router = useRouter();
  const modal = useModal();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = await modal.confirm({
      title: "Delete Article",
      message: "Are you sure you want to delete this article? This action cannot be undone.",
      variant: "danger",
      confirmText: "Delete Article"
    });

    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.delete(`/blogs/admin/${blogId}`);
      toast.success("Article deleted successfully");
      router.refresh();
    } catch (err) {
      toast.error("Failed to delete article");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {status === "PUBLISHED" && (
        <Link href={`/blogs/${slug}`} target="_blank" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200" title="Live Preview">
            <Eye size={18} />
        </Link>
      )}
      <Link href={`/dashboard/cms/blogs/edit/${blogId}`} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-primary-100" title="Edit Article">
          <Edit3 size={18} />
      </Link>
      <button 
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 text-slate-400 hover:text-error-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-error-100 disabled:opacity-50"
          title="Delete Article"
      >
          {deleting ? <Loader2 size={18} className="animate-spin text-error-600" /> : <Trash2 size={18} />}
      </button>
    </div>
  );
}
