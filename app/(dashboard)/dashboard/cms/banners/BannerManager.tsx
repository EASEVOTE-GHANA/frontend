"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { useModal } from "@/components/providers/ModalProvider";
import {
  Plus,
  Trash2,
  Save,
  X,
  Loader2,
  Upload,
  Link as LinkIcon,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

interface Banner {
  _id: string;
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
}

interface BannerManagerProps {
  initialBanners: Banner[];
}

export default function BannerManager({ initialBanners }: BannerManagerProps) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const modal = useModal();

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    linkUrl: "",
    order: 0,
    isActive: true,
  });

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || "",
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl || "",
        order: banner.order,
        isActive: banner.isActive,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: "",
        imageUrl: "",
        linkUrl: "",
        order: banners.length,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadImage(file, "banners");
      setFormData((prev) => ({ ...prev, imageUrl: res.url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.imageUrl) {
      toast.error("Image is required");
      return;
    }

    setIsProcessing(true);
    try {
      if (editingBanner) {
        const updated = await api.put(
          `/cms/banners/${editingBanner._id}`,
          formData,
        );
        setBanners(
          banners.map((b) => (b._id === editingBanner._id ? updated : b)),
        );
        toast.success("Banner updated");
      } else {
        const created = await api.post("/cms/banners", formData);
        setBanners([created, ...banners]);
        toast.success("Banner created");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save banner");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm({
      title: "Delete Banner",
      message:
        "Are you sure you want to delete this banner? This action cannot be undone.",
      variant: "danger",
      confirmText: "Delete Banner",
    });
    if (!confirmed) return;
    try {
      await api.delete(`/cms/banners/${id}`);
      setBanners(banners.filter((b) => b._id !== id));
      toast.success("Deleted");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const updated = await api.put(`/cms/banners/${banner._id}`, {
        isActive: !banner.isActive,
      });
      setBanners(banners.map((b) => (b._id === banner._id ? updated : b)));
      toast.success(updated.isActive ? "Banner activated" : "Banner hidden");
    } catch (error) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
        >
          <Plus size={18} /> Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div
            key={banner._id}
            className={`group relative bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all ${
              !banner.isActive ? "opacity-75 grayscale-50" : ""
            }`}
          >
            <div className="aspect-[16/9] relative bg-gray-100">
              <Image
                src={banner.imageUrl}
                alt={banner.title || "Banner"}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleActive(banner)}
                  className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 text-gray-700"
                  title={banner.isActive ? "Hide" : "Show"}
                >
                  {banner.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => handleOpenModal(banner)}
                  className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 text-blue-600"
                >
                  <Save size={16} className="rotate-0" />{" "}
                  {/* Just using Save as Edit icon placeholder or Edit2 */}
                </button>
                <button
                  onClick={() => handleDelete(banner._id)}
                  className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 truncate">
                  {banner.title || "Untitled Banner"}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500">
                  Order: {banner.order}
                </span>
              </div>
              {banner.linkUrl && (
                <div className="flex items-center gap-1 text-[11px] text-secondary-600 truncate">
                  <LinkIcon size={12} />
                  {banner.linkUrl}
                </div>
              )}
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl bg-gray-50">
            <p className="text-gray-400">
              No banners configured. Click "Add Banner" to start.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-xl">
                {editingBanner ? "Edit Banner" : "New Banner"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Image Upload Area */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Banner Image
                </label>
                <div className="relative aspect-[21/9] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden group">
                  {formData.imageUrl ? (
                    <>
                      <Image
                        src={formData.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                          <Upload size={16} /> Change Image
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleImageUpload}
                            accept="image/*"
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-100 transition-colors">
                      {uploading ? (
                        <Loader2
                          className="animate-spin text-secondary-600"
                          size={32}
                        />
                      ) : (
                        <>
                          <Upload className="text-gray-300 mb-2" size={32} />
                          <span className="text-sm text-gray-500 font-medium">
                            Click to upload banner
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            Recommended: 1920x800px
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleImageUpload}
                        accept="image/*"
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-secondary-600/20 outline-none transition-all"
                    placeholder="Enter banner title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Link URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, linkUrl: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-secondary-600/20 outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-secondary-600/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-secondary-600 focus:ring-secondary-600"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-semibold text-gray-700"
                >
                  Display this banner publicly
                </label>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50/50 border-t flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-all h-11"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isProcessing || uploading}
                className="px-8 py-2.5 bg-secondary-600 text-white font-bold rounded-xl hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-secondary-600/20 h-11 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />{" "}
                    {editingBanner ? "Update Banner" : "Apply Changes"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

