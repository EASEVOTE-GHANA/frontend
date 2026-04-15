import { Bell, Megaphone, Send } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            System Notifications
          </h1>
          <p className="text-slate-500">Broadcast announcements to all users</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900">
          Announcement System
        </h3>
        <p className="text-slate-500 max-w-md mx-auto mt-2">
          This module will allow super admins to send push notifications and
          email broadcasts to organizers and voters.
          <br />
          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded mt-2 inline-block">
            Status: Planned
          </span>
        </p>
      </div>
    </div>
  );
}
