"use client";

import React, { useState } from "react";
import { formatCurrencyFull } from "@/lib/utils";
import type { Material, StockMovement } from "@/types";
import {
  X,
  Package,
  Plus,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Tag,
  Scale,
  Truck,
  ShieldAlert,
  Layers,
} from "lucide-react";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMaterial: Material) => void;
  projectId: string;
  projectName: string;
  projectCode: string;
}

const CATEGORIES = [
  { value: "cement", label: "Cement & Binder" },
  { value: "steel", label: "Steel & Rebar" },
  { value: "sand", label: "Sand & Fine Aggregates" },
  { value: "aggregate", label: "Coarse Aggregates" },
  { value: "bricks", label: "Bricks & Blocks" },
  { value: "plumbing", label: "Plumbing & Piping" },
  { value: "electrical", label: "Electrical & Cabling" },
  { value: "paints", label: "Paints & Chemicals" },
  { value: "flooring", label: "Flooring & Tiles" },
  { value: "hardware", label: "Hardware & Fasteners" },
  { value: "wood", label: "Timber & Formwork" },
  { value: "tools", label: "Equipment & Tools" },
  { value: "general", label: "General Site Consumables" },
];

const COMMON_UNITS = [
  "bags",
  "MT",
  "brass",
  "pcs",
  "lengths",
  "coils",
  "sq.ft",
  "cu.m",
  "kg",
  "liters",
  "boxes",
  "meters",
];

export function AddMaterialModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectName,
  projectCode,
}: AddMaterialModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("cement");
  const [unit, setUnit] = useState("bags");
  const [customUnit, setCustomUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [currentStock, setCurrentStock] = useState<string>("0");
  const [reorderLevel, setReorderLevel] = useState<string>("20");
  const [supplierName, setSupplierName] = useState("");
  const [initialSiteStock, setInitialSiteStock] = useState<string>("0");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Please enter the material name.");
      return;
    }

    const finalUnit = unit === "other" ? customUnit.trim() : unit;
    if (!finalUnit) {
      setErrorMsg("Please select or specify a unit of measurement.");
      return;
    }

    const priceNum = parseFloat(unitPrice) || 0;
    if (priceNum < 0) {
      setErrorMsg("Unit rate cannot be negative.");
      return;
    }

    const warehouseStockNum = parseFloat(currentStock) || 0;
    const reorderLevelNum = parseFloat(reorderLevel) || 0;
    const initialSiteStockNum = parseFloat(initialSiteStock) || 0;

    setLoading(true);

    try {
      // 1. Create in backend catalogue
      const payload = {
        name: trimmedName,
        category,
        unit: finalUnit,
        unit_price: priceNum,
        current_stock: warehouseStockNum,
        reorder_level: reorderLevelNum,
        supplier_name: supplierName.trim() || undefined,
        organization_id: "org1",
      };

      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok && !resJson.material) {
        throw new Error(resJson.error || "Failed to add material to catalogue");
      }

      const createdMaterial: Material = resJson.material || {
        id: `mat-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 2. If user specified initial site stock for this project, record an opening stock movement
      if (initialSiteStockNum > 0) {
        try {
          await fetch("/api/materials/movements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project_id: projectId,
              material_id: createdMaterial.id,
              material_name: createdMaterial.name,
              movement_type: "receipt",
              quantity: initialSiteStockNum,
              unit: finalUnit,
              unit_cost: priceNum,
              date: new Date().toISOString().split("T")[0],
              source_or_location: "Opening Site Stock Allocation",
              reference_number: `OPN-${projectCode}`,
              notes: notes.trim() || "Initial project site stock allocation",
            }),
          });
        } catch (movErr) {
          console.warn("Could not record opening stock movement:", movErr);
        }
      }

      onSuccess(createdMaterial);
      handleReset();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create material");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName("");
    setCategory("cement");
    setUnit("bags");
    setCustomUnit("");
    setUnitPrice("");
    setCurrentStock("0");
    setReorderLevel("20");
    setSupplierName("");
    setInitialSiteStock("0");
    setNotes("");
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden"
        style={{
          background: "var(--color-card, #FFFFFF)",
          borderColor: "var(--color-border, #E5E7EB)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Add New Material</h3>
              <p className="text-xs text-gray-500">
                Register material into catalogue and allocate for{" "}
                <span className="font-semibold text-amber-800">{projectCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-800 border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Item Core Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Material Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Ultratech PPC Cement 50kg, Tata Tiscon TMT 16mm, River Sand"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                style={{ background: "var(--color-bg-primary, #FAFAF9)" }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                  style={{ background: "var(--color-bg-primary, #FAFAF9)" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Unit of Measurement <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                    style={{ background: "var(--color-bg-primary, #FAFAF9)" }}
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option value="other">Other (Custom unit)</option>
                  </select>
                  {unit === "other" && (
                    <input
                      type="text"
                      placeholder="e.g. bundle"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="w-28 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock Levels */}
          <div className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/50 space-y-4">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
              Pricing & Inventory Controls
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Standard Rate (₹ / {unit})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Warehouse Stock
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Low Stock Alert Level
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="20"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                />
              </div>
            </div>

            {/* Initial Site Allocation */}
            <div className="pt-2 border-t border-stone-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-800">
                    Opening Site Stock for {projectCode}
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Directly allocate physical units currently available on this job site.
                  </p>
                </div>
                <div className="w-full sm:w-44">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={initialSiteStock}
                    onChange={(e) => setInitialSiteStock(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Supplier & Specs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Primary Supplier / Vendor (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Tata Steel Distributors, UltraTech Building Solutions"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                style={{ background: "var(--color-bg-primary, #FAFAF9)" }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Notes / Technical Specification
              </label>
              <textarea
                rows={2}
                placeholder="Grade, brand preference, batch testing standards, or storage precautions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                style={{ background: "var(--color-bg-primary, #FAFAF9)" }}
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold border text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-stone-900 shadow-sm flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              style={{ background: "#FFB000" }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving Material...</span>
                </>
              ) : (
                <>
                  <Plus size={15} className="stroke-[2.5]" />
                  <span>Register Material</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
