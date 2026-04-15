import { createServerApiClient } from "@/lib/api-client";
import { 
  Calendar, 
  Clock, 
  ArrowLeft,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  User as UserIcon,
  Tag
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SingleBlogPage({ params }: { params: { slug: string } }) {
  const apiClient = createServerApiClient();
  const res = await apiClient.get(`/blogs/${params.slug}`).catch(() => null);
  const blog = res?.data || res;

  if (!blog) {
    return notFound();
  }

  return (
    <article className="min-h-screen bg-white pb-32">
      {/* HEADER / COVER IMAGE AREA */}
      <header className="relative w-full h-[60vh] min-h-[400px] overflow-hidden bg-slate-950">
          <img 
            src={blog.coverImage || "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=2938"} 
            alt={blog.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-20">
              <div className="container-custom space-y-8">
                  <Link 
                    href="/blogs"
                    className="inline-flex items-center gap-2 text-white/60 hover:text-white text-xs font-black uppercase tracking-widest transition-colors mb-4"
                  >
                      <ArrowLeft size={16} />
                      Back to Newsroom
                  </Link>

                  <div className="space-y-6 max-w-4xl">
                      <div className="flex flex-wrap gap-3">
                          <span className="px-4 py-1.5 bg-primary-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-900/40">
                              {blog.category || "Official Release"}
                          </span>
                      </div>
                      <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">
                          {blog.title}
                      </h1>
                      
                      <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/10">
                                  {blog.author?.fullName?.charAt(0)}
                              </div>
                              <span className="text-white">{blog.author?.fullName}</span>
                          </div>
                          <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(blog.publishedAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-2"><Clock size={14} /> {blog.readTime || 5} min read</span>
                      </div>
                  </div>
              </div>
          </div>
      </header>

      {/* CONTENT AREA */}
      <div className="container-custom pt-16 md:pt-24 grid grid-cols-1 lg:grid-cols-12 gap-16 px-4">
          <aside className="lg:col-span-3 space-y-12">
              <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Share Article</h4>
                  <div className="flex lg:flex-col gap-4">
                      <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary-700 hover:text-white transition-all flex items-center justify-center shadow-sm">
                          <Facebook size={20} />
                      </button>
                      <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary-700 hover:text-white transition-all flex items-center justify-center shadow-sm">
                          <Twitter size={20} />
                      </button>
                      <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary-700 hover:text-white transition-all flex items-center justify-center shadow-sm">
                          <Linkedin size={20} />
                      </button>
                      <button className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-primary-700 hover:text-white transition-all flex items-center justify-center shadow-sm">
                          <Share2 size={20} />
                      </button>
                  </div>
              </div>

              {blog.tags && blog.tags.length > 0 && (
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                        {blog.tags.map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100 italic">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
              )}
          </aside>

          <main className="lg:col-span-9">
              <div className="max-w-3xl">
                  {/* SUMMARY / EXCERPT */}
                  <div className="text-xl md:text-2xl font-bold text-slate-400 leading-relaxed mb-12 italic border-l-4 border-primary-100 pl-8">
                      {blog.excerpt}
                  </div>

                  {/* BODY CONTENT */}
                  <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-p:leading-relaxed prose-p:text-slate-700 prose-img:rounded-[2rem] prose-img:shadow-xl">
                      <div className="whitespace-pre-wrap leading-loose">
                          {blog.content}
                      </div>
                  </div>
                  
                  {/* FOOTER AREA */}
                  <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 overflow-hidden border border-slate-100">
                             {blog.author?.avatar ? <img src={blog.author.avatar} alt="" /> : <UserIcon size={24} />}
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Written By</p>
                              <p className="text-lg font-black text-slate-900 leading-none">{blog.author?.fullName}</p>
                          </div>
                      </div>
                      
                      <Link 
                        href="/blogs"
                        className="px-8 py-4 bg-slate-900 !text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-colors shadow-lg shadow-slate-200"
                      >
                          View More Articles
                      </Link>
                  </footer>
              </div>
          </main>
      </div>
    </article>
  );
}
