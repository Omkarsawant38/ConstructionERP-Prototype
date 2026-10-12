"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrencyFull, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/lib/rbac/client";
import { ExpenseFormModal } from "@/components/finance/ExpenseFormModal";
import { Select, SelectOption } from "@/components/ui/Select";
import { getAllProjects } from "@/lib/projectStore";
import {
  DollarSign,
  HardHat,
  Package,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  CreditCard,
  Building2,
  Receipt,
  User,
  Calendar,
} from "lucide-react";

interface ProjectExpenseItem {
  id: string;
  project_id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  supplier?: string;
  recorded_by?: string;
  expense_type?: "Labor" | "Material";
  worker_id?: string;
  worker_name?: string;
  material_id?: string;
  material_name?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  payment_method?: string;
  payee?: string;
  receipt_url?: string;
  status: "draft" | "pending_approval" | "approved" | "rejected";
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  project?: {
    id: string;
    name: string;
    project_code: string;
    approved_budget: number;
  };
  recorder?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface SummaryData {
  totalExpenses: number;
  laborExpenses: number;
  materialExpenses: number;
  pendingApprovals: number;
  count: number;
}

export default function FinancePage() {
  const { user } = useAuth();
  const { hasRole, hasPermission } = usePermissions();

  const [expenses, setExpenses] = useState<ProjectExpenseItem[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalExpenses: 0,
    laborExpenses: 0,
    materialExpenses: 0,
    pendingApprovals: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Project List for dropdown filter
  const [projectOptions, setProjectOptions] = useState<{
    id: string;
    name: string;
    project_code: string;
    approved_budget?: number;
    actual_expenses?: number;
  }[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const local = getAllProjects();
        return local.map((p) => ({
          id: p.id,
          name: p.name,
          project_code: p.project_code,
          approved_budget: p.approved_budget,
          actual_expenses: p.actual_expenses,
        }));
      } catch {}
    }
    return [];
  });

  // Reject confirmation state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  // View details modal
  const [viewExpense, setViewExpense] = useState<ProjectExpenseItem | null>(null);

  // Notification / Alert
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canApprove = hasRole("super_admin", "accountant") || hasPermission("expenses.approve") || hasPermission("finance.approve");

  const fetchExpenses = useCallback(async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (projectFilter !== "all") params.append("project_id", projectFilter);
      if (typeFilter !== "all") params.append("expense_type", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load expenses");
      const data = await res.json();

      setExpenses(data.expenses || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      console.error(err);
      showAlert("error", err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, projectFilter, typeFilter, statusFilter]);

  // Load project reference list for filtering
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/expenses/reference-data");
        if (res.ok) {
          const data = await res.json();
          if (data.projects && data.projects.length > 0) {
            setProjectOptions(data.projects);
          }
        }
      } catch (e) {
        console.warn("Could not load reference projects for filter:", e);
      }
    }
    loadProjects();

    const handleExternalUpdate = () => {
      fetchExpenses();
      try {
        const local = getAllProjects();
        setProjectOptions(
          local.map((p) => ({
            id: p.id,
            name: p.name,
            project_code: p.project_code,
            approved_budget: p.approved_budget,
            actual_expenses: p.actual_expenses,
          }))
        );
      } catch {}
    };

    window.addEventListener("construction_erp_expenses_updated", handleExternalUpdate);
    window.addEventListener("construction_erp_projects_updated", handleExternalUpdate);
    return () => {
      window.removeEventListener("construction_erp_expenses_updated", handleExternalUpdate);
      window.removeEventListener("construction_erp_projects_updated", handleExternalUpdate);
    };
  }, [fetchExpenses]);

  // Fetch expenses when filters change
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  const handleApprove = async (expense: ProjectExpenseItem) => {
    // Check separation of duties
    if (expense.recorded_by === user?.id && !hasRole("super_admin")) {
      showAlert("error", "Separation of duties: You cannot approve an expense created by yourself.");
      return;
    }

    try {
      setSubmittingAction(expense.id);
      const res = await fetch(`/api/expenses/${expense.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to approve expense");
      }

      showAlert("success", "Expense approved successfully and budget totals updated.");
      fetchExpenses();
    } catch (err: any) {
      showAlert("error", err.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;

    try {
      setSubmittingAction(rejectingId);
      const res = await fetch(`/api/expenses/${rejectingId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejection_reason: rejectReason.trim() || "Rejected by accountant",
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to reject expense");
      }

      showAlert("success", "Expense rejected.");
      setRejectingId(null);
      setRejectReason("");
      fetchExpenses();
    } catch (err: any) {
      showAlert("error", err.message);
    } finally {
      setSubmittingAction(null);
    }
  };

  const projectFilterOptions: SelectOption[] = [
    { value: "all", label: "All Projects" },
    ...projectOptions.map((p) => ({
      value: p.id,
      label: `${p.project_code} - ${p.name}`,
    })),
  ];

  const typeFilterOptions: SelectOption[] = [
    { value: "all", label: "All Types" },
    { value: "Labor", label: "Labor", icon: <HardHat size={14} className="text-blue-500" /> },
    { value: "Material", label: "Material", icon: <Package size={14} className="text-emerald-500" /> },
  ];

  const statusFilterOptions: SelectOption[] = [
    { value: "all", label: "All Statuses" },
    { value: "approved", label: "Approved", color: "#16A34A" },
    { value: "pending_approval", label: "Pending Approval", color: "#F59E0B" },
    { value: "draft", label: "Draft", color: "#9CA3AF" },
    { value: "rejected", label: "Rejected", color: "#DC2626" },
  ];

  return (
    <RouteGuard permission="finance.view">
      <div className="flex flex-col gap-6 pb-12" style={{ gap: "24px" }}>
        {/* Page Header */}
        <PageHeader
          title="Accountant & Expense Management"
          eyebrow="Finance & Accounts"
          description="Track project expenditures, review labor and material vouchers, approve payouts, and maintain strict budget control."
          icon={<DollarSign size={24} className="text-amber-500" />}
          actions={
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchExpenses()}
                disabled={refreshing}
                className="btn btn-secondary flex items-center gap-2"
              >
                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary flex items-center gap-2 shadow-sm"
                style={{ background: "#FFB000" }}
              >
                <Plus size={16} className="stroke-[2.5]" />
                <span>Record Expense</span>
              </button>
            </div>
          }
        />

        {/* Feedback Alert */}
        {alert && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
              alert.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {alert.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              className="ml-auto text-xs opacity-70 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* 1. Accountant KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: "16px" }}>
          <KPICard
            title="Total Project Expenses"
            value={formatCurrencyFull(summary.totalExpenses)}
            subtitle="Approved expenditures across all sites"
            icon={<Receipt size={20} />}
            iconBgColor="#FEF3C7"
            iconColor="#D97706"
          />
          <KPICard
            title="Labor Expenses"
            value={formatCurrencyFull(summary.laborExpenses)}
            subtitle="Workforce wages & sub-contracts"
            icon={<HardHat size={20} />}
            iconBgColor="#DBEAFE"
            iconColor="#2563EB"
          />
          <KPICard
            title="Material Expenses"
            value={formatCurrencyFull(summary.materialExpenses)}
            subtitle="Inventory stock & site materials"
            icon={<Package size={20} />}
            iconBgColor="#DCFCE7"
            iconColor="#16A34A"
          />
          <KPICard
            title="Pending Approvals"
            value={summary.pendingApprovals}
            subtitle={
              summary.pendingApprovals > 0
                ? `${summary.pendingApprovals} items waiting for accountant verification`
                : "All submitted vouchers verified"
            }
            icon={<Clock size={20} />}
            iconBgColor="#FEE2E2"
            iconColor="#DC2626"
            trend={summary.pendingApprovals > 0 ? "up" : "neutral"}
          />
        </div>

        {/* 2. Filter Toolbar */}
        <div className="premium-card" style={{ padding: "20px 24px" }}>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between" style={{ gap: "16px" }}>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: "12px" }}>
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search expenses, payee, worker..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-input w-full"
                  style={{ paddingLeft: "36px", height: "40px" }}
                />
              </div>

              {/* Project Filter */}
              <Select
                options={projectFilterOptions}
                value={projectFilter}
                onChange={setProjectFilter}
                placeholder="All Projects"
                size="md"
              />

              {/* Expense Type Filter */}
              <Select
                options={typeFilterOptions}
                value={typeFilter}
                onChange={setTypeFilter}
                placeholder="All Types"
                size="md"
              />

              {/* Status Filter */}
              <Select
                options={statusFilterOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Statuses"
                size="md"
              />
            </div>

            {(search || projectFilter !== "all" || typeFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setProjectFilter("all");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="btn btn-secondary whitespace-nowrap"
                style={{ height: "40px" }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* 2.5 Project-Wise Financial Calculation & Budget Performance Card */}
        {projectFilter !== "all" && (() => {
          const selectedProjectObj = projectOptions.find(
            (p) => p.id === projectFilter || p.project_code.toLowerCase() === projectFilter.toLowerCase()
          );
          if (!selectedProjectObj) return null;

          const approvedBudget = Number(selectedProjectObj.approved_budget) || 0;
          const actualSpent = summary.totalExpenses;
          const remaining = approvedBudget - actualSpent;
          const isOverBudget = remaining < 0;
          const overBudgetAmount = Math.abs(Math.min(0, remaining));
          const spentPercent = approvedBudget > 0 ? (actualSpent / approvedBudget) * 100 : 0;
          const laborPercent = actualSpent > 0 ? ((summary.laborExpenses / actualSpent) * 100).toFixed(0) : "0";
          const materialPercent = actualSpent > 0 ? ((summary.materialExpenses / actualSpent) * 100).toFixed(0) : "0";

          return (
            <div
              className="premium-card p-6"
              style={{
                borderLeft: isOverBudget ? "4px solid #EF4444" : "4px solid #FFB000",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}
                  >
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        {selectedProjectObj.project_code}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 m-0">
                        {selectedProjectObj.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 m-0 mt-0.5">
                      Live Project-Wise Financial Calculation & Expense Budget Performance
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isOverBudget ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-800 flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      Budget Overrun (+{formatCurrencyFull(overBudgetAmount)})
                    </span>
                  ) : spentPercent >= 85 ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1.5">
                      <Clock size={14} />
                      High Utilization ({spentPercent.toFixed(1)}%)
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      Budget Healthy ({spentPercent.toFixed(1)}% Consumed)
                    </span>
                  )}

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    style={{ background: "#FFB000" }}
                  >
                    <Plus size={14} />
                    <span>Record Expense</span>
                  </button>
                </div>
              </div>

              {/* 4 Metrics Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200/60 mb-4">
                <div>
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Approved Project Budget
                  </span>
                  <span className="text-base font-extrabold text-gray-900">
                    {formatCurrencyFull(approvedBudget)}
                  </span>
                  <span className="block text-[10px] text-gray-400 mt-0.5">Sanctioned allocation</span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Total Incurred Spent
                  </span>
                  <span className="text-base font-extrabold text-amber-700">
                    {formatCurrencyFull(actualSpent)}
                  </span>
                  <span className="block text-[10px] text-amber-600 mt-0.5">
                    {spentPercent.toFixed(1)}% of approved budget
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Remaining Budget
                  </span>
                  <span className={`text-base font-extrabold ${isOverBudget ? "text-red-600" : "text-emerald-700"}`}>
                    {isOverBudget ? `-${formatCurrencyFull(overBudgetAmount)}` : formatCurrencyFull(remaining)}
                  </span>
                  <span className={`block text-[10px] mt-0.5 ${isOverBudget ? "text-red-500" : "text-emerald-600"}`}>
                    {isOverBudget ? "Exceeds approved limit" : `${(100 - Math.min(100, spentPercent)).toFixed(1)}% available buffer`}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Labor vs Material Split
                  </span>
                  <div className="text-xs font-semibold text-gray-800 mt-1 flex flex-col gap-0.5">
                    <span className="flex items-center justify-between">
                      <span className="text-blue-700 font-medium">Labor:</span>
                      <strong>{formatCurrencyFull(summary.laborExpenses)} ({laborPercent}%)</strong>
                    </span>
                    <span className="flex items-center justify-between">
                      <span className="text-emerald-700 font-medium">Material:</span>
                      <strong>{formatCurrencyFull(summary.materialExpenses)} ({materialPercent}%)</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-gray-600 mb-1.5">
                  <span>Project Budget Consumption</span>
                  <span>
                    {formatCurrencyFull(actualSpent)} / {formatCurrencyFull(approvedBudget)} ({spentPercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${Math.min(100, (summary.laborExpenses / (approvedBudget || 1)) * 100)}%`,
                      backgroundColor: "#3B82F6",
                    }}
                    title={`Labor: ${formatCurrencyFull(summary.laborExpenses)}`}
                  />
                  <div
                    style={{
                      width: `${Math.min(100, (summary.materialExpenses / (approvedBudget || 1)) * 100)}%`,
                      backgroundColor: "#10B981",
                    }}
                    title={`Materials: ${formatCurrencyFull(summary.materialExpenses)}`}
                  />
                  {isOverBudget && (
                    <div
                      style={{
                        width: `${Math.min(25, (overBudgetAmount / (approvedBudget || 1)) * 100)}%`,
                        backgroundColor: "#EF4444",
                      }}
                      title={`Budget Overrun: ${formatCurrencyFull(overBudgetAmount)}`}
                    />
                  )}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-gray-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    Labor ({formatCurrencyFull(summary.laborExpenses)})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Material ({formatCurrencyFull(summary.materialExpenses)})
                  </span>
                  <span className="flex items-center gap-1.5 ml-auto">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block" />
                    Available Balance ({formatCurrencyFull(Math.max(0, remaining))})
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3. Expenses Data Table or Clean Empty State */}
        {loading ? (
          <div className="premium-card py-20 flex flex-col items-center justify-center text-center">
            <RefreshCw size={28} className="animate-spin text-amber-500 mb-3" />
            <p className="text-sm font-medium text-gray-600">Loading expense vouchers...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="premium-card py-16 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100 shadow-sm">
              <Receipt size={30} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No expenses found</h3>
            <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
              No transactions match your filter criteria or no expenses have been recorded yet.
            </p>
            <div className="flex items-center gap-3">
              {(search || projectFilter !== "all" || typeFilter !== "all" || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setProjectFilter("all");
                    setTypeFilter("all");
                    setStatusFilter("all");
                  }}
                  className="btn btn-secondary"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
                style={{ background: "#FFB000" }}
              >
                <Plus size={16} />
                Record First Expense
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              overflow: "hidden",
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
                    <th style={{ padding: "14px 16px" }}>Project</th>
                    <th style={{ padding: "14px 18px" }}>Category & Item</th>
                    <th style={{ padding: "14px 16px", textAlign: "right" }}>Qty & Rate</th>
                    <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 800 }}>Amount (₹)</th>
                    <th style={{ padding: "14px 16px", textAlign: "center" }}>Payment / Bill</th>
                    <th style={{ padding: "14px 16px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => {
                    const isSelfRecorded = exp.recorded_by === user?.id;
                    const isLabor = exp.expense_type === "Labor" || exp.category?.toLowerCase() === "labor";
                    const isMaterial = exp.expense_type === "Material" || exp.category?.toLowerCase() === "materials" || exp.category?.toLowerCase() === "material";
                    const rawName = exp.worker_name || exp.material_name || exp.description || "General Entry";
                    const itemName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

                    return (
                      <tr
                        key={exp.id}
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
                            <span>{formatDate(exp.date)}</span>
                          </div>
                        </td>

                        {/* Project */}
                        <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                          {exp.project ? (
                            <div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "2px 7px",
                                  borderRadius: "6px",
                                  backgroundColor: "#FEF3C7",
                                  border: "1px solid #FDE68A",
                                  color: "#92400E",
                                }}
                              >
                                {exp.project.project_code}
                              </span>
                              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 500, marginTop: "4px" }}>
                                {exp.project.name}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#94A3B8" }}>General / Head Office</span>
                          )}
                        </td>

                        {/* Category & Item */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                            {isLabor ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#EFF6FF",
                                  color: "#1D4ED8",
                                  border: "1px solid #BFDBFE",
                                  flexShrink: 0,
                                  marginTop: "2px",
                                }}
                              >
                                <HardHat size={12} />
                                Labor
                              </span>
                            ) : isMaterial ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#ECFDF5",
                                  color: "#047857",
                                  border: "1px solid #A7F3D0",
                                  flexShrink: 0,
                                  marginTop: "2px",
                                }}
                              >
                                <Package size={12} />
                                Material
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#F1F5F9",
                                  color: "#475569",
                                  border: "1px solid #E2E8F0",
                                  flexShrink: 0,
                                  marginTop: "2px",
                                  textTransform: "capitalize",
                                }}
                              >
                                {exp.category || "General"}
                              </span>
                            )}
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                                {itemName}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                                {exp.payee ? `Payee: ${exp.payee}` : exp.supplier ? `Supplier: ${exp.supplier}` : exp.description}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Qty & Rate */}
                        <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {exp.quantity && exp.rate ? (
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>
                                {exp.quantity} {exp.unit || "units"}
                              </div>
                              <div style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace" }}>
                                @ ₹{exp.rate}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Direct Voucher</span>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td style={{ padding: "14px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", fontFamily: "monospace" }}>
                            {formatCurrencyFull(exp.amount)}
                          </span>
                        </td>

                        {/* Payment / Bill */}
                        <td style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            {exp.payment_method ? (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#F8FAFC",
                                  color: "#475569",
                                  border: "1px solid #E2E8F0",
                                }}
                              >
                                {exp.payment_method}
                              </span>
                            ) : (
                              <span style={{ fontSize: "12px", color: "#CBD5E1" }}>—</span>
                            )}

                            {exp.receipt_url && (
                              <a
                                href={exp.receipt_url}
                                target="_blank"
                                rel="noreferrer"
                                title="View attached receipt / bill"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: "6px",
                                  backgroundColor: "#FFF9EB",
                                  color: "#B45309",
                                  border: "1px solid #FDE68A",
                                  textDecoration: "none",
                                }}
                              >
                                <FileText size={11} />
                                <span>Bill</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                          <StatusBadge status={exp.status} size="sm" />
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                            {/* Quick view button */}
                            <button
                              type="button"
                              onClick={() => setViewExpense(exp)}
                              style={{
                                padding: "5px 8px",
                                borderRadius: "6px",
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#FFFFFF",
                                color: "#64748B",
                                cursor: "pointer",
                              }}
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Approve / Reject Actions for Pending Expenses */}
                            {exp.status === "pending_approval" && canApprove && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(exp)}
                                  disabled={submittingAction === exp.id || (isSelfRecorded && !hasRole("super_admin"))}
                                  style={{
                                    padding: "5px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid #BBF7D0",
                                    backgroundColor: "#F0FDF4",
                                    color: "#166534",
                                    cursor: isSelfRecorded && !hasRole("super_admin") ? "not-allowed" : "pointer",
                                    opacity: isSelfRecorded && !hasRole("super_admin") ? 0.4 : 1,
                                  }}
                                  title={
                                    isSelfRecorded && !hasRole("super_admin")
                                      ? "Separation of duties: You cannot approve your own record"
                                      : "Approve Expense"
                                  }
                                >
                                  <CheckCircle2 size={14} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setRejectingId(exp.id)}
                                  disabled={submittingAction === exp.id}
                                  style={{
                                    padding: "5px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid #FECACA",
                                    backgroundColor: "#FEF2F2",
                                    color: "#991B1B",
                                    cursor: "pointer",
                                  }}
                                  title="Reject Expense"
                                >
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Summary Stats */}
            <div
              style={{
                padding: "14px 24px",
                backgroundColor: "#F8FAFC",
                borderTop: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#64748B",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span>
                Showing <strong style={{ color: "#0F172A", fontWeight: 700 }}>{expenses.length}</strong> recorded voucher{expenses.length === 1 ? "" : "s"}
              </span>
              <span>
                Total Approved Sum:{" "}
                <strong style={{ color: "#92400E", fontWeight: 800, fontSize: "14px", marginLeft: "4px" }}>
                  {formatCurrencyFull(summary.totalExpenses)}
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* 4. Reject Confirmation Modal */}
        {rejectingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl border"
              style={{
                background: "var(--color-card, #FFFFFF)",
                borderColor: "var(--color-border, #E5E7EB)",
              }}
            >
              <div className="flex items-center gap-3 text-red-600 mb-3">
                <AlertCircle size={22} />
                <h3 className="text-lg font-bold text-gray-900">Reject Expense Voucher</h3>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Please enter a reason for rejecting this expense. The voucher will be marked as rejected and excluded from project totals.
              </p>

              <textarea
                rows={3}
                placeholder="Reason for rejection (e.g., incorrect billing rate, duplicate invoice)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 mb-4"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setRejectingId(null);
                    setRejectReason("");
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={submittingAction === rejectingId}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. View Expense Detail Slide-over / Modal */}
        {viewExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div
              className="w-full max-w-lg rounded-2xl p-6 shadow-2xl border relative max-h-[90vh] overflow-y-auto"
              style={{
                background: "var(--color-card, #FFFFFF)",
                borderColor: "var(--color-border, #E5E7EB)",
              }}
            >
              <button
                onClick={() => setViewExpense(null)}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={viewExpense.status} />
                <span className="text-xs font-semibold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  {viewExpense.expense_type || viewExpense.category}
                </span>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mt-2">
                {viewExpense.worker_name || viewExpense.material_name || viewExpense.description || "Expense Entry"}
              </h2>
              <p className="text-xs text-gray-500 mb-6">Recorded on {formatDate(viewExpense.date)}</p>

              <div className="space-y-4 text-sm divide-y divide-gray-100">
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-xs text-gray-500 block">Project</span>
                    <strong className="text-gray-900">
                      {viewExpense.project ? `${viewExpense.project.project_code} - ${viewExpense.project.name}` : "General"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Total Amount</span>
                    <strong className="text-gray-900 text-base text-amber-800">
                      {formatCurrencyFull(viewExpense.amount)}
                    </strong>
                  </div>
                </div>

                {viewExpense.quantity && viewExpense.rate && (
                  <div className="grid grid-cols-3 gap-3 pt-4">
                    <div>
                      <span className="text-xs text-gray-500 block">Quantity</span>
                      <strong className="text-gray-800">{viewExpense.quantity}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Unit</span>
                      <strong className="text-gray-800">{viewExpense.unit}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Rate (₹)</span>
                      <strong className="text-gray-800">₹{viewExpense.rate}</strong>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div>
                    <span className="text-xs text-gray-500 block">Payee / Supplier</span>
                    <strong className="text-gray-800">
                      {viewExpense.payee || viewExpense.supplier || "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Payment Method</span>
                    <strong className="text-gray-800">{viewExpense.payment_method || "—"}</strong>
                  </div>
                </div>

                {viewExpense.description && (
                  <div className="pt-4">
                    <span className="text-xs text-gray-500 block mb-1">Notes / Description</span>
                    <p className="text-xs text-gray-700 bg-stone-50 p-2.5 rounded-lg border">
                      {viewExpense.description}
                    </p>
                  </div>
                )}

                {viewExpense.rejection_reason && (
                  <div className="pt-4">
                    <span className="text-xs text-red-500 block mb-1">Rejection Reason</span>
                    <p className="text-xs text-red-800 bg-red-50 p-2.5 rounded-lg border border-red-200">
                      {viewExpense.rejection_reason}
                    </p>
                  </div>
                )}

                {viewExpense.receipt_url && (
                  <div className="pt-4">
                    <span className="text-xs text-gray-500 block mb-2">Attached Receipt</span>
                    <a
                      href={viewExpense.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 rounded-xl hover:bg-amber-100 transition"
                    >
                      <FileText size={15} />
                      View Uploaded Document
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewExpense(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. Dynamic Expense Creation Modal */}
        <ExpenseFormModal
          isOpen={isModalOpen}
          defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            showAlert("success", "Expense voucher recorded successfully!");
            fetchExpenses();
          }}
        />
      </div>
    </RouteGuard>
  );
}
