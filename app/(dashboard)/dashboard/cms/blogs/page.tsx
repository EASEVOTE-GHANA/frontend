import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2,
  Calendar,
  User as UserIcon,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken);
  
  const res = (await apiClient.get("/blogs/admin").catch(() => ({}))) || {};
  const blogs = (res as any).blogs || (res as any).data?.blogs || [];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-primary-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-50">
                <FileText className="h-7 w-7" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    CMS Management
                </h1>
                <p className="text-slate-500 font-medium">
                    Create and organize platform editorial content
                </p>
            </div>
        </div>

        <Link 
            href="/dashboard/cms/blogs/new"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-700 !text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-primary-800 transition-all shadow-md shadow-primary-50"
        >
            <Plus size={18} />
            Write New Post
        </Link>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                  type="text" 
                  placeholder="Search articles by title or keyword..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-600 outline-none transition-all"
              />
          </div>
          <button className="px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter size={18} />
              <span className="text-sm font-bold">Filter By Status</span>
          </button>
      </div>

      {/* BLOGS TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Article Details</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Published</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Engagement</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {blogs.length === 0 ? (
                          <tr>
                              <td colSpan={5} className="px-8 py-20 text-center">
                                  <div className="flex flex-col items-center justify-center space-y-4">
                                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                          <FileText size={40} />
                                      </div>
                                      <p className="text-slate-500 font-medium">No articles found. Start by writing your first post!</p>
                                  </div>
                              </td>
                          </tr>
                      ) : (
                          blogs.map((blog: any) => (
                              <tr key={blog._id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                                  <td className="px-8 py-6">
                                      <div className="flex items-center gap-4">
                                          <div className="h-12 w-16 bg-slate-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                                              {blog.coverImage ? (
                                                  <img src={blog.coverImage} alt="" className="w-full h-full object-cover" />
                                              ) : (
                                                  <FileText className="absolute inset-0 m-auto text-slate-300" size={20} />
                                              )}
                                          </div>
                                          <div>
                                              <p className="text-sm font-black text-slate-900 leading-tight mb-1">{blog.title}</p>
                                              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                  <span className="flex items-center gap-1"><UserIcon size={12} /> {blog.author?.fullName}</span>
                                                  <span className="flex items-center gap-1"><Clock size={12} /> {blog.readTime || 5} min read</span>
                                              </div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className={clsx(
                                          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                          blog.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                                      )}>
                                          <span className={clsx("w-1.5 h-1.5 rounded-full", blog.status === "PUBLISHED" ? "bg-emerald-500" : "bg-slate-400")}></span>
                                          {blog.status}
                                      </div>
                                  </td>
                                  <td className="px-8 py-6">
                                      <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                          <Calendar size={14} className="text-slate-300" />
                                          {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString() : "Pending"}
                                      </p>
                                  </td>
                                  <td className="px-8 py-6">
                                      <div className="flex items-center gap-4">
                                          <div className="text-center">
                                              <p className="text-xs font-black text-slate-900">0</p>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Views</p>
                                          </div>
                                          <div className="text-center border-l border-slate-100 pl-4">
                                              <p className="text-xs font-black text-slate-900">0</p>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Shares</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                          <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all">
                                              <Eye size={18} />
                                          </button>
                                          <Link href={`/dashboard/cms/blogs/edit/${blog._id}`} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-primary-100">
                                              <Edit3 size={18} />
                                          </Link>
                                          <button className="p-2 text-slate-400 hover:text-error-600 hover:bg-white rounded-lg transition-all">
                                              <Trash2 size={18} />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* QUICK INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={32} />
              </div>
              <div>
                  <h4 className="text-2xl font-black text-slate-900">0</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Articles</p>
              </div>
          </div>
          <div className="md:col-span-2 bg-primary-700 p-8 rounded-3xl text-white shadow-xl shadow-primary-50 relative overflow-hidden group">
              <ShieldCheck className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
              <div className="relative z-10">
                  <h4 className="text-xl font-bold mb-2">Editorial Guidelines</h4>
                  <p className="text-primary-100 text-xs font-medium leading-relaxed max-w-lg mb-4">
                      Ensure all articles follow the EaseVote brand voice. High-quality imagery and clear, concise headings improve engagement by up to 40%.
                  </p>
                  <div className="flex items-center gap-4 mt-6 pt-6 border-t border-primary-600">
                      <span className="text-[10px] font-black uppercase tracking-widest">Active Policies</span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-50">•</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Version 1.2</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
