"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Calendar,
  MapPin,
  Vote,
  Globe,
  Lock,
  Image as ImageIcon,
  AlertCircle,
  Ticket,
  Plus,
  Trash2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { getEventStatus } from "@/lib/utils/event-status";
import { api } from "@/lib/api-client";
import { clsx } from "clsx";
import Image from "next/image";
import toast from "react-hot-toast";
import { useModal } from "@/components/providers/ModalProvider";

type TicketTypeForm = {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: string;
  maxPerOrder: string;
  soldCount: number;
  isNew?: boolean;
};

type Event = {
  id: string;
  eventCode: string;
  title: string;
  description: string | null;
  type: "VOTING" | "TICKETING" | "HYBRID";
  status: string;
  coverImage: string | null;
  bannerImage: string | null;
  startDate: string;
  endDate: string;
  costPerVote: number | null;
  minVotesPerPurchase: number;
  maxVotesPerPurchase: number | null;
  location: string | null;
  venue: string | null;
  isPublic: boolean;
  allowPublicNominations: boolean;
  nominationStartsAt?: string | null;
  nominationEndsAt?: string | null;
  nominationStartTime?: string | null;
  nominationEndTime?: string | null;
  nominationDeadline: string | null;
  votingStartsAt?: string | null;
  votingEndsAt?: string | null;
  votingStartTime?: string | null;
  votingEndTime?: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  ticketTypes?: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    quantity: number;
    soldCount: number;
    maxPerOrder: number;
  }>;
};

interface EventFormProps {
  eventId: string;
  currentStatus?: string;
  backUrl?: string; // Where to go on cancel/back (e.g. /dashboard/events or /dashboard/events)
}

