import { ChevronRight, Home } from "lucide-react";

export default function PageHeader() {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="w-full rounded-3xl overflow-hidden relative min-h-[240px] flex flex-col items-center justify-center text-center">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-linear-to-r from-primary-200 via-secondary-200 to-primary-200 opacity-60 z-0"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            FAQs
          </h1>

          <nav className="flex items-center space-x-2 text-sm text-gray-600 bg-white/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-sm">
            <a
              href="/"
              className="hover:text-secondary-600 flex items-center gap-1 transition-colors"
            >
              <Home className="w-3 h-3" />
              Home
            </a>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-secondary-500 font-medium">FAQs</span>
          </nav>
        </div>
      </div>
    </section>
  );
}
