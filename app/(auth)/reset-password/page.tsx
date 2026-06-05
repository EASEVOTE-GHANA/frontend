"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";

import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new reset link.",
      );
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setIsPending(true);

    try {
      const res = await fetch("/api/proxy/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/sign-in"), 3000);
      } else {
        let errorMsg = data.message || data.error || "Reset failed. The link may have expired.";
        if (typeof errorMsg === 'string') {
          if (errorMsg.includes("AxiosError") || errorMsg.includes("ETIMEDOUT") || errorMsg.includes("ECONNREFUSED") || res.status === 500) {
            errorMsg = "We are experiencing a temporary network hiccup. Please try again shortly.";
          }
        }
        setError(errorMsg);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-primary-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative z-10 max-w-lg text-white space-y-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-5xl font-display font-bold leading-tight text-white!">
            Create a new <span className="text-primary-500">password</span>.
          </h2>
          <p className="text-lg text-primary-100/80 leading-relaxed">
            Choose a strong password you haven't used before to keep your
            account secure.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 bg-white overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden mb-8 mt-8">
            <span className="text-2xl font-display font-bold text-primary-800">
              EaseVote<span className="text-primary-500">.gh</span>
            </span>
          </div>

          {success ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h1 className="text-3xl font-display font-bold text-slate-900">
                Password reset!
              </h1>
              <p className="text-slate-500">
                Your password has been updated. Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-3">
                  Reset Password
                </h1>
                <p className="text-slate-500">Enter your new password below.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                  {!token && (
                    <div className="mt-2">
                      <Link
                        href="/forgot-password"
                        className="font-bold underline"
                      >
                        Request a new reset link
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={20}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter strong password"
                      required
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* Password Strength Checklist */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Password Requirements
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        {
                          label: "At least 8 characters",
                          met: password.length >= 8,
                        },
                        {
                          label: "One uppercase letter",
                          met: /[A-Z]/.test(password),
                        },
                        {
                          label: "One lowercase letter",
                          met: /[a-z]/.test(password),
                        },
                        { label: "One number", met: /[0-9]/.test(password) },
                        {
                          label: "One special character",
                          met: /[^A-Za-z0-9]/.test(password),
                        },
                      ].map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className={clsx(
                              "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                              req.met
                                ? "bg-green-100 text-green-600"
                                : "bg-slate-200 text-slate-400",
                            )}
                          >
                            <CheckCircle2 size={10} />
                          </div>
                          <span
                            className={clsx(
                              "text-xs transition-colors",
                              req.met
                                ? "text-green-700 font-medium"
                                : "text-slate-500",
                            )}
                          >
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={20}
                    />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || !token}
                  className="w-full bg-primary-800 hover:bg-primary-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-900/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
