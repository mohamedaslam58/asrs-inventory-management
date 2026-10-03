'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

interface KpiMetric {
  id: number;
  label: string;
  value: string;
  prefix?: string;
}

interface CategoryValue {
  category: string;
  value: number;
}

interface WarehouseValue {
  warehouse: string;
  value: number;
}

interface LowStockItem {
  id: number;
  name: string;
  currentStock: number;
  reorderPoint: number;
  supplier: string;
}

interface Transaction {
  id: number;
  transactionDate: string;
  transactionType: string;
  itemName: string;
  warehouse: string;
  quantity: number;
}

interface DashboardData {
  metrics: KpiMetric[];
  stockByCategory: CategoryValue[];
  stockByWarehouse: WarehouseValue[];
  lowStock: LowStockItem[];
  recentTransactions: Transaction[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const result = (await apiFetch('/dashboard/stats')) as DashboardData;
      setData(result);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to update dashboard data:', err);
      setError('Error fetching dynamic metrics from NestJS backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const runFetch = () => {
      void fetchDashboardData();
    };

    const initialTimer = setTimeout(runFetch, 0);
    const interval = setInterval(runFetch, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xs text-emerald-500">
        Loading live inventory telemetry...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg bg-red-950/40 p-4 text-xs text-red-400 border border-red-800/40">
        {error}
      </div>
    );
  }

  const stockByCategory = data?.stockByCategory || [];
  const stockByWarehouse = data?.stockByWarehouse || [];
  const lowStock = data?.lowStock || [];
  const recentTransactions = data?.recentTransactions || [];

  const maxCategoryVal = Math.max(...stockByCategory.map((c) => c.value), 1);
  const maxWarehouseVal = Math.max(...stockByWarehouse.map((w) => w.value), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-emerald-400">LIVE DATA STREAM</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {data?.metrics.map((metric) => (
          <div
            key={metric.id}
            className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 shadow-sm backdrop-blur-sm"
          >
            <div>
              {metric.prefix && (
                <div className="text-xs font-semibold text-zinc-400">{metric.prefix}</div>
              )}
              <div className="text-2xl font-bold text-white tracking-tight">{metric.value}</div>
            </div>
            <div className="mt-2 text-xs text-zinc-400">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-white">Stock value by category (AED)</h2>
          <div className="mt-4 space-y-3.5">
            {stockByCategory.map((item) => {
              const widthPct = (item.value / maxCategoryVal) * 100;
              return (
                <div key={item.category} className="grid grid-cols-12 items-center gap-2 text-xs">
                  <span className="col-span-4 text-zinc-300 truncate font-medium">{item.category}</span>
                  <div className="col-span-5 h-2.5 w-full rounded-full bg-zinc-950">
                    <div
                      className="h-2.5 rounded-full bg-sky-400 transition-all duration-500"
                      style={{ width: `${Math.max(widthPct, 4)}%` }}
                    />
                  </div>
                  <span className="col-span-3 text-right font-mono font-semibold text-zinc-200">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse Breakdown */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-white">Stock value by warehouse (AED)</h2>
          <div className="mt-4 space-y-3.5">
            {stockByWarehouse.map((item) => {
              const widthPct = (item.value / maxWarehouseVal) * 100;
              return (
                <div key={item.warehouse} className="grid grid-cols-12 items-center gap-2 text-xs">
                  <span className="col-span-4 text-zinc-300 truncate font-medium">{item.warehouse}</span>
                  <div className="col-span-5 h-2.5 w-full rounded-full bg-zinc-950">
                    <div
                      className="h-2.5 rounded-full bg-sky-400 transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="col-span-3 text-right font-mono font-semibold text-zinc-200">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Low Stock Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-white mb-4">Low stock</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">ITEM</th>
                <th className="pb-3 text-center">STOCK</th>
                <th className="pb-3">REORDER PT</th>
                <th className="pb-3">SUPPLIER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {lowStock.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 font-medium text-zinc-200">{row.name}</td>
                  <td className="py-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-400 font-mono font-semibold text-[11px] border border-red-800/40">
                      {row.currentStock}
                    </span>
                  </td>
                  <td className="py-3 text-zinc-300 font-mono">{row.reorderPoint}</td>
                  <td className="py-3 text-zinc-400">{row.supplier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-white mb-4">Recent transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="pb-3">DATE</th>
                <th className="pb-3">TYPE</th>
                <th className="pb-3">ITEM</th>
                <th className="pb-3">WAREHOUSE</th>
                <th className="pb-3 text-right">QTY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {recentTransactions.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 text-zinc-400 font-mono">
                    {new Date(row.transactionDate).toISOString().split('T')[0]}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide font-mono ${
                        row.transactionType === 'OUT'
                          ? 'bg-red-950/80 text-red-400 border border-red-800/40'
                          : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/40'
                      }`}
                    >
                      {row.transactionType}
                    </span>
                  </td>
                  <td className="py-3 font-medium text-zinc-200">{row.itemName}</td>
                  <td className="py-3 text-zinc-400">{row.warehouse}</td>
                  <td className="py-3 text-right font-mono font-semibold text-zinc-200">
                    {row.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}