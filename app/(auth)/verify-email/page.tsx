"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "idle"
  >("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(
        "No verification token found. Please use the link from your email.",
      );
      return;
    }
    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/proxy/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: verificationToken }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");
        setTimeout(() => router.push("/sign-in"), 3000);
      } else {
        setStatus("error");
        setMessage(
          data.message ||
            data.error ||
            "Verification failed. The link may have expired.",
        );
      }
    } catch {
      setStatus("error");
      setMessage("An unexpected error occurred. Please try again.");
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
            <Mail size={32} className="text-white" />
          </div>
          <h2 className="text-5xl font-display font-bold leading-tight text-white!">
            Verifying your <span className="text-primary-500">email</span>.
          </h2>
          <p className="text-lg text-primary-100/80 leading-relaxed">
            Just a moment while we confirm your email address and activate your
            EaseVote organizer account.
          </p>
        </div>
      </div>

      {/* Right content panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 bg-white">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="lg:hidden mb-8 mt-8">
            <span className="text-2xl font-display font-bold text-primary-800">
              EaseVote<span className="text-primary-500">.gh</span>
            </span>
          </div>

          {status === "loading" || status === "idle" ? (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 size={40} className="text-primary-600 animate-spin" />
              </div>
              <h1 className="text-3xl font-display font-bold text-slate-900">
                Verifying your email...
              </h1>
              <p className="text-slate-500">Please wait a moment.</p>
            </div>
          ) : status === "success" ? (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h1 className="text-3xl font-display font-bold text-slate-900">
                Email Verified!
              </h1>
              <p className="text-slate-500">{message}</p>
              <p className="text-sm text-slate-400">
                Redirecting you to sign in...
              </p>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 font-bold text-primary-700 hover:underline"
              >
                Go to Sign In now
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle size={40} className="text-red-500" />
              </div>
              <h1 className="text-3xl font-display font-bold text-slate-900">
                Verification Failed
              </h1>
              <p className="text-slate-500">{message}</p>
              <div className="flex flex-col gap-3 mt-4">
                <Link
                  href="/sign-in"
                  className="w-full bg-primary-800 hover:bg-primary-900 text-white! py-3 rounded-xl font-bold transition-all text-center"
                >
                  Go to Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="text-sm font-bold text-primary-700 hover:underline"
                >
                  Create a new account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
