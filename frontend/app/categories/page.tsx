"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

interface CategoryRow {
  id: number;
  name: string;
  items: number;
  units: number;
  value: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await apiFetch('/categories', { signal })) as CategoryRow[];
      setCategories(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load category data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      void fetchCategories(controller.signal);
    }, 0);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    const name = prompt("Enter category name:");
    if (!name || !name.trim()) return;

    try {
      await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      void fetchCategories();
    } catch (err) {
      alert("Failed to add category.");
    }
  };

  return (
    <div className="p-8 bg-[#0b0f17] text-slate-200 min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-white mb-6">Categories</h1>

      <div className="mb-6">
        <button
          onClick={handleAddCategory}
          className="bg-[#38bdf8] hover:bg-[#0284c7] text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1"
        >
          + Add category
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-800/50 rounded-md text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#0f172a]/40 shadow-sm">
        <table className="w-full text-left text-sm text-slate-300 border-collapse">
          <thead className="text-xs uppercase text-slate-400 font-semibold border-b border-slate-800/80 bg-[#0f172a]/80">
            <tr>
              <th className="px-6 py-3.5">CATEGORY</th>
              <th className="px-6 py-3.5">ITEMS</th>
              <th className="px-6 py-3.5">UNITS</th>
              <th className="px-6 py-3.5">VALUE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{cat.name}</td>
                  <td className="px-6 py-4 text-slate-300">{cat.items}</td>
                  <td className="px-6 py-4 text-slate-300">{cat.units.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-300 font-medium">
                    AED {Number(cat.value).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}