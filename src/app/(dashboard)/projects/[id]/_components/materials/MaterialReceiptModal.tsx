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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "18px",
          width: "100%",
          maxWidth: "740px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "#DCFCE7",
                color: "#15803D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PackageCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Record Material Receipt (GRN)
              </h3>
              <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                Project: <strong style={{ color: "#D97706" }}>{projectCode}</strong> — {projectName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Form & Scrollable Content */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
          <div
            style={{
              padding: "24px 28px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {errorMsg && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#991B1B",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Optional Request Link */}
            <div
              style={{
                padding: "14px 16px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <LinkIcon size={14} style={{ color: "#D97706" }} />
                <span>Link to Approved Material Request (Optional)</span>
              </label>
              <select
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  color: "#0F172A",
                  outline: "none",
                }}
              >
                <option value="">-- Direct Delivery without Indent / Ad-hoc Receipt --</option>
                {eligibleRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.request_number} — Required by {r.required_date} ({r.items.map((i) => `${i.material_name} (${i.quantity} ${i.unit})`).join(", ")})
                  </option>
                ))}
              </select>
            </div>

            {/* Material & Receipt Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Material Catalogue Item <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0F172A",
                    outline: "none",
                  }}
                >
                  {catalogue.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Receipt Date (Stock Inward) <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Calendar
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94A3B8",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="date"
                    required
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      paddingLeft: "38px",
                      paddingRight: "14px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quantity, Rate & Total Value Box */}
            <div
              style={{
                padding: "18px 20px",
                borderRadius: "14px",
                border: "1px solid #FDE68A",
                backgroundColor: "#FFFBEB",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "14px" }}>
                {/* Quantity */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#78350F", marginBottom: "6px" }}>
                    Quantity Received ({currentUnit}) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: "1px solid #FCD34D",
                      backgroundColor: "#FFFFFF",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Unit Cost */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#78350F", marginBottom: "6px" }}>
                    Unit Cost (₹ / {currentUnit}) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94A3B8",
                        fontWeight: 700,
                        fontSize: "13px",
                        pointerEvents: "none",
                      }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      style={{
                        width: "100%",
                        height: "42px",
                        paddingLeft: "28px",
                        paddingRight: "14px",
                        borderRadius: "10px",
                        border: "1px solid #FCD34D",
                        backgroundColor: "#FFFFFF",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0F172A",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Goods Received Value */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#78350F", marginBottom: "6px" }}>
                    Goods Received Value
                  </label>
                  <div
                    style={{
                      height: "42px",
                      padding: "0 14px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #FCD34D",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      fontWeight: 800,
                      fontSize: "15px",
                      color: "#B45309",
                    }}
                  >
                    {formatCurrencyFull(calculatedTotalCost)}
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier & Ref # */}
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Supplier / Vendor / Quarry Source <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Truck
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94A3B8",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sahyadri Aggregate Supplies"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      paddingLeft: "38px",
                      paddingRight: "14px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Challan / PO / Invoice Ref #
                </label>
                <div style={{ position: "relative" }}>
                  <Hash
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94A3B8",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="e.g. DC-98432 or PO-2025-01"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      paddingLeft: "38px",
                      paddingRight: "14px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Unloading Location & Attachment URL */}
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Site Unloading Location
                </label>
                <div style={{ position: "relative" }}>
                  <MapPin
                    size={16}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94A3B8",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="e.g. Main Project Site Yard"
                    value={sourceOrLocation}
                    onChange={(e) => setSourceOrLocation(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      paddingLeft: "38px",
                      paddingRight: "14px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Delivery Challan Attachment URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://... or scan photo url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "13px",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Quality Inspection / Condition Notes */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Quality Inspection / Condition Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Inspected by site engineer, batch tested, verified weighbridge slip..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  color: "#0F172A",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div
            style={{
              padding: "16px 28px",
              borderTop: "1px solid #E2E8F0",
              backgroundColor: "#F8FAFC",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Receipt increases project site inventory immediately.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  padding: "9px 20px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  backgroundColor: "#FFB000",
                  color: "#0F172A",
                  fontWeight: 700,
                  fontSize: "13px",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 6px rgba(255, 176, 0, 0.25)",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="stroke-[2.5]" />
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
