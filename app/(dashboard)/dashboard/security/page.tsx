import { Shield, Lock, Key } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Security & Access
          </h1>
          <p className="text-slate-500">
            Manage admin access and security policies (Coming Soon)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 opacity-60">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900">
              Two-Factor Authentication
            </h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Enforce 2FA for all admin accounts.
          </p>
          <div className="h-6 w-12 bg-slate-200 rounded-full"></div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 opacity-60">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-slate-400" />
            <h3 className="font-semibold text-slate-900">API Access</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Manage API keys for third-party integrations.
          </p>
          <div className="h-8 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
