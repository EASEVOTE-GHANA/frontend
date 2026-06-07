import "@/styles/globals.css";
import { neuwelt, russoOne, bebas, nexa } from "@/components/ui/fonts";
import { Metadata } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "react-hot-toast";
import { ModalProvider } from "@/components/providers/ModalProvider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://easevotegh.com"
  ),
  title: {
    template: "%s | EaseVote Ghana",
    default: "EaseVote Ghana - Premier E-Voting & Ticketing Platform",
  },
  description:
    "Ghana's premier e-voting and ticketing platform. Create events, manage votes, and sell tickets securely with EaseVote.",
  keywords: [
    "e-voting",
    "ticketing",
    "events ghana",
    "voting platform",
    "ticket sales",
    "event management",
    "easevote",
    "ghana voting",
  ],
  authors: [{ name: "Goddy Smart Labs" }],
  creator: "Goddy Smart Labs",
  publisher: "EaseVote Ghana",
  openGraph: {
    title: "EaseVote Ghana - Premier E-Voting & Ticketing Platform",
    description:
      "Ghana's premier e-voting and ticketing platform. Create events, manage votes, and sell tickets securely.",
    url: "https://easevotegh.com",
    siteName: "EaseVote",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/seo/home.png",
        width: 1200,
        height: 630,
        alt: "EaseVote Ghana Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EaseVote Ghana",
    description:
      "Ghana's premier e-voting and ticketing platform. Secure, reliable, and easy to use.",
    creator: "@easevote",
    images: ["/images/seo/home.png"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${neuwelt.variable} ${russoOne} ${bebas} ${nexa.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Toaster position="top-right" />
        <ModalProvider>
          <SessionProvider>{children}</SessionProvider>
        </ModalProvider>
      </body>
    </html>
  );
}
