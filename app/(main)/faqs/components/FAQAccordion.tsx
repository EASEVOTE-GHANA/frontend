"use client";

import {
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Search,
} from "lucide-react";
import { useState } from "react";

interface FAQAccordionProps {
  items: {
    id: string;
    question: string;
    answer: string;
    category: string;
  }[];
}

export default function FAQAccordion({ items = [] }: FAQAccordionProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const categories = [
    "All",
    "General",
    "Voting",
    "Ticketing",
    "Payments",
    "Organizing",
  ];

  const filteredFAQs = items.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Sidebar Categories */}
      <div className="lg:col-span-3 space-y-2">
        <h3 className="font-display font-bold text-slate-900 mb-4 px-2">
          Categories
        </h3>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary-700 text-white shadow-md"
                : "text-slate-600 hover:bg-white hover:text-primary-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="lg:col-span-9">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h2 className="text-3xl font-display font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
              />
            </div>
            <button
              onClick={() => setOpenAccordion(openAccordion === "all" ? null : "all")}
              className="text-sm font-bold text-primary-600 hover:text-primary-800 whitespace-nowrap"
            >
              {openAccordion === "all" ? "Collapse All" : "Expand All"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredFAQs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <button
                onClick={() => toggleAccordion(faq.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-bold text-slate-800 text-lg">
                  {faq.question}
                </span>
                {openAccordion === faq.id || openAccordion === "all" ? (
                  <ChevronUp className="text-primary-600" />
                ) : (
                  <ChevronDown className="text-gray-400" />
                )}
              </button>

              {(openAccordion === faq.id || openAccordion === "all") && (
                <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2">
                  <div className="h-px w-full bg-gray-100 mb-4" />
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {faq.answer}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-slate-400 bg-gray-50 p-3 rounded-lg inline-flex">
                    <span>Was this helpful?</span>
                    <button className="hover:text-green-500 flex items-center gap-1 transition-colors">
                      <ThumbsUp size={14} /> Yes
                    </button>
                    <button className="hover:text-red-500 flex items-center gap-1 transition-colors">
                      <ThumbsDown size={14} /> No
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-slate-500">
                No results found for &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
