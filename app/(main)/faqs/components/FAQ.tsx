import { createServerApiClient } from "@/lib/api-client";
import { ChevronDown } from "lucide-react";

export default async function Faq() {
  const apiClient = createServerApiClient();
  const res = (await apiClient.get("/cms/faqs").catch(() => ({}))) || {};
  const faqs = (res as any).faqs || (res as any).data || (Array.isArray(res) ? res : []);

  if (!faqs || faqs.length === 0) {
    return (
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <p className="text-center text-gray-500">No FAQs available at the moment.</p>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 max-w-3xl mx-auto">
      <div className="space-y-4">
        {faqs.map((faq: any) => {
          const id = faq.id || faq._id;
          const question = faq.question || faq.content?.question;
          const answer = faq.answer || faq.content?.answer;

          if (!question || !answer) return null;

          return (
            <details
              key={id}
              className="group border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden"
            >
              <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                <span>{question}</span>
                <ChevronDown
                  size={20}
                  className="text-gray-400 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="px-6 pb-5 pt-1 text-gray-600 text-sm leading-relaxed">
                {answer}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
