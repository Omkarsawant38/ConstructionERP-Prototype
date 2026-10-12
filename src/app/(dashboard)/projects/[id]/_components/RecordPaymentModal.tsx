"use client";

import React, { useState } from "react";
import { X, IndianRupee } from "lucide-react";
import type { ProjectUnitIncome } from "@/types";
import { formatCurrencyFull } from "@/lib/utils";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: ProjectUnitIncome | null;
  onRecord: (unitId: string, amount: number, milestone?: string, notes?: string) => void;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  unit,
  onRecord,
}: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [milestone, setMilestone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("Bank Transfer (NEFT/RTGS)");

  if (!isOpen || !unit) return null;

  const currentPending = unit.pending_amount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    const paymentDetail = `Mode: ${paymentMode}${notes ? ` | ${notes}` : ""}`;
    onRecord(unit.id, amount, milestone || undefined, paymentDetail);
    onClose();
  };

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
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          width: "100%",
          maxWidth: "460px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #E2E8F0",
            backgroundColor: "#FFFDF9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Record Payment Receipt
            </h2>
            <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
              {unit.unit_number} • {unit.owner_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Unit Snapshot */}
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "#F8FAFC",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Unit:</span>
              <span style={{ fontWeight: 700, color: "#0F172A" }}>{unit.unit_number} ({unit.unit_type})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Total Price:</span>
              <span style={{ fontWeight: 600, color: "#0F172A" }}>{formatCurrencyFull(unit.total_amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Received so far:</span>
              <span style={{ fontWeight: 700, color: "#16A34A" }}>{formatCurrencyFull(unit.received_amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E2E8F0", paddingTop: "6px" }}>
              <span style={{ color: "#475569", fontWeight: 600 }}>Pending Balance:</span>
              <span style={{ fontWeight: 800, color: "#D97706" }}>{formatCurrencyFull(currentPending)}</span>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              Payment Amount (₹) <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                min="1"
                max={currentPending > 0 ? currentPending : undefined}
                required
                placeholder="Enter received amount"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  fontSize: "14px",
                  fontWeight: 700,
                  outline: "none",
                  backgroundColor: "#FFFFFF",
                }}
              />
            </div>
            {currentPending > 0 && (
              <button
                type="button"
                onClick={() => setAmount(currentPending)}
                style={{
                  marginTop: "4px",
                  fontSize: "11px",
                  color: "#D97706",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                Pay Full Pending Balance (₹ {currentPending.toLocaleString("en-IN")})
              </button>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
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
            >
              <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT / RTGS)</option>
              <option value="Cheque / Demand Draft">Cheque / Demand Draft</option>
              <option value="Home Loan Disbursement">Home Loan Disbursement</option>
              <option value="UPI / Online Payment">UPI / Online Payment</option>
              <option value="Cash Receipt">Cash Receipt</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              Construction Milestone / Stage
            </label>
            <input
              type="text"
              placeholder="e.g. 5th Slab Completed, Brickwork Stage"
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
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
              Transaction ID / Bank Reference
            </label>
            <input
              type="text"
              placeholder="e.g. UTR # 4209183492 or Chq # 001923"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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

          <div
            style={{
              paddingTop: "14px",
              borderTop: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
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
              disabled={amount <= 0}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                color: "#0F172A",
                backgroundColor: "#FFB000",
                border: "none",
                cursor: "pointer",
                opacity: amount <= 0 ? 0.5 : 1,
                boxShadow: "0 2px 6px rgba(255, 176, 0, 0.25)",
              }}
            >
              Confirm Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
