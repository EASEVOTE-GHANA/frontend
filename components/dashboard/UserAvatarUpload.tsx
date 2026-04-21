"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface UserAvatarUploadProps {
  userId: string;
  currentAvatar?: string;
  name: string;
  onSuccess?: (newUrl: string) => void;
}

export default function UserAvatarUpload({
  userId,
  currentAvatar,
  name,
  onSuccess,
}: UserAvatarUploadProps) {
  const { update: updateSession } = useSession();
  const [avatar, setAvatar] = useState(currentAvatar || "");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "avatars");

      const res = await api.uploadFormData("/upload/image", formData);
      const newUrl = res.url || res.imageUrl;

      // Update user profile with new avatar
      await api.patch(`/users/${userId}`, { avatar: newUrl });

      // Update the next-auth session as well
      await updateSession({ avatar: newUrl });

      setAvatar(newUrl);
      toast.success("Photo updated!");

      if (onSuccess) {
        onSuccess(newUrl);
      } else {
        // Refresh the page to reflect updated data if no callback
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative group h-16 w-16 flex-shrink-0">
      {/* Avatar display */}
      <div className="h-16 w-16 bg-slate-100 rounded-xl flex items-center justify-center text-xl font-bold text-slate-500 overflow-hidden shadow-sm">
        {avatar?.startsWith("http") ? (
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          name.substring(0, 2).toUpperCase()
        )}
      </div>

      {/* Hover overlay — click to upload */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
        title="Change photo"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        ) : (
          <Camera className="w-5 h-5 text-white" />
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
