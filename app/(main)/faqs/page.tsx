import PageHeader from "./components/PageHeader";
import DidYouKnow from "./components/DidYouKnow";
import Faq from "./components/FAQ";
import VideoGuides from "./components/VideoGuides";
import Newsletter from "@/components/features/Newsletter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | EaseVote Ghana",
  description:
    "Find answers to common questions about creating events, buying tickets, and voting on EaseVote Ghana.",
  alternates: {
    canonical: "/faqs",
  },
};

export default function FaqsPage() {
  return (
    <main className="min-h-screen pb-20">
      <PageHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-20">
        <DidYouKnow />
        <Faq />
        <div className="mb-20 sm:mb-32">
          <VideoGuides />
        </div>
        <div className="mt-20 text-center bg-secondary-50 rounded-3xl p-12">
          <h3 className="text-2xl font-bold text-secondary-900 mb-3">
            Still have questions?
          </h3>
          <p className="text-secondary-700 mb-8">
            Can&apos;t find the answer you&apos;re looking for? Please chat to
            our friendly team.
          </p>
          <button className="bg-secondary-600 text-white px-8 py-3 rounded-full font-bold hover:bg-secondary-700 transition-colors shadow-lg shadow-secondary-600/20">
            Contact Support
          </button>
        </div>{" "}
      </div>
      <Newsletter />
    </main>
  );
}
