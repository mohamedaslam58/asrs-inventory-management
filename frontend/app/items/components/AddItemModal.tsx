"use client";

import React, { useState, useEffect } from "react";

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  supplier: string;
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Default form state template
const INITIAL_FORM_STATE = {
  sku: "",
  barcode: "",
  name: "",
  categoryId: "",
  supplierId: "",
  unitCost: "",
  reorderPoint: "10",
  reorderQty: "50",
  status: "ACTIVE",
  stock: "0",
};

export default function AddItemModal({ isOpen, onClose, onSuccess }: AddItemModalProps) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousIsOpen, setPreviousIsOpen] = useState(isOpen);

  if (isOpen !== previousIsOpen) {
    setPreviousIsOpen(isOpen);
    if (isOpen) {
      setFormData(INITIAL_FORM_STATE);
      setError(null);
    }
  }

  useEffect(() => {
  if (isOpen) {
    const fetchData = async () => {
      try {
        // Update API_BASE_URL if your NestJS backend runs on port 4000 or uses /api prefix
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        const [catRes, supRes] = await Promise.all([
          fetch(`${API_BASE_URL}/categories`, { method: "GET" }),
          fetch(`${API_BASE_URL}/suppliers`, { method: "GET" }),
        ]);

        if (!catRes.ok) {
          throw new Error(`Failed to fetch categories: ${catRes.statusText}`);
        }
        if (!supRes.ok) {
          throw new Error(`Failed to fetch suppliers: ${supRes.statusText}`);
        }

        const catData = await catRes.json();
        const supData = await supRes.json();

        // Safely extract arrays whether returned directly or wrapped in { data: [...] }
        setCategories(Array.isArray(catData) ? catData : catData.data || []);
        setSuppliers(Array.isArray(supData) ? supData : supData.data || []);
      } catch (err) {
        console.error("Error fetching categories or suppliers:", err);
      }
    };

    fetchData();
  }
}, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryId ? Number(formData.categoryId) : null,
          supplierId: formData.supplierId ? Number(formData.supplierId) : null,
          unitCost: Number(formData.unitCost),
          reorderPoint: Number(formData.reorderPoint),
          reorderQty: Number(formData.reorderQty),
          stock: Number(formData.stock),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create item");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-lg font-bold text-white">Create New Item</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">SKU *</label>
              <input
                type="text"
                name="sku"
                required
                value={formData.sku}
                onChange={handleChange}
                placeholder="SKU-1001"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Barcode *</label>
              <input
                type="text"
                name="barcode"
                required
                value={formData.barcode}
                onChange={handleChange}
                placeholder="890123456"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Item Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Product Title"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Supplier</label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.supplier}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Unit Cost (AED)</label>
              <input
                type="number"
                step="0.01"
                name="unitCost"
                required
                value={formData.unitCost}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Reorder Point</label>
              <input
                type="number"
                name="reorderPoint"
                value={formData.reorderPoint}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Initial Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
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
              className="rounded-md bg-[#0284c7] hover:bg-[#0369a1] px-4 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}