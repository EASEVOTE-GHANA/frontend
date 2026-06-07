import PageHeader from "./components/PageHeader";
import ContactInfo from "./components/ContactInfo";
import ContactForm from "./components/ContactForm";
import Newsletter from "@/components/features/Newsletter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | EaseVote Ghana",
  description:
    "Get in touch with the EaseVote team. We are here to help with your e-voting and ticketing needs in Ghana.",
  alternates: {
    canonical: "https://easevotegh.com/contact",
  },
  openGraph: {
    title: "Contact Us | EaseVote Ghana",
    description: "Get in touch with the EaseVote team. We are here to help with your e-voting and ticketing needs in Ghana.",
    url: "/contact",
    images: [{ url: "/images/seo/contact.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | EaseVote Ghana",
    description: "Get in touch with the EaseVote team.",
    images: ["/images/seo/contact.webp"],
  },
};

export default function ContactUsPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <PageHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Contact Information (Left Column) */}
          <ContactInfo />
          {/* Contact Form (Right Column) */}
          <ContactForm />
        </div>
      </div>
      <Newsletter />
    </main>
  );
}