export function EventForm({ eventId, currentStatus, backUrl }: EventFormProps) {
  const router = useRouter();
  const modal = useModal();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "VOTING" as "VOTING" | "TICKETING" | "HYBRID",
    startDate: "",
    startTime: "09:00",
    endDate: "",
    endTime: "21:00",
    costPerVote: "",
    minVotesPerPurchase: "1",
    maxVotesPerPurchase: "",
    location: "",
    venue: "",
    isPublic: true,
    allowPublicNominations: false,
    imageUrl: "",
    imagePublicId: "",
    votingStartDate: "",
    votingStartTime: "09:00",
    votingEndDate: "",
    votingEndTime: "23:59",
  });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([]);
  const [deletedTicketTypeIds, setDeletedTicketTypeIds] = useState<string[]>(
    [],
  );

  const generateId = () => Math.random().toString(36).substring(2, 9);

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
        soldCount: 0,
        isNew: true,
      },
    ]);
  };

  const updateTicketType = (
    id: string,
    field: keyof TicketTypeForm,
    value: string,
  ) => {
    let newValue = value;
    // Strip leading zeros for quantities/prices unless it's a decimal like 0.5
    if ((field === "price" || field === "quantity" || field === "maxPerOrder") && newValue.length > 1 && newValue.startsWith("0") && newValue[1] !== ".") {
      newValue = newValue.replace(/^0+/, "");
    }

    setTicketTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: newValue } : t)),
    );
  };

  const removeTicketType = async (id: string) => {
    const ticket = ticketTypes.find((t) => t.id === id);
    if (ticket && ticket.soldCount > 0) {
      setError("Cannot remove a ticket type that has sales");
      return;
    }

    const confirmed = await modal.confirm({
      title: "Remove Ticket Type",
      message: `Are you sure you want to remove the ticket type "${ticket?.name || "Untitled"}"?`,
      confirmText: "Remove",
      variant: "danger"
    });

    if (!confirmed) return;

    if (ticketTypes.length > 1) {
      if (ticket && !ticket.isNew) {
        setDeletedTicketTypeIds((prev) => [...prev, id]);
      }
      setTicketTypes((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const parseDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return { date: "", time: "09:00" };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { date: "", time: "09:00" };

    // Use local components for the UI to prevent UTC shifting in <input type="date">
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
  };

  const formatInputDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await api.get(`/events/${eventId}`);
        setEvent(data.data || data.event || data);

        const d = data.data || data.event || data;

        const start = parseDateTime(d.startDate);
        const end = parseDateTime(d.endDate);
        const vStart = parseDateTime(d.votingStartTime || d.votingStartDate || d.startDate);
        const vEnd = parseDateTime(d.votingEndTime || d.votingEndDate || d.endDate);

        setFormData({
          title: d.title || "",
          description: d.description || "",
          type: d.type || "VOTING",
          startDate: start.date,
          startTime: start.time,
          endDate: end.date,
          endTime: end.time,
          votingStartDate: vStart.date,
          votingStartTime: vStart.time,
          votingEndDate: vEnd.date,
          votingEndTime: vEnd.time,
          costPerVote:
            d.costPerVote?.toString() || d.votePrice?.toString() || "",
          minVotesPerPurchase:
            d.minVotesPerPurchase?.toString() ||
            d.minVotes?.toString() ||
            "1",
          maxVotesPerPurchase:
            d.maxVotesPerPurchase?.toString() ||
            d.maxVotes?.toString() ||
            "",
          location: d.location || "",
          venue: d.venue || "",
          isPublic: d.isPublic ?? true,
          allowPublicNominations:
            d.allowPublicNominations ?? d.allowNominations ?? false,
          imageUrl: d.imageUrl || d.coverImage || "",
          imagePublicId: d.imagePublicId || "",
        });

        if (data.ticketTypes && data.ticketTypes.length > 0) {
          setTicketTypes(
            data.ticketTypes.map(
              (t: any) => ({
                id: (t.id || t._id || t.id)?.toString(),
                name: t.name,
                description: t.description || "",
                price: t.price.toString(),
                quantity: t.quantity.toString(),
                maxPerOrder: t.maxPerOrder?.toString() || "10",
                soldCount: t.soldCount || 0,
                isNew: false,
              }),
            ),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

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
      let newValue = value;
      // Strip leading zeros for numeric fields (but allow 0.5 etc)
      if (type === "number" && newValue.length > 1 && newValue.startsWith("0") && newValue[1] !== ".") {
        newValue = newValue.replace(/^0+/, "");
      }
      setFormData((prev) => ({ ...prev, [name]: newValue }));
    }
  };

  const handleImageDelete = async () => {
    const confirmed = await modal.confirm({
      title: "Remove Cover Image",
      message: "Are you sure you want to remove the current cover image?",
      confirmText: "Remove",
      variant: "danger"
    });

    if (confirmed) {
      try {
        if (formData.imagePublicId) {
          await api.deleteImage(formData.imagePublicId).catch(console.error);
        }
        setFormData((prev) => ({ ...prev, imageUrl: "", imagePublicId: "" }));
        toast.success("Image removed");
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPEG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size allowed is 5MB.");
      return;
    }

    const uploadForm = new FormData();
    uploadForm.append("image", file);
    uploadForm.append("folder", "events");

    try {
      setIsUploadingImage(true);
      if (formData.imagePublicId) {
        await api.deleteImage(formData.imagePublicId).catch(console.error);
      }
      const res = await api.uploadFormData("/upload/image", uploadForm);
      setFormData((prev) => ({
        ...prev,
        imageUrl: res.url || res.imageUrl,
        imagePublicId: res.publicId,
      }));
      setSuccess("Image uploaded successfully!");
    } catch (err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const originalStart = event ? new Date(event.startDate).toISOString() : null;
      const originalEnd = event ? new Date(event.endDate).toISOString() : null;

      const startISO = formData.startDate ? new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString() : undefined;
      const endISO = formData.endDate ? new Date(`${formData.endDate}T${formData.endTime}:00`).toISOString() : undefined;

      const votingStartISO = (formData.type === "VOTING" || formData.type === "HYBRID") && formData.votingStartDate
        ? new Date(`${formData.votingStartDate}T${formData.votingStartTime}:00`).toISOString()
        : undefined;
      const votingEndISO = (formData.type === "VOTING" || formData.type === "HYBRID") && formData.votingEndDate
        ? new Date(`${formData.votingEndDate}T${formData.votingEndTime}:00`).toISOString()
        : undefined;

      // Validation
      if ((formData.type === "VOTING" || formData.type === "HYBRID")) {
        if (!votingStartISO || !votingEndISO) {
          setError("Voting start and end dates are required for voting events.");
          return;
        }

        // Window bounds validation
        if (startISO && votingStartISO && new Date(votingStartISO) < new Date(startISO)) {
          setError("Voting cannot start before the event starts.");
          return;
        }
        if (endISO && votingEndISO && new Date(votingEndISO) > new Date(endISO)) {
          setError("Voting cannot end after the event ends.");
          return;
        }
      }

      const {
        startDate, startTime, endDate, endTime,
        votingStartDate, votingStartTime, votingEndDate, votingEndTime,
        ...cleanedData
      } = formData;

      const payload: Record<string, unknown> = {
        ...cleanedData,
        ...(startISO && startISO !== originalStart ? { startDate: startISO } : {}),
        ...(endISO && endISO !== originalEnd ? { endDate: endISO } : {}),
        ...(votingStartISO ? { votingStartTime: votingStartISO, votingStartDate: votingStartISO } : {}),
        ...(votingEndISO ? { votingEndTime: votingEndISO, votingEndDate: votingEndISO } : {}),
        costPerVote: formData.costPerVote ? parseFloat(formData.costPerVote) : null,
        minVotesPerPurchase: parseInt(formData.minVotesPerPurchase) || 1,
        maxVotesPerPurchase: formData.maxVotesPerPurchase ? parseInt(formData.maxVotesPerPurchase) : null,
        allowPublicNominations: formData.allowPublicNominations,
        imageUrl: formData.imageUrl,
        imagePublicId: formData.imagePublicId,
      };

      const result = await api.put(`/events/${eventId}`, payload);

      if (!result.id && !result._id && !result.success) {
        throw new Error("Failed to update event");
      }

      if (formData.type === "TICKETING" || formData.type === "HYBRID") {
        for (const id of deletedTicketTypeIds) {
          await api.delete(`/events/${eventId}/ticket-types/${id}`);
        }

        for (const t of ticketTypes) {
          const tPayload = {
            name: t.name,
            description: t.description || null,
            price: parseFloat(t.price),
            quantity: parseInt(t.quantity),
            maxPerOrder: parseInt(t.maxPerOrder) || 10,
          };

          const ticketId = t.id || (t as any)._id;

          if (!ticketId && !t.isNew) {
            console.warn("Skipping ticket update due to missing ID:", t.name);
            continue;
          }

          if (t.isNew) {
            await api.post(`/events/${eventId}/ticket-types`, tPayload);
          } else {
            await api.put(`/events/${eventId}/ticket-types/${ticketId}`, tPayload);
          }
        }
      }

      toast.success("Event updated successfully!");
      setDeletedTicketTypeIds([]);
      router.refresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to update event";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-8 bg-slate-200 rounded w-64 animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 h-96 animate-pulse" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error || "Event not found"}</p>
        </div>
      </div>
    );
  }

  const status = currentStatus || event.status;
  const isLive = status === "LIVE";
  const backHref = backUrl || `/dashboard/events/${eventId}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Event</h1>
            <p className="text-slate-500">{event.title}</p>
          </div>
        </div>
      </div>

      {isLive && status === "LIVE" && (
        <div className="flex items-center gap-3 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-primary-600" />
          <p className="text-sm text-primary-800">
            This event is currently live. Only certain fields can be edited. To
            make major changes, please pause the event first.
          </p>
        </div>
      )}

      {status === "PAUSED" && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Clock className="h-5 w-5 text-blue-600" />
          <p className="text-sm text-blue-800">
            This event is currently paused. You can edit all fields and then resume the event from the dashboard.
          </p>
        </div>
      )}

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
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Basic Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Event Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={isLive}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <ImageIcon className="h-4 w-4 inline mr-1" />
                Cover Image
              </label>
              <div className="flex flex-col gap-4">
                {formData.imageUrl ? (
                  <div className="group relative w-full h-64 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <Image
                      src={formData.imageUrl}
                      alt="Event Cover"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Hover Overlay */}
                    <div className={clsx(
                      "absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center gap-3",
                      isUploadingImage ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-2 text-white">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="text-xs font-medium">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <label className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-slate-900 rounded-full cursor-pointer transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg group-active:scale-95">
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-sm font-semibold">Replace Cover Image</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleImageDelete}
                            className="p-2.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg hover:rotate-12 active:scale-95"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-primary-400 transition-all group overflow-hidden relative">
                    {isUploadingImage ? (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 text-primary-600 animate-in fade-in">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-xs font-medium">Uploading cover image...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 transition-transform duration-300 group-hover:scale-105 text-center px-4">
                        <div className="p-3 bg-slate-100 rounded-full text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                        <div>
                          <span className="block text-sm font-semibold text-slate-900">Upload Cover Image</span>
                          <span className="block text-xs text-slate-500 mt-1">Recommended size: 1200x630 (PNG, JPG or WEBP)</span>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Event Type
                </label>
                {eventId ? (
                  <div className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-500" />
                    {formData.type.charAt(0) + formData.type.slice(1).toLowerCase()}
                  </div>
                ) : (
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="VOTING">Voting</option>
                    <option value="TICKETING">Ticketing</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Visibility
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, isPublic: true }))
                      }
                      className="w-4 h-4 text-primary-600"
                    />
                    <Globe className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">Public</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isPublic"
                      checked={!formData.isPublic}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, isPublic: false }))
                      }
                      className="w-4 h-4 text-primary-600"
                    />
                    <Lock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">Private</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
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
                    onChange={handleChange}
                    disabled={isLive}
                    onClick={(e) => e.currentTarget.showPicker()}
                    onKeyDown={(e) => e.preventDefault()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 peer disabled:cursor-not-allowed"
                    required
                  />
                  <div className="w-full h-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white flex items-center transition-all peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:border-primary-500 peer-hover:border-primary-300 disabled:bg-slate-100">
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
                  disabled={isLive}
                  className="w-32 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-all cursor-pointer bg-white disabled:bg-slate-100"
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
                    min={formData.startDate}
                    onChange={handleChange}
                    disabled={isLive}
                    onClick={(e) => e.currentTarget.showPicker()}
                    onKeyDown={(e) => e.preventDefault()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 peer disabled:cursor-not-allowed"
                    required
                  />
                  <div className="w-full h-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white flex items-center transition-all peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:border-primary-500 peer-hover:border-primary-300 disabled:bg-slate-100">
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
                  disabled={isLive}
                  className="w-32 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-all cursor-pointer bg-white disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {(formData.type === "VOTING" || formData.type === "HYBRID") && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-primary-50 rounded-lg">
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
              Voting Window (Required)
            </h3>
            <p className="text-xs text-slate-500 mb-4 -mt-2">
              Define the exact period when votes can be cast. This can be different from the general event dates.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Voting Opens *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <input
                      type="date"
                      name="votingStartDate"
                      value={formData.votingStartDate}
                      onChange={handleChange}
                      onClick={(e) => e.currentTarget.showPicker()}
                      onKeyDown={(e) => e.preventDefault()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 peer"
                      required
                    />
                    <div className="w-full h-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white flex items-center transition-all peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:border-primary-500 peer-hover:border-primary-300">
                      <span className={formData.votingStartDate ? "text-slate-900" : "text-slate-400"}>
                        {formData.votingStartDate ? formatInputDate(formData.votingStartDate) : "mm/dd/yyyy"}
                      </span>
                    </div>
                  </div>
                  <input
                    type="time"
                    name="votingStartTime"
                    value={formData.votingStartTime}
                    onChange={handleChange}
                    className="w-32 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-all cursor-pointer bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Voting Closes *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <input
                      type="date"
                      name="votingEndDate"
                      value={formData.votingEndDate}
                      min={formData.votingStartDate}
                      onChange={handleChange}
                      onClick={(e) => e.currentTarget.showPicker()}
                      onKeyDown={(e) => e.preventDefault()}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 peer"
                      required
                    />
                    <div className="w-full h-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white flex items-center transition-all peer-focus:ring-2 peer-focus:ring-primary-500 peer-focus:border-primary-500 peer-hover:border-primary-300">
                      <span className={formData.votingEndDate ? "text-slate-900" : "text-slate-400"}>
                        {formData.votingEndDate ? formatInputDate(formData.votingEndDate) : "mm/dd/yyyy"}
                      </span>
                    </div>
                  </div>
                  <input
                    type="time"
                    name="votingEndTime"
                    value={formData.votingEndTime}
                    onChange={handleChange}
                    className="w-32 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 hover:border-primary-300 transition-all cursor-pointer bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Venue Name
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g., National Theatre"
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
        </div>

        {(formData.type === "VOTING" || formData.type === "HYBRID") && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Voting Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vote Price (GHS)
                </label>
                <input
                  type="number"
                  name="costPerVote"
                  value={formData.costPerVote}
                  onChange={handleChange}
                  disabled={isLive}
                  step="0.01"
                  min="0"
                  placeholder="1.00"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                  disabled={isLive}
                  min="1"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                  disabled={isLive}
                  min="1"
                  placeholder="Unlimited"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowPublicNominations"
                  checked={formData.allowPublicNominations}
                  onChange={handleChange}
                  disabled={isLive}
                  className="w-4 h-4 text-primary-600 rounded disabled:cursor-not-allowed"
                />
                <span className="text-sm text-slate-700">
                  Allow public nominations for this event
                </span>
              </label>

              {/* Nomination Phase Timelines Removed - Managed in Nomination Settings */}
            </div>
          </div>
        )}

        {(formData.type === "TICKETING" || formData.type === "HYBRID") && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Ticket Types
                </h3>
                <p className="text-sm text-slate-500">
                  Manage ticket tiers with their own prices and quantities
                </p>
              </div>
              {!isLive && (
                <button
                  type="button"
                  onClick={addTicketType}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Ticket Type
                </button>
              )}
            </div>

            {ticketTypes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Ticket className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No ticket types configured</p>
                <button
                  type="button"
                  onClick={addTicketType}
                  className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Add your first ticket type
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {ticketTypes.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-500">
                          Ticket Type {index + 1}
                        </span>
                        {ticket.soldCount > 0 && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            {ticket.soldCount} sold
                          </span>
                        )}
                      </div>
                      {ticketTypes.length > 1 &&
                        !isLive &&
                        ticket.soldCount === 0 && (
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
                          disabled={isLive && ticket.soldCount > 0}
                          placeholder="e.g., Regular, VIP, VVIP"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                          disabled={isLive}
                          step="0.01"
                          min="0"
                          placeholder="200.00"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                            disabled={
                              isLive &&
                              parseInt(ticket.quantity) <= ticket.soldCount
                            }
                            min={ticket.soldCount || 1}
                            placeholder="500"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          {/* <Link
            href={backHref}
            className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link> */}
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
