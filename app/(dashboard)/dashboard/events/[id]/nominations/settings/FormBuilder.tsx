"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useModal } from "@/components/providers/ModalProvider";
type NominationFieldType = "TEXT" | "TEXTAREA" | "NUMBER" | "EMAIL" | "PHONE" | "SELECT" | "MULTI_SELECT" | "CHECKBOX" | "URL";
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  MoreVertical,
  GripVertical,
  Calendar,
  Clock,
  Settings2,
  Layout,
  CheckCircle,
  AlertTriangle,
  Globe,
  Settings,
  FileText,
  Eye,
  X,
  User,
  UploadCloud,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

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
  const modal = useModal();
  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // New Field State
  const [newField, setNewField] = useState({
    label: "",
    type: "TEXT" as NominationFieldType,
    required: false,
    options: "", // Comma sep for now
  });

  useEffect(() => {
    setIsActive(event?.allowPublicNominations || false);
    setFields(initialForm?.customFields || initialForm?.fields || []);
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
    "URL",
  ];

  const handleToggleActive = async () => {
    const newState = !isActive;
    setIsActive(newState);

    try {
      await api.put(`/events/${eventId}`, { allowPublicNominations: newState });
      toast.success(`Nominations ${newState ? "Enabled" : "Disabled"}`);
    } catch {
      toast.error("Failed to update status");
      setIsActive(!newState);
    }
  };



  const handleSaveField = async () => {
    if (!newField.label) {
      toast.error("Label is required");
      return;
    }

    setIsSaving(true);
    try {
      const optionsArray = typeof newField.options === 'string' && newField.options
        ? newField.options.split(",").map((s: string) => s.trim())
        : (Array.isArray(newField.options) ? newField.options : []);

      const newFieldData = {
        question: newField.label,
        type: newField.type.toLowerCase(),
        required: newField.required,
        options: optionsArray.length > 0 ? optionsArray : undefined,
      };

      let updatedFields;
      // Identify if we are editing an existing field by matching labels/questions
      if (editingField) {
        updatedFields = fields.map((f) =>
          (f.question === (editingField.question || editingField.label) || f.label === (editingField.question || editingField.label))
            ? { ...f, ...newFieldData }
            : f
        );
      } else {
        updatedFields = [...fields, { ...newFieldData, order: fields.length }];
      }

      await api.post(`/nominations/events/${eventId}/form`, {
        customFields: updatedFields,
      });

      toast.success(editingField ? "Field updated correctly" : "New field added");
      setIsModalOpen(false);
      setFields(updatedFields);
    } catch (error) {
      toast.error("Failed to save field changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    const confirmed = await modal.confirm({
      title: "Delete Question?",
      message: "Are you sure you want to remove this question? This will affect the current form live.",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      const updatedFields = fields.filter((_, i) => i !== index);
      await api.post(`/nominations/events/${eventId}/form`, {
        customFields: updatedFields,
      });
      setFields(updatedFields);
      toast.success("Question deleted");
    } catch (error) {
      toast.error("Failed to delete field");
    }
  };

  const openEdit = (field: any) => {
    setEditingField(field);
    setNewField({
      label: field.label || field.question,
      type: (field.type || "TEXT").toUpperCase() as NominationFieldType,
      required: field.required,
      options: Array.isArray(field.options) ? field.options.join(", ") : (field.options || ""),
    });
    setIsModalOpen(true);
  };

  // --- SUB-COMPONENT: REALISTIC FIELD PREVIEW ---
  const FieldPreview = ({ field, isSystem = false, isInteractive = false, onEdit, onDelete, className }: any) => {
    const label = field.question || field.label;
    const type = (field.type || "TEXT").toUpperCase();

    return (
      <div className={clsx("group relative", className)}>
        {/* Admin Controls (Hover Only) */}
        {!isSystem && (
          <div className="absolute -right-12 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={onEdit}
              className="p-2 bg-white text-slate-400 hover:text-primary-700 rounded-lg border border-slate-200 shadow-sm transition-all active:scale-95"
              title="Edit Question"
            >
              <Settings2 size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 shadow-sm transition-all active:scale-95"
              title="Delete Question"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        <div className={clsx(
          "space-y-2 pb-4 border-l-4 transition-all",
          isSystem ? "border-transparent" : "border-transparent group-hover:border-primary-600 pl-4 -ml-4"
        )}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700">
              {label} {field.required && <span className="text-primary-600">*</span>}
            </label>
          </div>

          <div className="w-full">
            {type === "TEXTAREA" ? (
              isInteractive ? (
                <textarea 
                  className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 text-sm focus:ring-4 focus:ring-primary-50/50 focus:border-primary-600 outline-none transition-all resize-none"
                  placeholder="Enter biography or description..."
                />
              ) : (
                <div className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-400 text-sm">
                  Short biography or description...
                </div>
              )
            ) : type === "SELECT" || type === "MULTI_SELECT" ? (
              isInteractive ? (
                <div className="relative group/select">
                   <select 
                     className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-4 focus:ring-primary-50/50 focus:border-primary-600 outline-none transition-all appearance-none cursor-pointer"
                     defaultValue=""
                   >
                     <option value="" disabled>{label.includes("Category") ? "Select Category..." : "Select an option..."}</option>
                     {Array.isArray(field.options) && field.options.map((opt: string) => (
                       <option key={opt} value={opt}>{opt}</option>
                     ))}
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                     <ChevronDown size={14} />
                   </div>
                </div>
              ) : (
                <div className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-sm flex justify-between items-center group-hover:bg-white transition-all cursor-pointer">
                  <span>
                    {label.includes("Category") 
                      ? (event?.categories?.length > 0 ? "Select Category..." : "No categories defined")
                      : (Array.isArray(field.options) && field.options.length > 0 ? field.options[0] + (field.options.length > 1 ? "..." : "") : "Select an option...")
                    }
                  </span>
                  <div className="p-1 bg-slate-100 rounded-md">
                    <MoreVertical size={12} className="text-slate-500" />
                  </div>
                </div>
              )
            ) : type === "CHECKBOX" ? (
              <label className="flex items-center gap-3 p-1 cursor-pointer group">
                <input 
                  type="checkbox" 
                  disabled={!isInteractive}
                  className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer" 
                />
                <span className={clsx("text-sm transition-colors", isInteractive ? "text-slate-600 group-hover:text-slate-900" : "text-slate-400")}>
                  {isInteractive ? "Accept terms and conditions" : "I agree to the terms..."}
                </span>
              </label>
            ) : type === "FILE" ? (
              isInteractive ? (
                <div className="w-full relative group/file">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <div className="w-full p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white flex flex-col items-center justify-center text-slate-400 gap-2 group-hover/file:border-primary-400 group-hover/file:bg-primary-50/10 transition-all">
                    <UploadCloud size={24} className="text-primary-600 mb-1" />
                    <span className="text-sm font-bold text-slate-700">Click to upload {label.toLowerCase()}</span>
                    <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">JPG, PNG or PDF (MAX. 5MB)</span>
                  </div>
                </div>
              ) : (
                <div className="w-full p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <UploadCloud size={24} className="opacity-40" />
                  <span className="text-xs font-medium">Upload file or photo</span>
                </div>
              )
            ) : (
              isInteractive ? (
                <input 
                  type={type.toLowerCase()}
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-4 focus:ring-primary-50/50 focus:border-primary-600 outline-none transition-all"
                  placeholder={type === "EMAIL" ? "nominee@example.com" : type === "PHONE" ? "024 XXX XXXX" : `Enter ${label.toLowerCase()}...`}
                />
              ) : (
                <div className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400/60 text-sm">
                  {type === "EMAIL" ? "nominee@example.com" : type === "PHONE" ? "024 XXX XXXX" : `Enter ${label.toLowerCase()}...`}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      {/* 0. INTEGRATED HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link
            href={`/dashboard/events/${eventId}/edit`}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event Settings
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Nomination Settings
            </h1>
            <p className="text-slate-500">
              Configure how candidates apply for this event.
            </p>
          </div>
        </div>

        {/* TOP RIGHT TOGGLE */}
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
            <span className={clsx("text-xs font-bold", isActive ? "text-primary-700" : "text-slate-500")}>
              {isActive ? "Publicly Open" : "Publicly Closed"}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-100 mx-1"></div>
          <button
            onClick={handleToggleActive}
            className={clsx(
              "w-12 h-6 rounded-full transition-all relative p-1",
              isActive ? "bg-primary-700" : "bg-slate-200"
            )}
          >
            <div className={clsx("w-4 h-4 bg-white rounded-full transition-all shadow-sm", isActive ? "translate-x-6" : "")} />
          </button>
        </div>
      </div>

      {/* 1. FORM QUESTIONS BUILDER (Now Primary WYSIWYG) */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-primary-700 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-primary-700/20">
              <Layout size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Form Builder</h2>
              <p className="text-slate-500">Design the application form for your nominees.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-6 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all active:scale-95"
            >
              <Eye size={18} /> Preview
            </button>
            <button
              onClick={async () => {
                setIsSaving(true);
                try {
                  await api.post(`/nominations/events/${eventId}/form`, {
                    customFields: fields.map((f, i) => ({
                      question: f.label || f.question,
                      type: (f.type || "text").toLowerCase(),
                      required: f.required || false,
                      options: f.options,
                      order: i,
                    })),
                  });
                  toast.success("Nomination form saved successfully");
                } catch (error) {
                  toast.error("Failed to save form");
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3.5 bg-primary-700 text-white rounded-2xl text-sm font-bold hover:bg-primary-800 transition-all shadow-lg shadow-primary-700/20 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isSaving ? "Saving..." : "Save Form"}
            </button>
          </div>
        </div>

        <div className="p-8 md:p-16 bg-slate-50/20 flex justify-center">
          {/* THE FORM CANVAS */}
          <div className="w-full rounded-2xl max-w-4xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/5 overflow-hidden ring-1 ring-slate-100">
            {/* Form Header Preview with Event Image */}
            <div
              className="relative h-64 flex items-end p-10 bg-slate-900 overflow-hidden"
              style={{
                backgroundImage: event?.imageUrl ? `url(${event.imageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Dark Overlay for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              <div className="relative z-10 w-full">
                <p className="text-white text-xs font-black uppercase tracking-[0.2em] mb-2 drop-shadow-md">Application Form</p>
                <h3 className="text-4xl font-bold tracking-tight text-white! drop-shadow-lg">{event?.title || "Event Nomination"}</h3>
              </div>
            </div>

            <div className="p-10 md:p-14 space-y-6">
              {/* SYSTEM FIELDS SECTION */}
              <div className="space-y-4">
                <div className="grid gap-6">
                  {[
                    { label: "Full Name", type: "TEXT", required: true },
                    { label: "Email Address", type: "EMAIL", required: true },
                    { label: "Phone Number", type: "PHONE", required: true },
                    { 
                      label: "Nomination Category", 
                      type: "SELECT", 
                      required: true, 
                      options: (event?.categories || []).map((c: any) => c.name || c.title)
                    },
                    { label: "Profile Photo", type: "FILE", required: false },
                    { label: "Bio/Description", type: "TEXTAREA", required: false }
                  ].map((f) => (
                    <FieldPreview key={f.label} field={f} isSystem={true} />
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* CUSTOM QUESTIONS SECTION */}
              <div className="space-y-6">
                <div className="grid gap-1">
                  {fields.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                      <p className="text-slate-400 text-sm font-medium">No additional questions.</p>
                    </div>
                  ) : (
                    fields.map((field, index) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={index}
                      >
                        <FieldPreview
                          field={field}
                          onEdit={() => openEdit(field)}
                          onDelete={() => handleDelete(index)}
                        />
                      </motion.div>
                    ))
                  )}

                  <button
                    onClick={() => {
                      setEditingField(null);
                      setNewField({ label: "", type: "TEXT", required: false, options: "" });
                      setIsModalOpen(true);
                    }}
                    className="w-full mt-4 py-8 border-2 border-dashed border-primary-100 rounded-3xl text-primary-700 font-bold flex items-center justify-center gap-3 hover:border-primary-600 hover:bg-primary-50/50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                      <Plus size={20} />
                    </div>
                    <span>Add Specific Question</span>
                  </button>
                </div>
              </div>

              {/* Form Footer Branding */}
              <div className="pt-16 pb-4 flex flex-col items-center gap-3 border-t border-slate-50 mt-10">
                <div className="flex items-center gap-2 transition-all duration-500 cursor-default group/logo">
                  <Image src="/easevote.svg" alt="Easevote Logo" width={24} height={24} className="object-contain group-hover/logo:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-900 tracking-tight">EASEVOTE</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Powered by Easevote</p>
                  <a
                    href="https://www.easevotegh.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-medium text-slate-400 hover:text-primary-700 transition-colors"
                  >
                    www.easevotegh.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* MODAL: FIELD EDITOR */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                    {editingField ? <Settings size={22} /> : <Plus size={24} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{editingField ? "Edit Question" : "New Question"}</h3>
                    <p className="text-sm text-slate-500">Configure how applicants should answer.</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Question Label</label>
                  <input
                    type="text"
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="e.g. Past Experience"
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-900 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Input Type</label>
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-900 outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23667c99%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%3F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1.2rem_center] bg-no-repeat"
                    >
                      {fieldTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={clsx(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        newField.required ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 bg-white group-hover:border-slate-400"
                      )}>
                        {newField.required && <CheckCircle size={14} />}
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={newField.required}
                          onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        />
                      </div>
                      <span className="font-bold text-slate-700 text-sm">Required</span>
                    </label>
                  </div>
                </div>

                {(newField.type === "SELECT" || newField.type === "MULTI_SELECT") && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Options (Comma Separated)</label>
                    <input
                      type="text"
                      value={newField.options}
                      onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                      placeholder="Option 1, Option 2, Option 3"
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-900 outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-12">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveField}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin mx-auto" /> : (editingField ? "Update Question" : "Add Question")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PREVIEW */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-10 bg-slate-900/80 backdrop-blur-2xl overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="absolute top-6 right-6 z-50 w-8 h-8 bg-primary-800/20 hover:bg-primary-800/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg active:scale-90"
              >
                <X size={16} />
              </button>

              {/* High-Fidelity Form Content */}
              <div className="overflow-y-auto max-h-[90vh] custom-scrollbar">
                {/* Reusing existing branding header logic */}
                <div
                  className="relative h-64 flex items-end p-10 bg-slate-900 overflow-hidden"
                  style={{
                    backgroundImage: event?.imageUrl ? `url(${event.imageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="relative z-10 w-full">
                    <p className="text-white text-xs font-black uppercase tracking-[0.2em] mb-2 drop-shadow-md">Nomination Preview</p>
                    <h3 className="text-4xl font-bold tracking-tight text-white! drop-shadow-lg">{event?.title || "Event Nomination"}</h3>
                  </div>
                </div>

                <div className="p-10 md:p-14 space-y-10">
                  <div className="space-y-6">
                    {/* System Fields Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: "Nominee Full Name", type: "TEXT", required: true },
                        { label: "Nominee Email Address", type: "EMAIL", required: true },
                        { label: "Nominee Phone Number", type: "PHONE", required: true },
                        { 
                          label: "Nomination Category", 
                          type: "SELECT", 
                          required: true, 
                          options: (event?.categories || []).map((c: any) => c.name || c.title)
                        },
                        { label: "Profile Photo", type: "FILE", required: false },
                        { label: "Bio/Description", type: "TEXTAREA", required: false }
                      ].map((f) => (
                        <FieldPreview 
                          key={f.label} 
                          field={f} 
                          isSystem={true} 
                          isInteractive={true} 
                          className={clsx(
                            (f.type === "FILE" || f.type === "TEXTAREA") ? "md:col-span-2" : ""
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {fields.length > 0 && (
                    <div className="space-y-6">
                      <div className="h-px bg-slate-100 w-full my-10" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Additional Requirements</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fields.map((f, i) => (
                          <FieldPreview 
                            key={i} 
                            field={f} 
                            isSystem={true} 
                            isInteractive={true} 
                            className={clsx(
                              (f.type === "textarea" || f.type === "TEXTAREA" || (Array.isArray(f.options) && f.options.length > 3)) ? "md:col-span-2" : ""
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-12">
                    <button
                      disabled
                      className="w-full py-5 bg-primary-700 text-white rounded-[2rem] font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary-700/20 active:scale-95 transition-all opacity-90"
                    >
                      Submit Application (Preview Mode)
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-6 font-medium italic">
                      This is a visual preview. Actual form submission is disabled.
                    </p>
                  </div>

                  {/* Preview Branding Footer */}
                  <div className="pt-20 pb-10 flex flex-col items-center gap-3 border-t border-slate-50 mt-16">
                    <div className="flex items-center gap-2 opacity-40">
                      <Image src="/easevote.svg" alt="Easevote Logo" width={24} height={24} className="object-contain" />
                      <span className="text-xs font-bold text-slate-900 tracking-tight">EASEVOTE</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Powered by Easevote</p>
                      <a 
                        href="https://www.easevotegh.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-medium text-primary-600 hover:underline"
                      >
                        www.easevotegh.com
                      </a>
                    </div>
                  </div>
                </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
