"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';

interface SupplierRow {
  id: number;
  supplier: string;
  email: string;
  phone: string;
  items: number;
  openPos: number;
  totalPoValue: number;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = (await apiFetch('/suppliers', { signal: controller.signal })) as SupplierRow[];
        setSuppliers(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to fetch suppliers:', err);
          setError('Failed to load supplier records.');
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const formatCurrency = (val?: number | null) => {
  const amount = Number(val) || 0;
  return `AED ${amount.toLocaleString('en-US')}`;
};

  return (
    <div className="p-8 bg-[#0b0f17] text-slate-200 min-h-screen font-sans">
      {/* Title Header */}
      <h1 className="text-2xl font-bold text-white mb-6">Suppliers</h1>

      {/* Action Button */}
      <div className="mb-6">
        <button className="bg-[#38bdf8] hover:bg-[#0284c7] text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5">
          <span>+</span> Add supplier
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-800/50 rounded-md text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#0f172a]/40 shadow-sm">
        <table className="w-full text-left text-sm text-slate-300 border-collapse">
          <thead className="text-xs uppercase text-slate-400 font-semibold border-b border-slate-800/80 bg-[#0f172a]/80">
            <tr>
              <th className="px-6 py-3.5">SUPPLIER</th>
              <th className="px-6 py-3.5">EMAIL</th>
              <th className="px-6 py-3.5">PHONE</th>
              <th className="px-6 py-3.5">ITEMS</th>
              <th className="px-6 py-3.5">OPEN POS</th>
              <th className="px-6 py-3.5">TOTAL PO VALUE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Loading suppliers...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No suppliers found.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    {s.supplier}
                  </td>
                  <td className="px-6 py-4 text-slate-300">{s.email}</td>
                  <td className="px-6 py-4 text-slate-300 whitespace-nowrap">{s.phone}</td>
                  <td className="px-6 py-4 text-slate-300">{s.items}</td>
                  <td className="px-6 py-4 text-slate-300">{s.openPos}</td>
                  <td className="px-6 py-4 text-slate-200 font-medium whitespace-nowrap">
                    {formatCurrency(s.totalPoValue)}
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