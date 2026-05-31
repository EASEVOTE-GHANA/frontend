"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { useModal } from "@/components/providers/ModalProvider";
import { clsx } from "clsx";

export default function NotificationForm({ organizers }: { organizers: any[] }) {
  const router = useRouter();
  const modal = useModal();
  const [recipientType, setRecipientType] = useState<"ALL_ORGANIZERS" | "SELECTED_USERS">("ALL_ORGANIZERS");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [channels, setChannels] = useState<("EMAIL" | "SMS")[]>(["EMAIL"]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // SMS segment calculation
  const smsStats = useMemo(() => {
    const len = content.length;
    let segments = 0;
    if (len > 0) {
      segments = len <= 160 ? 1 : Math.ceil(len / 153); // GSM Multi-part character limit
    }
    return { len, segments };
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    if (channels.length === 0) return;
    if (recipientType === "SELECTED_USERS" && selectedUserIds.length === 0) return;

    setLoading(true);
    try {
      await api.post("/admin/notifications/send", {
        recipientType,
        selectedUserIds: recipientType === "SELECTED_USERS" ? selectedUserIds : undefined,
        channels,
        subject: channels.includes("EMAIL") ? subject : undefined,
        content
      });
      setSuccess(true);
      setSubject("");
      setContent("");
      setTimeout(() => setSuccess(false), 5000);
      router.refresh();
    } catch (err) {
      modal.alert({ title: "Send Failed", message: "Failed to send notification. Check console for details.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (chan: "EMAIL" | "SMS") => {
    if (channels.includes(chan)) {
      setChannels(channels.filter((c) => c !== chan));
    } else {
      setChannels([...channels, chan]);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Broadcast Dispatched</h3>
        <p className="text-sm text-slate-500 mt-2">The notification has been queued for delivery.</p>
        <button 
          onClick={() => setSuccess(false)}
          className="mt-6 text-primary-700 font-black text-[10px] uppercase tracking-widest hover:underline"
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* CHANNEL SELECTION */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Channels</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => toggleChannel("EMAIL")}
            className={clsx(
              "flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border",
              channels.includes("EMAIL") ? "bg-primary-700 border-primary-700 text-white shadow-md shadow-primary-100" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            <Mail size={16} /> Email
          </button>
          <button
            type="button"
            onClick={() => toggleChannel("SMS")}
            className={clsx(
              "flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border",
              channels.includes("SMS") ? "bg-primary-700 border-primary-700 text-white shadow-md shadow-primary-100" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            <MessageSquare size={16} /> SMS
          </button>
        </div>
      </div>

      {/* RECIPIENTS */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipients</label>
        <select
          value={recipientType}
          onChange={(e: any) => setRecipientType(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
        >
          <option value="ALL_ORGANIZERS">All Active Organizers</option>
          <option value="SELECTED_USERS">Select Specific Organizers</option>
        </select>

        {recipientType === "SELECTED_USERS" && (
          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white p-2 mt-2 space-y-1 custom-scrollbar">
            {organizers.map((org) => (
              <label key={org._id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(org._id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedUserIds([...selectedUserIds, org._id]);
                    else setSelectedUserIds(selectedUserIds.filter(id => id !== org._id));
                  }}
                  className="rounded border-slate-300 text-primary-700 focus:ring-primary-700"
                />
                <span className="text-xs font-bold text-slate-700">{org.businessName || org.fullName}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="space-y-4">
        {channels.includes("EMAIL") && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Important Update from EaseVote"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Body</label>
            {channels.includes("SMS") && (
              <div className={clsx(
                "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                smsStats.len > 160 ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
              )}>
                {smsStats.len} / {smsStats.segments} {smsStats.segments === 1 ? 'Segment' : 'Segments'}
              </div>
            )}
          </div>
          <textarea
            required
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message here..."
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !content || channels.length === 0}
        className="w-full bg-slate-900 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-2 group disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Dispatch Broadcast
            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </>
        )}
      </button>

      <p className="text-[10px] text-slate-400 font-medium text-center px-4">
        <AlertCircle size={10} className="inline mr-1 -mt-0.5" />
        Broadcasts are sent individually and logged for auditing.
      </p>
    </form>
  );
}
