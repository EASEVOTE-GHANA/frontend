"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import { api } from "@/lib/api-client";
import Image from "next/image";

type CandidateForm = {
  id?: string;
  code?: string;
  name: string;
  bio: string;
  email?: string;
  phone?: string;
  image: string | null;
  imagePublicId?: string | null;
  voteCount?: number;
};

type CategoryForm = {
  id?: string;
  name: string;
  description: string;
  isExpanded: boolean;
  totalVotes?: number;
  candidates: CandidateForm[];
};

type EventData = {
  id: string;
  title: string;
  categories: Array<{
    id: string;
    name: string;
    description: string | null;
    totalVotes: number;
    candidates: Array<{
      id: string;
      code: string;
      name: string;
      bio: string | null;
      email?: string | null;
      phone?: string | null;
      image: string | null;
      imagePublicId: string | null;
      voteCount: number;
    }>;
  }>;
};

interface CategoriesManagerProps {
  eventId: string;
  backUrl?: string;
}

export function CategoriesManager({
  eventId,
  backUrl,
}: CategoriesManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [eventTitle, setEventTitle] = useState("");

  const [categories, setCategories] = useState<CategoryForm[]>([]);
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<string[]>([]);
  const [deletedCandidateIds, setDeletedCandidateIds] = useState<
    { categoryId: string; candidateId: string }[]
  >([]);
  const [uploadingImageCandIdx, setUploadingImageCandIdx] = useState<{
    cat: number;
    cand: number;
  } | null>(null);

  const fetchEvent = async () => {
    try {
      const data = await api.get(`/events/${eventId}`);
      const eventData = data.data || data.event || data;
      setEventTitle(eventData.title);

      if (eventData.categories) {
        setCategories(
          eventData.categories.map((c: any) => ({
            id: c.id || c._id,
            name: c.name,
            description: c.description || "",
            isExpanded: false,
            totalVotes: c.totalVotes,
            candidates: c.candidates.map((cand: any) => ({
              id: cand.id || cand._id,
              code: cand.code,
              name: cand.name,
              bio: cand.bio || "",
              email: cand.email || "",
              phone: cand.phone || "",
              image: cand.image || cand.imageUrl,
              imagePublicId: cand.imagePublicId,
              voteCount: cand.voteCount,
            })),
          })),
        );
      }
    } catch (err) {
      setError("Failed to load event data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchEvent();
  }, [eventId]);

  const addCategory = () => {
    setCategories((prev) => [
      ...prev,
      {
        name: "",
        description: "",
        isExpanded: true,
        candidates: [],
      },
    ]);
  };

  const updateCategory = (
    index: number,
    field: keyof CategoryForm,
    value: unknown,
  ) => {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  const removeCategory = (index: number) => {
    const category = categories[index];
    if (category.totalVotes && category.totalVotes > 0) {
      setError(
        `Cannot delete category "${category.name}" because it has existing votes.`,
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete the category "${category.name}"? This will also remove all ${category.candidates.length} candidates. This action cannot be undone.`,
      )
    ) {
      return;
    }

    if (category.id) {
      setDeletedCategoryIds((prev) => [...prev, category.id!]);
    }
    setCategories((prev) => prev.filter((_, i) => i !== index));
    setError(""); // Clear error if successful
  };

  const toggleCategoryExpand = (index: number) => {
    setCategories((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, isExpanded: !c.isExpanded } : c,
      ),
    );
  };

  const addCandidate = (categoryIndex: number) => {
    setCategories((prev) =>
      prev.map((c, i) =>
        i === categoryIndex
          ? {
              ...c,
              candidates: [
                ...c.candidates,
                {
                  name: "",
                  bio: "",
                  email: "",
                  phone: "",
                  image: null,
                },
              ],
            }
          : c,
      ),
    );
  };

  const updateCandidate = (
    categoryIndex: number,
    candidateIndex: number,
    field: keyof CandidateForm,
    value: string,
  ) => {
    setCategories((prev) =>
      prev.map((c, i) =>
        i === categoryIndex
          ? {
              ...c,
              candidates: c.candidates.map((cand, j) =>
                j === candidateIndex ? { ...cand, [field]: value } : cand,
              ),
            }
          : c,
      ),
    );
  };

  const removeCandidate = (categoryIndex: number, candidateIndex: number) => {
    const candidate = categories[categoryIndex].candidates[candidateIndex];
    if (candidate.voteCount && candidate.voteCount > 0) {
      setError(
        `Cannot delete candidate "${candidate.name}" because they have existing votes.`,
      );
      return;
    }

    if (
      !confirm(
        `Remove candidate "${candidate.name || "Unknown"}" from "${categories[categoryIndex].name}"?`,
      )
    ) {
      return;
    }

    // Cleanup orphaned image if it exists
    if (candidate.imagePublicId) {
      api.deleteImage(candidate.imagePublicId).catch(console.error);
    }

    const categoryId = categories[categoryIndex].id;
    if (candidate.id && categoryId) {
      setDeletedCandidateIds((prev) => [
        ...prev,
        { categoryId, candidateId: candidate.id! },
      ]);
    }

    setCategories((prev) =>
      prev.map((c, i) =>
        i === categoryIndex
          ? {
              ...c,
              candidates: c.candidates.filter((_, j) => j !== candidateIndex),
            }
          : c,
      ),
    );
    setError("");
  };

  const handleCandidateImageUpload = async (
    catIndex: number,
    candIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size per recommendation
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Invalid format. Please use JPG, PNG, WebP or GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Max size is 5MB.");
      return;
    }

    const candidate = categories[catIndex].candidates[candIndex];

    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", "candidates");

    setUploadingImageCandIdx({ cat: catIndex, cand: candIndex });
    setError("");

    try {
      // 1. If candidate already has an image, delete the old one first
      if (candidate.imagePublicId) {
        await api.deleteImage(candidate.imagePublicId).catch(console.error);
      }

      // 2. Upload new image
      const data = await api.uploadFormData("/upload/image", formData);
      const imageUrl = data.url || data.imageUrl;
      const publicId = data.publicId;

      if (imageUrl) {
        setCategories((prev) =>
          prev.map((c, i) =>
            i === catIndex
              ? {
                  ...c,
                  candidates: c.candidates.map((cand, j) =>
                    j === candIndex
                      ? { ...cand, image: imageUrl, imagePublicId: publicId }
                      : cand,
                  ),
                }
              : c,
          ),
        );
      }
    } catch (err) {
      setError("Failed to upload image.");
    } finally {
      setUploadingImageCandIdx(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      // Validate
      for (const cat of categories) {
        if (!cat.name.trim())
          throw new Error("All categories must have a name");
        // REMOVED: Strict validation for candidates (now optional for nomination events)
         if (cat.candidates.length === 0) {
          throw new Error(`Please add at least one candidate to the category: ${cat.name}`);
        }
        for (const cand of cat.candidates) {
          if (!cand.name.trim())
            throw new Error(`All candidates in ${cat.name} must have a name`);
          if (!cand.phone?.trim())
            throw new Error(`Candidate "${cand.name || 'Unknown'}" in ${cat.name} must have a phone number`);
        }
      }

      // 1. Delete removed candidates
      for (const { categoryId, candidateId } of deletedCandidateIds) {
        await api.delete(
          `/events/${eventId}/categories/${categoryId}/candidates/${candidateId}`,
        );
      }

      // 2. Delete removed categories
      for (const categoryId of deletedCategoryIds) {
        await api.delete(`/events/${eventId}/categories/${categoryId}`);
      }

      // 3. Create or update categories and candidates
      for (const cat of categories) {
        let categoryId = cat.id;

        const catPayload = {
          name: cat.name,
          description: cat.description || null,
        };

        if (categoryId) {
          await api.put(
            `/events/${eventId}/categories/${categoryId}`,
            catPayload,
          );
        } else {
          const newCat = await api.post(
            `/events/${eventId}/categories`,
            catPayload,
          );
          categoryId = newCat.category?._id || newCat.category?.id || newCat._id || newCat.id;
        }

        if (!categoryId) continue;

        for (const cand of cat.candidates) {
          const candPayload = {
            name: cand.name,
            description: cand.bio || null,
            email: cand.email || null,
            phone: cand.phone || null,
            imageUrl: cand.image || null,
            imagePublicId: cand.imagePublicId || null,
          };

          if (cand.id) {
            await api.put(
              `/events/${eventId}/categories/${categoryId}/candidates/${cand.id}`,
              candPayload,
            );
          } else {
            await api.post(
              `/events/${eventId}/categories/${categoryId}/candidates`,
              candPayload,
            );
          }
        }
      }

      setSuccess("Categories updated successfully!");
      setDeletedCategoryIds([]);
      setDeletedCandidateIds([]);
      await fetchEvent();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update categories",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const backHref = backUrl || `/dashboard/events/${eventId}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href={backHref}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Manage Categories
          </h1>
          <p className="text-slate-500">{eventTitle}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Categories & Candidates
            </h2>
            <button
              type="button"
              onClick={addCategory}
              className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>

          {categories.map((category, catIndex) => (
            <div
              key={catIndex}
              className="border border-slate-200 rounded-lg overflow-hidden bg-white"
            >
              <div
                className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer"
                onClick={() => toggleCategoryExpand(catIndex)}
              >
                <div className="flex items-center gap-3">
                  {category.isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                  <div>
                    <span className="font-medium text-slate-900">
                      {category.name || `Category ${catIndex + 1}`}
                    </span>
                    <span className="text-sm text-slate-500 ml-2">
                      ({category.candidates.length} candidates)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCategory(catIndex);
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {category.isExpanded && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) =>
                          updateCategory(catIndex, "name", e.target.value)
                        }
                        placeholder="e.g., Best Artist"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={category.description}
                        onChange={(e) =>
                          updateCategory(
                            catIndex,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Brief description"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Candidates
                      </span>
                      <button
                        type="button"
                        onClick={() => addCandidate(catIndex)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add Candidate
                      </button>
                    </div>

                    <div className="space-y-3">
                      {category.candidates.map((candidate, candIndex) => (
                        <div
                          key={candIndex}
                          className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-sm font-medium text-primary-700 flex-shrink-0">
                            {candIndex + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {candidate.code && (
                            <input
                              type="text"
                              value={candidate.code}
                              readOnly
                              className="px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg focus:outline-none cursor-not-allowed uppercase font-mono"
                              placeholder="Code"
                            />
                            )}
                            <input
                              type="text"
                              value={candidate.name}
                              onChange={(e) =>
                                updateCandidate(
                                  catIndex,
                                  candIndex,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="Candidate Name"
                              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="flex gap-2">
                              {candidate.image && (
                                <Image
                                  src={candidate.image}
                                  alt="candidate preview"
                                  width={40}
                                  height={40}
                                  className="object-cover rounded"
                                />
                              )}
                              <label className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 cursor-pointer flex items-center gap-2 bg-white ext-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 relative">
                                <ImageIcon className="h-4 w-4" />
                                {uploadingImageCandIdx?.cat === catIndex &&
                                uploadingImageCandIdx?.cand === candIndex
                                  ? "Uploading..."
                                  : "Upload Image"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleCandidateImageUpload(
                                      catIndex,
                                      candIndex,
                                      e,
                                    )
                                  }
                                />
                              </label>
                            </div>
                            <input
                              type="text"
                              value={candidate.bio}
                              onChange={(e) =>
                                updateCandidate(
                                  catIndex,
                                  candIndex,
                                  "bio",
                                  e.target.value,
                                )
                              }
                              placeholder="Bio (optional)"
                              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <input
                              type="email"
                              value={candidate.email}
                              onChange={(e) =>
                                updateCandidate(
                                  catIndex,
                                  candIndex,
                                  "email",
                                  e.target.value,
                                )
                              }
                              placeholder="Email (optional)"
                              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <input
                              type="tel"
                              value={candidate.phone || ""}
                              onChange={(e) =>
                                updateCandidate(
                                  catIndex,
                                  candIndex,
                                  "phone",
                                  e.target.value,
                                )
                              }
                              placeholder="Phone Number *"
                              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCandidate(catIndex, candIndex)}
                            className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-500 mb-2">No categories yet</p>
              <button
                type="button"
                onClick={addCategory}
                className="text-primary-600 font-medium hover:underline"
              >
                Create your first category
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
