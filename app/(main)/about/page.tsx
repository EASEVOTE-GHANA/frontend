import PageHeader from "./components/PageHeader";
import BrandHeart from "./components/BrandHeart";
import ValuesSection from "./components/ValuesSection";
import Services from "./components/Services";
import Offers from "./components/Offers";
import Features from "./components/Features";
import Team from "./components/Team";
import Newsletter from "@/components/features/Newsletter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | EaseVote Ghana",
  description:
    "Learn about EaseVote's mission to revolutionize e-voting and event ticketing in Ghana. Meet our team and discover our values.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | EaseVote Ghana",
    description: "Learn about EaseVote's mission to revolutionize e-voting and event ticketing in Ghana. Meet our team and discover our values.",
    url: "/about",
    images: [{ url: "/images/seo/about.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | EaseVote Ghana",
    description: "Learn about EaseVote's mission to revolutionize e-voting and event ticketing in Ghana.",
    images: ["/images/seo/about.webp"],
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <PageHeader />
      <BrandHeart />
      <ValuesSection />
      <Services />
      <Offers />
      <Features />
      <Team />
      <Newsletter />
    </main>
  );
}
