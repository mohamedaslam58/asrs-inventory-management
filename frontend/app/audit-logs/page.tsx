"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";

interface AuditLog {
  id: number;
  time: string;
  user: string;
  action: string;
  detail: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const endpoint = query
        ? `/audit-logs?search=${encodeURIComponent(query)}`
        : "/audit-logs";
      const data = (await apiFetch(endpoint)) as AuditLog[];
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLogs(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchLogs]);

  const exportCSV = () => {
    const headers = ["TIME", "USER", "ACTION", "DETAIL"];
    const rows = logs.map((log) => [
      log.time,
      log.user,
      log.action,
      log.detail,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 bg-[#080d14] text-slate-200 min-h-screen font-sans space-y-6">
      <h1 className="text-2xl font-bold text-white tracking-tight">Audit Logs</h1>

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-2xl">
          <input
            type="text"
            placeholder="Filter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f1724] border border-slate-800 text-slate-200 placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-slate-600 transition-colors"
          />
        </div>

        <button
          onClick={exportCSV}
          disabled={logs.length === 0}
          className="bg-[#0f1724] hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>

      {/* Logs Table Container */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0b121e]/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="uppercase text-slate-400 border-b border-slate-800/80 bg-[#0d1522] font-semibold">
              <tr>
                <th className="px-6 py-3.5 tracking-wider w-48">TIME</th>
                <th className="px-6 py-3.5 tracking-wider w-64">USER</th>
                <th className="px-6 py-3.5 tracking-wider w-48">ACTION</th>
                <th className="px-6 py-3.5 tracking-wider">DETAIL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-slate-300 whitespace-nowrap">
                      {log.time}
                    </td>
                    <td className="px-6 py-3.5 text-slate-200 font-medium">
                      {log.user}
                    </td>
                    <td className="px-6 py-3.5 text-slate-200 font-medium">
                      {log.action}
                    </td>
                    <td className="px-6 py-3.5 text-slate-300">
                      {log.detail}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}