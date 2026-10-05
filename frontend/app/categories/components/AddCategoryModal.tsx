"use client";

import React, { useState } from "react";

interface Category {
  id: number;
  name: string;
  items?: number;
  units?: number;
  value?: number;
}

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Pass back the created category with calculated values to update local state immediately
  onSuccess: (newCategory: Category) => void;
}

const INITIAL_FORM_STATE = {
  name: "",
  items: "0",
  units: "0",
  value: "0.00",
};

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSuccess,
}: AddCategoryModalProps) {
  const [formData, setFormData] = useState(() => ({ ...INITIAL_FORM_STATE }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({ ...INITIAL_FORM_STATE });
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

      // 1. Send only 'name' to the backend as per Category entity schema
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create category");
      }

      const savedCategory = await response.json();

      // 2. Attach calculated frontend values to the saved record
      const fullCategoryData: Category = {
        ...savedCategory,
        items: Number(formData.items) || 0,
        units: Number(formData.units) || 0,
        value: Number(formData.value) || 0,
      };

      onSuccess(fullCategoryData);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm select-none">
      <div className="w-full max-w-md space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white">Add Category</h3>
            <p className="text-xs text-zinc-400">
              Create category and initialize display metrics.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="rounded-md border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Electrical Accessories, HVAC"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 transition-colors focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#0284c7] hover:bg-[#0369a1] px-4 py-2 text-xs font-medium text-white transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}