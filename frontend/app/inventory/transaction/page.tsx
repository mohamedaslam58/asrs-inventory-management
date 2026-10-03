"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api-client';

interface StockTransactionRow {
  id: number;
  date: string;
  type: string;
  item: string;
  warehouse: string;
  qty: number;
}

export default function StockTransactionsPage() {
  const [transactions, setTransactions] = useState<StockTransactionRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = (await apiFetch('/stock-transactions', { signal })) as {
        totalCount: number;
        data: StockTransactionRow[];
      };
      setTransactions(res.data);
      setTotalCount(res.totalCount);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to fetch transactions:', err);
        setError('Failed to load transaction records.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- asynchronous fetch is intentionally triggered on mount
    void fetchTransactions(controller.signal);
    return () => controller.abort();
  }, [fetchTransactions]);

  // Combined text and dropdown filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter((row) => {
      const matchesType = selectedType === 'ALL' || row.type === selectedType;
      const query = search.toLowerCase();
      const matchesText =
        !query ||
        row.item.toLowerCase().includes(query) ||
        row.warehouse.toLowerCase().includes(query);

      return matchesType && matchesText;
    });
  }, [transactions, search, selectedType]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['DATE', 'TYPE', 'ITEM', 'WAREHOUSE', 'QTY'];
    const rows = filteredTransactions.map((r) => [
      r.date,
      r.type,
      `"${r.item}"`,
      `"${r.warehouse}"`,
      r.qty,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'OUT':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-950/80 text-red-400 border border-red-800/40">
            OUT
          </span>
        );
      case 'TRF':
      case 'TRANSFER':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
            TRF
          </span>
        );
      case 'IN':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
            IN
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="p-8 bg-[#0b0f17] text-slate-200 min-h-screen font-sans">
      <h1 className="text-2xl font-bold text-white mb-6">
        Stock Transactions <span className="text-slate-400 font-normal">({totalCount})</span>
      </h1>

      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Filter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 bg-[#111827] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#111827] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-700 cursor-pointer"
          >
            <option value="ALL">All types</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
            <option value="TRF">TRF</option>
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button className="bg-[#38bdf8] hover:bg-[#0284c7] text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            + New
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

      {/* Transactions Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#0f172a]/40 shadow-sm">
        <table className="w-full text-left text-sm text-slate-300 border-collapse">
          <thead className="text-xs uppercase text-slate-400 font-semibold border-b border-slate-800/80 bg-[#0f172a]/80">
            <tr>
              <th className="px-6 py-3.5">DATE</th>
              <th className="px-6 py-3.5">TYPE</th>
              <th className="px-6 py-3.5">ITEM</th>
              <th className="px-6 py-3.5">WAREHOUSE</th>
              <th className="px-6 py-3.5">QTY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Loading stock transactions...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No stock transactions found matching filter.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-slate-300 whitespace-nowrap">{tx.date}</td>
                  <td className="px-6 py-4">{renderBadge(tx.type)}</td>
                  <td className="px-6 py-4 font-medium text-white">{tx.item}</td>
                  <td className="px-6 py-4 text-slate-300">{tx.warehouse}</td>
                  <td className="px-6 py-4 text-slate-300">{tx.qty}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}