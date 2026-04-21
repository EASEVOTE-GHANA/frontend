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
      </div>
      <Newsletter />
    </main>
  );
}
