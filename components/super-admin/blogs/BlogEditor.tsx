"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useModal } from "@/components/providers/ModalProvider";
import {
  Save,
  Send,
  Image as ImageIcon,
  X,
  Type,
  Layout,
  Tag,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Trash2,
  Edit3
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

export default function BlogEditor({ blog }: { blog?: any }) {
  const router = useRouter();
  const modal = useModal();
  const [loadingAction, setLoadingAction] = useState<"DRAFT" | "PUBLISHED" | "DELETE" | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    title: blog?.title || "",
    content: blog?.content || "",
    category: blog?.category || "NEWS",
    status: blog?.status || "DRAFT",
    coverImage: blog?.coverImage || "",
    tags: blog?.tags?.join(", ") || ""
  });

  const categories = ["NEWS", "TUTORIAL", "ANNOUNCEMENT", "GUIDE"];

  useEffect(() => {
    // Only load draft if creating a new blog
    if (!blog) {
      const savedDraft = sessionStorage.getItem("blogDraft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.formData) {
            setFormData(prev => ({ ...prev, ...parsed.formData }));
          }
        } catch (e) {
          console.error("Failed to parse blog draft", e);
        }
      }
    }
  }, [blog]);

  useEffect(() => {
    if (!blog) {
      const draft = { formData };
      sessionStorage.setItem("blogDraft", JSON.stringify(draft));
    }
  }, [formData, blog]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    setUploadingImage(true);
    try {
      const res = await api.uploadImage(file, "blogs");
      const newUrl = res.url || res.imageUrl || res.data?.url || res.data?.imageUrl || "";
      setFormData(prev => ({ ...prev, coverImage: newUrl }));
      toast.success("Cover image uploaded");
    } catch (err) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(statusOverride?: "DRAFT" | "PUBLISHED") {
    if (!formData.title || !formData.content) {
      toast.error("Please fill in the title and content");
      return;
    }

    setLoadingAction(statusOverride || (formData.status as "DRAFT" | "PUBLISHED"));
    try {
      const payload = {
        ...formData,
        status: statusOverride || formData.status,
        tags: formData.tags.split(",").map((t: string) => t.trim()).filter((t: string) => t)
      };

      if (blog?._id) {
        await api.put(`/blogs/admin/${blog._id}`, payload);
        toast.success("Article updated successfully");
        setFormData((prev: any) => ({ ...prev, status: payload.status }));
        router.refresh(); // Refresh server state, but stay on page
      } else {
        const newBlog = await api.post("/blogs/admin", payload);
        toast.success("Article created successfully");
        sessionStorage.removeItem("blogDraft");
        // Redirect to the newly created blog's edit page to prevent duplicate creations
        router.push(`/dashboard/cms/blogs/edit/${newBlog._id || newBlog.data?._id}`);
      }
    } catch (error) {
      toast.error("Failed to save article");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleDelete() {
    if (!blog?._id) return;
    const confirmed = await modal.confirm({
      title: "Delete Article",
      message: "Are you sure you want to delete this article? This action cannot be undone.",
      variant: "danger",
      confirmText: "Delete Article"
    });

    if (!confirmed) return;

    setLoadingAction("DELETE");
    try {
      await api.delete(`/blogs/admin/${blog._id}`);
      toast.success("Article deleted successfully");
      router.push("/dashboard/cms/blogs");
      router.refresh();
    } catch (err) {
      toast.error("Failed to delete article");
      setLoadingAction(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <Layout size={14} />
            <span>Editorial Studio</span>
            <span>•</span>
            <span className={clsx(formData.status === "PUBLISHED" ? "text-emerald-600" : "text-amber-600")}>
              {formData.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
          >
            <Eye size={16} />
            {previewMode ? "Exit Preview" : "Live Preview"}
          </button>

          {formData.status === "PUBLISHED" ? (
            <>
              <button
                disabled={loadingAction !== null}
                onClick={handleDelete}
                className="px-4 py-2 text-error-600 font-bold text-sm flex items-center gap-2 hover:bg-error-50 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loadingAction === "DELETE" ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
              <button
                disabled={loadingAction !== null}
                onClick={() => handleSubmit("PUBLISHED")}
                className="px-6 py-2 bg-primary-700 !text-white font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-primary-800 rounded-xl transition-all shadow-md shadow-primary-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {loadingAction === "PUBLISHED" ? <Loader2 size={16} className="animate-spin" /> : <Edit3 size={16} />}
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                disabled={loadingAction !== null}
                onClick={() => handleSubmit("DRAFT")}
                className="px-4 py-2 border border-slate-200 text-slate-900 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {loadingAction === "DRAFT" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Draft
              </button>
              <button
                disabled={loadingAction !== null}
                onClick={() => handleSubmit("PUBLISHED")}
                className="px-6 py-2 bg-primary-700 !text-white font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-primary-800 rounded-xl transition-all shadow-md shadow-primary-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {loadingAction === "PUBLISHED" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publish Now
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* MAIN FORM */}
        <div className="lg:col-span-2 space-y-6">
          {previewMode ? (
            <div className="prose prose-slate max-w-none bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
              {formData.coverImage && (
                <div className="w-full h-[300px] sm:h-[400px]">
                  <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {formData.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{new Date().toLocaleDateString()}</span>
                </div>

                <h1 className="text-4xl font-black text-slate-900 mb-8 leading-tight">{formData.title || "Your compelling headline"}</h1>

                <div className="whitespace-pre-wrap text-lg leading-relaxed text-slate-700 mb-10 font-medium">
                  {formData.content || "Your article content will appear here..."}
                </div>

                {formData.tags && (
                  <div className="flex items-center gap-2 pt-6 border-t border-slate-100">
                    <Tag size={16} className="text-slate-400" />
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean).map((tag: string) => (
                        <span key={tag} className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter a compelling headline..."
                  className="w-full text-4xl font-black text-slate-900 border-none outline-none focus:ring-0 placeholder:text-slate-200 bg-transparent"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <div className="h-px w-full bg-slate-100"></div>
              </div>
              <div className="w-full mt-4 prose-editor rounded-xl overflow-hidden border border-slate-200">
                <JoditEditor
                  value={formData.content}
                  config={{ height: 600, placeholder: "Tell your story...", style: { background: "transparent" } }}
                  onBlur={(newContent) => setFormData({ ...formData, content: newContent })}
                />
              </div>
            </>
          )}
        </div>

        {/* SIDEBAR SETTINGS */}
        <div className="space-y-6">
          {/* COVER IMAGE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <ImageIcon size={14} /> Cover Appearance
            </h4>
            <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group relative overflow-hidden transition-all hover:bg-slate-100">
              {formData.coverImage ? (
                <>
                  <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => setFormData({ ...formData, coverImage: "" })} className="p-2 bg-white rounded-full text-error-600 shadow-lg">
                      <X size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-white rounded-xl shadow-sm mb-2 text-slate-300">
                    {uploadingImage ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {uploadingImage ? "Uploading..." : "Upload Cover"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-400 text-center italic">Supported: JPEG, PNG • Ratio: 16:9</p>
          </div>

          {/* CLASSIFICATION */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Tag size={14} /> Category
              </h4>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-100 outline-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Type size={14} /> Tags (Comma separated)
              </h4>
              <input
                type="text"
                placeholder="e.g. news, voting, guide"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-100 outline-none"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          {/* SEO PREVIEW CARD */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl"></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">Search Engine View</span>
                <CheckCircle2 size={14} className="text-emerald-400" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold truncate">{formData.title || "Your Page Title"}</p>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {formData.content || "This is how your article will look on Google and social media feeds."}
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500">Slug: {formData.title.toLowerCase().replace(/\s+/g, '-').slice(0, 20)}...</span>
                <AlertCircle size={14} className="text-slate-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
