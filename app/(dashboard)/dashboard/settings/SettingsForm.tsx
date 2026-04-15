"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { Loader2, Save, LucideIcon, Check, X, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type SettingItem = {
  key: string;
  label: string;
  description: string;
  type: "boolean" | "number" | "text" | "select";
  value: any;
  options?: { value: string; label: string }[];
};

export default function SettingsForm({
  item,
  iconNode,
}: {
  item: SettingItem;
  iconNode: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [value, setValue] = useState(item.value);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    setShowConfirm(false);

    try {
      const response = await fetch("/api/proxy/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // @ts-ignore - custom session type has accessToken
          ...(session?.accessToken && {
            Authorization: `Bearer ${session.accessToken}`,
          }),
        },
        body: JSON.stringify({
          key: item.key,
          value: item.type === "boolean" ? value : String(value),
          updatedBy: session?.user?.email || "unknown",
        }),
      });

      const res = await response.json();

      if (response.ok && res.success !== false) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // Rollback on error
        setValue(item.value);
        alert(res.message || res.error || "Failed to save setting. Rolled back to previous value.");
      }
    } catch (err) {
      setValue(item.value);
      alert("Network error. Failed to save setting. Rolled back to previous value.");
    } finally {
      setLoading(false);
    }
  };

  const isDirty = value !== item.value;

  return (
    <>
      <div className="p-6 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-500 shrink-0">
          {iconNode}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <label className="block text-sm font-semibold text-slate-900">
              {item.label}
            </label>
            {isDirty && (
              <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase">
                Unsaved Changes
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-4 max-w-2xl">{item.description}</p>

          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              {item.type === "boolean" ? (
                <button
                  onClick={() => setValue(!value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${
                    value ? "bg-green-500" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`${
                      value ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              ) : item.type === "select" ? (
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                >
                  {item.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={item.type === "number" ? "number" : "text"}
                  value={value}
                  onChange={(e) =>
                    setValue(
                      item.type === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                    )
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              )}
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading || !isDirty}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm
                  ${
                    !isDirty
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95"
                  }
              `}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : success ? (
                <>
                  <Check className="w-4 h-4" /> Saved
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Apply Change
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        loading={loading}
        variant="warning"
        title="Apply Platform Setting?"
        message={`You are about to change "${item.label}" from "${item.value}" to "${value}". This is a global change that affects all active events and users immediately. Are you sure you want to proceed?`}
        confirmText="Yes, Apply Change"
        cancelText="Cancel"
      />
    </>
  );
}

