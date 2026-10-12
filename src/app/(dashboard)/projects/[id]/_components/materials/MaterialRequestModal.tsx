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
          maxWidth: "860px",
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
                backgroundColor: "#FEF3C7",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Create Material Request
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

        {/* Scrollable Form Body */}
        <div
          style={{
            padding: "24px 28px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "22px",
            flex: 1,
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

          {/* Key Parameters: Priority, Date, Location */}
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1.3fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Priority Level <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  color: "#0F172A",
                  outline: "none",
                }}
              >
                <option value="low">Low (Standard Routine)</option>
                <option value="medium">Medium (Scheduled Pour/Task)</option>
                <option value="high">High (Urgent Milestone)</option>
                <option value="critical">Critical (Site Stoppage Risk)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Required Delivery Date <span style={{ color: "#EF4444" }}>*</span>
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
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    paddingLeft: "38px",
                    paddingRight: "12px",
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
                Site Delivery Location <span style={{ color: "#EF4444" }}>*</span>
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
                  required
                  placeholder="e.g. Tower B - Bay 4"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    paddingLeft: "38px",
                    paddingRight: "12px",
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

          {/* Line Items Card */}
          <div
            style={{
              border: "1px solid #E2E8F0",
              borderRadius: "14px",
              overflow: "hidden",
              backgroundColor: "#FFFFFF",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                backgroundColor: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  Requested Material Line Items
                </h4>
                <p style={{ fontSize: "11px", color: "#64748B", margin: "2px 0 0 0" }}>
                  Select materials from catalogue and specify quantities
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: "#FEF3C7",
                  border: "1px solid #FCD34D",
                  color: "#92400E",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F1F5F9", color: "#475569", fontWeight: 700, borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ padding: "10px 14px", minWidth: "220px" }}>Material from Catalogue *</th>
                    <th style={{ padding: "10px 14px", width: "100px" }}>Quantity *</th>
                    <th style={{ padding: "10px 10px", width: "70px" }}>Unit</th>
                    <th style={{ padding: "10px 14px", width: "110px", textAlign: "right" }}>Est. Rate</th>
                    <th style={{ padding: "10px 14px" }}>Notes / Specific Purpose</th>
                    <th style={{ padding: "10px 10px", width: "44px", textAlign: "center" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                      }}
                    >
                      <td style={{ padding: "10px 14px" }}>
                        <select
                          value={item.material_id}
                          onChange={(e) => handleMaterialChange(idx, e.target.value)}
                          style={{
                            width: "100%",
                            height: "38px",
                            padding: "0 10px",
                            borderRadius: "8px",
                            border: "1px solid #CBD5E1",
                            backgroundColor: "#FFFFFF",
                            fontSize: "12px",
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
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          placeholder="Qty"
                          style={{
                            width: "100%",
                            height: "38px",
                            padding: "0 10px",
                            borderRadius: "8px",
                            border: "1px solid #CBD5E1",
                            backgroundColor: "#FFFFFF",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#0F172A",
                            outline: "none",
                          }}
                        />
                      </td>
                      <td style={{ padding: "10px 10px", color: "#64748B", fontWeight: 600 }}>
                        {item.unit}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", color: "#334155", fontWeight: 600 }}>
                        {formatCurrencyFull(item.estimated_unit_cost)}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => handleItemNotesChange(idx, e.target.value)}
                          placeholder="Grade, specs, or task"
                          style={{
                            width: "100%",
                            height: "38px",
                            padding: "0 10px",
                            borderRadius: "8px",
                            border: "1px solid #CBD5E1",
                            backgroundColor: "#FFFFFF",
                            fontSize: "12px",
                            color: "#0F172A",
                            outline: "none",
                          }}
                        />
                      </td>
                      <td style={{ padding: "10px 10px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#94A3B8",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "6px",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Estimated Value Row */}
            <div
              style={{
                padding: "12px 18px",
                backgroundColor: "#FFFBEB",
                borderTop: "1px solid #FDE68A",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "12px", color: "#78350F", fontWeight: 500 }}>
                {items.length} line {items.length === 1 ? "item" : "items"} configured
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "#78350F" }}>Total Estimated Indent Value:</span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#92400E" }}>
                  {formatCurrencyFull(calculateTotalEstimatedCost())}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Attachments */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Site Justification / Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain the scheduled activity, work order, or contractor requirement..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  fontSize: "12px",
                  color: "#0F172A",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Attachment URL or Drawing Reference (Optional)
              </label>
              <input
                type="text"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                placeholder="https://... or PO-REF-1234"
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  fontSize: "12px",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
              <p style={{ fontSize: "11px", color: "#94A3B8", margin: "4px 0 0 0" }}>
                Link to bar bending schedule, pour plan, or supplier quote.
              </p>
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
          <div style={{ fontSize: "12px", color: "#64748B", display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
            <Clock size={15} style={{ color: "#D97706", flexShrink: 0 }} />
            <span>Submitted requests route directly to the PM for approval.</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: "#FFFFFF",
                border: "1px solid #CBD5E1",
                color: "#475569",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              style={{
                height: "40px",
                padding: "0 20px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: "#FFFFFF",
                border: "1px solid #CBD5E1",
                color: "#475569",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              style={{
                height: "40px",
                padding: "0 22px",
                borderRadius: "10px",
                backgroundColor: "#FFB000",
                color: "#0F172A",
                fontWeight: 700,
                fontSize: "13px",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(255, 176, 0, 0.25)",
                boxSizing: "border-box",
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="stroke-[2.5]" />
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
