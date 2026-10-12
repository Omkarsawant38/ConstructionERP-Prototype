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
          maxWidth: "680px",
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
                backgroundColor: "#FFEDD5",
                color: "#C2410C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowUpRight size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Issue Material to Site (Stock Out)
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

        {/* Form & Content */}
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

            {/* Material Selection */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Select Material to Issue <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
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

            {/* Available Site Stock Badge */}
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                backgroundColor: "#EFF6FF",
                border: "1px solid #BFDBFE",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1E40AF" }}>
                <Layers size={16} />
                <span style={{ fontSize: "12px", fontWeight: 600 }}>Current Available Project Stock:</span>
              </div>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  backgroundColor: availableStock > 0 ? "#DBEAFE" : "#FEE2E2",
                  color: availableStock > 0 ? "#1E40AF" : "#991B1B",
                }}
              >
                {availableStock} {currentUnit}
              </span>
            </div>

            {/* Quantity and Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Quantity to Issue ({currentUnit}) <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  max={availableStock > 0 ? availableStock : undefined}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: isInsufficient ? "1px solid #EF4444" : "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: isInsufficient ? "#DC2626" : "#0F172A",
                    outline: "none",
                  }}
                />
                {isInsufficient && (
                  <p style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertTriangle size={12} />
                    Exceeds available site stock ({availableStock} {currentUnit})
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Issue Date <span style={{ color: "#EF4444" }}>*</span>
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
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
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

            {/* Work Task Destination */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Site Destination / Task / Work Activity <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tower B Raft Concreting, Masonry Layer Block 2"
                value={sourceOrLocation}
                onChange={(e) => setSourceOrLocation(e.target.value)}
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
              <p style={{ fontSize: "11px", color: "#64748B", margin: "4px 0 0 0" }}>
                Specifies which physical structural component or subcontractor receives the material.
              </p>
            </div>

            {/* Work Order Ref & Dispatched To */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Site Issue Slip / Indent Ref #
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
                    placeholder="e.g. ISS-0042"
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

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Dispatched To / Contractor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shree Ganesh Steel Fixers"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
              Reduces project site stock upon dispatch.
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
                disabled={submitting || isInsufficient || availableStock <= 0}
                style={{
                  padding: "9px 22px",
                  borderRadius: "10px",
                  backgroundColor: "#EA580C",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: "13px",
                  border: "none",
                  cursor: submitting || isInsufficient || availableStock <= 0 ? "not-allowed" : "pointer",
                  opacity: isInsufficient || availableStock <= 0 ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 6px rgba(234, 88, 12, 0.25)",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Issuing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="stroke-[2.5]" />
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
