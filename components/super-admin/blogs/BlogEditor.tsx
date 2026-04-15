"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
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
  Loader2
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

export default function BlogEditor({ blog }: { blog?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  async function handleSubmit(statusOverride?: "DRAFT" | "PUBLISHED") {
    if (!formData.title || !formData.content) {
      toast.error("Please fill in the title and content");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        status: statusOverride || formData.status,
        tags: formData.tags.split(",").map((t: string) => t.trim()).filter((t: string) => t)
      };

      if (blog?._id) {
        await api.put(`/blogs/admin/${blog._id}`, payload);
        toast.success("Article updated successfully");
      } else {
        await api.post("/blogs/admin", payload);
        toast.success("Article created successfully");
      }
      router.push("/dashboard/cms/blogs");
      router.refresh();
    } catch (error) {
      toast.error("Failed to save article");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* HEADER ACTIONS */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <Layout size={14} />
            <span>Editorial Studio</span>
            <span>•</span>
            <span className={clsx(formData.status === "PUBLISHED" ? "text-emerald-600" : "text-amber-600")}>
                {formData.status}
            </span>
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 rounded-xl transition-colors"
            >
                <Eye size={16} />
                {previewMode ? "Exit Preview" : "Live Preview"}
            </button>
            <button 
                disabled={loading}
                onClick={() => handleSubmit("DRAFT")}
                className="px-4 py-2 border border-slate-200 text-slate-900 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 rounded-xl transition-colors"
            >
                <Save size={16} />
                Save Draft
            </button>
            <button 
                disabled={loading}
                onClick={() => handleSubmit("PUBLISHED")}
                className="px-6 py-2 bg-primary-700 !text-white font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-primary-800 rounded-xl transition-all shadow-md shadow-primary-50"
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publish Now
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* MAIN FORM */}
          <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                  <input 
                    type="text"
                    placeholder="Enter a compelling headline..."
                    className="w-full text-4xl font-black text-slate-900 border-none outline-none focus:ring-0 placeholder:text-slate-200"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                  <div className="h-px w-full bg-slate-100"></div>
              </div>

              {previewMode ? (
                  <div className="prose prose-slate max-w-none p-8 bg-slate-50 rounded-3xl border border-slate-100 min-h-[500px]">
                      <h1 className="text-3xl font-black mb-6">{formData.title}</h1>
                      <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                          {formData.content || "Your article content will appear here..."}
                      </div>
                  </div>
              ) : (
                  <textarea 
                    placeholder="Tell your story... (Markdown supported)"
                    className="w-full min-h-[600px] text-lg leading-relaxed text-slate-700 border-none outline-none focus:ring-0 placeholder:text-slate-300 resize-none font-medium"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
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
                                <button onClick={() => setFormData({...formData, coverImage: ""})} className="p-2 bg-white rounded-full text-error-600 shadow-lg">
                                    <X size={20} />
                                </button>
                            </div>
                          </>
                      ) : (
                        <>
                            <div className="p-3 bg-white rounded-xl shadow-sm mb-2 text-slate-300">
                                <ImageIcon size={24} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Cover</span>
                            {/* Simple URL input for now */}
                            <input 
                                type="text" 
                                placeholder="Paste Image URL"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
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
