"use client";

import React, { useState } from "react";
import { X, Building2, User, Phone, Mail, IndianRupee, Layers } from "lucide-react";
import type { UnitIncomeFormData } from "@/types";

interface AddUnitIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UnitIncomeFormData) => void;
}

const UNIT_TYPE_SUGGESTIONS = [
  "2 BHK Executive",
  "3 BHK Premium",
  "3 BHK Garden View",
  "4 BHK Royal Penthouse",
  "Commercial Retail Store",
  "Office Suite",
  "Luxury Villa",
  "Studio Apartment",
];

export default function AddUnitIncomeModal({
  isOpen,
  onClose,
  onSave,
}: AddUnitIncomeModalProps) {
  const [formData, setFormData] = useState<UnitIncomeFormData>({
    unit_number: "",
    unit_type: "2 BHK Premium",
    floor: "",
    carpet_area_sqft: 1100,
    owner_name: "",
    owner_phone: "",
    owner_email: "",
    total_amount: 7500000,
    received_amount: 2500000,
    status: "partially_paid",
    booking_date: new Date().toISOString().split("T")[0],
    payment_milestone: "Plinth & 1st Slab Stage",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const err: Record<string, string> = {};
    if (!formData.unit_number.trim()) err.unit_number = "Room / Unit Number is required";
    if (!formData.owner_name.trim()) err.owner_name = "Owner / Buyer name is required";
    if (formData.total_amount <= 0) err.total_amount = "Sale amount must be greater than 0";
    if (formData.received_amount < 0) err.received_amount = "Received amount cannot be negative";
    if (formData.received_amount > formData.total_amount) {
      err.received_amount = "Received amount cannot exceed total agreed price";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
    onClose();
  };

  const pendingAmount = Math.max(0, (formData.total_amount || 0) - (formData.received_amount || 0));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "18px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #E2E8F0",
            backgroundColor: "#FFFDF9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "#FFF9EB",
                border: "1px solid #FFE4A0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D97706",
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Add Unit Ownership & Income
              </h2>
              <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                Record which room/unit is owned by whom and agreed payment terms
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F1F5F9";
              e.currentTarget.style.color = "#0F172A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#94A3B8";
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Section: Room / Unit Information */}
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#B45309",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Layers size={14} /> Room / Unit Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Room / Unit Number <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat A-102, Office 301, Shop 4"
                    value={formData.unit_number}
                    onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: errors.unit_number ? "1px solid #FCA5A5" : "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  {errors.unit_number && (
                    <div style={{ fontSize: "11px", color: "#EF4444", marginTop: "4px" }}>{errors.unit_number}</div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Unit Type
                  </label>
                  <input
                    type="text"
                    list="unitTypesListClean"
                    placeholder="e.g. 2 BHK, 3 BHK, Penthouse"
                    value={formData.unit_type}
                    onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  <datalist id="unitTypesListClean">
                    {UNIT_TYPE_SUGGESTIONS.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Floor / Wing
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Floor, Tower A"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Carpet Area (sq. ft.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1100"
                    value={formData.carpet_area_sqft || ""}
                    onChange={(e) => setFormData({ ...formData, carpet_area_sqft: Number(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section: Owner Information */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "18px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#B45309",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <User size={14} /> Owner / Buyer Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Owner / Buyer Full Name <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar or Anita Sharma"
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: errors.owner_name ? "1px solid #FCA5A5" : "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  {errors.owner_name && (
                    <div style={{ fontSize: "11px", color: "#EF4444", marginTop: "4px" }}>{errors.owner_name}</div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.owner_phone}
                    onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="buyer@example.com"
                    value={formData.owner_email}
                    onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section: Agreed Price & Payment Status */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "18px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#B45309",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <IndianRupee size={14} /> Agreed Price & Payment Terms
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Total Agreed Price (₹) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    placeholder="e.g. 7500000"
                    value={formData.total_amount || ""}
                    onChange={(e) => setFormData({ ...formData, total_amount: Number(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: errors.total_amount ? "1px solid #FCA5A5" : "1px solid #CBD5E1",
                      fontSize: "14px",
                      fontWeight: 700,
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  {errors.total_amount && (
                    <div style={{ fontSize: "11px", color: "#EF4444", marginTop: "4px" }}>{errors.total_amount}</div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Amount Received so far (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g. 2500000"
                    value={formData.received_amount || ""}
                    onChange={(e) => setFormData({ ...formData, received_amount: Number(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: errors.received_amount ? "1px solid #FCA5A5" : "1px solid #CBD5E1",
                      fontSize: "14px",
                      fontWeight: 700,
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                      color: "#16A34A",
                    }}
                  />
                  {errors.received_amount && (
                    <div style={{ fontSize: "11px", color: "#EF4444", marginTop: "4px" }}>{errors.received_amount}</div>
                  )}
                </div>

                {/* Pending balance banner */}
                <div
                  style={{
                    gridColumn: "span 2",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>Pending Balance Due:</span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: pendingAmount > 0 ? "#D97706" : "#16A34A",
                    }}
                  >
                    ₹ {pendingAmount.toLocaleString("en-IN")} {pendingAmount === 0 ? " (Fully Cleared)" : ""}
                  </span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Booking / Agreement Date
                  </label>
                  <input
                    type="date"
                    value={formData.booking_date}
                    onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Current Milestone / Stage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5th Slab Completed, Possession"
                    value={formData.payment_milestone}
                    onChange={(e) => setFormData({ ...formData, payment_milestone: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Notes / Bank Reference
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Bank loan sanctioned via SBI, next tranche due on plastering..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                      resize: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #E2E8F0",
              backgroundColor: "#F8FAFC",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#475569",
                backgroundColor: "#FFFFFF",
                border: "1px solid #CBD5E1",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "9px 22px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#0F172A",
                backgroundColor: "#FFB000",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(255, 176, 0, 0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#E69E00";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FFB000";
              }}
            >
              Save Unit & Income
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
