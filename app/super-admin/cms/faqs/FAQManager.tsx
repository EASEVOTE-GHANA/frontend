"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Save,
  X,
  Database,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

type FAQContent = {
  question: string;
  answer: string;
  category: string;
};

interface FAQManagerProps {
  initialFaqs: {
    id: string;
    content: FAQContent;
    status: string;
    updatedAt: Date;
  }[];
}

export default function FAQManager({ initialFaqs }: FAQManagerProps) {
  const [faqs, setFaqs] = useState(initialFaqs);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "General",
  });

  const categories = [
    "General",
    "Voting",
    "Ticketing",
    "Payments",
    "Organizing",
  ];

  const filteredFaqs = faqs.filter(
    (faq: any) => {
      const question = faq.content?.question || faq.question || "";
      const answer = faq.content?.answer || faq.answer || "";
      return (
        question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  );

  const handleOpenModal = (faq?: any) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        question: faq.content?.question || faq.question || "",
        answer: faq.content?.answer || faq.answer || "",
        category: faq.content?.category || faq.category || "General",
      });
    } else {
      setEditingFaq(null);
      setFormData({ question: "", answer: "", category: "General" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.question || !formData.answer) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsProcessing(true);
    try {
      await api.put("/cms/faqs", {
        id: editingFaq?.id,
        ...formData,
      });

      toast.success(editingFaq ? "FAQ Updated" : "FAQ Created");
      setIsModalOpen(false);
      // Ideally we would re-fetch or update local state from server response,
      // but simpler to refresh for now or rely on Next.js revalidate
      window.location.reload();
    } catch (error) {
      toast.error("Failed to save FAQ");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      await api.delete(`/cms/faqs/${id}`);
      toast.success("FAQ Deleted");
      setFaqs(faqs.filter((f) => f.id !== id));
    } catch (error) {
      toast.error("Failed to delete FAQ");
    }
  };

  const handleSeed = async () => {
    setIsProcessing(true);
    try {
      const result = await api.post("/cms/faqs/seed", {});
      if (result.success) {
        toast.success(result.message);
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to seed FAQs");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-magenta-500"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {faqs.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Database size={16} /> Seed Defaults
            </button>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex-1 sm:flex-none cursor-pointer"
          >
            <Plus size={16} /> Add FAQ
          </button>
        </div>
      </div>

      {/* FAQs List */}
      <div className="grid gap-4">
        {filteredFaqs.map((faq) => (
          <div
            key={faq.id}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-600">
                  {faq.content.category}
                </span>
                <span className="text-[10px] text-gray-400">
                  Last updated: {new Date(faq.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1">
                {(faq as any).content?.question || (faq as any).question}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {(faq as any).content?.answer || (faq as any).answer}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenModal(faq)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDelete(faq.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">No FAQs found.</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-magenta-600 text-sm font-medium mt-2 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {editingFaq ? "Edit FAQ" : "New FAQ"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magenta-500 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magenta-500 focus:outline-none"
                  placeholder="e.g., How do I vote?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Answer
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-magenta-500 focus:outline-none resize-none"
                  placeholder="Enter the detailed answer..."
                ></textarea>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isProcessing}
                className="px-4 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save FAQ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
