"use client";

import React, { useState } from "react";
import { X, Check, AlertCircle, IndianRupee, Calendar, Building2, Tag, CreditCard } from "lucide-react";
import type { ExpenseCategory, Project } from "@/types";
import { Select } from "@/components/ui/Select";
import { formatCurrencyFull } from "@/lib/utils";

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  onExpenseCreated: (expenseData: {
    date: string;
    category: ExpenseCategory;
    amount: number;
    supplier: string;
    description: string;
    status?: "draft" | "pending_approval" | "approved" | "rejected";
    payment_method?: string;
  }) => Promise<void> | void;
}

const CATEGORY_OPTIONS = [
  { value: "materials", label: "Materials (Cement, Steel, Bricks)", color: "#3B82F6" },
  { value: "labor", label: "Labor & Workforce Payouts", color: "#10B981" },
  { value: "equipment", label: "Equipment & Heavy Machinery", color: "#F59E0B" },
  { value: "subcontractor", label: "Subcontractor Invoices", color: "#6366F1" },
  { value: "professional-fees", label: "Professional & Architect Fees", color: "#8B5CF6" },
  { value: "permits", label: "Municipal Permits & Approvals", color: "#EC4899" },
  { value: "site-logistics", label: "Site Logistics & Utilities", color: "#14B8A6" },
  { value: "overhead", label: "General Site Overheads", color: "#64748B" },
];

const PAYMENT_METHODS = [
  { value: "Bank Transfer / RTGS", label: "Bank Transfer / RTGS" },
  { value: "Corporate Cheque", label: "Corporate Cheque" },
  { value: "UPI / Digital", label: "UPI / Digital" },
  { value: "Petty Cash", label: "Petty Cash Voucher" },
];

export function AddExpenseModal({
  open,
  onClose,
  project,
  onExpenseCreated,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("materials");
  const [amount, setAmount] = useState<string>("");
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer / RTGS");
  const [status, setStatus] = useState<"approved" | "pending_approval">("approved");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Expense description is required");
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid expense amount greater than 0");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onExpenseCreated({
        description: description.trim(),
        category,
        amount: numAmount,
        supplier: supplier.trim() || "Direct Expense",
        date: date || new Date().toISOString().split("T")[0],
        payment_method: paymentMethod,
        status,
      });

      // Reset
      setDescription("");
      setAmount("");
      setSupplier("");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  const numericPreview = Number(amount) || 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        style={{
          position: "relative",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "600px",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
          animation: "scaleIn 0.2s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "#D97706",
                  backgroundColor: "#FFF9EB",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  border: "1px solid #FFE4A0",
                }}
              >
                {project.project_code}
              </span>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Record Project Expense
              </h2>
            </div>
            <p style={{ fontSize: "12px", color: "#64748B", margin: "4px 0 0 0" }}>
              Log material, labor, or vendor invoices for <strong style={{ color: "#334155" }}>{project.name}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #E2E8F0",
              backgroundColor: "#F8FAFC",
              color: "#64748B",
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F1F5F9";
              e.currentTarget.style.color = "#0F172A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#F8FAFC";
              e.currentTarget.style.color = "#64748B";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflowY: "auto", flex: 1 }}>
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Description */}
            <div>
              <label
                htmlFor="exp-desc"
                style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
              >
                Expense Description / Purpose <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                id="exp-desc"
                type="text"
                required
                autoFocus
                placeholder="e.g. Steel rebar procurement for foundation, Cement bulk delivery, Tower crane rental"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (error) setError(null);
                }}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: error ? "1px solid #DC2626" : "1px solid #CBD5E1",
                  fontSize: "14px",
                  color: "#0F172A",
                  outline: "none",
                  backgroundColor: "#FFFFFF",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#FFB000";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 176, 0, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#CBD5E1";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Category & Amount */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Cost Category
                </label>
                <Select
                  options={CATEGORY_OPTIONS}
                  value={category}
                  onChange={(val) => setCategory(val as ExpenseCategory)}
                  width="100%"
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label
                    htmlFor="exp-amount"
                    style={{ fontSize: "12px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Amount (₹) <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  {numericPreview > 0 && (
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#16A34A" }}>
                      {formatCurrencyFull(numericPreview)}
                    </span>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#64748B",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    id="exp-amount"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 250000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                      width: "100%",
                      height: "40px",
                      paddingLeft: "28px",
                      paddingRight: "14px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#0F172A",
                      outline: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#FFB000";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 176, 0, 0.15)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#CBD5E1";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Supplier & Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label
                  htmlFor="exp-supplier"
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Supplier / Vendor / Payee
                </label>
                <input
                  id="exp-supplier"
                  type="text"
                  placeholder="e.g. UltraTech Cement, Tata Steel, Shree Labor"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    fontSize: "13px",
                    color: "#0F172A",
                    outline: "none",
                    backgroundColor: "#FFFFFF",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#FFB000";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#CBD5E1";
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="exp-date"
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Expense Date
                </label>
                <input
                  id="exp-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    fontSize: "13px",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Payment Method & Status */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Payment Method
                </label>
                <Select
                  options={PAYMENT_METHODS}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  width="100%"
                />
              </div>

              <div>
                <label
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Voucher Status
                </label>
                <Select
                  options={[
                    { value: "approved", label: "Approved & Recorded", color: "#10B981" },
                    { value: "pending_approval", label: "Pending Approval", color: "#F59E0B" },
                  ]}
                  value={status}
                  onChange={(val) => setStatus(val as any)}
                  width="100%"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #F1F5F9",
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
              disabled={submitting}
              style={{
                padding: "9px 18px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 600,
                color: "#64748B",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F1F5F9";
                e.currentTarget.style.color = "#0F172A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#FFFFFF";
                e.currentTarget.style.color = "#64748B";
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !description.trim() || !amount}
              style={{
                padding: "9px 22px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#FFB000",
                fontSize: "13px",
                fontWeight: 700,
                color: "#0F172A",
                cursor: submitting || !description.trim() || !amount ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(255, 176, 0, 0.25)",
                transition: "all 0.15s ease",
                opacity: submitting || !description.trim() || !amount ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!submitting && description.trim() && amount) e.currentTarget.style.backgroundColor = "#E69E00";
              }}
              onMouseLeave={(e) => {
                if (!submitting && description.trim() && amount) e.currentTarget.style.backgroundColor = "#FFB000";
              }}
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{submitting ? "Recording Expense..." : "Record Expense"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
