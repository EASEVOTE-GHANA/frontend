"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Vote,
  Ticket,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  MapPin,
  Globe,
  Lock,
  DollarSign,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import NominationFormDesigner, {
  NominationSettings,
} from "./NominationFormDesigner";
import { clsx } from "clsx";
import { api } from "@/lib/api-client";

type TicketTypeForm = {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
  maxPerOrder: string;
};

type CandidateForm = {
  id: string;
  code: string;
  name: string;
  bio: string;
  email: string;
  phone: string;
};

type CategoryForm = {
  id: string;
  name: string;
  description: string;
  isExpanded: boolean;
  candidates: CandidateForm[];
};

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateCandidateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function CreateEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const getOrdinalNum = (n: number) => {
    return (
      n +
      (n > 0
        ? ["th", "st", "nd", "rd"][
            (n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10
          ]
        : "")
    );
  };

  const formatInputDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = getOrdinalNum(date.getDate());
    const month = date.toLocaleString("en-GB", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "" as "VOTING" | "TICKETING" | "",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "21:00",
    votingStartDate: "",
    votingStartTime: "09:00",
    votingEndDate: "",
    votingEndTime: "17:00",
    nominationStartDate: "",
    nominationStartTime: "09:00",
    nominationEndDate: "",
    nominationEndTime: "17:00",
    location: "",
    venue: "",
    isPublic: true,
    votePrice: "",
    minVotesPerPurchase: "1",
    maxVotesPerPurchase: "",
    allowPublicNominations: false,
    coverImage: "",
    coverImageFile: null as File | null,
  });

  const [nominationSettings, setNominationSettings] =
    useState<NominationSettings>({
      isActive: true, // Default active if enabled
      whatsappLink: "",
      fields: [],
    });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([]);
  const [categories, setCategories] = useState<CategoryForm[]>([]);
  const [minDate, setMinDate] = useState<string>("");

  // Calculate minimum start date on the client-side to prevent hydration mismatch
  useEffect(() => {
    const now = new Date();
    // Add 15 minutes buffer
    now.setMinutes(now.getMinutes() + 15);
    
    // YYYY-MM-DD
    const dateString = now.toISOString().split("T")[0];
    setMinDate(dateString);

    // If initial formData is empty, set some reasonable defaults
    setFormData(prev => ({
        ...prev,
        startDate: dateString,
        endDate: dateString
    }));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const selectEventType = (type: "VOTING" | "TICKETING") => {
    setFormData((prev) => ({ ...prev, type }));
    if (type === "TICKETING" && ticketTypes.length === 0) {
      addTicketType();
    }
    if (type === "VOTING" && categories.length === 0) {
      addCategory();
    }
    setCurrentStep(2);
  };

  const addTicketType = () => {
    setTicketTypes((prev) => [
      ...prev,
      {
        id: generateId(),
        name: "",
        description: "",
        price: "",
        quantity: "",
        maxPerOrder: "10",
      },
    ]);
  };

  const updateTicketType = (
    id: string,
    field: keyof TicketTypeForm,
    value: string,
  ) => {
    setTicketTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const removeTicketType = (id: string) => {
    if (ticketTypes.length > 1) {
      setTicketTypes((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const addCategory = () => {
    setCategories((prev) => [
      ...prev,
      {
        id: generateId(),
        name: "",
        description: "",
        isExpanded: true,
        candidates: [],
      },
    ]);
  };

  const updateCategory = (
    id: string,
    field: keyof CategoryForm,
    value: unknown,
  ) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const removeCategory = (id: string) => {
    if (categories.length > 1) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const toggleCategoryExpand = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isExpanded: !c.isExpanded } : c)),
    );
  };

  const addCandidate = (categoryId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              candidates: [
                ...c.candidates,
                {
                  id: generateId(),
                  code: generateCandidateCode(),
                  name: "",
                  bio: "",
                  email: "",
                  phone: "",
                },
              ],
            }
          : c,
      ),
    );
  };

  const updateCandidate = (
    categoryId: string,
    candidateId: string,
    field: keyof CandidateForm,
    value: string,
  ) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              candidates: c.candidates.map((cand) =>
                cand.id === candidateId ? { ...cand, [field]: value } : cand,
              ),
            }
          : c,
      ),
    );
  };

  const removeCandidate = (categoryId: string, candidateId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              candidates: c.candidates.filter(
                (cand) => cand.id !== candidateId,
              ),
            }
          : c,
      ),
    );
  };

  const validateForm = () => {
    if (!formData.title.trim()) return "Event title is required";
    if (!formData.type) return "Please select an event type";
    if (formData.type === "VOTING") {
      // Dates are optional for Voted based events if they haven't been started yet?
      // Actually backend usually requires dates.
      if (!formData.startDate) return "Start date is required";
      if (!formData.endDate) return "End date is required";

      const startString = formData.startDate;
      const endString = formData.endDate;
      
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayString = `${year}-${month}-${day}`;

      // Removed past-date validation entirely to avoid timezone conflicts and allow retrospective creation

      if (endString < startString) {
        return "End date must be on or after the start date";
      }
    }

    if (!formData.coverImage.trim() && !formData.coverImageFile) {
      return "Cover image is required";
    }

    if (formData.type === "TICKETING") {
      for (const ticket of ticketTypes) {
        if (!ticket.name.trim()) return "All ticket types must have a name";
        if (!ticket.price || parseFloat(ticket.price) < 0)
          return "All ticket types must have a valid price";
        if (!ticket.quantity || parseInt(ticket.quantity) < 1)
          return "All ticket types must have a valid quantity";
      }
    }

    if (formData.type === "VOTING") {
      if (!formData.votePrice || parseFloat(formData.votePrice) <= 0) {
        return "Vote price is required for voting events";
      }
      if (categories.length === 0) {
        return "Please add at least one category to your voting event.";
      }
      for (const category of categories) {
        if (!category.name.trim()) return "All categories must have a name";
        if (category.candidates.length === 0) {
          return `Please add at least one candidate to the category: ${category.name}`;
        }
        for (const candidate of category.candidates) {
          if (!candidate.name.trim())
            return `All candidates in ${category.name} must have a name`;
          if (!candidate.phone.trim())
            return `Candidate "${candidate.name || 'Unknown'}" in ${category.name} must have a phone number`;
        }
      }
    }

    return null;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        coverImageFile: file,
        coverImage: URL.createObjectURL(file), // for preview
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      let imageUrl = formData.coverImage;
      let imagePublicId = null;

      // Upload image if a new file was selected
      if (formData.coverImageFile) {
        const uploadForm = new FormData();
        uploadForm.append("image", formData.coverImageFile);
        uploadForm.append("folder", "events");
        const uploadRes = await api.uploadFormData("/upload/image", uploadForm);
        imageUrl = uploadRes.imageUrl || uploadRes.url || imageUrl;
        imagePublicId = uploadRes.publicId || null;
      }

      const eventPayload = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        imageUrl,
        imagePublicId,
        startDate: formData.startDate ? new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString() : undefined,
        endDate: formData.endDate ? new Date(`${formData.endDate}T${formData.endTime}:00`).toISOString() : undefined,
        location: formData.location || null,
        venue: formData.venue || null,
        isPublic: formData.isPublic,
        // Conditional VOTING fields
        ...(formData.type === "VOTING" && {
          votingStartsAt: formData.votingStartDate ? new Date(`${formData.votingStartDate}T${formData.votingStartTime}:00`).toISOString() : null,
          votingEndsAt: formData.votingEndDate ? new Date(`${formData.votingEndDate}T${formData.votingEndTime}:00`).toISOString() : null,
          nominationStartsAt: formData.allowPublicNominations && formData.nominationStartDate ? new Date(`${formData.nominationStartDate}T${formData.nominationStartTime}:00`).toISOString() : null,
          nominationEndsAt: formData.allowPublicNominations && formData.nominationEndDate ? new Date(`${formData.nominationEndDate}T${formData.nominationEndTime}:00`).toISOString() : null,
          nominationDeadline: formData.allowPublicNominations && formData.nominationEndDate ? new Date(`${formData.nominationEndDate}T${formData.nominationEndTime}:00`).toISOString() : null,
          votingStartTime: formData.votingStartDate ? new Date(`${formData.votingStartDate}T${formData.votingStartTime}:00`).toISOString() : null,
          votingEndTime: formData.votingEndDate ? new Date(`${formData.votingEndDate}T${formData.votingEndTime}:00`).toISOString() : null,
          nominationStartTime: formData.allowPublicNominations && formData.nominationStartDate ? new Date(`${formData.nominationStartDate}T${formData.nominationStartTime}:00`).toISOString() : null,
          nominationEndTime: formData.allowPublicNominations && formData.nominationEndDate ? new Date(`${formData.nominationEndDate}T${formData.nominationEndTime}:00`).toISOString() : null,
          costPerVote: parseFloat(formData.votePrice),
          minVotesPerPurchase: parseInt(formData.minVotesPerPurchase) || 1,
          maxVotesPerPurchase: formData.maxVotesPerPurchase ? parseInt(formData.maxVotesPerPurchase) : null,
          allowPublicNominations: formData.allowPublicNominations,
          categories: categories.map((cat) => ({
            name: cat.name,
            description: cat.description || "Category description",
            candidates: cat.candidates.map((cand) => ({
              name: cand.name,
              description: cand.bio || "Candidate bio",
              code: cand.code,
              email: cand.email || `${cand.code.toLowerCase()}@easevote.com`,
              phone: cand.phone || "0000000000",
            })),
          })),
        }),
      };

      // 1. Create Event
      const eventRes = await api.post("/events", eventPayload);
      const eventId =
        eventRes.id || eventRes.data?.id || eventRes.event?.id || eventRes._id;

      if (!eventId) throw new Error("Event ID not returned from creation");

      // 2. Voting Event nested creations removed: Mongoose creates categories & candidates atomically from the root payload above

      // 3. Ticketing Event nested creations
      if (formData.type === "TICKETING") {
        for (let i = 0; i < ticketTypes.length; i++) {
          const ticket = ticketTypes[i];
          await api.post(`/events/${eventId}/ticket-types`, {
            name: ticket.name,
            description: ticket.description || null,
            price: parseFloat(ticket.price),
            quantity: parseInt(ticket.quantity),
          });
        }
      }

      // 4. Nomination Settings
      if (formData.type === "VOTING" && formData.allowPublicNominations) {
        try {
          await api.post(`/nominations/events/${eventId}/form`, {
            whatsappLink: nominationSettings.whatsappLink,
            customFields: nominationSettings.fields.map((field, index) => ({
              question: field.label,
              type: field.type.toLowerCase(),
              required: field.required,
              options: field.options,
              order: index,
            })),
          });
        } catch (nomError) {
          console.error("Failed to save nomination settings:", nomError);
        }
      }

      router.push(`/dashboard/events/${eventId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  const totalCandidates = categories.reduce(
    (acc, c) => acc + c.candidates.length,
    0,
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/events"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create New Event
          </h1>
          <p className="text-slate-500">
            Set up your voting or ticketing event
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((step) => {
          // Hide step 5 if not applicable
          if (
            step === 5 &&
            (formData.type !== "VOTING" || !formData.allowPublicNominations)
          )
            return null;

          const isLastStep =
            step ===
            (formData.type === "VOTING" && formData.allowPublicNominations
              ? 5
              : 4);

          return (
            <div key={step} className="flex items-center flex-shrink-0">
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  currentStep >= step
                    ? "bg-primary-600 text-white"
                    : "bg-slate-200 text-slate-500",
                )}
              >
                {step}
              </div>
              {!isLastStep && (
                <div
                  className={clsx(
                    "w-8 sm:w-16 h-1 mx-1",
                    currentStep > step ? "bg-primary-600" : "bg-slate-200",
                  )}
                />
              )}
            </div>
          );
        })}
        <span className="ml-4 text-sm text-slate-500 hidden md:inline font-medium">
          {currentStep === 1 && "Select Event Type"}
          {currentStep === 2 && "Basic Information"}
          {currentStep === 3 && "Event Media"}
          {currentStep === 4 &&
            (formData.type === "VOTING"
              ? "Categories & Candidates"
              : "Ticket Types")}
          {currentStep === 5 && "Nomination Form"}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 text-center">
              What type of event are you creating?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => selectEventType("VOTING")}
                className={clsx(
                  "p-6 rounded-xl border-2 text-left transition-all hover:shadow-md",
                  formData.type === "VOTING"
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200 hover:border-primary-300",
                )}
              >
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Vote className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Voting Event
                </h3>
                <p className="text-sm text-slate-600">
                  Create awards, pageants, or competitions where people vote for
                  their favorites. Includes categories and candidates.
                </p>
                <ul className="mt-4 space-y-1 text-sm text-slate-500">
                  <li>• Multiple categories</li>
                  <li>• Unlimited candidates per category</li>
                  <li>• Real-time vote tracking</li>
                  <li>• USSD and web voting</li>
                </ul>
              </button>

              <button
                type="button"
                onClick={() => selectEventType("TICKETING")}
                className={clsx(
                  "p-6 rounded-xl border-2 text-left transition-all hover:shadow-md",
                  formData.type === "TICKETING"
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200 hover:border-primary-300",
                )}
              >
                <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <Ticket className="h-7 w-7 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Ticketing Event
                </h3>
                <p className="text-sm text-slate-600">
                  Sell tickets for concerts, conferences, or any live event.
                  Multiple ticket types with different pricing.
                </p>
                <ul className="mt-4 space-y-1 text-sm text-slate-500">
                  <li>• Multiple ticket tiers</li>
                  <li>• Quantity limits per type</li>
                  <li>• QR code tickets</li>
                  <li>• Check-in management</li>
                </ul>
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={
                      formData.type === "VOTING"
                        ? "e.g., Miss Ghana 2025"
                        : "e.g., Rapperholic Concert 2024"
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell people what this event is about..."
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    General Event Duration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Start Date & Time *
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 group">
                          <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            min={minDate}
                            onChange={handleChange}
                            onClick={(e) => e.currentTarget.showPicker()}
                            onKeyDown={(e) => e.preventDefault()}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 peer"
                            required
                          />
                          <div className="w-full h-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white flex items-center transition-all peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:border-primary-500 peer-hover:border-primary-300">
                            <span className={formData.startDate ? "text-slate-900" : "text-slate-400"}>
                              {formData.startDate ? formatInputDate(formData.startDate) : "mm/dd/yyyy"}
                            </span>
                          </div>
                        </div>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          className="w-32 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-all cursor-pointer bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        End Date & Time *
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 group">
                          <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            min={formData.startDate || minDate}
                            onChange={handleChange}
                            onClick={(e) => e.currentTarget.showPicker()}
                            onKeyDown={(e) => e.preventDefault()}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 peer"
                            required
                          />
                          <div className="w-full h-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white flex items-center transition-all peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:border-primary-500 peer-hover:border-primary-300">
                            <span className={formData.endDate ? "text-slate-900" : "text-slate-400"}>
                              {formData.endDate ? formatInputDate(formData.endDate) : "mm/dd/yyyy"}
                            </span>
                          </div>
                        </div>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          className="w-32 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-all cursor-pointer bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Venue Name
                    </label>
                    <input
                      type="text"
                      name="venue"
                      value={formData.venue}
                      onChange={handleChange}
                      placeholder="e.g., Grand Arena, AICC"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Accra, Ghana"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Visibility
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        checked={formData.isPublic}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, isPublic: true }))
                        }
                        className="w-4 h-4 text-primary-600"
                      />
                      <Globe className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700">
                        Public - Listed on EaseVote
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        checked={!formData.isPublic}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, isPublic: false }))
                        }
                        className="w-4 h-4 text-primary-600"
                      />
                      <Lock className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700">
                        Private - Only via direct link
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {formData.type === "VOTING" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Voting Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Vote Price (GHS) *
                    </label>
                    <input
                      type="number"
                      name="votePrice"
                      value={formData.votePrice}
                      onChange={handleChange}
                      step="0.01"
                      min="0.01"
                      placeholder="1.00"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Min Votes per Transaction
                    </label>
                    <input
                      type="number"
                      name="minVotesPerPurchase"
                      value={formData.minVotesPerPurchase}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Max Votes per Transaction
                    </label>
                    <input
                      type="number"
                      name="maxVotesPerPurchase"
                      value={formData.maxVotesPerPurchase}
                      onChange={handleChange}
                      min="1"
                      placeholder="Unlimited"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Voting Phase Timelines</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Voting Start</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 group">
                          <input type="date" name="votingStartDate" value={formData.votingStartDate} onChange={handleChange} onClick={(e) => e.currentTarget.showPicker()} onKeyDown={(e) => e.preventDefault()} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 peer" />
                          <div className="w-full h-full px-3 py-2 border border-slate-200 rounded-lg bg-white flex items-center transition-all peer-focus:ring-2 peer-focus:ring-primary-500">
                            <span className={formData.votingStartDate ? "text-slate-900 text-sm" : "text-slate-400 text-sm"}>{formData.votingStartDate ? formatInputDate(formData.votingStartDate) : "mm/dd/yyyy"}</span>
                          </div>
                        </div>
                        <input type="time" name="votingStartTime" value={formData.votingStartTime} onChange={handleChange} className="w-28 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Voting End</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1 group">
                          <input type="date" name="votingEndDate" value={formData.votingEndDate} min={formData.votingStartDate} onChange={handleChange} onClick={(e) => e.currentTarget.showPicker()} onKeyDown={(e) => e.preventDefault()} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 peer" />
                          <div className="w-full h-full px-3 py-2 border border-slate-200 rounded-lg bg-white flex items-center transition-all peer-focus:ring-2 peer-focus:ring-primary-500">
                            <span className={formData.votingEndDate ? "text-slate-900 text-sm" : "text-slate-400 text-sm"}>{formData.votingEndDate ? formatInputDate(formData.votingEndDate) : "mm/dd/yyyy"}</span>
                          </div>
                        </div>
                        <input type="time" name="votingEndTime" value={formData.votingEndTime} onChange={handleChange} className="w-28 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowPublicNominations"
                      checked={formData.allowPublicNominations}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-slate-700">
                      Allow public nominations for this event
                    </span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={
                  !formData.title || !formData.startDate || !formData.endDate
                }
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Event Media
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <ImageIcon className="h-4 w-4 inline mr-1" />
                    Cover Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Upload an image for your event banner.
                  </p>
                </div>

                {formData.coverImage && (
                  <div className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={formData.coverImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && formData.type === "TICKETING" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Ticket Types
                  </h3>
                  <p className="text-sm text-slate-500">
                    Define different ticket tiers with their own prices and
                    quantities
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addTicketType}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Ticket Type
                </button>
              </div>

              <div className="space-y-4">
                {ticketTypes.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-slate-500">
                        Ticket Type {index + 1}
                      </span>
                      {ticketTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketType(ticket.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={ticket.name}
                          onChange={(e) =>
                            updateTicketType(ticket.id, "name", e.target.value)
                          }
                          placeholder="e.g., Regular, VIP, VVIP"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={ticket.description}
                          onChange={(e) =>
                            updateTicketType(
                              ticket.id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="e.g., Standard entry, Front row access"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Price (GHS) *
                        </label>
                        <input
                          type="number"
                          value={ticket.price}
                          onChange={(e) =>
                            updateTicketType(ticket.id, "price", e.target.value)
                          }
                          step="0.01"
                          min="0"
                          placeholder="200.00"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={ticket.quantity}
                            onChange={(e) =>
                              updateTicketType(
                                ticket.id,
                                "quantity",
                                e.target.value,
                              )
                            }
                            min="1"
                            placeholder="500"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Max per Order
                          </label>
                          <input
                            type="number"
                            value={ticket.maxPerOrder}
                            onChange={(e) =>
                              updateTicketType(
                                ticket.id,
                                "maxPerOrder",
                                e.target.value,
                              )
                            }
                            min="1"
                            placeholder="10"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && formData.type === "VOTING" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Categories & Candidates
                  </h3>
                  <p className="text-sm text-slate-500">
                    {categories.length}{" "}
                    {categories.length === 1 ? "category" : "categories"} •{" "}
                    {totalCandidates}{" "}
                    {totalCandidates === 1 ? "candidate" : "candidates"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCategory}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Category
                </button>
              </div>

              <div className="space-y-4">
                {categories.map((category, catIndex) => (
                  <div
                    key={category.id}
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <div
                      className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleCategoryExpand(category.id)}
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
                        {categories.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCategory(category.id);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
                                updateCategory(
                                  category.id,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g., Best Artist of the Year"
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
                                  category.id,
                                  "description",
                                  e.target.value,
                                )
                              }
                              placeholder="Brief description of this category"
                              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-4 mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-slate-900">
                              Candidates
                            </h4>
                            <button
                              type="button"
                              onClick={() => addCandidate(category.id)}
                              className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-md transition-colors font-medium"
                            >
                              <Plus className="h-3 w-3" />
                              Add Candidate
                            </button>
                          </div>
                          
                          {category.candidates.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">
                              No candidates added yet. You can add them here now, or later from your dashboard.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {category.candidates.map((cand, candIndex) => (
                                <div key={cand.id} className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <input
                                          type="text"
                                          placeholder="Candidate Name *"
                                          value={cand.name}
                                          onChange={(e) => updateCandidate(category.id, cand.id, "name", e.target.value)}
                                          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                        />
                                      </div>
                                      <div>
                                        <input
                                          type="text"
                                          placeholder="Voting Code (e.g., JDO)"
                                          value={cand.code}
                                          onChange={(e) => updateCandidate(category.id, cand.id, "code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
                                          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono uppercase bg-white"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div>
                                        <input
                                          type="email"
                                          placeholder="Email Address"
                                          value={cand.email}
                                          onChange={(e) => updateCandidate(category.id, cand.id, "email", e.target.value)}
                                          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                        />
                                      </div>
                                      <div>
                                        <input
                                          type="tel"
                                          placeholder="Phone Number *"
                                          value={cand.phone}
                                          onChange={(e) => updateCandidate(category.id, cand.id, "phone", e.target.value)}
                                          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <textarea
                                        placeholder="Brief bio or description (optional)"
                                        value={cand.bio}
                                        onChange={(e) => updateCandidate(category.id, cand.id, "bio", e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-white"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeCandidate(category.id, cand.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0 mt-0.5"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type={
                  formData.type === "VOTING" && formData.allowPublicNominations
                    ? "button"
                    : "submit"
                }
                disabled={saving}
                onClick={
                  formData.type === "VOTING" && formData.allowPublicNominations
                    ? () => setCurrentStep(5)
                    : undefined
                }
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : formData.type === "VOTING" &&
                  formData.allowPublicNominations ? (
                  "Continue"
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        {currentStep === 5 &&
          formData.type === "VOTING" &&
          formData.allowPublicNominations && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Calendar className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Configure Nomination Timelines Later</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    For now, you are only designing the nomination questions. You can set the specific start and end dates for the nomination phase in your event's <b>Nomination Settings</b> once the event is created.
                  </p>
                </div>
              </div>

              <NominationFormDesigner
                settings={nominationSettings}
                onChange={setNominationSettings}
              />

              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Event
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
      </form>
    </div>
  );
}
