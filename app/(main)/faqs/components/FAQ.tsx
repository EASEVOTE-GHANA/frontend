import { createServerApiClient } from "@/lib/api-client";
import FAQAccordion from "./FAQAccordion";

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

  // Map the backend data to the structure expected by FAQAccordion
  const mappedFaqs = faqs.map((faq: any) => ({
    id: faq.id || faq._id,
    question: faq.content?.question || faq.question || "Untitled Question",
    answer: faq.content?.answer || faq.answer || "No answer provided.",
    category: faq.content?.category || faq.category || "General",
  })).filter((f: any) => f.question && f.answer);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <FAQAccordion items={mappedFaqs} />
    </section>
  );
}
