"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Lock, Mail, Phone, Camera, Loader2, Save, CheckCircle2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api-client";
import { useModal } from "@/components/providers/ModalProvider";

interface AdminAccountClientProps {
  user: {
    id: string;
    fullName: string;
    businessName: string;
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
  const { update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const modal = useModal();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security">(    tabParam === "security" ? "security" : "profile"
  );

  // Profile Form State
  const [profileData, setProfileData] = useState({
    fullName: user.fullName,
    businessName: user.businessName,
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
        fullName: profileData.fullName,
        businessName: profileData.businessName,
        email: profileData.email,
        phone: profileData.phone,
        avatar: profileData.avatar,
      });

      if (result.success !== false) {
        // Update the next-auth session as well
        await updateSession({ avatar: profileData.avatar });
        
        await modal.alert({ title: "Profile Updated", message: "Profile updated successfully!", variant: "info" });
        router.refresh();
      } else {
        modal.alert({ title: "Update Failed", message: result.message || result.error || "Failed to update profile", variant: "danger" });
      }
    } catch (error: any) {
      console.error("Profile Update Error:", error);
      modal.alert({ title: "Error", message: error.message || "An unexpected error occurred", variant: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB."); return; }

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "avatars");
      const res = await api.uploadFormData("/upload/image", formData);
      const newUrl = res.url || res.imageUrl;
      // Update user profile with new avatar
      await api.put(`/users/${user.id}`, { ...profileData, avatar: newUrl });
      
      // Update the next-auth session as well
      await updateSession({ avatar: newUrl });

      setProfileData((prev) => ({ ...prev, avatar: newUrl }));
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Upload failed.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      modal.alert({ title: "Passwords Don't Match", message: "New passwords do not match. Please try again.", variant: "warning" });
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
        modal.alert({ title: "Weak Password", message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.", variant: "warning" });
        setIsLoading(false);
        return;
      }

      const result = await api.patch(`/users/${user.id}/password`, {
        password: passwordData.newPassword,
      });

      if (result.success !== false) {
        await modal.alert({ title: "Password Changed", message: "Password changed successfully!", variant: "info" });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        modal.alert({ title: "Change Failed", message: result.message || result.error || "Failed to change password", variant: "danger" });
      }
    } catch (error: any) {
      console.error("Password Change Error:", error);
      modal.alert({ title: "Error", message: error.message || "An unexpected error occurred", variant: "danger" });
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
                        {(profileData.fullName || profileData.businessName || "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-sm border border-gray-200 text-gray-600 hover:text-primary-600 transition-colors disabled:opacity-50"
                    title="Upload photo"
                  >
                    {isUploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Profile Photo</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Click the camera icon to upload a photo directly.
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
                      value={profileData.fullName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, fullName: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>

                {user.role === "ORGANIZER" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Business Name
                    </label>
                    <div className="relative">
                      <CheckCircle2
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        value={profileData.businessName}
                        onChange={(e) =>
                          setProfileData({ ...profileData, businessName: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        placeholder="Enter business name"
                        required
                      />
                    </div>
                  </div>
                )}

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
