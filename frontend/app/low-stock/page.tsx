"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

interface LowStockAlertRow {
  itemId: number;
  item: string;
  stock: number;
  reorderPt: number;
  shortfall: number;
  suggestedQty: number;
  supplier: string;
}

export default function LowStockAlertsPage() {
  const [alerts, setAlerts] = useState<LowStockAlertRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPOs, setIsCreatingPOs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await apiFetch('/low-stock/alerts', { signal })) as LowStockAlertRow[];
      setAlerts(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to fetch low stock alerts:', err);
        setError('Failed to load low stock alerts.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadAlerts = async () => {
      await fetchAlerts(controller.signal);
    };

    void loadAlerts();
    return () => controller.abort();
  }, [fetchAlerts]);

  const handleCreateDraftPOs = async () => {
    setIsCreatingPOs(true);
    try {
      await apiFetch('/low-stock/create-draft-pos', { method: 'POST' });
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to create draft POs:', err);
    } finally {
      setIsCreatingPOs(false);
    }
  };

  const handleExportCSV = () => {
    if (alerts.length === 0) return;
    const headers = ['ITEM', 'STOCK', 'REORDER PT', 'SHORTFALL', 'SUGGESTED QTY', 'SUPPLIER'];
    const rows = alerts.map((r) => [
      `"${r.item}"`,
      r.stock,
      r.reorderPt,
      r.shortfall,
      r.suggestedQty,
      `"${r.supplier}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `low_stock_alerts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 bg-[#0b0f17] text-slate-200 min-h-screen font-sans">
      {/* Title Header */}
      <h1 className="text-2xl font-bold text-white mb-6">
        Low Stock Alerts ({alerts.length})
      </h1>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleCreateDraftPOs}
          disabled={isCreatingPOs || alerts.length === 0}
          className="bg-[#38bdf8] hover:bg-[#0284c7] text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isCreatingPOs ? 'Creating...' : 'Create draft POs'}
        </button>

        <button
          onClick={handleExportCSV}
          className="bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Export CSV
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
              <th className="px-6 py-3.5">ITEM</th>
              <th className="px-6 py-3.5">STOCK</th>
              <th className="px-6 py-3.5">REORDER PT</th>
              <th className="px-6 py-3.5">SHORTFALL</th>
              <th className="px-6 py-3.5">SUGGESTED QTY</th>
              <th className="px-6 py-3.5">SUPPLIER</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Loading low stock alerts...
                </td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No items currently below reorder threshold.
                </td>
              </tr>
            ) : (
              alerts.map((r) => (
                <tr key={r.itemId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    {r.item}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-red-950/70 text-red-400 border border-red-900/40">
                      {r.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{r.reorderPt}</td>
                  <td className="px-6 py-4 text-slate-300">{r.shortfall}</td>
                  <td className="px-6 py-4 text-slate-300">{r.suggestedQty}</td>
                  <td className="px-6 py-4 text-slate-300 whitespace-nowrap">{r.supplier}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}