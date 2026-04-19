"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { Loader2, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

interface PayoutRequestFormProps {
  availableBalance: number;
}

export default function PayoutRequestForm({
  availableBalance,
}: PayoutRequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    method: "bank_transfer",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let newValue = value;
    if (type === "number" && newValue.length > 1 && newValue.startsWith("0") && newValue[1] !== ".") {
      newValue = newValue.replace(/^0+/, "");
    }
    setFormData({ ...formData, [name]: newValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > availableBalance) {
      toast.error("Amount exceeds available balance");
      return;
    }
    if (!formData.bankName || !formData.accountNumber || !formData.accountName) {
      toast.error("Please fill in all bank details");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.post("/payouts", {
        amount,
        method: formData.method,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
      });

      if ((result as any).success) {
        toast.success("Payout request submitted successfully!");
        setFormData({
          amount: "",
          method: "bank_transfer",
          bankName: "",
          accountNumber: "",
          accountName: "",
        });
        router.refresh();
      } else {
        toast.error((result as any).error || "Failed to submit payout request");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Request Payout</h2>
      <p className="text-sm text-gray-500 mb-6">
        Available:{" "}
        <span className="font-bold text-green-600">
          GHS {availableBalance.toLocaleString()}
        </span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (GHS)
          </label>
          <div className="relative">
            <DollarSign
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              min="1"
              step="0.01"
              max={availableBalance}
              required
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bank Name
          </label>
          <input
            type="text"
            name="bankName"
            value={formData.bankName}
            onChange={handleChange}
            placeholder="e.g. Ghana Commercial Bank"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Number
          </label>
          <input
            type="text"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            placeholder="Enter account number"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Name
          </label>
          <input
            type="text"
            name="accountName"
            value={formData.accountName}
            onChange={handleChange}
            placeholder="Name on account"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || availableBalance <= 0}
          className="w-full py-2.5 bg-primary-900 text-white font-bold rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Submitting...
            </>
          ) : (
            "Submit Payout Request"
          )}
        </button>
      </form>
    </div>
  );
}
