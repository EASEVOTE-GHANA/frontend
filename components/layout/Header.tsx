"use client";

import React, { useState } from "react";
import { Menu, X, ChevronDown, User } from "lucide-react";
import Logo from "@/components/ui/EaseVoteLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Voting", href: "/events/voting" },
  { label: "Tickets", href: "/events/ticketing" },
  {
    label: "Resources",
    href: "#", // Dropdown trigger, keeping as hash or prevent default
    subLinks: [
      { label: "Blog", href: "/blogs" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
  { label: "Contact Us", href: "/contact" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;

  const toggleDropdown = (label: string) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="header sticky top-0 z-50 bg-white shadow-md w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Logo />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6 items-center">
            {navLinks.map((link) => (
              <div key={link.label} className="relative group">
                <div
                  className={`flex items-center px-3 py-2 rounded-md font-medium cursor-pointer transition-colors ${
                    !link.subLinks && isActive(link.href)
                      ? "text-primary-700 font-semibold"
                      : "text-neutral-600 hover:text-primary-700"
                  }`}
                >
                  {link.subLinks ? (
                    <span className="flex items-center">
                      {link.label}
                      <ChevronDown className="ml-1 h-4 w-4 group-hover:rotate-180 transition-transform duration-200" />
                    </span>
                  ) : (
                    <Link href={link.href}>{link.label}</Link>
                  )}
                </div>

                {link.subLinks && (
                  <div className="absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                    <div className="py-1">
                      {link.subLinks.map((sub) => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className={`block px-4 py-2 text-sm hover:bg-gray-100 hover:text-primary-700 ${
                            isActive(sub.href)
                              ? "text-primary-700 font-semibold"
                              : "text-gray-700!"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Action Area */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name || "User"}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-primary-600" />
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {user.name?.split(" ")[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className={`font-medium hover:underline ${
                  pathname === "/sign-in"
                    ? "text-primary-700! font-semibold"
                    : "text-primary-700"
                }`}
              >
                Login
              </Link>
            )}
            <Link
              href={user ? "/dashboard/events/new" : "/sign-up"}
              className="border-2 border-primary-700 text-primary-700 px-6 py-2 rounded-lg font-bold hover:bg-primary-700 hover:text-white! transition-colors"
            >
              {user ? "Create Event" : "Sign Up"}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-brand-deep hover:text-brand-bright hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? (
                <X className="h-8 w-8" />
              ) : (
                <Menu className="h-8 w-8" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 absolute w-full shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <div key={link.label}>
                <div
                  className={`flex justify-between items-center w-full px-3 py-2 rounded-md text-base font-medium hover:text-brand-bright hover:bg-gray-50 ${
                    !link.subLinks && isActive(link.href)
                      ? "text-brand-deep bg-gray-50"
                      : "text-text-main"
                  }`}
                >
                  {link.subLinks ? (
                    <div
                      className="flex justify-between items-center w-full"
                      onClick={() => toggleDropdown(link.label)}
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`h-5 w-5 transform transition-transform ${
                          activeDropdown === link.label ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      className="w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
                {link.subLinks && activeDropdown === link.label && (
                  <div className="pl-6 space-y-1 bg-gray-50">
                    {link.subLinks.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={`block px-3 py-2 text-sm hover:text-brand-deep ${
                          isActive(sub.href)
                            ? "text-brand-deep font-semibold"
                            : "text-gray-600"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 border-t border-gray-200 flex flex-col space-y-3 px-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name || "User"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="text-primary-700 font-bold block px-3 py-2 hover:bg-slate-50 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  href="/sign-in"
                  className="text-brand-deep font-medium block px-3"
                  onClick={() => setIsOpen(false)}
                >
                  Login / User Profile
                </Link>
              )}
              <Link
                href={user ? "/dashboard/events/new" : "/sign-up"}
                className="w-full text-center border-2 border-primary-700 text-primary-700 px-4 py-2 rounded-lg font-bold"
                onClick={() => setIsOpen(false)}
              >
                {user ? "Create Event" : "Sign Up"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
