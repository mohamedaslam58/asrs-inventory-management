"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import Guard from '@/app/components/Guard';
import { Permission } from '@/app/config/rbac';
import AssignAssetModal, { AssetAssignment } from './components/AssignAssetModal';

interface AssetAssignmentRow {
  id: number;
  tag: string;
  asset: string;
  employee: string;
  department: string;
  issued: string; // Formatted YYYY-MM-DD from API
  status: "Assigned" | "Returned";
}

export default function AssetAssignmentPage() {
  const [assignments, setAssignments] = useState<AssetAssignmentRow[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAssignmentCreated = (newAssignment: AssetAssignment) => {
    const assignmentRow = {
      id: newAssignment.id,
      tag: newAssignment.tag,
      asset: (newAssignment as Partial<AssetAssignmentRow>).asset ?? "",
      employee: (newAssignment as Partial<AssetAssignmentRow>).employee ?? "",
      department: (newAssignment as Partial<AssetAssignmentRow>).department ?? "",
      issued:
        (newAssignment as Partial<AssetAssignmentRow>).issued ??
        new Date().toISOString().slice(0, 10),
      status:
        (newAssignment as Partial<AssetAssignmentRow>).status === "Returned"
          ? "Returned"
          : "Assigned",
    } as AssetAssignmentRow;

    setAssignments((prev) => [assignmentRow, ...prev]);
  };

  const fetchAssignments = useCallback(
    async (query = "", signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const endpoint = query
          ? `/asset-assignments?search=${encodeURIComponent(query)}`
          : "/asset-assignments";
        const data = (await apiFetch(endpoint, {
          signal,
        })) as AssetAssignmentRow[];
        setAssignments(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Failed to fetch asset assignments:", err);
          setError("Failed to load asset assignments.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      void fetchAssignments(search, controller.signal);
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [search, fetchAssignments]);

  const handleReturn = async (id: number) => {
    try {
      await apiFetch(`/asset-assignments/${id}/return`, { method: "PATCH" });
      await fetchAssignments(search);
    } catch (err) {
      console.error("Failed to return asset:", err);
    }
  };

  const handleExportCSV = () => {
    if (assignments.length === 0) return;
    const headers = [
      "TAG",
      "ASSET",
      "EMPLOYEE",
      "DEPARTMENT",
      "ISSUED",
      "STATUS",
    ];
    const rows = assignments.map((r) => [
      `"${r.tag}"`,
      `"${r.asset}"`,
      `"${r.employee}"`,
      `"${r.department}"`,
      r.issued,
      r.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `asset_assignments_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 bg-[#0b0f17] text-slate-200 min-h-screen font-sans">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white mb-6">Asset Assignment</h1>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Filter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-slate-800 text-slate-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <Guard permission={Permission.CREATE_ASSET_ASSIGNMENT}>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#38bdf8] hover:bg-[#0284c7] text-slate-950 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span> Assign asset
          </button>
          {/* Modal */}
      <AssignAssetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAssignmentCreated}
      />
          </Guard>
          <button
            onClick={handleExportCSV}
            className="bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-slate-200 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
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

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-[#0f172a]/40 shadow-sm">
        <table className="w-full text-left text-sm text-slate-300 border-collapse">
          <thead className="text-xs uppercase text-slate-400 font-semibold border-b border-slate-800/80 bg-[#0f172a]/80">
            <tr>
              <th className="px-6 py-3.5">TAG</th>
              <th className="px-6 py-3.5">ASSET</th>
              <th className="px-6 py-3.5">EMPLOYEE</th>
              <th className="px-6 py-3.5">DEPARTMENT</th>
              <th className="px-6 py-3.5">ISSUED</th>
              <th className="px-6 py-3.5">STATUS</th>
              <th className="px-6 py-3.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  Loading assignments...
                </td>
              </tr>
            ) : assignments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  No asset assignments found.
                </td>
              </tr>
            ) : (
              assignments.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-300 whitespace-nowrap">
                    {row.tag}
                  </td>
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                    {row.asset}
                  </td>
                  <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                    {row.employee}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {row.department}
                  </td>
                  <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                    {row.issued}
                  </td>
                  <td className="px-6 py-4">
                    {row.status === "Assigned" ? (
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                        Assigned
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        Returned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.status === "Assigned" && (
                      <button
                        onClick={() => handleReturn(row.id)}
                        className="text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors"
                      >
                        Return
                      </button>
                    )}
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