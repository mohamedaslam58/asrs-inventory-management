"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Permission } from '../config/rbac';
import Guard from '../components/Guard';

interface PurchaseOrderRow {
  id: number;
  po: string;
  date: string;
  supplier: string;
  lines: number;
  total: number;
  status: 'Draft' | 'Approved' | 'Sent' | 'Received' | string;
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = (await apiFetch('/purchase-orders', { signal })) as PurchaseOrderRow[];
      setOrders(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to fetch purchase orders:', err);
        setError('Failed to load purchase orders.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetchOrders(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchOrders]);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await apiFetch(`/purchase-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      void fetchOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAutoCreate = async () => {
    setIsAutoCreating(true);
    try {
      await apiFetch('/purchase-orders/auto-create', { method: 'POST' });
      await fetchOrders();
    } catch (err) {
      console.error('Failed to auto-create POs:', err);
    } finally {
      setIsAutoCreating(false);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) return;
    const headers = ['PO', 'DATE', 'SUPPLIER', 'LINES', 'TOTAL', 'STATUS'];
    const rows = orders.map((r) => [
      r.po,
      r.date,
      `"${r.supplier}"`,
      r.lines,
      r.total,
      r.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `purchase_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val?: number | null) => {
    const amount = Number(val) || 0;
    return `AED ${amount.toLocaleString('en-US')}`;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-950/60 text-amber-500 border border-amber-800/40">
            Draft
          </span>
        );
      case 'Approved':
        return (
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-sky-950/60 text-sky-400 border border-sky-800/40">
            Approved
          </span>
        );
      case 'Sent':
        return (
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
            Sent
          </span>
        );
      case 'Received':
        return (
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            Received
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const renderActionLinks = (row: PurchaseOrderRow) => {
    switch (row.status) {
      case 'Draft':
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <button className="text-sky-400 hover:underline">View</button>
            <span className="text-slate-600">·</span>
            <button
              onClick={() => handleStatusUpdate(row.id, 'Approved')}
              className="text-sky-400 hover:underline"
            >
              Mark Approved
            </button>
          </div>
        );
      case 'Approved':
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <button className="text-sky-400 hover:underline">View</button>
            <span className="text-slate-600">·</span>
            <button
              onClick={() => handleStatusUpdate(row.id, 'Sent')}
              className="text-sky-400 hover:underline"
            >
              Mark Sent
            </button>
          </div>
        );
      case 'Sent':
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <button className="text-sky-400 hover:underline">View</button>
            <span className="text-slate-600">·</span>
            <button
              onClick={() => handleStatusUpdate(row.id, 'Received')}
              className="text-sky-400 hover:underline"
            >
              Receive stock
            </button>
          </div>
        );
      case 'Received':
      default:
        return (
          <button className="text-sky-400 hover:underline text-sm">View</button>
        );
    }
  };

  return (
    <div className="p-8 bg-[#0b0f17] text-slate-200 min-h-screen font-sans">
      <h1 className="text-2xl font-bold text-white mb-6">Purchase Orders</h1>

      {/* Action Bar */}
      <div className="flex items-center gap-3 mb-6">
        <Guard permission={Permission.CREATE_DRAFT_POS}>
        <button
          onClick={handleAutoCreate}
          disabled={isAutoCreating}
          className="bg-[#38bdf8] hover:bg-[#0284c7] text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isAutoCreating ? 'Generating...' : 'Auto-create POs from low stock'}
        </button>
        </Guard>

        <button
          onClick={handleExportCSV}
          className="bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
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
              <th className="px-6 py-3.5">PO</th>
              <th className="px-6 py-3.5">DATE</th>
              <th className="px-6 py-3.5">SUPPLIER</th>
              <th className="px-6 py-3.5">LINES</th>
              <th className="px-6 py-3.5">TOTAL</th>
              <th className="px-6 py-3.5">STATUS</th>
              <th className="px-6 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  Loading purchase orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              orders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{po.po}</td>
                  <td className="px-6 py-4 text-slate-300 whitespace-nowrap">{po.date}</td>
                  <td className="px-6 py-4 text-slate-300">{po.supplier}</td>
                  <td className="px-6 py-4 text-slate-300">{po.lines}</td>
                  <td className="px-6 py-4 text-slate-200 font-medium whitespace-nowrap">
                    {formatCurrency(po.total)}
                  </td>
                  <td className="px-6 py-4">{renderStatusBadge(po.status)}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {renderActionLinks(po)}
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