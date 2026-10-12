"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatCurrencyFull } from "@/lib/utils";
import { getAllProjects, updateProjectExpensesTotal } from "@/lib/projectStore";
import { createExpense } from "@/lib/expenseStore";
import {
  Building2,
  Calendar,
  DollarSign,
  Package,
  HardHat,
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  CreditCard,
  User,
  Info,
  TrendingUp,
  Percent,
  Wallet,
  ShieldAlert,
} from "lucide-react";

interface ProjectOption {
  id: string;
  project_code: string;
  name: string;
  approved_budget: number;
  actual_expenses: number;
  status: string;
  city?: string;
}

interface MaterialOption {
  id: string;
  name: string;
  category: string;
  unit: string;
  unit_price: number;
  current_stock: number;
  supplier_name?: string;
}

interface WorkerOption {
  id: string;
  name: string;
  trade: string;
  unit: string;
  default_rate: number;
  type: string;
}

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultProjectId?: string;
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectId,
}: ExpenseFormModalProps) {
  // Synchronous initial fallback from projectStore so dropdown is NEVER empty
  const getInitialProjects = (): ProjectOption[] => {
    if (typeof window === "undefined") return [];
    try {
      const all = getAllProjects();
      return (all || []).map((p) => ({
        id: p.id,
        project_code: p.project_code,
        name: p.name,
        approved_budget: Number(p.approved_budget) || 0,
        actual_expenses: Number(p.actual_expenses) || 0,
        status: p.status,
        city: p.city,
      }));
    } catch {
      return [];
    }
  };

  const initialProjects = getInitialProjects();

  // Form State
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId || (initialProjects[0]?.id || "")
  );
  const [expenseType, setExpenseType] = useState<"Labor" | "Material">("Labor");

  // Dynamic entities
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");

  const [quantity, setQuantity] = useState<number | "">(1);
  const [unit, setUnit] = useState<string>("Day");
  const [rate, setRate] = useState<number | "">(1200);
  const [paymentMethod, setPaymentMethod] = useState<string>("Bank Transfer");
  const [payee, setPayee] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");

  // UI state
  const [loadingRefData, setLoadingRefData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reference lists from Supabase / Seed
  const [projects, setProjects] = useState<ProjectOption[]>(initialProjects);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [workers, setWorkers] = useState<WorkerOption[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch reference data when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setLoadingRefData(true);

      // Re-read local projects immediately in case a new project was created
      const localList = getInitialProjects();
      if (localList.length > 0) {
        setProjects(localList);
        if (defaultProjectId) {
          setSelectedProjectId(defaultProjectId);
        } else if (!selectedProjectId) {
          setSelectedProjectId(localList[0].id);
        }
      }

      fetch("/api/expenses/reference-data")
        .then((res) => res.json())
        .then((data) => {
          if (data.projects && data.projects.length > 0) {
            setProjects(data.projects);
            if (defaultProjectId) {
              const matched = data.projects.find(
                (p: any) =>
                  p.id === defaultProjectId ||
                  p.project_code.toLowerCase() === defaultProjectId.toLowerCase()
              );
              if (matched) setSelectedProjectId(matched.id);
            } else if (!selectedProjectId) {
              setSelectedProjectId(data.projects[0].id);
            }
          }
          if (data.materials && data.materials.length > 0) {
            setMaterials(data.materials);
          }
          if (data.workers && data.workers.length > 0) {
            setWorkers(data.workers);
            if (!selectedWorkerId) {
              setSelectedWorkerId(data.workers[0].id);
              setUnit(data.workers[0].unit || "Day");
              setRate(data.workers[0].default_rate || 1200);
              setPayee(data.workers[0].name);
            }
          }
        })
        .catch((err) => {
          console.warn("Reference data API warning, using local stores:", err);
        })
        .finally(() => {
          setLoadingRefData(false);
        });
    }
  }, [isOpen, defaultProjectId]);

  // Selected project details
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  // Auto-update Unit & Rate when worker changes
  const handleWorkerChange = (workerId: string) => {
    setSelectedWorkerId(workerId);
    const worker = workers.find((w) => w.id === workerId);
    if (worker) {
      setUnit(worker.unit || "Day");
      setRate(worker.default_rate || 1000);
      setPayee(worker.name);
    }
  };

  // Auto-update Unit & Rate when material changes
  const handleMaterialChange = (materialId: string) => {
    setSelectedMaterialId(materialId);
    const mat = materials.find((m) => m.id === materialId);
    if (mat) {
      setUnit(mat.unit || "Units");
      setRate(mat.unit_price || 0);
      setPayee(mat.supplier_name || "Material Vendor");
    }
  };

  // Switch Expense Type
  const handleTypeChange = (type: "Labor" | "Material") => {
    setExpenseType(type);
    if (type === "Labor") {
      const worker = workers[0];
      if (worker) {
        setSelectedWorkerId(worker.id);
        setUnit(worker.unit || "Day");
        setRate(worker.default_rate || 1200);
        setPayee(worker.name);
      }
    } else {
      const mat = materials[0];
      if (mat) {
        setSelectedMaterialId(mat.id);
        setUnit(mat.unit || "Units");
        setRate(mat.unit_price || 0);
        setPayee(mat.supplier_name || "Material Vendor");
      }
    }
  };

  // Auto-calculate Total Amount: Quantity * Rate
  const calculatedTotal = (Number(quantity) || 0) * (Number(rate) || 0);

  // Handle receipt upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/expenses/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload file");

      setReceiptUrl(data.url);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload file attachment");
    } finally {
      setUploadingFile(false);
    }
  };

  // Submit expense
  const handleSubmit = async (targetStatus: "draft" | "pending_approval" | "approved") => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedProjectId) {
      setErrorMessage("Please select a project.");
      return;
    }

    if (Number(quantity) <= 0) {
      setErrorMessage("Quantity must be greater than zero.");
      return;
    }

    if (Number(rate) <= 0) {
      setErrorMessage("Rate must be greater than zero.");
      return;
    }

    if (calculatedTotal <= 0) {
      setErrorMessage("Total Amount must be greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedWorker = workers.find((w) => w.id === selectedWorkerId);
      const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

      const payload = {
        project_id: selectedProjectId,
        date: expenseDate,
        expense_type: expenseType,
        worker_id: expenseType === "Labor" ? selectedWorkerId : null,
        worker_name: expenseType === "Labor" ? selectedWorker?.name : null,
        material_id: expenseType === "Material" ? selectedMaterialId : null,
        material_name: expenseType === "Material" ? selectedMaterial?.name : null,
        quantity: Number(quantity),
        unit,
        rate: Number(rate),
        amount: calculatedTotal,
        payment_method: paymentMethod,
        payee: payee || (expenseType === "Labor" ? selectedWorker?.name : selectedMaterial?.name),
        description,
        receipt_url: receiptUrl,
        status: targetStatus,
      };

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record expense");

      // Update local stores and dispatch cross-tab reactive events
      try {
        await createExpense(
          selectedProjectId,
          {
            date: expenseDate,
            category: expenseType === "Labor" ? "labor" : "materials",
            amount: calculatedTotal,
            supplier: payee || (expenseType === "Labor" ? selectedWorker?.name : selectedMaterial?.name) || "Direct Vendor",
            description: description || `${expenseType} expenditure (${quantity} ${unit} @ ₹${rate})`,
            status: targetStatus,
            payment_method: paymentMethod,
          },
          null,
          currentProject?.project_code
        );

        if (targetStatus === "approved") {
          updateProjectExpensesTotal(selectedProjectId, calculatedTotal);
        }
      } catch (storeErr) {
        console.warn("Local expense sync warning:", storeErr);
      }

      setSuccessMessage(
        targetStatus === "draft"
          ? "Expense draft saved successfully!"
          : "Expense submitted and recorded successfully!"
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit expense");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: "840px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
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
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#FFF9EB",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarSign size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Record New Expense
              </h2>
              <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                Add verified labor attendance voucher or inventory material invoice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "8px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {errorMessage && (
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
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                backgroundColor: "#ECFDF5",
                border: "1px solid #A7F3D0",
                color: "#065F46",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section 1: Project & Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Project Search Dropdown */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Select Project *
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0F172A",
                  outline: "none",
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.project_code}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Expense Date *
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
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

          {/* Live Project-Wise Financial Calculation & Impact Card */}
          {currentProject && (() => {
            const approvedBudget = Number(currentProject.approved_budget) || 0;
            const currentExpenses = Number(currentProject.actual_expenses) || 0;
            const currentRemaining = Math.max(0, approvedBudget - currentExpenses);
            const currentPercent = approvedBudget > 0 ? (currentExpenses / approvedBudget) * 100 : 0;

            const newTotalExpenses = currentExpenses + calculatedTotal;
            const newRemainingBudget = approvedBudget - newTotalExpenses;
            const newPercent = approvedBudget > 0 ? (newTotalExpenses / approvedBudget) * 100 : 0;
            const isOverBudget = newRemainingBudget < 0;
            const overBudgetAmount = Math.abs(Math.min(0, newRemainingBudget));

            const currentWidth = Math.min(100, currentPercent);
            const addedWidth = approvedBudget > 0 ? Math.min(100 - currentWidth, (calculatedTotal / approvedBudget) * 100) : 0;

            return (
              <div
                style={{
                  borderRadius: "14px",
                  border: isOverBudget ? "1.5px solid #FCA5A5" : "1.5px solid #E2E8F0",
                  backgroundColor: isOverBudget ? "#FEF2F2" : "#F8FAFC",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        backgroundColor: "#FEF3C7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#D97706",
                      }}
                    >
                      <Building2 size={16} />
                    </div>
                    <div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                        [{currentProject.project_code}] {currentProject.name}
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748B", marginLeft: "6px" }}>
                        ({currentProject.city || "Site Location"})
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isOverBudget ? (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          backgroundColor: "#FEE2E2",
                          color: "#991B1B",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <ShieldAlert size={12} />
                        Over Budget (+{formatCurrencyFull(overBudgetAmount)})
                      </span>
                    ) : newPercent >= 85 ? (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <TrendingUp size={12} />
                        High Utilization ({newPercent.toFixed(1)}%)
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "999px",
                          backgroundColor: "#DCFCE7",
                          color: "#166534",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <CheckCircle2 size={12} />
                        Budget Healthy ({newPercent.toFixed(1)}% used)
                      </span>
                    )}
                  </div>
                </div>

                {/* 4-Box Project Financial Calculation Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "10px",
                    backgroundColor: "#FFFFFF",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  {/* Approved Budget */}
                  <div>
                    <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                      Approved Budget
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#0F172A" }}>
                      {formatCurrencyFull(approvedBudget)}
                    </span>
                    <span style={{ display: "block", fontSize: "10px", color: "#94A3B8" }}>
                      Project baseline
                    </span>
                  </div>

                  {/* Current Spent */}
                  <div>
                    <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                      Current Spent
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#475569" }}>
                      {formatCurrencyFull(currentExpenses)}
                    </span>
                    <span style={{ display: "block", fontSize: "10px", color: "#64748B" }}>
                      {currentPercent.toFixed(1)}% consumed
                    </span>
                  </div>

                  {/* This Expense */}
                  <div style={{ backgroundColor: "#FFFBEB", padding: "4px 8px", borderRadius: "6px" }}>
                    <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#B45309", textTransform: "uppercase" }}>
                      + This Expense
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#B45309" }}>
                      +{formatCurrencyFull(calculatedTotal)}
                    </span>
                    <span style={{ display: "block", fontSize: "10px", color: "#D97706" }}>
                      {quantity || 0} {unit} @ ₹{rate || 0}
                    </span>
                  </div>

                  {/* Projected Remaining Balance */}
                  <div style={{ backgroundColor: isOverBudget ? "#FEF2F2" : "#F0FDF4", padding: "4px 8px", borderRadius: "6px" }}>
                    <span style={{ display: "block", fontSize: "10px", fontWeight: 700, color: isOverBudget ? "#DC2626" : "#166534", textTransform: "uppercase" }}>
                      Projected Balance
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: isOverBudget ? "#DC2626" : "#166534" }}>
                      {isOverBudget ? `-${formatCurrencyFull(overBudgetAmount)}` : formatCurrencyFull(newRemainingBudget)}
                    </span>
                    <span style={{ display: "block", fontSize: "10px", color: isOverBudget ? "#EF4444" : "#15803D" }}>
                      {isOverBudget ? "Over budget limit" : `${(100 - Math.min(100, newPercent)).toFixed(1)}% buffer left`}
                    </span>
                  </div>
                </div>

                {/* Visual Dual-Tone Budget Utilization Bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 600, color: "#64748B", marginBottom: "4px" }}>
                    <span>Project Budget Consumption</span>
                    <span>
                      {formatCurrencyFull(newTotalExpenses)} / {formatCurrencyFull(approvedBudget)} ({newPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: "#E2E8F0",
                      borderRadius: "999px",
                      overflow: "hidden",
                      display: "flex",
                    }}
                  >
                    {/* Existing spent slice */}
                    <div
                      style={{
                        width: `${currentWidth}%`,
                        backgroundColor: "#334155",
                        transition: "width 0.3s ease",
                      }}
                      title={`Current expenses: ${formatCurrencyFull(currentExpenses)}`}
                    />
                    {/* New expense slice */}
                    <div
                      style={{
                        width: `${addedWidth}%`,
                        backgroundColor: isOverBudget ? "#EF4444" : "#FFB000",
                        transition: "width 0.3s ease",
                      }}
                      title={`This expense: ${formatCurrencyFull(calculatedTotal)}`}
                    />
                  </div>
                </div>

                {/* Advisory Notice */}
                {isOverBudget ? (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#991B1B",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 600,
                    }}
                  >
                    <AlertCircle size={14} color="#DC2626" />
                    <span>
                      Warning: Recording this expense of {formatCurrencyFull(calculatedTotal)} will exceed the project budget limit by {formatCurrencyFull(overBudgetAmount)}.
                    </span>
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#475569",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Info size={13} color="#64748B" />
                    <span>
                      After this voucher, {formatCurrencyFull(newRemainingBudget)} will remain available under project {currentProject.project_code}.
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Section 2: Expense Type Selector */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "8px" }}>
              Expense Type *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                type="button"
                onClick={() => handleTypeChange("Labor")}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: expenseType === "Labor" ? "2px solid #FFB000" : "1px solid #E2E8F0",
                  backgroundColor: expenseType === "Labor" ? "#FFFDF5" : "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: expenseType === "Labor" ? "#92400E" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                <HardHat size={18} color={expenseType === "Labor" ? "#D97706" : "#64748B"} />
                <span>Labor / Workforce</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange("Material")}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: expenseType === "Material" ? "2px solid #FFB000" : "1px solid #E2E8F0",
                  backgroundColor: expenseType === "Material" ? "#FFFDF5" : "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: expenseType === "Material" ? "#92400E" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                <Package size={18} color={expenseType === "Material" ? "#D97706" : "#64748B"} />
                <span>Material / Inventory</span>
              </button>
            </div>
          </div>

          {/* Section 3: Dynamic Selection (Worker vs Material) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {expenseType === "Labor" ? (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Select Worker / Contractor *
                </label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => handleWorkerChange(e.target.value)}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "13px",
                    color: "#0F172A",
                    outline: "none",
                  }}
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} — {w.trade}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Select Inventory Material *
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "13px",
                    color: "#0F172A",
                    outline: "none",
                  }}
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category}) — ₹{m.unit_price}/{m.unit}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Payee / Supplier */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Payee / Supplier Name
              </label>
              <input
                type="text"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                placeholder="Name of vendor or worker recipient"
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
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

          {/* Section 4: Quantity, Unit, Rate, and Automatic Calculation */}
          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              backgroundColor: "#FFFDF5",
              border: "1.5px solid #FDE68A",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1.5fr",
              gap: "12px",
              alignItems: "end",
            }}
          >
            {/* Quantity */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#92400E", marginBottom: "4px" }}>
                Quantity *
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? "" : parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #FCD34D",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            {/* Unit */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#92400E", marginBottom: "4px" }}>
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #FCD34D",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            {/* Rate */}
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#92400E", marginBottom: "4px" }}>
                Rate (₹) *
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={rate}
                onChange={(e) => setRate(e.target.value === "" ? "" : parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  height: "38px",
                  padding: "0 10px",
                  borderRadius: "8px",
                  border: "1px solid #FCD34D",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            {/* Calculated Total Amount (Auto-Calculated) */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1.5px solid #F59E0B",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#B45309", textTransform: "uppercase" }}>
                Total Amount (Qty × Rate)
              </span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>
                {formatCurrencyFull(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* Section 5: Payment Method & Attachment */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  fontSize: "13px",
                  color: "#0F172A",
                  outline: "none",
                }}
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cheque">Corporate Cheque</option>
                <option value="UPI">UPI / Digital Payment</option>
                <option value="Petty Cash">Petty Cash</option>
                <option value="Direct Contractor Payout">Direct Contractor Payout</option>
              </select>
            </div>

            {/* Bill / Receipt Attachment Upload */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Bill / Receipt Attachment
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  style={{
                    height: "40px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: "1px dashed #CBD5E1",
                    backgroundColor: "#F8FAFC",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flex: 1,
                  }}
                >
                  {uploadingFile ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                  <span>{receiptUrl ? "Replace Attached Bill" : "Upload Invoice / Voucher"}</span>
                </button>
                {receiptUrl && (
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      backgroundColor: "#ECFDF5",
                      color: "#065F46",
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <FileCheck size={14} />
                    <span>Uploaded</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 6: Notes / Description */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
              Expense Notes & Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide invoice reference number, purpose of work, site location notes..."
              style={{
                width: "100%",
                padding: "10px 12px",
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
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn btn-secondary"
            style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600 }}
          >
            Cancel
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={submitting}
              className="btn btn-secondary"
              style={{
                padding: "9px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
              }}
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={() => handleSubmit("approved")}
              disabled={submitting}
              style={{
                padding: "9px 20px",
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
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
              <span>{submitting ? "Processing..." : "Submit & Record Expense"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
