"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Lock, Mail, Phone, Camera, Loader2, Save, CheckCircle2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api-client";

interface AdminAccountClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    role: string;
  };
}

export default function AdminAccountClient({ user }: AdminAccountClientProps) {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading settings...</div>}>
      <AdminAccountContent user={user} />
    </Suspense>
  );
}

function AdminAccountContent({ user }: AdminAccountClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security">(
    tabParam === "security" ? "security" : "profile"
  );

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    avatar: user.avatar || "",
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // If the ID from the prop is missing (possible if the backend response format varied),
      // we can try to fall back or just rely on the ID being present.
      // But based on the report, it might be hitting /users/undefined.
      if (!user.id) {
        throw new Error("User ID is missing. Please refresh and try again.");
      }

      const result = await api.put(`/users/${user.id}`, {
        fullName: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        avatar: profileData.avatar,
      });

      if (result.success !== false) {
        alert("Profile updated successfully!");
        router.refresh();
      } else {
        alert(result.message || result.error || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Profile Update Error:", error);
      alert(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    try {
      if (!user.id) {
        throw new Error("User ID is missing. Please refresh and try again.");
      }

      // Platform-wide security check
      const hasUpper = /[A-Z]/.test(passwordData.newPassword);
      const hasLower = /[a-z]/.test(passwordData.newPassword);
      const hasNumber = /[0-9]/.test(passwordData.newPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(passwordData.newPassword);

      if (passwordData.newPassword.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        alert("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
        setIsLoading(false);
        return;
      }

      const result = await api.patch(`/users/${user.id}/password`, {
        password: passwordData.newPassword,
      });

      if (result.success !== false) {
        alert("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        alert(result.message || result.error || "Failed to change password");
      }
    } catch (error: any) {
      console.error("Password Change Error:", error);
      alert(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/50 rounded-xl transition-colors text-gray-600 border border-gray-100 bg-white/30 backdrop-blur-sm"
          title="Go Back"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500">
            Manage your profile and security preferences
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <User size={18} />
            Profile Details
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors ${
              activeTab === "security"
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Lock size={18} />
            Security
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === "profile" ? (
            <form
              onSubmit={handleProfileUpdate}
              className="max-w-2xl space-y-6"
            >
              {/* Avatar Section */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-gray-400">
                        {profileData.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-sm border border-gray-200 text-gray-600 hover:text-primary-600 transition-colors"
                    onClick={() => {
                      const url = prompt("Enter image URL");
                      if (url) setProfileData({ ...profileData, avatar: url });
                    }}
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Profile Photo</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Click the camera icon to update your photo URL.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none transition-all"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email address cannot be changed directly.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handlePasswordChange}
              className="max-w-2xl space-y-6"
            >
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Password Requirements
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    {
                      label: "At least 8 characters",
                      met: passwordData.newPassword.length >= 8,
                    },
                    {
                      label: "One uppercase letter",
                      met: /[A-Z]/.test(passwordData.newPassword),
                    },
                    {
                      label: "One lowercase letter",
                      met: /[a-z]/.test(passwordData.newPassword),
                    },
                    { 
                      label: "One number", 
                      met: /[0-9]/.test(passwordData.newPassword) 
                    },
                    {
                      label: "One special character",
                      met: /[^A-Za-z0-9]/.test(passwordData.newPassword),
                    },
                  ].map((req, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                          req.met
                            ? "bg-green-100 text-green-600"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        <CheckCircle2 size={10} />
                      </div>
                      <span
                        className={`text-xs transition-colors ${
                          req.met
                            ? "text-green-700 font-medium"
                            : "text-slate-500"
                        }`}
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter new password"
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
