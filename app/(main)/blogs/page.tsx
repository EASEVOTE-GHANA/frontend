import { createServerApiClient } from "@/lib/api-client";
import { 
  Calendar, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Newspaper,
  User as UserIcon
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

export const dynamic = "force-dynamic";

export default async function BlogsIndexPage() {
  const apiClient = createServerApiClient();
  const res = (await apiClient.get("/blogs").catch(() => ({}))) || {};
  const blogs = (res as any).blogs || (res as any).data?.blogs || [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HERO SECTION */}
      <section className="bg-primary-700 pt-32 pb-20 px-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary-900/40 rounded-full blur-[100px]"></div>
          
          <div className="container-custom relative z-10 text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-400 animate-pulse"></span>
                  Official Newsroom
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                  Platform insights <br />& global updates.
              </h1>
              <p className="max-w-xl mx-auto text-primary-100 text-lg font-medium opacity-80 leading-relaxed pt-2">
                  Stay updated with the latest from the voting ecosystem. Guides, news, and behind-the-scenes stories from the EaseVote team.
              </p>
          </div>
      </section>

      <section className="container-custom -mt-10 relative z-20">
          {blogs.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-200 shadow-xl shadow-slate-200/50">
                  <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Newspaper size={40} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2">The newsroom is quiet.</h2>
                  <p className="text-slate-500 max-w-sm mx-auto font-medium">
                      Check back soon for our first editorial release. We're currently crafting some great stories for you.
                  </p>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {blogs.map((blog: any, idx: number) => (
                      <Link 
                        href={`/blogs/${blog.slug}`} 
                        key={blog._id}
                        className={clsx(
                            "group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col hover:-translate-y-2",
                            idx === 0 && "md:col-span-2 lg:col-span-2 md:flex-row"
                        )}
                      >
                          <div className={clsx(
                              "relative overflow-hidden",
                              idx === 0 ? "md:w-1/2" : "aspect-[16/10]"
                          )}>
                              <img 
                                src={blog.coverImage || "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=2938"} 
                                alt={blog.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                                      {blog.category || "News"}
                                  </span>
                              </div>
                          </div>

                          <div className={clsx(
                              "p-8 md:p-10 flex flex-col justify-between flex-1",
                              idx === 0 && "md:w-1/2"
                          )}>
                              <div>
                                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
                                      <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(blog.publishedAt).toLocaleDateString()}</span>
                                      <span className="flex items-center gap-1.5"><Clock size={12} /> {blog.readTime || 5} min read</span>
                                  </div>
                                  <h2 className={clsx(
                                      "font-black text-slate-900 leading-[1] mb-6 tracking-tight group-hover:text-primary-700 transition-colors",
                                      idx === 0 ? "text-4xl" : "text-2xl"
                                  )}>
                                      {blog.title}
                                  </h2>
                                  <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-3 mb-8">
                                      {blog.excerpt}
                                  </p>
                              </div>

                              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-[10px] font-black uppercase">
                                          {blog.author?.fullName?.charAt(0)}
                                      </div>
                                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{blog.author?.fullName}</span>
                                  </div>
                                  <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-900 group-hover:bg-primary-700 group-hover:text-white transition-all">
                                      <ChevronRight size={18} />
                                  </div>
                              </div>
                          </div>
                      </Link>
                  ))}
              </div>
          )}
      </section>

      {/* NEWSLETTER MINI SEC */}
      <section className="container-custom mt-32 px-4">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden text-center max-w-5xl mx-auto shadow-2xl shadow-slate-900/20">
              <TrendingUp className="absolute -right-10 -bottom-10 h-64 w-64 text-white/[0.03] -rotate-12" />
              <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                  <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">Subscribe for the <br />latest intel.</h3>
                  <p className="text-slate-400 font-medium leading-relaxed text-sm max-w-md mx-auto">
                      Get platform updates, organizer tips, and voting tech news delivered straight to your inbox. No spam, ever.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                      <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-600"
                      />
                      <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-50 transition-colors whitespace-nowrap">
                          Join the list
                      </button>
                  </div>
              </div>
          </div>
      </section>
    </div>
  );
}
