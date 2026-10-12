"use client";

import { useEffect, useState, useCallback } from "react";
import { demoExpenses } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/client";
import type { ProjectExpense, ExpenseFormData, Project, ExpenseCategory } from "@/types";

const LOCAL_STORAGE_KEY = "construction_erp_custom_expenses";
const UPDATE_EVENT = "construction_erp_expenses_updated";

// Map demo project IDs to project codes and vice versa
const DEMO_PROJECT_MAP: Record<string, string[]> = {
  "p1": ["p1", "prj-001", "PRJ-001"],
  "prj-001": ["p1", "prj-001", "PRJ-001"],
  "PRJ-001": ["p1", "prj-001", "PRJ-001"],
  "p2": ["p2", "prj-002", "PRJ-002"],
  "prj-002": ["p2", "prj-002", "PRJ-002"],
  "PRJ-002": ["p2", "prj-002", "PRJ-002"],
  "p3": ["p3", "prj-003", "PRJ-003"],
  "prj-003": ["p3", "prj-003", "PRJ-003"],
  "PRJ-003": ["p3", "prj-003", "PRJ-003"],
  "p4": ["p4", "prj-004", "PRJ-004"],
  "prj-004": ["p4", "prj-004", "PRJ-004"],
  "PRJ-004": ["p4", "prj-004", "PRJ-004"],
  "p5": ["p5", "prj-005", "PRJ-005"],
  "prj-005": ["p5", "prj-005", "PRJ-005"],
  "PRJ-005": ["p5", "prj-005", "PRJ-005"],
  "p6": ["p6", "prj-006", "PRJ-006"],
  "prj-006": ["p6", "prj-006", "PRJ-006"],
  "PRJ-006": ["p6", "prj-006", "PRJ-006"],
};

/**
 * Get custom expenses from localStorage
 */
export function getCustomExpenses(): ProjectExpense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read expenses from localStorage:", error);
    return [];
  }
}

/**
 * Save custom expenses to localStorage
 */
export function saveCustomExpenses(expenses: ProjectExpense[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch (error) {
    console.error("Failed to save expenses to localStorage:", error);
  }
}

/**
 * Check if an expense belongs to project by ID or Code
 */
export function doesExpenseBelongToProject(expense: ProjectExpense, projectId: string, projectCode?: string): boolean {
  if (expense.project_id === projectId) return true;
  if (projectCode && expense.project_id === projectCode) return true;

  const aliasesForId = DEMO_PROJECT_MAP[projectId] || [];
  if (aliasesForId.includes(expense.project_id)) return true;

  if (projectCode) {
    const aliasesForCode = DEMO_PROJECT_MAP[projectCode] || [];
    if (aliasesForCode.includes(expense.project_id)) return true;
  }

  return false;
}

/**
 * Get all merged expenses for a project
 */
export function getProjectExpenses(projectId: string, projectCode?: string): ProjectExpense[] {
  const custom = getCustomExpenses();
  const customForProject = custom.filter(e => doesExpenseBelongToProject(e, projectId, projectCode));
  const customIds = new Set(customForProject.map(e => e.id));

  const demoForProject = demoExpenses
    .filter(e => doesExpenseBelongToProject(e, projectId, projectCode))
    .filter(e => !customIds.has(e.id));

  // Custom expenses first, sorted by date descending
  return [...customForProject, ...demoForProject].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Create a new expense
 */
export async function createExpense(
  projectId: string,
  formData: {
    date: string;
    category: ExpenseCategory;
    amount: number;
    supplier: string;
    description: string;
    status?: "draft" | "pending_approval" | "approved" | "rejected";
    payment_method?: string;
  },
  userId?: string | null,
  projectCode?: string
): Promise<ProjectExpense> {
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `exp-${Date.now()}`;

  const now = new Date().toISOString();

  const newExpense: ProjectExpense = {
    id,
    project_id: projectId,
    date: formData.date || now.split("T")[0],
    category: formData.category || "materials",
    amount: Number(formData.amount) || 0,
    supplier: formData.supplier || "",
    description: formData.description || "",
    status: formData.status || "approved",
    payment_method: formData.payment_method || "Bank Transfer",
    organization_id: "org1",
    recorded_by: userId || "user1",
    created_at: now,
    updated_at: now,
  };

  const existing = getCustomExpenses();
  saveCustomExpenses([newExpense, ...existing]);

  // Attempt Supabase insert
  try {
    const supabase = createClient();
    await supabase.from("expenses").insert({
      id: newExpense.id,
      project_id: newExpense.project_id,
      date: newExpense.date,
      category: newExpense.category,
      amount: newExpense.amount,
      description: newExpense.description,
      supplier: newExpense.supplier,
      organization_id: newExpense.organization_id,
    });
  } catch (err) {
    console.warn("Supabase expense sync failed (demo mode):", err);
  }

  return newExpense;
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  const custom = getCustomExpenses();
  const filtered = custom.filter(e => e.id !== expenseId);
  saveCustomExpenses(filtered);

  try {
    const supabase = createClient();
    await supabase.from("expenses").delete().eq("id", expenseId);
  } catch {
    // ignore
  }
}

/**
 * Hook to access and manage expenses for a project with budget metrics
 */
export function useProjectExpenses(project?: Project | null) {
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshExpenses = useCallback(() => {
    if (!project) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    const current = getProjectExpenses(project.id, project.project_code);
    setExpenses(current);
    setLoading(false);
  }, [project?.id, project?.project_code]);

  useEffect(() => {
    refreshExpenses();

    const handleUpdate = () => {
      refreshExpenses();
    };

    window.addEventListener(UPDATE_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
    };
  }, [refreshExpenses]);

  // Calculate actual total expenses from itemized list
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const approvedBudget = project?.approved_budget || 0;
  const remainingBudget = Math.max(0, approvedBudget - totalExpenses);
  const budgetSpentPercent = approvedBudget > 0 ? Math.min(100, Math.round((totalExpenses / approvedBudget) * 100)) : 0;

  const addExpense = async (
    formData: {
      date: string;
      category: ExpenseCategory;
      amount: number;
      supplier: string;
      description: string;
      status?: "draft" | "pending_approval" | "approved" | "rejected";
      payment_method?: string;
    },
    userId?: string | null
  ) => {
    if (!project) return;
    const created = await createExpense(project.id, formData, userId, project.project_code);
    refreshExpenses();
    return created;
  };

  const removeExpense = async (expenseId: string) => {
    await deleteExpense(expenseId);
    refreshExpenses();
  };

  return {
    expenses,
    loading,
    totalExpenses,
    approvedBudget,
    remainingBudget,
    budgetSpentPercent,
    refreshExpenses,
    addExpense,
    removeExpense,
  };
}
