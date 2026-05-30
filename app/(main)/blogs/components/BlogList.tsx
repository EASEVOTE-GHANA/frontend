import { Calendar, Clock, ChevronRight, Newspaper } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";

interface Blog {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  category?: string;
  publishedAt: string;
  readTime?: number;
  author?: { fullName?: string };
}

interface BlogListProps {
  blogs: Blog[];
}

export default function BlogList({ blogs }: BlogListProps) {
  if (blogs.length === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Newspaper size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          The newsroom is quiet.
        </h2>
        <p className="text-slate-500 max-w-sm mx-auto font-medium">
          Check back soon for our first editorial release. We&apos;re currently
          crafting some great stories for you.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {blogs.map((blog, idx) => (
        <Link
          href={`/blogs/${blog.slug}`}
          key={blog._id}
          className={clsx(
            "group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col hover:-translate-y-2",
            idx === 0 && "md:col-span-2 lg:col-span-2 md:flex-row",
          )}
        >
          <div
            className={clsx(
              "relative overflow-hidden",
              idx === 0 ? "md:w-1/2 aspect-4/3" : "aspect-16/10",
            )}
          >
            <Image
              src={
                blog.coverImage ||
                "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=2938"
              }
              alt={blog.title}
              fill
              sizes={idx === 0 ? "50vw" : "(max-width: 768px) 100vw, 33vw"}
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                {blog.category || "News"}
              </span>
            </div>
          </div>

          <div
            className={clsx(
              "p-8 md:p-10 flex flex-col justify-between flex-1",
              idx === 0 && "md:w-1/2",
            )}
          >
            <div>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />{" "}
                  {new Date(blog.publishedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} /> {blog.readTime || 5} min read
                </span>
              </div>
              <h2
                className={clsx(
                  "font-black text-slate-900 leading-[1] mb-6 tracking-tight group-hover:text-primary-700 transition-colors",
                  idx === 0 ? "text-4xl" : "text-2xl",
                )}
              >
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
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                  {blog.author?.fullName}
                </span>
              </div>
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-900 group-hover:bg-primary-700 group-hover:text-white transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
