"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api-client';

interface InventoryRow {
  itemId: number;
  item: string;
  abuDhabi: number;
  dubai: number;
  alAin: number;
  total: number;
  value: number;
}

export default function InventoryMatrixPage() {
  const [matrix, setMatrix] = useState<InventoryRow[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatrix = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await apiFetch('/inventory/matrix', { signal })) as InventoryRow[];
      setMatrix(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to fetch inventory matrix:', err);
        setError('Failed to load live stock matrix.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMatrix(controller.signal);
    return () => controller.abort();
  }, [fetchMatrix]);

  // Client-side search filter
  const filteredMatrix = useMemo(() => {
    if (!search.trim()) return matrix;
    return matrix.filter((row) =>
      row.item.toLowerCase().includes(search.toLowerCase())
    );
  }, [matrix, search]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredMatrix.length === 0) return;
    const headers = ['ITEM', 'ABU DHABI', 'DUBAI', 'AL AIN', 'TOTAL', 'VALUE (AED)'];
    const rows = filteredMatrix.map((r) => [
      `"${r.item}"`,
      r.abuDhabi,
      r.dubai,
      r.alAin,
      r.total,
      r.value,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'inventory_matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 bg-[#0b0f17] text-slate-200 min-h-screen font-sans">
      <h1 className="text-2xl font-semibold text-white mb-6">
        Inventory <span className="text-slate-400 font-normal">(live, derived from the stock ledger)</span>
      </h1>

      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-96">
          <input
            type="text"
            placeholder="Filter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button className="bg-[#38bdf8] hover:bg-[#0284c7] text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            + Stock transaction
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
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
      <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#0f172a]/40 shadow-sm">
        <table className="w-full text-left text-sm text-slate-300 border-collapse">
          <thead className="text-xs uppercase text-slate-400 font-semibold border-b border-slate-800/80 bg-[#0f172a]/80">
            <tr>
              <th className="px-6 py-3.5">ITEM</th>
              <th className="px-6 py-3.5">ABU DHABI</th>
              <th className="px-6 py-3.5">DUBAI</th>
              <th className="px-6 py-3.5">AL AIN</th>
              <th className="px-6 py-3.5">TOTAL</th>
              <th className="px-6 py-3.5">VALUE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Loading inventory stock...
                </td>
              </tr>
            ) : filteredMatrix.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No matching inventory records found.
                </td>
              </tr>
            ) : (
              filteredMatrix.map((row) => (
                <tr key={row.itemId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{row.item}</td>
                  <td className="px-6 py-4 text-slate-300">{row.abuDhabi}</td>
                  <td className="px-6 py-4 text-slate-300">{row.dubai}</td>
                  <td className="px-6 py-4 text-slate-300">{row.alAin}</td>
                  <td className="px-6 py-4 text-slate-300 font-medium">{row.total}</td>
                  <td className="px-6 py-4 text-slate-300 font-medium">
                    AED {Number(row.value).toLocaleString('en-US', { minimumFractionDigits: 0 })}
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