import { createServerApiClient } from "@/lib/api-client";
import { TrendingUp } from "lucide-react";
import PageHeader from "./components/PageHeader";
import BlogList from "./components/BlogList";

export const dynamic = "force-dynamic";

export default async function BlogsIndexPage() {
  const apiClient = createServerApiClient();
  const res = (await apiClient.get("/blogs").catch(() => ({}))) || {};
  const blogs = (res as any).blogs || (res as any).data?.blogs || [];

  return (
    <main className="min-h-screen flex flex-col">
      <PageHeader />
      <BlogList blogs={blogs} />
      <div className="bg-slate-50 pb-20">
        <section className="container-custom -mt-10 relative z-20">
          <BlogList blogs={blogs} />
        </section>

        {/* NEWSLETTER MINI SEC */}
        <section className="container-custom mt-32 px-4">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden text-center max-w-5xl mx-auto shadow-2xl shadow-slate-900/20">
            <TrendingUp className="absolute -right-10 -bottom-10 h-64 w-64 text-white/[0.03] -rotate-12" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                Subscribe for the <br />
                latest intel.
              </h3>
              <p className="text-slate-400 font-medium leading-relaxed text-sm max-w-md mx-auto">
                Get platform updates, organizer tips, and voting tech news
                delivered straight to your inbox. No spam, ever.
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
    </main>
  );
}
