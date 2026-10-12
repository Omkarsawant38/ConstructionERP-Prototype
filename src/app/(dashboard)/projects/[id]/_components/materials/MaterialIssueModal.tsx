"use client";

import React, { useState, useEffect } from "react";
import type { Material, ProjectMaterialRegisterItem, StockMovement } from "@/types";
import {
  X,
  ArrowUpRight,
  Calendar,
  Layers,
  Hash,
  AlertCircle,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface MaterialIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMovement: StockMovement) => void;
  projectId: string;
  projectName: string;
  projectCode: string;
  catalogue: Material[];
  registerItems: ProjectMaterialRegisterItem[];
  preselectedMaterialId?: string;
}

export function MaterialIssueModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectName,
  projectCode,
  catalogue,
  registerItems,
  preselectedMaterialId,
}: MaterialIssueModalProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("5");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [sourceOrLocation, setSourceOrLocation] = useState<string>("Tower A - 3rd Floor Slab Pour");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (preselectedMaterialId) {
        setSelectedMaterialId(preselectedMaterialId);
      } else if (catalogue.length > 0 && !selectedMaterialId) {
        // Prefer an item that has available stock
        const inStockItem = registerItems.find((r) => r.current_stock > 0);
        setSelectedMaterialId(inStockItem ? inStockItem.material_id : catalogue[0].id);
      }
    }
  }, [isOpen, preselectedMaterialId, catalogue, registerItems]);

  if (!isOpen) return null;

  const currentMaterial = catalogue.find((m) => m.id === selectedMaterialId);
  const currentRegister = registerItems.find((r) => r.material_id === selectedMaterialId);
  const availableStock = currentRegister ? currentRegister.current_stock : 0;
  const currentUnit = currentMaterial?.unit || "units";
  const numQty = parseFloat(quantity) || 0;

  const isInsufficient = numQty > availableStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedMaterialId) {
      setErrorMsg("Please select a material to issue.");
      return;
    }
    if (numQty <= 0) {
      setErrorMsg("Issue quantity must be greater than zero.");
      return;
    }
    if (availableStock <= 0) {
      setErrorMsg(`No stock available at site for ${currentMaterial?.name || "this material"}. Please record a material receipt first.`);
      return;
    }
    if (numQty > availableStock) {
      setErrorMsg(
        `Cannot issue ${numQty} ${currentUnit}. Only ${availableStock} ${currentUnit} are available in site stock.`
      );
      return;
    }
    if (!sourceOrLocation.trim()) {
      setErrorMsg("Work task or destination location is mandatory for auditable material consumption.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        project_id: projectId,
        material_id: selectedMaterialId,
        material_name: currentMaterial?.name || "Material",
        movement_type: "issue",
        quantity: numQty,
        unit: currentUnit,
        unit_cost: currentMaterial?.unit_price || 0,
        date: issueDate,
        source_or_location: sourceOrLocation.trim(),
        reference_number: referenceNumber.trim() || null,
        notes: notes.trim() || null,
      };

      const res = await fetch("/api/materials/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to record material issue.");
      }

      onSuccess(data.movement);
      onClose();
    } catch (err: any) {
      console.error("Issue error:", err);
      setErrorMsg(err.message || "Failed to record material issue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Issue Material to Site (Stock Out)</h2>
              <p className="text-xs text-gray-500">
                Project: <span className="font-semibold text-gray-700">{projectCode}</span> — {projectName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Material Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select Material to Issue *
              </label>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="form-input text-sm w-full py-2 font-medium"
              >
                {catalogue.map((mat) => {
                  const reg = registerItems.find((r) => r.material_id === mat.id);
                  const st = reg ? reg.current_stock : 0;
                  return (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} — Current Site Stock: {st} {mat.unit}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Current Site Stock Badge */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-900">
                <Layers size={16} className="text-blue-600" />
                <span className="font-semibold">Current Available Project Stock:</span>
              </div>
              <span className={`font-bold px-2.5 py-1 rounded-md text-xs ${availableStock > 0 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                {availableStock} {currentUnit}
              </span>
            </div>

            {/* Quantity and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity to Issue ({currentUnit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  max={availableStock > 0 ? availableStock : undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`form-input text-sm w-full py-2 font-bold ${
                    isInsufficient ? "border-red-500 text-red-600 focus:ring-red-500" : "text-gray-900"
                  }`}
                />
                {isInsufficient && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Exceeds available site stock ({availableStock} {currentUnit})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Issue Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="form-input text-sm w-full py-2 pl-9"
                  />
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Work Task Destination */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Site Destination / Task / Work Activity *
              </label>
              <input
                type="text"
                placeholder="e.g. Tower B Raft Concreting, Masonry Layer Block 2"
                value={sourceOrLocation}
                onChange={(e) => setSourceOrLocation(e.target.value)}
                className="form-input text-sm w-full py-2"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Specifies which physical structural component or subcontractor receives the material.
              </p>
            </div>

            {/* Work Order Ref & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Site Issue Slip / Indent Ref #
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. ISS-0042"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="form-input text-xs w-full py-2 pl-8"
                  />
                  <Hash size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Dispatched To / Contractor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shree Ganesh Steel Fixers"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input text-xs w-full py-2"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Reduces project site stock upon dispatch.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn btn-secondary text-sm py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || isInsufficient || availableStock <= 0}
                className="btn btn-primary text-sm py-2 px-5 bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Issuing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirm Issue (Stock Out)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
