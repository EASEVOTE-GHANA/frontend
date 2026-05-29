"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

export default function NominateClient({ event }: { event: any }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nomineeName: "",
    nomineePhone: "",
    nomineeEmail: "",
    categoryId: "",
    bio: "",
    nominatorName: "",
    nominatorPhone: "",
  });
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [formConfig, setFormConfig] = useState<any>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchFormConfig = async () => {
      try {
        const res = await api.get(`/nominations/events/${event.id}/form`);
        setFormConfig(res.data || res);
      } catch (err) {
        console.error("Failed to fetch nomination form config:", err);
      } finally {
        setIsLoadingForm(false);
      }
    };
    fetchFormConfig();
  }, [event.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomFieldChange = (question: string, value: string) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let imageUrl = "";

      // 1. Upload Image
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        uploadData.append("folder", "candidates");

        const uploadRes = await api.uploadFormData("/upload/image", uploadData);
        imageUrl = uploadRes.data.url;
      } else {
        setErrorMsg("Please provide a photo of the nominee.");
        setIsSubmitting(false);
        return;
      }

      // 2. Format Custom Fields
      const customFields = Object.entries(customAnswers).map(([question, answer]) => ({
        question,
        answer,
      }));

      // 3. Submit Nomination
      // Guide: POST /api/nominations/events/:eventId/submit
      await api.post(`/nominations/events/${event.id}/submit`, {
        nomineeName: formData.nomineeName,
        nomineePhone: formData.nomineePhone,
        email: formData.nomineeEmail || undefined,
        categoryId: formData.categoryId,
        bio: formData.bio || undefined,
        photoUrl: imageUrl,
        customFields,
        nominatorName: formData.nominatorName,
        nominatorPhone: formData.nominatorPhone,
      });

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Nomination failed:", error);
      setErrorMsg(
        error.message || "Failed to submit nomination. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Nomination Submitted!
          </h2>
          <p className="text-slate-500 mb-8">
            Thank you for participating! The organizer will review your
            nomination. If approved, the candidate will appear on the voting
            page.
          </p>
          {formConfig?.whatsappLink && (
            <a
              href={formConfig.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all mb-3"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Join WhatsApp Group
            </a>
          )}
          <button
            onClick={() => router.push(`/events/${event.eventCode}`)}
            className="w-full py-4 bg-primary-700 hover:bg-primary-700 text-white font-bold rounded-xl transition-all"
          >
            Return to Event
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={40} />
      </div>
    );
  }

  if (event && !event.allowPublicNominations) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Nominations are Closed
          </h2>
          <p className="text-slate-500 mb-8">
            Public nominations for this event are currently not available.
          </p>
          <button
            onClick={() => router.push(`/events/${event.eventCode}`)}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl transition-all"
          >
            Return to Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-500 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-3xl mx-auto relative z-10">
          <Link
            href={`/events/${event.eventCode}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Back to Event
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            File a Nomination
          </h1>
          <p className="text-lg text-white/80 max-w-xl">
            Submit a candidate you believe deserves recognition for{" "}
            {event.title}.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                {errorMsg}
              </div>
            )}

            {/* Section: Nominee Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Nominee Details</h3>
              
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nominee Photo *
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-dashed border-gray-300 relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Upload size={24} />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Upload a clear photo
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      JPG, PNG or GIF (Max 2MB)
                    </p>
                    <button
                      type="button"
                      className="mt-2 text-sm font-bold text-primary-600 hover:text-primary-800"
                      onClick={() => {
                        const fileInput = document.querySelector(
                          'input[type="file"]',
                        ) as HTMLInputElement;
                        if (fileInput) fileInput.click();
                      }}
                    >
                      Select File
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nominee Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nomineeName}
                    onChange={(e) =>
                      setFormData({ ...formData, nomineeName: e.target.value })
                    }
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-medium text-slate-900 bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.nomineePhone}
                    onChange={(e) =>
                      setFormData({ ...formData, nomineePhone: e.target.value })
                    }
                    placeholder="e.g. 0244000000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-medium text-slate-900 bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Award Category *
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-medium text-slate-900 bg-gray-50/50 appearance-none"
                  >
                    <option value="" disabled>
                      Select a category
                    </option>
                    {event.categories &&
                      event.categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                        fillRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nominee Bio / Description
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  placeholder="Tell us about the nominee..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-medium text-slate-900 bg-gray-50/50 resize-none"
                ></textarea>
              </div>
            </div>

            {/* Section: Custom Questions */}
            {formConfig && formConfig.customFields && formConfig.customFields.length > 0 && (
              <div className="space-y-6 pt-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Additional Information</h3>
                {formConfig.customFields.map((field: any, index: number) => (
                  <div key={index}>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {field.question} {field.required ? "*" : ""}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        required={field.required}
                        rows={3}
                        onChange={(e) => handleCustomFieldChange(field.question, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-medium text-slate-900 bg-gray-50/50 resize-none"
                      />
                    ) : field.type === "select" ? (
                      <select
                        required={field.required}
                        onChange={(e) => handleCustomFieldChange(field.question, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-medium text-slate-900 bg-gray-50/50"
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        required={field.required}
                        onChange={(e) => handleCustomFieldChange(field.question, e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-medium text-slate-900 bg-gray-50/50"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Section: Nominator Information */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Your Information (Nominator)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nominatorName}
                    onChange={(e) =>
                      setFormData({ ...formData, nominatorName: e.target.value })
                    }
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-medium text-slate-900 bg-gray-50/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Your Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.nominatorPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, nominatorPhone: e.target.value })
                    }
                    placeholder="e.g. 0244000000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all font-medium text-slate-900 bg-gray-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Nomination"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
