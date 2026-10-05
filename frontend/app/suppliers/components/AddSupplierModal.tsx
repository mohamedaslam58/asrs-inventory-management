'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';

export interface Supplier {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  items?: number;
  openPos?: number;
  totalPoValue?: number;
}

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSupplier: Supplier) => void;
}

export default function AddSupplierModal({
  isOpen,
  onClose,
  onSuccess,
}: AddSupplierModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      // 1. Post to NestJS API
      const savedSupplier = await apiFetch<Supplier>('/suppliers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // 2. Attach calculated values for UI rendering
      const fullSupplierData: Supplier = {
        ...savedSupplier,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        items: 0,
        openPos: 0,
        totalPoValue: 0,
      };

      onSuccess(fullSupplierData);
      onClose();

      // Reset form fields
      setFormData({ name: '', email: '', phone: '' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create supplier. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-white">Add New Supplier</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Supplier Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. ABC Technology LLC"
              className="w-full rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. sales@abctech.ae"
              className="w-full rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Phone Number *
            </label>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +971 2 555 0199"
              className="w-full rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}