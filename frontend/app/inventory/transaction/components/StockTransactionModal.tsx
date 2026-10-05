"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface Item {
  id: number;
  name: string;
  stock: number;
}

interface Warehouse {
  id: number;
  name: string;
}

interface StockTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  items?: Item[];
  warehouses?: Warehouse[];
}

export default function StockTransactionModal({
  isOpen,
  ...props
}: StockTransactionModalProps) {
  if (!isOpen) return null;

  return <StockTransactionModalForm isOpen={isOpen} {...props} />;
}

function StockTransactionModalForm({
  isOpen,
  onClose,
  onSuccess,
  items = [],
  warehouses = [
    { id: 1, name: "Abu Dhabi Main Warehouse" },
    { id: 2, name: "Dubai Warehouse" },
    { id: 3, name: "Al Ain Warehouse" },
  ],
}: StockTransactionModalProps) {
  const router = useRouter();
  const [type, setType] = useState<"IN" | "OUT" | "TRANSFER">("IN");
  const [itemId, setItemId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [warehouse, setWarehouse] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adjust warehouse defaults based on transaction type selection
  const handleTypeChange = (newType: "IN" | "OUT" | "TRANSFER") => {
  setType(newType);
  setError(null);
};

  if (!isOpen) return null;

  const selectedItem = items.find((i) => i.id === Number(itemId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!itemId) {
      setError("Please select an item.");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setError("Please enter a valid quantity greater than 0.");
      return;
    }

    // Warehouse validation checks
    // if ((type === "OUT" || type === "TRANSFER") && !fromWarehouseId) {
    //   setError("Please select a source (From) warehouse.");
    //   return;
    // }

    // if ((type === "IN" || type === "TRANSFER") && !toWarehouseId) {
    //   setError("Please select a destination (To) warehouse.");
    //   return;
    // }

    // if (type === "TRANSFER" && fromWarehouseId === toWarehouseId) {
    //   setError("Source and destination warehouses cannot be the same.");
    //   return;
    // }

    // Stock limit check for removal/transfer
    // if ((type === "OUT" || type === "TRANSFER") && selectedItem && Number(quantity) > selectedItem.stock) {
    //   setError(`Quantity exceeds current available stock (${selectedItem.stock} units).`);
    //   return;
    // }

    setLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/";

      const response = await fetch(`${API_BASE_URL}/stock-transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        itemName: selectedItem?.name,
        transactionType: type,
        quantity: Number(quantity),
        warehouse: warehouse || null,
        transactionDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to record transaction.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <h2 className="text-lg font-semibold text-white">Stock Transaction</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Transaction Type Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => handleTypeChange("IN")}
                className={`py-2 text-xs font-semibold rounded-md transition-all ${
                  type === "IN"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                + Stock In
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("OUT")}
                className={`py-2 text-xs font-semibold rounded-md transition-all ${
                  type === "OUT"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                - Stock Out
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("TRANSFER")}
                className={`py-2 text-xs font-semibold rounded-md transition-all ${
                  type === "TRANSFER"
                    ? "bg-[#0284c7] text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ⇄ Transfer
              </button>
            </div>
          </div>

          {/* Select Item */}
<div>
  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
    Select Item
  </label>
  <select
    value={itemId}
    onChange={(e) => setItemId(e.target.value === "" ? "" : Number(e.target.value))}
    required
    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8] transition-colors"
  >
    <option value="">Select an item...</option>
    {items.map((item) => (
      <option key={item.id} value={item.id}>
        {item.name} (Stock: {item.stock})
      </option>
    ))}
  </select>
</div>

          {/* Warehouse Selection */}
<div>
  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
    Warehouse
  </label>
  <select
    value={warehouse}
    onChange={(e) => setWarehouse(e.target.value)}
    required
    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <option value="">Select a warehouse...</option>
    {warehouses.map((wh) => (
      <option key={wh.id} value={wh.name}>
        {wh.name}
      </option>
    ))}
  </select>
</div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : "")}
              placeholder="0"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#38bdf8] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                type === "IN"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : type === "OUT"
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : "bg-[#38bdf8] hover:bg-[#0284c7] text-slate-950"
              } disabled:opacity-50`}
            >
              {loading
                ? "Processing..."
                : `Confirm ${
                    type === "IN"
                      ? "Stock In"
                      : type === "OUT"
                      ? "Stock Out"
                      : "Transfer"
                  }`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}