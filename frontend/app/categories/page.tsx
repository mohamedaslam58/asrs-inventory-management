"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api-client';
import AddCategoryModal from './components/AddCategoryModal';
import Guard from '../components/Guard';
import { Permission } from '../config/rbac';

interface CategoryRow {
  id: number;
  name: string;
  items: number;
  units: number;
  value: number;
}

interface Item {
  id: number;
  name: string;
  categoryId: number;
  stock: number;
  unitCost: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

  const fetchCategories = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await apiFetch('/categories', { signal })) as CategoryRow[];
      const data_items = (await apiFetch('/items/getItems', { signal })) as Item[];
      setCategories(data);
      setItems(data_items);
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

  const categoriesWithMetrics = useMemo(() => {
    return categories.map((cat) => {
      // Filter items belonging to this category
      const categoryItems = items.filter((item) => item.categoryId === cat.id);

      const totalItems = categoryItems.length;
      const totalUnits = categoryItems.reduce(
        (sum, item) => sum + (Number(item.stock) || 0),
        0
      );
      const totalValue = categoryItems.reduce(
        (sum, item) =>
          sum + (Number(item.stock) || 0) * (Number(item.unitCost) || 0),
        0
      );

      return {
        ...cat,
        itemsCount: totalItems,
        units: totalUnits,
        value: totalValue,
      };
    });
  }, [categories, items]);

  return (
    <div className="p-8 bg-[#0b0f17] text-slate-200 min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-white mb-6">Categories</h1>

      <div className="mb-6">
        <Guard permission={Permission.CREATE_CATEGORY}>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#38bdf8] hover:bg-[#0284c7] text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 cursor-pointer"
          >
            + Add category
          </button>
        </Guard>

        <AddCategoryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            void fetchCategories();
          }}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-800/50 rounded-md text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#0f172a]/40 shadow-sm">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
            <tr>
              <th className="p-3">Category Name</th>
              <th className="p-3">Items</th>
              <th className="p-3">Units (Stock)</th>
              <th className="p-3">Total Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {categoriesWithMetrics.map((category) => (
              <tr key={category.id} className="hover:bg-zinc-800/50">
                <td className="p-3 font-medium text-white">{category.name}</td>
                <td className="p-3">{category.itemsCount}</td>
                <td className="p-3">{category.units}</td>
                <td className="p-3 font-semibold text-emerald-400">
                  AED {category.value.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}