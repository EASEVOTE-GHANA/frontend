import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerApiClient } from "@/lib/api-client";
import FAQManager from "./FAQManager";

export const dynamic = "force-dynamic";

export default async function FAQsPage() {
  const session = await getServerSession(authOptions);
  const apiClient = createServerApiClient(session?.accessToken as string | undefined);
  const res = (await apiClient.get("/cms/faqs").catch(() => ({}))) || {};
  const faqs = (res as any).faqs || (res as any).data || (Array.isArray(res) ? res : []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">FAQ Management</h1>
        <p className="text-sm text-gray-500">
          Create, edit, and manage frequently asked questions for the public
          site.
        </p>
      </div>

      <FAQManager initialFaqs={faqs} />
    </div>
  );
}
