"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
type NominationFieldType = "TEXT" | "TEXTAREA" | "NUMBER" | "EMAIL" | "PHONE" | "SELECT" | "MULTI_SELECT" | "CHECKBOX" | "FILE" | "URL";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  MoreVertical,
  GripVertical,
  Calendar,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

interface FormBuilderProps {
  eventId: string;
  initialForm: any;
  event: any;
}

export default function FormBuilder({
  eventId,
  initialForm,
  event,
}: FormBuilderProps) {
  const [fields, setFields] = useState<any[]>(initialForm?.customFields || initialForm?.fields || []);
  const [isActive, setIsActive] = useState(event?.allowPublicNominations || false);
  const [whatsappLink, setWhatsappLink] = useState(
    initialForm?.whatsappLink || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Field State
  const [newField, setNewField] = useState({
    label: "",
    type: "TEXT" as NominationFieldType,
    required: false,
    options: "", // Comma sep for now
  });

  // Date Formatting Helpers
  const toInputDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
  };

  const toInputTime = (dateStr: string | null) => {
    if (!dateStr) return "09:00";
    const d = new Date(dateStr);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  // Timeline State
  const [nomDates, setNomDates] = useState({
    startDate: toInputDate(event?.nominationStartsAt || event?.nominationStartTime),
    startTime: toInputTime(event?.nominationStartsAt || event?.nominationStartTime),
    endDate: toInputDate(event?.nominationEndsAt || event?.nominationEndTime || event?.nominationDeadline),
    endTime: toInputTime(event?.nominationEndsAt || event?.nominationEndTime || event?.nominationDeadline),
  });
  const [isSavingDuration, setIsSavingDuration] = useState(false);
  const [isSaveSuccess, setIsSaveSuccess] = useState(false);
  const router = useRouter();

  // Keep state in sync with server data when prop updates (e.g. on manual refresh)
  useEffect(() => {
    setNomDates({
      startDate: toInputDate(event?.nominationStartsAt || event?.nominationStartTime),
      startTime: toInputTime(event?.nominationStartsAt || event?.nominationStartTime),
      endDate: toInputDate(event?.nominationEndsAt || event?.nominationEndTime || event?.nominationDeadline),
      endTime: toInputTime(event?.nominationEndsAt || event?.nominationEndTime || event?.nominationDeadline),
    });
    setIsActive(event?.allowPublicNominations || false);
    setWhatsappLink(initialForm?.whatsappLink || "");
  }, [event, initialForm]);

  const fieldTypes: NominationFieldType[] = [
    "TEXT",
    "TEXTAREA",
    "NUMBER",
    "EMAIL",
    "PHONE",
    "SELECT",
    "MULTI_SELECT",
    "CHECKBOX",
    "FILE",
    "URL",
  ];

  const handleToggleActive = async () => {
    const newState = !isActive;
    setIsActive(newState);
    
    try {
      // 1. Update the event's visibility flag (Master Switch)
      await api.put(`/events/${eventId}`, { allowPublicNominations: newState });
      
      toast.success(`Nominations ${newState ? "Enabled" : "Disabled"}`);
    } catch (error: any) {
      console.error("Status update failed:", error);
      const errMsg = error?.message || "";
      if (errMsg.includes("modify live")) {
        alert("🔒 This setting is currently locked because the event is LIVE. \n\nPlease ensure your event structure is finalized before publishing.");
      } else {
        toast.error("Failed to update status");
      }
      setIsActive(!newState); // Revert to original state
    }
  };

  const handleSaveDuration = async () => {
    setIsSavingDuration(true);
    try {
      const startISO = nomDates.startDate ? new Date(`${nomDates.startDate}T${nomDates.startTime}:00`).toISOString() : null;
      const endISO = nomDates.endDate ? new Date(`${nomDates.endDate}T${nomDates.endTime}:00`).toISOString() : null;

      // Include voting times from the original event to ensure a complete update record
      await api.put(`/events/${eventId}`, {
        nominationStartsAt: startISO,
        nominationStartTime: startISO,
        nominationEndsAt: endISO,
        nominationEndTime: endISO,
        nominationDeadline: endISO,
        // Carry over existing voting dates to ensure consistent backend validation/persistence
        votingStartsAt: event.votingStartsAt,
        votingEndsAt: event.votingEndsAt,
        votingStartTime: event.votingStartTime,
        votingEndTime: event.votingEndTime
      });

      toast.success("Nomination timelines have been successfully updated!", {
        duration: 4000,
        icon: '📅'
      });
      
      setIsSavingDuration(false);
      setIsSaveSuccess(true);
      router.refresh(); // Tells Next.js to re-fetch the server component data
      
      // Reset success state after 2.5 seconds
      setTimeout(() => {
        setIsSaveSuccess(false);
      }, 2500);
    } catch (error: any) {
      const errMsg = error?.message || "";
      if (errMsg.includes("modify live")) {
        alert("🔒 This setting is currently locked because the event is LIVE.");
      } else {
        toast.error("Failed to save duration");
      }
    } finally {
      setIsSavingDuration(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // 1. Update the nomination form questions (Clean Payload)
      await api.post(`/nominations/events/${eventId}/form`, {
        whatsappLink,
        customFields: fields.map((f, i) => ({
          question: f.label || f.question,
          type: (f.type || "text").toLowerCase(),
          required: f.required || false,
          options: f.options,
          order: i,
        })),
      });

      toast.success("Questions updated");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // ... (rest of functions)

  const handleSaveField = async () => {
    if (!newField.label) {
      toast.error("Label is required");
      return;
    }

    setIsSaving(true);
    try {
      const optionsArray = newField.options
        ? newField.options.split(",").map((s: string) => s.trim())
        : [];

      const newFieldData = {
        question: newField.label,
        type: newField.type.toLowerCase(),
        required: newField.required,
        options: optionsArray.length > 0 ? optionsArray : undefined,
      };

      let updatedFields;
      if (editingField) {
        updatedFields = fields.map((f) =>
          f === editingField ? { ...f, ...newFieldData } : f
        );
      } else {
        updatedFields = [...fields, { ...newFieldData, order: fields.length }];
      }

      await api.post(`/nominations/events/${eventId}/form`, {
        whatsappLink,
        customFields: updatedFields,
      });

      toast.success("Field saved");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save field");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm("Delete this field?")) return;
    try {
      const updatedFields = fields.filter((_, i) => i !== index);
      await api.post(`/nominations/events/${eventId}/form`, {
        whatsappLink,
        customFields: updatedFields,
      });

      setFields(updatedFields);
      toast.success("Field deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const openEdit = (field: any) => {
    setEditingField(field);
    setNewField({
      label: field.label || field.question,
      type: (field.type || "TEXT").toUpperCase() as NominationFieldType,
      required: field.required,
      options: Array.isArray(field.options) ? field.options.join(", ") : "",
    });
    setIsModalOpen(true);
  };

  const openNew = () => {
    setEditingField(null);
    setNewField({
      label: "",
      type: "TEXT",
      required: false,
      options: "",
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Nomination Window Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-50 rounded-lg">
            <Calendar className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nomination Window</h2>
            <p className="text-gray-500 text-sm">Set when public nominations open and close.</p>
          </div>
        </div>

        {/* System Notice for Backend Issue */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <div className="p-1.5 bg-amber-100 rounded-lg shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900 mb-0.5">System Notice: Manual Control Required</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              The backend currently ignores scheduled nomination timelines. To start or end nominations, please use the <strong>"Live" toggle</strong> in the <strong>Form Configuration</strong> section below. Scheduled windows will be enabled in a future system update.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Nomination Start</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={nomDates.startDate}
                onChange={(e) => setNomDates(prev => ({ ...prev, startDate: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <input
                type="time"
                value={nomDates.startTime}
                onChange={(e) => setNomDates(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Nomination End</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={nomDates.endDate}
                min={nomDates.startDate}
                onChange={(e) => setNomDates(prev => ({ ...prev, endDate: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <input
                type="time"
                value={nomDates.endTime}
                onChange={(e) => setNomDates(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            onClick={handleSaveDuration}
            disabled={isSavingDuration}
            className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-lg transition-all duration-300 min-w-[180px] justify-center ${
              isSaveSuccess 
                ? "bg-green-600 text-white shadow-lg shadow-green-200" 
                : "bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
            }`}
          >
            {isSavingDuration ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaveSuccess ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                Timelines Updated!
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                Save Duration
              </>
            )}
          </button>
        </div>
      </div>
      {/* Configuration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Form Configuration
            </h2>
            <p className="text-gray-500 text-sm">
              Manage nomination status and post-submission actions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-bold ${
                isActive ? "text-green-600" : "text-gray-500"
              }`}
            >
              {isActive ? "Live" : "Disabled"}
            </span>
            <button
              onClick={handleToggleActive}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isActive ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  isActive ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              WhatsApp Group Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://chat.whatsapp.com/..."
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-magenta-500 outline-none"
              value={whatsappLink}
              onChange={(e) => setWhatsappLink(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Nominees will be invited to join this group after successful
              submission.
            </p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 h-[42px]"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nomination Form</h2>
            <p className="text-gray-500 text-sm">
              Design the questions candidates must answer.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`text-sm font-bold ${
                isActive ? "text-green-600" : "text-gray-500"
              }`}
            >
              {isActive ? "Live" : "Disabled"}
            </span>
            <button
              onClick={handleToggleActive}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isActive ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  isActive ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Default Fields (Read Only) */}
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            System Fields (Standard)
          </h3>
          <div className="space-y-2">
            {[
              "Full Name",
              "Email Address",
              "Phone Number",
              "Nominee Photo",
              "Bio",
            ].map((label) => (
              <div
                key={label}
                className="p-4 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center opacity-70"
              >
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-xs font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded">
                  REQUIRED
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Fields */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Custom Fields
            </h3>
            <button
              onClick={openNew}
              className="text-sm text-magenta-600 font-bold flex items-center gap-1 hover:underline"
            >
              <Plus size={16} /> Add Question
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={index}
                className="p-4 bg-white border border-gray-200 rounded-lg flex justify-between items-center hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-3">
                  <GripVertical
                    className="text-gray-300 cursor-grab"
                    size={20}
                  />
                  <div>
                    <p className="font-bold text-gray-800">{field.label || field.question}</p>
                    <p className="text-xs text-gray-500">
                      {field.type}{" "}
                      {field.required ? "• Required" : "• Optional"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(field)}
                    className="p-2 text-gray-500 hover:text-blue-600 rounded bg-gray-50 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="p-2 text-gray-500 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400">No custom questions added.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
              <h3 className="font-bold text-lg mb-6">
                {editingField ? "Edit Question" : "Add Custom Question"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Question Label
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-magenta-500 outline-none"
                    value={newField.label}
                    onChange={(e) =>
                      setNewField({ ...newField, label: e.target.value })
                    }
                    placeholder="e.g. Years of Experience"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-magenta-500 outline-none"
                      value={newField.type}
                      onChange={(e) =>
                        setNewField({
                          ...newField,
                          type: e.target.value as NominationFieldType,
                        })
                      }
                    >
                      {fieldTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-magenta-600 rounded focus:ring-magenta-500"
                        checked={newField.required}
                        onChange={(e) =>
                          setNewField({
                            ...newField,
                            required: e.target.checked,
                          })
                        }
                      />
                      <span className="font-medium text-gray-700">
                        Required?
                      </span>
                    </label>
                  </div>
                </div>

                {(newField.type === "SELECT" ||
                  newField.type === "MULTI_SELECT") && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Options (Comma separated)
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-magenta-500 outline-none"
                      value={newField.options}
                      onChange={(e) =>
                        setNewField({ ...newField, options: e.target.value })
                      }
                      placeholder="Option A, Option B, Option C"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveField}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Question"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
