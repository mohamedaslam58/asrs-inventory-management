"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import AddItemModal from './components/AddItemModal';
import { Permission } from '../config/rbac';
import Guard from '../components/Guard';

interface Item {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  supplier: string;
  cost: number;
  stock: number;
  reorderPoint: number;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 1. Debounce search input to avoid hitting API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilter(filter);
    }, 300);

    return () => clearTimeout(handler);
  }, [filter]);

  // 2. Fetch items with AbortController to handle race conditions
  const fetchItems = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      // Using standard RESTful path /items (or /items/getItems if explicitly mapped in NestJS)
      const query = debouncedFilter ? `?search=${encodeURIComponent(debouncedFilter)}` : '';
      const data = await apiFetch<Item[]>(`/items/getItems${query}`, { signal });
      setItems(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to fetch items:', err);
        setError('Failed to load items. Check your backend connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilter]);

  // 3. Initial fetch & 10s background refresh interval
  useEffect(() => {
    const controller = new AbortController();
    const initialFetchTimer = setTimeout(() => {
      void fetchItems(controller.signal);
    }, 0);

    const interval = setInterval(() => {
      void fetchItems();
    }, 10000); // 10s auto-refresh interval

    return () => {
      controller.abort();
      clearTimeout(initialFetchTimer);
      clearInterval(interval);
    };
  }, [fetchItems]);

  // CSV Export Handler
  const handleExportCSV = () => {
  if (!items.length) return;

  const headers = ["SKU", "Barcode", "Item", "Category", "Supplier", "Cost (AED)", "Stock", "Reorder Point"];
  
  const rows = items.map(item => {
    // Helper function to safely escape CSV string values
    const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;

    return [
      escapeCsv(item.sku),
      escapeCsv(item.barcode),
      escapeCsv(item.name),
      escapeCsv(item.category),
      escapeCsv(item.supplier),
      item.cost ?? 0,
      item.stock ?? 0,
      item.reorderPoint ?? 0
    ];
  });

  // Use Blob instead of encodeURI for reliable handling of special characters & large datasets
  const csvString = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `items_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

  return (
    <div className="p-6 bg-[#0f172a] text-slate-200 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          Items
          {isLoading && (
            <span className="text-xs font-normal text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-0.5 rounded-full animate-pulse">
              Syncing...
            </span>
          )}
        </h1>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#1e293b] border border-slate-700 text-slate-200 px-4 py-2 rounded-md w-full sm:w-72 focus:outline-none focus:border-cyan-500 placeholder-slate-500 text-sm"
        />
        <div className="flex gap-3">
      {/* 2. Open Modal on Button Click */}
      <Guard permission={Permission.CREATE_ITEM}>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="bg-[#0284c7] hover:bg-[#0369a1] text-white px-4 py-2 rounded-md font-medium text-sm flex items-center justify-center gap-1 transition-colors cursor-pointer"
      >
        + Add item
      </button>
      </Guard>

      {/* 3. Pass state props to Modal */}
      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchItems}
      />
          <button 
            onClick={handleExportCSV}
            className="bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-800/50 rounded-md text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0f172a]">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#1e293b] text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">BARCODE</th>
              <th className="px-4 py-3">ITEM</th>
              <th className="px-4 py-3">CATEGORY</th>
              <th className="px-4 py-3">SUPPLIER</th>
              <th className="px-4 py-3">COST</th>
              <th className="px-4 py-3">STOCK</th>
              <th className="px-4 py-3">REORDER PT</th>
              <th className="px-4 py-3 text-center">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No items found.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isLowStock = Number(item.stock) <= Number(item.reorderPoint);
                return (
                  <tr key={item.id} className="hover:bg-[#1e293b]/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-200">{item.sku}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{item.barcode}</td>
                    <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-slate-300">{item.category}</td>
                    <td className="px-4 py-3 text-slate-300">{item.supplier}</td>
                    <td className="px-4 py-3 text-slate-200">
                      AED {Number(item.cost).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{item.stock}</td>
                    <td className="px-4 py-3 text-slate-300">{item.reorderPoint}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isLowStock
                            ? 'bg-red-950/80 text-red-400 border border-red-800/50'
                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                        }`}
                      >
                        {isLowStock ? 'Low' : 'OK'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}