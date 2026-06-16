"use client";

import { useState, useEffect, useRef } from "react";
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
import toast from "react-hot-toast";
import { useModal } from "@/components/providers/ModalProvider";

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
  const modal = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventCode, setEventCode] = useState("");

  const [categories, setCategories] = useState<CategoryForm[]>([]);
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<string[]>([]);
  const [deletedCandidateIds, setDeletedCandidateIds] = useState<
    { categoryId: string; candidateId: string }[]
  >([]);
  const [uploadingImageCandIdx, setUploadingImageCandIdx] = useState<{
    cat: number;
    cand: number;
  } | null>(null);

  const draftKey = `categoriesDraft-${eventId}`;

  const fetchEvent = async () => {
    try {
      const data = await api.get(`/events/${eventId}`);
      const eventData = data.data || data.event || data;
      setEventTitle(eventData.title);
      setEventCode(eventData.eventCode || "");

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

  // Restore unsaved draft after server data has loaded
  const draftChecked = useRef(false);
  useEffect(() => {
    if (loading || draftChecked.current) return;
    draftChecked.current = true;
    const savedDraft = sessionStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.categories?.length) {
          setCategories(parsed.categories);
        }
        if (parsed.deletedCategoryIds?.length) {
          setDeletedCategoryIds(parsed.deletedCategoryIds);
        }
        if (parsed.deletedCandidateIds?.length) {
          setDeletedCandidateIds(parsed.deletedCandidateIds);
        }
        toast("Recovered unsaved edits from your browser", {
          icon: "🔄",
          duration: 3000,
        });
      } catch (e) {
        console.error("Failed to parse categories draft", e);
      }
    }
  }, [loading]);

  // Auto-save draft to sessionStorage on every change
  useEffect(() => {
    if (loading || !draftChecked.current) return;
    const draft = {
      categories,
      deletedCategoryIds,
      deletedCandidateIds,
    };
    sessionStorage.setItem(draftKey, JSON.stringify(draft));
  }, [categories, deletedCategoryIds, deletedCandidateIds, loading]);

  // Re-fetch when the tab regains focus, but only if there's no active draft
  // to avoid overwriting unsaved work.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const hasDraft = sessionStorage.getItem(draftKey);
        if (!hasDraft) fetchEvent();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

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

  const removeCategory = async (index: number) => {
    const category = categories[index];

    const confirmed = await modal.confirm({
      title: "Delete Category",
      message: `Are you sure you want to delete the category "${categories[index].name || "Untitled"}"? This will also remove all its candidates from the selection.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

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
                  code: "",
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

  const removeCandidate = async (catIdx: number, candIdx: number) => {
    const candidate = categories[catIdx].candidates[candIdx];

    const confirmed = await modal.confirm({
      title: "Delete Candidate",
      message: `Are you sure you want to remove ${categories[catIdx].candidates[candIdx].name || "this candidate"}?`,
      confirmText: "Remove",
      variant: "danger",
    });

    if (!confirmed) return;

    // Cleanup orphaned image if it exists
    if (candidate.imagePublicId) {
      api.deleteImage(candidate.imagePublicId).catch(() => {});
    }

    const categoryId = categories[catIdx].id;
    if (candidate.id && categoryId) {
      setDeletedCandidateIds((prev) => [
        ...prev,
        { categoryId, candidateId: candidate.id! },
      ]);
    }

    setCategories((prev) =>
      prev.map((c, i) =>
        i === catIdx
          ? {
              ...c,
              candidates: c.candidates.filter((_, j) => j !== candIdx),
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
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      toast.error("Invalid format. Please use JPG, PNG, WebP or GIF.");
      return;
    }

    const candidate = categories[catIndex].candidates[candIndex];

    setUploadingImageCandIdx({ cat: catIndex, cand: candIndex });
    setError("");

    try {
      // 1. If candidate already has an image, delete the old one first
      if (candidate.imagePublicId) {
        await api.deleteImage(candidate.imagePublicId).catch(() => {});
      }

      // 2. Upload new image
      const data = await api.uploadImage(file, "candidates");
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
        // Candidates are now optional during initial setup or nomination phase
        for (const cand of cat.candidates) {
          if (!cand.name.trim())
            throw new Error(`All candidates in ${cat.name} must have a name`);
          if (!cand.phone?.trim())
            throw new Error(
              `Candidate "${cand.name || "Unknown"}" in ${cat.name} must have a phone number`,
            );
        }
      }

      // 1. Fetch fresh backend state immediately before saving.
      //    Any nomination-approved candidates added since this component last
      //    loaded would be missing from local state and silently overwritten by
      //    a naive atomic PUT. We preserve them here.
      const freshData = await api.get(`/events/${eventId}`);
      const freshEvent = freshData.data || freshData.event || freshData;
      const backendCategories: any[] = freshEvent.categories || [];

      const deletedCandidateIdSet = new Set(
        deletedCandidateIds.map((d: { categoryId: string; candidateId: string }) => d.candidateId)
      );

      // 2. Compute the highest existing code suffix so fallback codes for any
      //    legacy candidates (created without a code during an earlier broken state)
      //    never collide with existing ones.
      let nextFallback = 1;
      backendCategories.forEach((bc: any) => {
        (bc.candidates || []).forEach((cand: any) => {
          if (cand.code && eventCode && cand.code.startsWith(eventCode)) {
            const n = parseInt(cand.code.slice(eventCode.length), 10);
            if (!isNaN(n) && n >= nextFallback) nextFallback = n + 1;
          }
        });
      });

      // 3. Build merged payload
      const syncPayload = {
        categories: categories.map((cat) => {
          const backendCat = backendCategories.find(
            (bc: any) => (bc._id || bc.id)?.toString() === cat.id?.toString()
          );

          const localCandidateIds = new Set(
            cat.candidates.map((c: CandidateForm) => c.id).filter(Boolean)
          );

          // Candidates that exist in the backend but aren't in local state and
          // haven't been explicitly deleted — these were approved from nominations
          // while the organizer had this page open.
          const orphans: any[] = backendCat
            ? backendCat.candidates.filter((bc: any) => {
                const bcId = (bc._id || bc.id)?.toString();
                return bcId && !localCandidateIds.has(bcId) && !deletedCandidateIdSet.has(bcId);
              })
            : [];

          return {
            _id: cat.id,
            name: cat.name,
            description: cat.description || null,
            candidates: [
              ...cat.candidates.map((cand: CandidateForm) => ({
                _id: cand.id,
                name: cand.name,
                description: cand.bio || null,
                email: cand.email || null,
                phone: cand.phone || null,
                imageUrl: cand.image || null,
                imagePublicId: cand.imagePublicId || null,
                code: cand.code || `${eventCode}${nextFallback++}`,
              })),
              ...orphans.map((bc: any) => ({
                _id: bc._id || bc.id,
                name: bc.name,
                description: bc.description || bc.bio || null,
                email: bc.email || null,
                phone: bc.phone || null,
                imageUrl: bc.imageUrl || bc.image || null,
                imagePublicId: bc.imagePublicId || null,
                code: bc.code || `${eventCode}${nextFallback++}`,
              })),
            ],
          };
        }),
      };

      // 3. Perform atomic sync
      await api.put(`/events/${eventId}`, syncPayload);

      toast.success("Changes saved successfully!");
      setDeletedCategoryIds([]);
      setDeletedCandidateIds([]);
      sessionStorage.removeItem(draftKey);
      router.refresh();
      fetchEvent();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Failed to save changes";
      setError(msg);
      toast.error(msg);
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
                        disabled={!eventCode}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!eventCode ? "Loading event code…" : undefined}
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
                            <input
                              type="text"
                              value={candidate.code ?? ""}
                              readOnly
                              className="px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg focus:outline-none cursor-not-allowed uppercase font-mono"
                              placeholder="Auto-generated"
                            />
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
