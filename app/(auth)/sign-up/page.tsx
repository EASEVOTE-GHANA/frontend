"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Building2,
  Loader2,
} from "lucide-react";
import TrustCenter from "@/components/layout/TrustCenter/TrustCenter";
import { api } from "@/lib/api-client";

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTrustCenterOpen, setIsTrustCenterOpen] = useState(false);
  const [activeTrustTab, setActiveTrustTab] = useState<
    "terms" | "privacy" | "cookies"
  >("terms");
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<{
    success: boolean;
    message: string;
    errors?: any;
  }>({ success: false, message: "" });

  const handleOpenLegal = (tab: "terms" | "privacy" | "cookies") => {
    setActiveTrustTab(tab);
    setIsTrustCenterOpen(true);
  };

  const formAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    // Client-side password confirmation check
    if (data.password !== data.confirmPassword) {
      setState({
        success: false,
        message: "Passwords do not match. Please try again.",
      });
      return;
    }

    setIsPending(true);
    try {
      const res = await fetch("/api/proxy/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          organizationName: data.businessName,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        // 200 or 201 — registration succeeded
        setState({
          success: true,
          message:
            result.message ||
            "Account created! Please check your email to verify your account.",
        });
      } else {
        setState({
          success: false,
          message:
            result.message ||
            result.error ||
            "Registration failed. Please try again.",
          errors: result.errors,
        });
      }
    } catch {
      setState({
        success: false,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/check-email");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

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
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h2 className="text-5xl font-display font-bold leading-tight text-white!">
              Host World-Class{" "}
              <span className="text-secondary-500">Events</span>.
            </h2>
            <p className="text-lg text-magenta-100/80 leading-relaxed">
              Launch your awards scheme or school election in minutes. Get
              real-time analytics, instant payouts, and zero stress.
            </p>

            {/* 3D Card Visual */}
            <div className="relative mt-12 perspective-1000">
              <div className="w-full bg-linear-to-br from-white/20 to-white/5 backdrop-blur-lg border border-white/20 rounded-3xl p-6 shadow-2xl transform rotate-y-12 rotate-x-6 hover:rotate-0 transition-all duration-500">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 rounded-full bg-secondary-600"></div>
                  <div className="h-4 w-20 bg-white/20 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-6 w-3/4 bg-white/40 rounded-lg"></div>
                  <div className="h-4 w-1/2 bg-white/20 rounded-lg"></div>
                </div>
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
              Become an Organizer
            </h1>
            <p className="text-slate-500">
              Start managing your events professionally today.
            </p>
          </div>

          {state?.message && (
            <div
              className={`p-4 rounded-lg mb-6 text-sm font-medium ${
                state.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {state.message}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={formAction}>
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  name="fullName"
                  type="text"
                  placeholder="Kwame Mensah"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              {state?.errors?.fullName && (
                <p className="text-red-500 text-xs mt-1">
                  {state.errors.fullName[0]}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">
                Organization Name
              </label>
              <div className="relative">
                <Building2
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  name="businessName"
                  type="text"
                  placeholder="e.g. SRC 2025, Ghana Music Awards"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              {state?.errors?.businessName && (
                <p className="text-red-500 text-xs mt-1">
                  {state.errors.businessName[0]}
                </p>
              )}
            </div>

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
                  name="email"
                  type="email"
                  placeholder="name@organization.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              {state?.errors?.email && (
                <p className="text-red-500 text-xs mt-1">
                  {state.errors.email[0]}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  name="phone"
                  type="tel"
                  placeholder="024 456 7890"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
              </div>
              {state?.errors?.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {state.errors.phone[0]}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {state?.errors?.password && (
                <p className="text-red-500 text-xs mt-1">
                  {state.errors.password[0]}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <div className="relative flex items-center h-5">
                <input
                  type="checkbox"
                  required
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
              <div className="text-sm text-slate-500">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => handleOpenLegal("terms")}
                  className="font-bold text-slate-900 underline hover:text-primary-600"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => handleOpenLegal("privacy")}
                  className="font-bold text-slate-900 underline hover:text-primary-600"
                >
                  Privacy Policy
                </button>
                .
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-primary-800 hover:bg-primary-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Creating
                  Account...
                </>
              ) : (
                <>
                  Create Organizer Account
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer Switch */}
          <div className="mt-10 text-center">
            <p className="text-slate-600">
              Already have an account?
              <Link
                href="/sign-in"
                className="ml-2 font-bold text-magenta-800 hover:text-magenta-600 hover:underline transition-colors"
                scroll={false}
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
      <TrustCenter
        isOpen={isTrustCenterOpen}
        onOpen={() => setIsTrustCenterOpen(true)}
        onClose={() => setIsTrustCenterOpen(false)}
        activeTab={activeTrustTab}
        onTabChange={setActiveTrustTab}
        showCookieBanner={false}
      />
    </>
  );
}
