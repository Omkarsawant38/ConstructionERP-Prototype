"use client";

import React, { useState } from "react";
import { formatCurrencyFull, formatDateShort } from "@/lib/utils";
import { Plus, Search, Filter, MoreHorizontal, FileText } from "lucide-react";
import type { Project } from "@/types";
import { demoExpenses } from "@/lib/demo-data";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select } from "@/components/ui/Select";

const expenseCategoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "materials", label: "Materials", color: "#3B82F6" },
  { value: "labor", label: "Labor", color: "#10B981" },
  { value: "equipment", label: "Equipment", color: "#F59E0B" },
  { value: "professional-fees", label: "Professional Fees", color: "#8B5CF6" },
];

export default function ProjectExpensesTab({ project }: { project: Project }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const projectExpenses = demoExpenses.filter(e => e.project_id === project.id);

  const filteredExpenses = projectExpenses.filter((expense) => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          expense.supplier?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 border-l-4 border-amber-500">
           <h3 className="text-sm font-medium text-gray-500 mb-1">Approved Budget</h3>
           <p className="text-2xl font-bold text-gray-900">{formatCurrencyFull(project.approved_budget)}</p>
        </div>
        <div className="premium-card p-6 border-l-4 border-red-500">
           <h3 className="text-sm font-medium text-gray-500 mb-1">Total Expenses</h3>
           <p className="text-2xl font-bold text-gray-900">{formatCurrencyFull(project.actual_expenses || 0)}</p>
        </div>
        <div className="premium-card p-6 border-l-4 border-green-500">
           <h3 className="text-sm font-medium text-gray-500 mb-1">Remaining Budget</h3>
           <p className="text-2xl font-bold text-green-600">{formatCurrencyFull(project.remaining_budget || 0)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center premium-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10 w-full"
            />
          </div>
          <Select 
            width="180px"
            options={expenseCategoryOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>

        <button className="btn btn-primary self-end sm:self-auto shrink-0">
          <Plus size={18} />
          <span className="hidden sm:inline">Add Expense</span>
        </button>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Supplier/Vendor</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="text-gray-600 whitespace-nowrap">{formatDateShort(expense.date)}</td>
                    <td>
                      <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                        {expense.category.replace("-", " ")}
                      </span>
                    </td>
                    <td className="text-gray-900 max-w-xs truncate" title={expense.description}>
                      {expense.description}
                    </td>
                    <td className="text-gray-600">{expense.supplier || "-"}</td>
                    <td className="font-semibold text-gray-900 text-right">{formatCurrencyFull(expense.amount)}</td>
                    <td>
                      <StatusBadge status="approved" size="sm" />
                    </td>
                    <td>
                      <div className="flex justify-end items-center gap-2">
                        {expense.receipt_url && (
                          <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md" title="View Receipt">
                            <FileText size={16} />
                          </button>
                        )}
                        <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No expenses found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
