"use client";

import React, { useState } from "react";
import { formatCurrencyFull, formatDateShort } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  FileText, 
  Wallet, 
  Receipt, 
  TrendingUp, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar,
  IndianRupee,
  X
} from "lucide-react";
import type { Project, ProjectExpense } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select } from "@/components/ui/Select";
import { useProjectExpenses } from "@/lib/expenseStore";
import { AddExpenseModal } from "@/components/expenses/AddExpenseModal";
import { updateProjectExpensesTotal } from "@/lib/projectStore";

const expenseCategoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "materials", label: "Materials", color: "#3B82F6" },
  { value: "labor", label: "Labor & Wages", color: "#10B981" },
  { value: "equipment", label: "Equipment & Machinery", color: "#F59E0B" },
  { value: "subcontractor", label: "Subcontractor", color: "#6366F1" },
  { value: "professional-fees", label: "Professional Fees", color: "#8B5CF6" },
  { value: "overhead", label: "Site Overheads", color: "#64748B" },
];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  materials: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  labor: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  equipment: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  subcontractor: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  "professional-fees": { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  permits: { bg: "#FDF2F8", text: "#BE185D", border: "#FBCFE8" },
  "site-logistics": { bg: "#F0FDFA", text: "#0F766E", border: "#99F6E4" },
  overhead: { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0" },
};

export default function ProjectExpensesTab({ project }: { project: Project }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const {
    expenses,
    loading,
    totalExpenses,
    approvedBudget,
    remainingBudget,
    budgetSpentPercent,
    addExpense,
    removeExpense,
  } = useProjectExpenses(project);

  const handleCreateExpense = async (formData: any) => {
    try {
      await addExpense(formData);
      updateProjectExpensesTotal(project.id, Number(formData.amount) || 0);
      setFeedback({ message: `Expense "${formData.description}" recorded successfully!`, type: "success" });
      setTimeout(() => setFeedback(null), 3500);
    } catch {
      setFeedback({ message: "Failed to record expense", type: "error" });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDeleteExpense = async (expense: ProjectExpense) => {
    await removeExpense(expense.id);
    updateProjectExpensesTotal(project.id, -(Number(expense.amount) || 0));
    setActiveMenuId(null);
    setFeedback({ message: `Expense voucher removed`, type: "success" });
    setTimeout(() => setFeedback(null), 3500);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      expense.description?.toLowerCase().includes(q) ||
      expense.supplier?.toLowerCase().includes(q) ||
      expense.category?.toLowerCase().includes(q);

    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast Feedback */}
      {feedback && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: feedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
            color: feedback.type === "success" ? "#065F46" : "#991B1B",
            border: `1px solid ${feedback.type === "success" ? "#A7F3D0" : "#FECACA"}`,
          }}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 3 Executive Financial Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Approved Budget */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Approved Budget
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {formatCurrencyFull(approvedBudget)}
            </div>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
              Total financial sanction
            </div>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#F1F5F9",
              border: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#334155",
            }}
          >
            <Wallet size={24} />
          </div>
        </div>

        {/* Total Incurred Expenses */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Expenses
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {formatCurrencyFull(totalExpenses)}
            </div>
            <div style={{ fontSize: "12px", color: "#D97706", fontWeight: 600, marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontSize: "10px",
                  padding: "1px 6px",
                  borderRadius: "6px",
                  backgroundColor: "#FEF3C7",
                  border: "1px solid #FDE68A",
                }}
              >
                {budgetSpentPercent}%
              </span>
              <span>of budget utilized</span>
            </div>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#FFF9EB",
              border: "1px solid #FFE4A0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#D97706",
            }}
          >
            <Receipt size={24} />
          </div>
        </div>

        {/* Remaining Budget */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Remaining Buffer
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#16A34A", marginTop: "4px" }}>
              {formatCurrencyFull(remainingBudget)}
            </div>
            <div style={{ fontSize: "12px", color: "#15803D", fontWeight: 500, marginTop: "4px" }}>
              {100 - budgetSpentPercent}% remaining buffer
            </div>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#ECFDF5",
              border: "1px solid #A7F3D0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#059669",
            }}
          >
            <ShieldCheck size={24} />
          </div>
        </div>
      </div>

      {/* Top Search, Category Filter, and Add Expense Button */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "260px" }}>
          {/* Search Box */}
          <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
            <Search
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
              placeholder="Search expenses, vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: "38px",
                paddingLeft: "36px",
                paddingRight: searchQuery ? "32px" : "14px",
                borderRadius: "10px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#F8FAFC",
                fontSize: "13px",
                color: "#0F172A",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#FFB000";
                e.currentTarget.style.backgroundColor = "#FFFFFF";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#CBD5E1";
                e.currentTarget.style.backgroundColor = "#F8FAFC";
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <Select
            width="180px"
            options={expenseCategoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>

        {/* Add Expense Action Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 18px",
            borderRadius: "10px",
            backgroundColor: "#FFB000",
            color: "#0F172A",
            fontSize: "13px",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(255, 176, 0, 0.25)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#E69E00";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#FFB000";
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Expenses Table */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflow: "visible",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "#F8FAFC",
                  borderBottom: "1px solid #E2E8F0",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <th style={{ padding: "14px 20px" }}>Date</th>
                <th style={{ padding: "14px 16px" }}>Category</th>
                <th style={{ padding: "14px 16px" }}>Description</th>
                <th style={{ padding: "14px 16px" }}>Supplier / Vendor</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>Amount (₹)</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#64748B" }}>
                    <div style={{ display: "inline-block", width: "24px", height: "24px", border: "2px solid #FFB000", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <p style={{ marginTop: "10px", fontSize: "13px" }}>Loading project expenses...</p>
                  </td>
                </tr>
              ) : filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => {
                  const catStyle = CATEGORY_STYLES[expense.category] || {
                    bg: "#F1F5F9",
                    text: "#475569",
                    border: "#E2E8F0",
                  };

                  return (
                    <tr
                      key={expense.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#F8FAFC";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {/* Date */}
                      <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#334155", fontWeight: 500 }}>
                          <Calendar size={13} style={{ color: "#94A3B8" }} />
                          <span>{formatDateShort(expense.date)}</span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            textTransform: "capitalize",
                            backgroundColor: catStyle.bg,
                            color: catStyle.text,
                            border: `1px solid ${catStyle.border}`,
                          }}
                        >
                          {expense.category.replace("-", " ")}
                        </span>
                      </td>

                      {/* Description */}
                      <td style={{ padding: "14px 16px", maxWidth: "300px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {expense.description}
                        </div>
                        {expense.payment_method && (
                          <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                            Via {expense.payment_method}
                          </div>
                        )}
                      </td>

                      {/* Supplier */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#334155" }}>
                          <Building2 size={13} style={{ color: "#94A3B8", flexShrink: 0 }} />
                          <span>{expense.supplier || "Direct"}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                          {formatCurrencyFull(expense.amount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px" }}>
                        <StatusBadge status={expense.status || "approved"} size="sm" />
                      </td>

                      {/* Action Menu */}
                      <td style={{ padding: "14px 16px", textAlign: "right", position: "relative" }}>
                        <div style={{ display: "inline-block", position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === expense.id ? null : expense.id)}
                            style={{
                              padding: "6px",
                              borderRadius: "8px",
                              border: "1px solid transparent",
                              backgroundColor: activeMenuId === expense.id ? "#F1F5F9" : "transparent",
                              color: "#64748B",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#F1F5F9";
                              e.currentTarget.style.color = "#0F172A";
                            }}
                            onMouseLeave={(e) => {
                              if (activeMenuId !== expense.id) {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "#64748B";
                              }
                            }}
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === expense.id && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "100%",
                                marginTop: "4px",
                                backgroundColor: "#FFFFFF",
                                borderRadius: "10px",
                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
                                border: "1px solid #E2E8F0",
                                width: "160px",
                                zIndex: 30,
                                padding: "4px",
                                textAlign: "left",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(expense)}
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  textAlign: "left",
                                  border: "none",
                                  background: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  color: "#DC2626",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              >
                                <Trash2 size={13} />
                                <span>Delete Voucher</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: "64px 24px", textAlign: "center" }}>
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        backgroundColor: "#FFF9EB",
                        border: "1px solid #FFE4A0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 16px auto",
                        color: "#D97706",
                      }}
                    >
                      <Receipt size={28} />
                    </div>
                    <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>
                      {searchQuery || categoryFilter !== "all"
                        ? "No expenses found matching your filters"
                        : "No expenses recorded for this project yet"}
                    </h4>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 20px 0", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
                      {searchQuery || categoryFilter !== "all"
                        ? "Try clearing your search query or selecting a different cost category."
                        : "Track material purchases, labor wages, machinery leases, and site overheads against the approved budget."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      style={{
                        padding: "9px 20px",
                        borderRadius: "10px",
                        backgroundColor: "#FFB000",
                        color: "#0F172A",
                        fontSize: "13px",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 2px 6px rgba(255, 176, 0, 0.25)",
                      }}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span>Record First Expense</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        project={project}
        onExpenseCreated={handleCreateExpense}
      />
    </div>
  );
}
