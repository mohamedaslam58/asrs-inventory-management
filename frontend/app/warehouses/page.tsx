"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

interface WarehouseRow {
  id: number;
  warehouse: string;
  city: string;
  skusStocked: number;
  units: number;
  value: number;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await apiFetch('/warehouses', { signal })) as WarehouseRow[];
      setWarehouses(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to fetch warehouses:', err);
        setError('Failed to load warehouse metrics.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => {
      void fetchWarehouses(controller.signal);
    }, 0);

    return () => {
      globalThis.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchWarehouses]);

  return (
    <div className="p-8 bg-[#0b0f17] text-slate-200 min-h-screen font-sans">
      <h1 className="text-3xl font-bold text-white mb-6">Warehouses</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-800/50 rounded-md text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#0f172a]/40 shadow-sm">
        <table className="w-full text-left text-sm text-slate-300 border-collapse">
          <thead className="text-xs uppercase text-slate-400 font-semibold border-b border-slate-800/80 bg-[#0f172a]/80">
            <tr>
              <th className="px-6 py-3.5">WAREHOUSE</th>
              <th className="px-6 py-3.5">CITY</th>
              <th className="px-6 py-3.5">SKUS STOCKED</th>
              <th className="px-6 py-3.5">UNITS</th>
              <th className="px-6 py-3.5">VALUE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Loading warehouses...
                </td>
              </tr>
            ) : warehouses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No warehouses found.
                </td>
              </tr>
            ) : (
              warehouses.map((wh) => (
                <tr key={wh.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{wh.warehouse}</td>
                  <td className="px-6 py-4 text-slate-300">{wh.city}</td>
                  <td className="px-6 py-4 text-slate-300">{wh.skusStocked}</td>
                  <td className="px-6 py-4 text-slate-300">{wh.units.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-300 font-medium">
                    AED {Number(wh.value).toLocaleString('en-US', { minimumFractionDigits: 0 })}
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