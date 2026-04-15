import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import GatewaySettings from "@/components/super-admin/finance/GatewaySettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken as string | undefined);
  const configs = await apiClient.get("/settings/gateway").catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Settings</h1>
        <p className="text-sm text-gray-500">
          Control active payment gateways and monitoring thresholds.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <GatewaySettings configs={configs} />
      </div>
    </div>
  );
}
