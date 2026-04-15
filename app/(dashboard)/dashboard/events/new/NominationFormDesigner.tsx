"use client";

import { useState } from "react";
type NominationFieldType = "TEXT" | "TEXTAREA" | "NUMBER" | "EMAIL" | "PHONE" | "SELECT" | "MULTI_SELECT" | "CHECKBOX" | "FILE" | "URL";
import { Plus, Trash2, GripVertical, Check, X } from "lucide-react";
import toast from "react-hot-toast";

export interface NominationFieldConfig {
  id: string; // Temporary ID for list management
  label: string;
  type: NominationFieldType;
  required: boolean;
  options?: string[];
}

export interface NominationSettings {
  isActive: boolean;
  whatsappLink: string;
  fields: NominationFieldConfig[];
}

interface NominationFormDesignerProps {
  settings: NominationSettings;
  onChange: (settings: NominationSettings) => void;
}

export default function NominationFormDesigner({
  settings,
  onChange,
}: NominationFormDesignerProps) {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Intermediate state for adding/editing a field
  const [tempField, setTempField] = useState<{
    label: string;
    type: NominationFieldType;
    required: boolean;
    options: string;
  }>({
    label: "",
    type: "TEXT",
    required: false,
    options: "",
  });

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

  const handleLinkChange = (link: string) => {
    onChange({ ...settings, whatsappLink: link });
  };

  const openNewField = () => {
    setEditingFieldId(null);
    setTempField({
      label: "",
      type: "TEXT",
      required: false,
      options: "",
    });
    setIsModalOpen(true);
  };

  const openEditField = (field: NominationFieldConfig) => {
    setEditingFieldId(field.id);
    setTempField({
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options ? field.options.join(", ") : "",
    });
    setIsModalOpen(true);
  };

  const handleSaveField = () => {
    if (!tempField.label.trim()) {
      toast.error("Label is required");
      return;
    }

    const optionsArray = ["SELECT", "MULTI_SELECT"].includes(tempField.type)
      ? tempField.options
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    if (editingFieldId) {
      // Update existing
      const updatedFields = settings.fields.map((f) =>
        f.id === editingFieldId
          ? {
              ...f,
              label: tempField.label,
              type: tempField.type,
              required: tempField.required,
              options: optionsArray,
            }
          : f
      );
      onChange({ ...settings, fields: updatedFields });
    } else {
      // Add new
      const newFieldConfig: NominationFieldConfig = {
        id: Math.random().toString(36).substring(7),
        label: tempField.label,
        type: tempField.type,
        required: tempField.required,
        options: optionsArray,
      };
      onChange({
        ...settings,
        fields: [...settings.fields, newFieldConfig],
      });
    }
    setIsModalOpen(false);
  };

  const handleDeleteField = (id: string) => {
    onChange({
      ...settings,
      fields: settings.fields.filter((f) => f.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Nomination Configuration
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            WhatsApp Group Link (Optional)
          </label>
          <input
            type="url"
            value={settings.whatsappLink}
            onChange={(e) => handleLinkChange(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Nominees will be invited to join this group after successful
            submission.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-slate-900">Custom Fields</h4>
            <button
              type="button"
              onClick={openNewField}
              className="text-sm text-primary-600 font-bold flex items-center gap-1 hover:underline"
            >
              <Plus size={16} /> Add Question
            </button>
          </div>

          <div className="space-y-3">
            {settings.fields.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400">No custom questions added.</p>
              </div>
            )}

            {settings.fields.map((field) => (
              <div
                key={field.id}
                className="p-4 bg-white border border-gray-200 rounded-lg flex justify-between items-center group transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <GripVertical
                    className="text-gray-300 cursor-grab"
                    size={20}
                  />
                  <div>
                    <p className="font-bold text-gray-800">{field.label}</p>
                    <p className="text-xs text-gray-500">
                      {field.type}{" "}
                      {field.required ? "• Required" : "• Optional"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEditField(field)}
                    className="p-2 text-slate-500 hover:text-blue-600 rounded bg-slate-50 hover:bg-blue-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteField(field.id)}
                    className="p-2 text-slate-500 hover:text-red-600 rounded bg-slate-50 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-lg mb-6">
              {editingFieldId ? "Edit Question" : "Add Custom Question"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Question Label
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                  value={tempField.label}
                  onChange={(e) =>
                    setTempField({ ...tempField, label: e.target.value })
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
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={tempField.type}
                    onChange={(e) =>
                      setTempField({
                        ...tempField,
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
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      checked={tempField.required}
                      onChange={(e) =>
                        setTempField({
                          ...tempField,
                          required: e.target.checked,
                        })
                      }
                    />
                    <span className="font-medium text-gray-700">Required?</span>
                  </label>
                </div>
              </div>

              {["SELECT", "MULTI_SELECT"].includes(tempField.type) && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Options (Comma separated)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={tempField.options}
                    onChange={(e) =>
                      setTempField({ ...tempField, options: e.target.value })
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
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveField}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
