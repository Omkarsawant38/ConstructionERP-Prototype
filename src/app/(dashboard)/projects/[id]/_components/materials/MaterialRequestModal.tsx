"use client";

import React, { useState, useEffect } from "react";
import { formatCurrencyFull } from "@/lib/utils";
import { usePermissions } from "@/lib/rbac/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Material, MaterialRequest, MaterialRequestItem } from "@/types";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  AlertCircle,
  Package,
  Clock,
  FileText,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface MaterialRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRequest: MaterialRequest) => void;
  projectId: string;
  projectName: string;
  projectCode: string;
  catalogue: Material[];
}

interface DraftItem {
  material_id: string;
  material_name: string;
  quantity: string;
  unit: string;
  estimated_unit_cost: number;
  notes: string;
}

export function MaterialRequestModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectName,
  projectCode,
  catalogue,
}: MaterialRequestModalProps) {
  const { user } = useAuth();
  const { hasPermission, hasRole } = usePermissions();

  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [deliveryLocation, setDeliveryLocation] = useState("Main Project Site Yard");
  const [notes, setNotes] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize with one line item when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (catalogue.length > 0 && items.length === 0) {
        const firstMat = catalogue[0];
        setItems([
          {
            material_id: firstMat.id,
            material_name: firstMat.name,
            quantity: "10",
            unit: firstMat.unit,
            estimated_unit_cost: Number(firstMat.unit_price) || 0,
            notes: "",
          },
        ]);
      }
    }
  }, [isOpen, catalogue]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const defaultMat = catalogue[0];
    if (!defaultMat) return;
    setItems((prev) => [
      ...prev,
      {
        material_id: defaultMat.id,
        material_name: defaultMat.name,
        quantity: "1",
        unit: defaultMat.unit,
        estimated_unit_cost: Number(defaultMat.unit_price) || 0,
        notes: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg("Request must contain at least one material line item.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    setErrorMsg(null);
  };

  const handleMaterialChange = (index: number, matId: string) => {
    const selectedMat = catalogue.find((m) => m.id === matId);
    if (!selectedMat) return;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              material_id: selectedMat.id,
              material_name: selectedMat.name,
              unit: selectedMat.unit,
              estimated_unit_cost: Number(selectedMat.unit_price) || 0,
            }
          : item
      )
    );
  };

  const handleQuantityChange = (index: number, val: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: val } : item))
    );
  };

  const handleItemNotesChange = (index: number, val: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, notes: val } : item))
    );
  };

  const calculateTotalEstimatedCost = () => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      return sum + q * item.estimated_unit_cost;
    }, 0);
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    setErrorMsg(null);

    // Validation
    if (!requiredDate) {
      setErrorMsg("Required delivery date is mandatory.");
      return;
    }
    if (!deliveryLocation.trim()) {
      setErrorMsg("Site delivery location is mandatory.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Please add at least one material item to the request.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const q = parseFloat(it.quantity);
      if (isNaN(q) || q <= 0) {
        setErrorMsg(`Item #${i + 1} (${it.material_name}) must have a quantity greater than zero.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        project_id: projectId,
        priority,
        required_date: requiredDate,
        delivery_location: deliveryLocation.trim(),
        notes: notes.trim(),
        attachment_url: attachmentUrl.trim() || null,
        is_draft: isDraft,
        items: items.map((it) => ({
          material_id: it.material_id,
          material_name: it.material_name,
          quantity: parseFloat(it.quantity),
          unit: it.unit,
          estimated_unit_cost: it.estimated_unit_cost,
          notes: it.notes.trim() || null,
        })),
      };

      const res = await fetch("/api/materials/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create material request");
      }

      onSuccess(data.request);
      onClose();
    } catch (err: any) {
      console.error("Create request error:", err);
      setErrorMsg(err.message || "Failed to submit material request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create Material Request</h2>
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Key Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Priority Level *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="form-input text-sm w-full py-2"
              >
                <option value="low">Low (Standard Routine)</option>
                <option value="medium">Medium (Scheduled Pour/Task)</option>
                <option value="high">High (Urgent Milestone)</option>
                <option value="critical">Critical (Site Stoppage Risk)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Required Delivery Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="form-input text-sm w-full py-2 pl-9"
                />
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Site Delivery Location *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Tower B - Bay 4"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="form-input text-sm w-full py-2 pl-9"
                />
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Multi-item Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Requested Material Line Items</h3>
                <p className="text-xs text-gray-500">Select materials from catalogue and specify quantities</p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 w-1/3">Material from Catalogue *</th>
                    <th className="py-2.5 px-3 w-28">Quantity *</th>
                    <th className="py-2.5 px-3 w-20">Unit</th>
                    <th className="py-2.5 px-3 w-28 text-right">Est. Rate</th>
                    <th className="py-2.5 px-3">Notes</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/20">
                      <td className="p-2">
                        <select
                          value={item.material_id}
                          onChange={(e) => handleMaterialChange(idx, e.target.value)}
                          className="form-input text-xs w-full py-1.5"
                        >
                          {catalogue.map((mat) => (
                            <option key={mat.id} value={mat.id}>
                              {mat.name} ({mat.category})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          className="form-input text-xs w-full py-1.5 font-semibold text-gray-800"
                          placeholder="Qty"
                        />
                      </td>
                      <td className="p-2 text-gray-500 font-medium whitespace-nowrap">
                        {item.unit}
                      </td>
                      <td className="p-2 text-right font-medium text-gray-700 whitespace-nowrap">
                        {formatCurrencyFull(item.estimated_unit_cost)}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleItemNotesChange(idx, e.target.value)}
                          placeholder="Grade, specs, or task"
                          className="form-input text-xs w-full py-1.5"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Estimated Value */}
            <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-200 flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">
                {items.length} line {items.length === 1 ? "item" : "items"} configured
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Total Estimated Indent Value:</span>
                <span className="font-bold text-amber-700 text-sm">
                  {formatCurrencyFull(calculateTotalEstimatedCost())}
                </span>
              </div>
            </div>
          </div>

          {/* Request Notes & Attachment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Site Justification / Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain the scheduled activity, work order, or contractor requirement..."
                className="form-input text-xs w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Attachment URL or Drawing Reference (Optional)
              </label>
              <input
                type="text"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://... or PO-REF-1234"
                className="form-input text-xs w-full py-2"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Link to bar bending schedule, pour plan, or supplier quote.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <Clock size={14} className="text-amber-500" />
            <span>Submitted requests route directly to the Project Manager for approval.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-secondary text-sm py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="btn btn-secondary text-sm py-2 px-4 border-gray-300"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="btn btn-primary text-sm py-2 px-5 bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
