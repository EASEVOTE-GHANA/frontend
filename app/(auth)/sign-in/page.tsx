"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  BarChart3,
  Loader2,
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (session?.user?.role) {
        // Unified dashboard route handles role-based views
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* LEFT SIDE: Visual Brand Panel (Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-primary-900 relative overflow-hidden items-center justify-center p-12">
        {/* Background Effects */}

        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[100px]"></div>

        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        ></div>

        <div className="relative z-10 max-w-lg text-white">
          <div className="space-y-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
              <BarChart3 size={32} className="text-white" />
            </div>
            <h2 className="text-5xl font-display font-bold leading-tight text-white!">
              Welcome back to your <br />{" "}
              <span className="text-secondary-500">Command Center</span>.
            </h2>
            <p className="text-lg text-magenta-100/80 leading-relaxed">
              Log in to manage your events, monitor real-time voting revenue,
              and download ticketing reports.
            </p>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-12">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <img
                      key={i}
                      src={`https://picsum.photos/seed/organizer${i}/100/100`}
                      className="w-10 h-10 rounded-full border-2 border-magenta-900"
                      alt="Organizer"
                    />
                  ))}
                </div>
                <p className="text-sm font-bold">
                  Trusted by 500+ top organizers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 bg-white overflow-y-auto relative">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile Header (Brand) */}
          <div className="lg:hidden mb-8 mt-8">
            <span className="text-2xl font-display font-bold text-magenta-800">
              EaseVote<span className="text-magenta-500">.gh</span>
            </span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-3">
              Welcome Back
            </h1>
            <p className="text-slate-500">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-magenta-600 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-800 hover:bg-primary-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer Switch */}
          <div className="mt-10 text-center">
            <p className="text-slate-600">
              New to EaseVote?
              <Link
                href="/sign-up"
                className="ml-2 font-bold text-magenta-800 hover:text-magenta-600 hover:underline transition-colors"
              >
                Create Organizer Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
