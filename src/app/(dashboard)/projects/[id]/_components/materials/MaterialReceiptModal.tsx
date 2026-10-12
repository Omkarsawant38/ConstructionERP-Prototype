"use client";

import React, { useState, useEffect } from "react";
import { formatCurrencyFull } from "@/lib/utils";
import type { Material, MaterialRequest, StockMovement } from "@/types";
import {
  X,
  PackageCheck,
  Calendar,
  Truck,
  Hash,
  MapPin,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Link as LinkIcon,
} from "lucide-react";

interface MaterialReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMovement: StockMovement) => void;
  projectId: string;
  projectName: string;
  projectCode: string;
  catalogue: Material[];
  requests: MaterialRequest[];
  preselectedRequestId?: string;
}

export function MaterialReceiptModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectName,
  projectCode,
  catalogue,
  requests,
  preselectedRequestId,
}: MaterialReceiptModalProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [selectedRequestItemId, setSelectedRequestItemId] = useState<string>("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("10");
  const [unitCost, setUnitCost] = useState<string>("0");
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [supplierName, setSupplierName] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [sourceOrLocation, setSourceOrLocation] = useState<string>("Main Project Site Yard");
  const [notes, setNotes] = useState<string>("");
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available requests that are approved or partially fulfilled
  const eligibleRequests = requests.filter(
    (r) => r.status === "approved" || r.status === "partially_fulfilled"
  );

  // When opened, initialize
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (preselectedRequestId) {
        setSelectedRequestId(preselectedRequestId);
      } else if (eligibleRequests.length > 0) {
        setSelectedRequestId("");
      }

      if (catalogue.length > 0 && !selectedMaterialId) {
        const first = catalogue[0];
        setSelectedMaterialId(first.id);
        setUnitCost(String(first.unit_price || 0));
        setSupplierName(first.supplier_name || "");
      }
    }
  }, [isOpen, preselectedRequestId, catalogue]);

  // When request changes, handle request item auto-fill
  useEffect(() => {
    if (selectedRequestId) {
      const req = requests.find((r) => r.id === selectedRequestId);
      if (req && req.items && req.items.length > 0) {
        const item = req.items[0];
        setSelectedRequestItemId(item.id);
        setSelectedMaterialId(item.material_id);
        const remaining = Math.max(0, item.quantity - (item.fulfilled_quantity || 0));
        setQuantity(String(remaining > 0 ? remaining : item.quantity));
        setUnitCost(String(item.estimated_unit_cost || 0));
        setSourceOrLocation(req.delivery_location || "Main Project Site Yard");

        const catMat = catalogue.find((m) => m.id === item.material_id);
        if (catMat?.supplier_name) {
          setSupplierName(catMat.supplier_name);
        }
      }
    }
  }, [selectedRequestId, requests, catalogue]);

  // When material changes directly
  const handleMaterialChange = (matId: string) => {
    setSelectedMaterialId(matId);
    const catMat = catalogue.find((m) => m.id === matId);
    if (catMat) {
      setUnitCost(String(catMat.unit_price || 0));
      if (catMat.supplier_name) {
        setSupplierName(catMat.supplier_name);
      }
    }
  };

  if (!isOpen) return null;

  const currentMaterial = catalogue.find((m) => m.id === selectedMaterialId);
  const currentUnit = currentMaterial?.unit || "units";
  const numQty = parseFloat(quantity) || 0;
  const numRate = parseFloat(unitCost) || 0;
  const calculatedTotalCost = numQty * numRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedMaterialId) {
      setErrorMsg("Please select a material.");
      return;
    }
    if (numQty <= 0) {
      setErrorMsg("Received quantity must be greater than zero.");
      return;
    }
    if (!receiptDate) {
      setErrorMsg("Receipt date is required.");
      return;
    }
    if (!supplierName.trim()) {
      setErrorMsg("Supplier or source name is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        project_id: projectId,
        material_id: selectedMaterialId,
        material_name: currentMaterial?.name || "Material",
        movement_type: "receipt",
        quantity: numQty,
        unit: currentUnit,
        unit_cost: numRate,
        date: receiptDate,
        request_id: selectedRequestId || null,
        request_item_id: selectedRequestItemId || null,
        supplier_name: supplierName.trim(),
        reference_number: referenceNumber.trim() || null,
        source_or_location: sourceOrLocation.trim() || null,
        notes: notes.trim() || null,
        attachment_url: attachmentUrl.trim() || null,
      };

      const res = await fetch("/api/materials/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to record material receipt.");
      }

      onSuccess(data.movement);
      onClose();
    } catch (err: any) {
      console.error("Receipt error:", err);
      setErrorMsg(err.message || "Failed to record material receipt.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold">
              <PackageCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Record Material Receipt (GRN)</h2>
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

            {/* Optional Request Link */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg">
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <LinkIcon size={13} className="text-amber-600" />
                <span>Link to Approved Material Request (Optional)</span>
              </label>
              <select
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                className="form-input text-xs w-full py-2 bg-white"
              >
                <option value="">-- Direct Delivery without Indent / Ad-hoc Receipt --</option>
                {eligibleRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.request_number} — Required by {r.required_date} ({r.items.map((i) => `${i.material_name} (${i.quantity} ${i.unit})`).join(", ")})
                  </option>
                ))}
              </select>
            </div>

            {/* Material & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Material Catalogue Item *
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  className="form-input text-sm w-full py-2 font-medium"
                >
                  {catalogue.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Receipt Date (Stock Inward) *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="form-input text-sm w-full py-2 pl-9"
                  />
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Quantity, Rate & Total Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-amber-50/40 rounded-lg border border-amber-100">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quantity Received ({currentUnit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="form-input text-sm w-full py-2 font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Unit Cost (₹ / {currentUnit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="form-input text-sm w-full py-2 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Goods Received Value
                </label>
                <div className="h-9 px-3 bg-white border border-gray-200 rounded-lg flex items-center font-bold text-amber-700 text-sm">
                  {formatCurrencyFull(calculatedTotalCost)}
                </div>
              </div>
            </div>

            {/* Supplier & Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Supplier / Vendor / Quarry Source *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Ultratech Building Solutions"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="form-input text-sm w-full py-2 pl-9"
                  />
                  <Truck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Challan / PO / Invoice Ref #
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. DC-98432 or PO-2025-01"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="form-input text-sm w-full py-2 pl-9"
                  />
                  <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Unloading Location & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Site Unloading Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Central Site Yard / Tower B Staging"
                    value={sourceOrLocation}
                    onChange={(e) => setSourceOrLocation(e.target.value)}
                    className="form-input text-xs w-full py-2 pl-8"
                  />
                  <MapPin size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Delivery Challan Attachment URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://... or scan photo url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="form-input text-xs w-full py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Quality Inspection / Condition Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Inspected by site engineer, batch tested, verified weighbridge slip..."
                className="form-input text-xs w-full"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Receipt increases project site inventory immediately.
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
                disabled={submitting}
                className="btn btn-primary text-sm py-2 px-5 bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Record Receipt (Stock In)</span>
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
