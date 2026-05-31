"use client";

import Logo from "@/components/ui/EaseVoteLogo";
import SocialIcons from "../ui/SocialIcons";
import Link from "next/link";

interface FooterProps {
  onOpenLegal: (tab: "privacy" | "terms" | "cookies") => void;
}

export default function Footer({ onOpenLegal }: FooterProps) {
  return (
    <footer className="bg-primary-900 text-white pt-12 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link
              href="/"
              className="text-3xl font-display font-bold text-white tracking-tight block"
            >
              <Logo textColor="text-white" />
            </Link>
            <p className="text-primary-200/80 text-sm leading-relaxed max-w-xs">
              Empowering organizers to create and manage events effortlessly.
              EaseVote Ghana is your seamless platform for reliable e-voting,
              ticketing and digital event experiences.
            </p>
            <div className="flex gap-4">
              <SocialIcons />
            </div>
          </div>

          {/* Product Links */}
          <div className="md:pl-8">
            <h3 className="font-display font-bold text-white! text-lg mb-6 tracking-wide">
              Quick Links
            </h3>
            <ul className="space-y-4 text-primary-100 text-sm font-medium">
              <li>
                <Link
                  href="/"
                  className="hover:text-white hover:translate-x-1 transition-all inline-block"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-white hover:translate-x-1 transition-all inline-block"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/events/voting"
                  className="hover:text-white hover:translate-x-1 transition-all inline-block"
                >
                  Vote Now
                </Link>
              </li>
              <li>
                <Link
                  href="/events/ticketing"
                  className="hover:text-white hover:translate-x-1 transition-all inline-block"
                >
                  Buy Tickets
                </Link>
              </li>
              <li>
                <Link
                  href="/blogs"
                  className="hover:text-white hover:translate-x-1 transition-all inline-block"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  className="hover:text-white hover:translate-x-1 transition-all inline-block"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white! mb-4 uppercase text-sm tracking-wider">
              Contact Info
            </h3>
            <ul className="space-y-3 text-sm">
              <li>Easevote Gh, Accra - Ghana</li>
              <li>
                <span className="block text-gray-500 text-xs">
                  Main Office:
                </span>
                0550073142
              </li>
              <li>
                <span className="block text-gray-500 text-xs">Support:</span>
                0554440813 / 0559540992
              </li>
              <li>info@easevotegh.com</li>
              <li className="pt-2">Mon - Friday (8AM – 5PM)</li>
              <li className="text-secondary-600 font-bold">
                24/7 Technical Support
              </li>
            </ul>
          </div>

          {/* Payment Badges */}
          <div>
            <h3 className="font-display font-bold text-white! text-lg mb-6 tracking-wide">
              We Accept
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="px-2 py-1 bg-yellow-400 text-black font-bold rounded text-xs flex items-center">
                MTN
              </div>
              <div className="px-2 py-1 bg-red-600 text-white font-bold rounded text-xs flex items-center">
                Telecel
              </div>
              <div className="px-2 py-1 bg-blue-600 text-white font-bold rounded text-xs flex items-center">
                AirtelTigo
              </div>
              <div className="px-2 py-1 bg-gray-100 text-blue-800 font-bold rounded text-xs flex items-center">
                VISA
              </div>
              <div className="px-2 py-1 bg-white text-red-700 font-bold rounded text-xs flex items-center border border-slate-100">
                MasterCard
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-primary-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              System Operational
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-primary-200/80">
          <p>&copy; 2026 Easevote Ghana. All rights reserved.</p>
          {/* Legal Links */}
          <div className="flex space-x-6 mt-4 md:mt-0">
            <button
              className="hover:text-white! cursor-pointer"
              onClick={() => onOpenLegal("privacy")}
            >
              Privacy Policy
            </button>
            <button
              className="hover:text-white! cursor-pointer"
              onClick={() => onOpenLegal("terms")}
            >
              Terms of Service
            </button>
            <button
              className="hover:text-white! cursor-pointer"
              onClick={() => onOpenLegal("cookies")}
            >
              Cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
