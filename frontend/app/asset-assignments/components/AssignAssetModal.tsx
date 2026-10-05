'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';

export interface AssetAssignment {
  id: number;
  tag: string;
  itemId: number;
  employee: string;
  department: string;
  warehouseId: number;
  issuedAt: string;
  returnedAt: string | null;
  item?: Item;
  // Included for UI rendering
  assetName?: string;
  status?: string;
}

interface Item {
  id: number;
  name: string;
  stock?: number;
}

interface ItemOption {
  id: number;
  name: string;
  stock?: number;
}

interface WarehouseOption {
  id: number;
  warehouse: string;
}

interface AssignAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAssignment: AssetAssignment) => void;
}

export default function AssignAssetModal({
  isOpen,
  onClose,
  onSuccess,
}: AssignAssetModalProps) {
  const [formData, setFormData] = useState({
    tag: '',
    itemId: '',
    employee: '',
    department: '',
    warehouseId: '',
    issuedAt: new Date().toISOString().split('T')[0],
  });

  const [items, setItems] = useState<ItemOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch items and warehouses from DB when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadDropdownData = async () => {
      setLoadingDropdowns(true);
      setError(null);
      try {
        const [itemsData, warehousesData] = await Promise.all([
          apiFetch<ItemOption[]>('/items/getItems'),
          apiFetch<WarehouseOption[]>('/warehouses'),
        ]);

        setItems(Array.isArray(itemsData) ? itemsData : []);
        setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
      } catch (err: unknown) {
        console.error('Failed to load assets/warehouses dropdown data:', err);
        setError('Failed to fetch items or warehouses from database.');
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.itemId || !formData.warehouseId) {
      setError('Please select both an asset item and a warehouse.');
      return;
    }

    setLoading(true);

    try {
      const selectedItem = items.find((i) => Number(i.id) === Number(formData.itemId));

      const payload = {
        tag: formData.tag.trim(),
        itemId: Number(formData.itemId),
        employee: formData.employee.trim(),
        department: formData.department.trim(),
        warehouseId: Number(formData.warehouseId),
        issuedAt: new Date(formData.issuedAt).toISOString(),
        item: { id: Number(formData.itemId) },
        returnedAt: null,
      };

      // 1. Post assignment record to NestJS API
      const savedRecord = await apiFetch<AssetAssignment>('/asset-assignments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // 2. Attach frontend metadata for instant table update
      const fullAssignmentData: AssetAssignment = {
        ...savedRecord,
        tag: payload.tag,
        employee: payload.employee,
        department: payload.department,
        issuedAt: payload.issuedAt,
        returnedAt: null,
        assetName: selectedItem?.name || 'Assigned Asset',
        item: selectedItem ? { id: selectedItem.id, name: selectedItem.name, stock: selectedItem.stock } : undefined,
        status: 'Assigned',
      };

      onSuccess(fullAssignmentData);
      onClose();

      // Reset form
      setFormData({
        tag: '',
        itemId: '',
        employee: '',
        department: '',
        warehouseId: '',
        issuedAt: new Date().toISOString().split('T')[0],
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to assign asset. Please check required fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h2 className="text-lg font-bold text-white">Assign Asset</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Tag */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Asset Tag *
            </label>
            <input
              type="text"
              name="tag"
              required
              value={formData.tag}
              onChange={handleChange}
              placeholder="e.g. AST-5020"
              className="w-full rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Select Asset Item (DB Dropdown) */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Select Asset Item *
            </label>
            <select
              name="itemId"
              required
              disabled={loadingDropdowns}
              value={formData.itemId}
              onChange={handleChange}
              className="w-full rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
            >
              <option value="">
                {loadingDropdowns ? 'Loading items...' : 'Select an asset...'}
              </option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} {item.stock !== undefined ? `(Stock: ${item.stock})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Employee & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Employee *
              </label>
              <input
                type="text"
                name="employee"
                required
                value={formData.employee}
                onChange={handleChange}
                placeholder="e.g. Noura Ahmed"
                className="w-full rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Department *
              </label>
              <input
                type="text"
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Operations"
                className="w-full rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Warehouse (DB Dropdown) & Issued Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Warehouse *
              </label>
              <select
                name="warehouseId"
                required
                disabled={loadingDropdowns}
                value={formData.warehouseId}
                onChange={handleChange}
                className="w-full rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              >
                <option value="">
                  {loadingDropdowns ? 'Loading...' : 'Select warehouse...'}
                </option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.warehouse}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Issued Date *
              </label>
              <input
                type="date"
                name="issuedAt"
                required
                value={formData.issuedAt}
                onChange={handleChange}
                className="w-full rounded-lg bg-zinc-950 px-3 py-2 text-xs text-white border border-zinc-800 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingDropdowns}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}