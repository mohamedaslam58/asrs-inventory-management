"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

interface ValuationRow {
  category: string;
  abuDhabi: number;
  dubai: number;
  alAin: number;
  totalValue: number;
}

interface TurnoverRow {
  category: string;
  cogs90d: number;
  stockValue: number;
  turnsPerYear: number;
}

interface SlowMovingRow {
  itemId: number;
  item: string;
  units: number;
  valueTiedUp: number;
  noIssuesForDays: string;
}

interface ForecastRow {
  itemId: number;
  item: string;
  avgDailyUse: number;
  forecastNext30d: number;
  stock: number;
  daysOfCover: number;
  suggestedOrder: number;
}

export default function ReportsPage() {
  const [valuation, setValuation] = useState<ValuationRow[]>([]);
  const [turnover, setTurnover] = useState<TurnoverRow[]>([]);
  const [slowMoving, setSlowMoving] = useState<SlowMovingRow[]>([]);
  const [forecast, setForecast] = useState<ForecastRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllReports = async () => {
      setIsLoading(true);
      try {
        const [valData, turnData, slowData, fcData] = await Promise.all([
          apiFetch("/reports/valuation"),
          apiFetch("/reports/turnover"),
          apiFetch("/reports/slow-moving"),
          apiFetch("/reports/forecast"),
        ]);
        setValuation(valData as ValuationRow[]);
        setTurnover(turnData as TurnoverRow[]);
        setSlowMoving(slowData as SlowMovingRow[]);
        setForecast(fcData as ForecastRow[]);
      } catch (err) {
        console.error("Failed to load report metrics:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAllReports();
  }, []);

  const formatAED = (val: number) =>
    `AED ${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 bg-[#0b0f17] text-slate-200 min-h-screen font-sans space-y-10">
      <h1 className="text-2xl font-bold text-white">Reports</h1>

      {/* 1. Inventory Valuation */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-medium text-slate-200">
            Inventory valuation (AED, weighted cost)
          </h2>
          <button
            onClick={() =>
              exportCSV(
                "inventory_valuation",
                ["CATEGORY", "ABU DHABI", "DUBAI", "AL AIN", "TOTAL VALUE"],
                valuation.map((r) => [r.category, formatAED(r.abuDhabi), formatAED(r.dubai), formatAED(r.alAin), formatAED(r.totalValue)])
              )
            }
            className="mt-2 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 font-medium px-3 py-1.5 rounded text-xs transition-colors"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#0f172a]/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="uppercase text-slate-400 border-b border-slate-800/80 bg-[#0f172a]/80 font-semibold">
              <tr>
                <th className="px-6 py-3">CATEGORY</th>
                <th className="px-6 py-3">ABU DHABI</th>
                <th className="px-6 py-3">DUBAI</th>
                <th className="px-6 py-3">AL AIN</th>
                <th className="px-6 py-3">TOTAL VALUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : valuation.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="px-6 py-3 text-white font-medium">{r.category}</td>
                  <td className="px-6 py-3">{formatAED(r.abuDhabi)}</td>
                  <td className="px-6 py-3">{formatAED(r.dubai)}</td>
                  <td className="px-6 py-3">{formatAED(r.alAin)}</td>
                  <td className="px-6 py-3">{formatAED(r.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Inventory Turnover */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-medium text-slate-200">Inventory turnover</h2>
          <button
            onClick={() =>
              exportCSV(
                "inventory_turnover",
                ["CATEGORY", "COGS 90D", "STOCK VALUE", "TURNS / YEAR"],
                turnover.map((r) => [r.category, formatAED(r.cogs90d), formatAED(r.stockValue), r.turnsPerYear])
              )
            }
            className="mt-2 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 font-medium px-3 py-1.5 rounded text-xs transition-colors"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#0f172a]/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="uppercase text-slate-400 border-b border-slate-800/80 bg-[#0f172a]/80 font-semibold">
              <tr>
                <th className="px-6 py-3">CATEGORY</th>
                <th className="px-6 py-3">COGS 90D</th>
                <th className="px-6 py-3">STOCK VALUE</th>
                <th className="px-6 py-3">TURNS / YEAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : turnover.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="px-6 py-3 text-white font-medium">{r.category}</td>
                  <td className="px-6 py-3">{formatAED(r.cogs90d)}</td>
                  <td className="px-6 py-3">{formatAED(r.stockValue)}</td>
                  <td className="px-6 py-3">{r.turnsPerYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Slow-moving items */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-medium text-slate-200">
            Slow-moving items (no issues in 60 days)
          </h2>
          <button
            onClick={() =>
              exportCSV(
                "slow_moving_items",
                ["ITEM", "UNITS", "VALUE TIED UP", "NO ISSUES FOR (DAYS)"],
                slowMoving.map((r) => [r.item, r.units, formatAED(r.valueTiedUp), r.noIssuesForDays])
              )
            }
            className="mt-2 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 font-medium px-3 py-1.5 rounded text-xs transition-colors"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#0f172a]/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="uppercase text-slate-400 border-b border-slate-800/80 bg-[#0f172a]/80 font-semibold">
              <tr>
                <th className="px-6 py-3">ITEM</th>
                <th className="px-6 py-3">UNITS</th>
                <th className="px-6 py-3">VALUE TIED UP</th>
                <th className="px-6 py-3">NO ISSUES FOR (DAYS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : slowMoving.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="px-6 py-3 text-white font-medium">{r.item}</td>
                  <td className="px-6 py-3">{r.units}</td>
                  <td className="px-6 py-3">{formatAED(r.valueTiedUp)}</td>
                  <td className="px-6 py-3">{r.noIssuesForDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Basic demand forecast */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-medium text-slate-200">
            Basic demand forecast (weighted 30d/90d usage, top 20 by need)
          </h2>
          <button
            onClick={() =>
              exportCSV(
                "demand_forecast",
                ["ITEM", "AVG DAILY USE", "FORECAST NEXT 30D", "STOCK", "DAYS OF COVER", "SUGGESTED ORDER"],
                forecast.map((r) => [r.item, r.avgDailyUse, r.forecastNext30d, r.stock, r.daysOfCover, r.suggestedOrder])
              )
            }
            className="mt-2 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 font-medium px-3 py-1.5 rounded text-xs transition-colors"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#0f172a]/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="uppercase text-slate-400 border-b border-slate-800/80 bg-[#0f172a]/80 font-semibold">
              <tr>
                <th className="px-6 py-3">ITEM</th>
                <th className="px-6 py-3">AVG DAILY USE</th>
                <th className="px-6 py-3">FORECAST NEXT 30D</th>
                <th className="px-6 py-3">STOCK</th>
                <th className="px-6 py-3">DAYS OF COVER</th>
                <th className="px-6 py-3">SUGGESTED ORDER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : forecast.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="px-6 py-3 text-white font-medium">{r.item}</td>
                  <td className="px-6 py-3">{r.avgDailyUse}</td>
                  <td className="px-6 py-3">{r.forecastNext30d}</td>
                  <td className="px-6 py-3">{r.stock}</td>
                  <td className="px-6 py-3">{r.daysOfCover}</td>
                  <td className="px-6 py-3">{r.suggestedOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}