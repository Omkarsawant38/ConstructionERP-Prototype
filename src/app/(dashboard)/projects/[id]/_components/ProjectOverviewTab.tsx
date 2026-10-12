"use client";

import React from "react";
import { formatCurrencyFull, formatDateShort, getProjectImageUrl } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Calendar, Clock, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import type { Project } from "@/types";
import { demoActivities } from "@/lib/demo-data";
import { useProjectTasks } from "@/lib/taskStore";
import { useProjectExpenses } from "@/lib/expenseStore";

interface ProjectOverviewTabProps {
  project: Project;
  onNavigateToTasks?: () => void;
}

export default function ProjectOverviewTab({ project, onNavigateToTasks }: ProjectOverviewTabProps) {
  const { tasks: allProjectTasks } = useProjectTasks(project);
  const { totalExpenses } = useProjectExpenses(project);

  const totalTasksCount = allProjectTasks.length || project.tasks_count || 0;
  const completedTasksCount = allProjectTasks.filter(t => t.status === "completed").length;
  const inProgressTasksCount = allProjectTasks.filter(t => t.status === "in-progress").length;

  // Upcoming Tasks: pending tasks sorted by nearest due date
  const upcomingTasks = allProjectTasks
    .filter(t => t.status !== "completed")
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 3);

  // Priority Tasks: critical or high priority pending tasks
  const priorityTasks = allProjectTasks
    .filter(t => t.status !== "completed")
    .sort((a, b) => {
      const pOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
    })
    .slice(0, 3);
    
  const recentActivity = demoActivities
    .filter(a => a.project_id === project.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  // Financial calculations: prioritize expenses tracked in expenseStore, fallback to project.actual_expenses
  const spentAmount = totalExpenses > 0 ? totalExpenses : (project.actual_expenses || 0);
  const remainingBudget = Math.max(0, (project.approved_budget || 0) - spentAmount);
  const budgetSpentPercent = project.approved_budget > 0 
    ? Math.min(100, Math.round((spentAmount / project.approved_budget) * 100)) 
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "32px" }}>
      {/* Left Column - Main Details */}
      <div className="lg:col-span-2 flex flex-col" style={{ gap: "24px" }}>
        {/* Project Image & Details */}
        <div className="premium-card overflow-hidden">
          <div 
            className="h-64 bg-gray-200"
            style={{
              backgroundImage: `url('${getProjectImageUrl(project)}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: '#e5e7eb' // Fallback color
            }}
          />
          <div style={{ padding: "24px" }}>
            <h3 className="text-lg font-bold text-gray-900" style={{ marginBottom: "8px" }}>Project Description</h3>
            <p className="text-gray-600 leading-relaxed" style={{ marginBottom: "24px" }}>
              {project.description || "No description provided."}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-gray-100" style={{ gap: "24px", paddingTop: "16px", paddingBottom: "16px" }}>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Start Date</span>
                <span className="font-medium text-gray-900">{formatDateShort(project.start_date)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">End Date</span>
                <span className="font-medium text-gray-900">{formatDateShort(project.end_date)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Project Type</span>
                <span className="font-medium text-gray-900">{project.project_type || "N/A"}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Category</span>
                <span className="font-medium text-gray-900">{project.construction_category || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress & Financials */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "32px" }}>
          <div className="premium-card" style={{ padding: "24px" }}>
            <h3 className="text-base font-bold text-gray-900" style={{ marginBottom: "16px" }}>Project Progress</h3>
            <div className="flex items-end justify-between" style={{ marginBottom: "8px" }}>
              <span className="text-3xl font-bold text-gray-900">{project.progress}%</span>
              <span className="text-sm font-medium text-gray-500 mb-1">Overall Completion</span>
            </div>
            <ProgressBar value={project.progress} height={8} />
            
            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  Completed Tasks
                </span>
                <span className="font-medium">{completedTasksCount} / {totalTasksCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" />
                  In Progress Tasks
                </span>
                <span className="font-medium">{inProgressTasksCount} active</span>
              </div>
            </div>
          </div>

          <div className="premium-card" style={{ padding: "24px" }}>
            <h3 className="text-base font-bold text-gray-900" style={{ marginBottom: "16px" }}>Financial Overview</h3>
            <div className="flex items-end justify-between" style={{ marginBottom: "8px" }}>
              <div>
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">Total Spent</span>
                <span className="text-3xl font-bold text-gray-900">{formatCurrencyFull(spentAmount)}</span>
              </div>
              <span className="text-sm font-medium text-amber-600 mb-1">{budgetSpentPercent}% Spent</span>
            </div>
            <ProgressBar value={budgetSpentPercent} height={8} color={budgetSpentPercent > 90 ? "var(--color-error)" : "var(--color-warning)"} />
            
            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Approved Budget</span>
                <span className="font-medium text-gray-900">{formatCurrencyFull(project.approved_budget)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Spent Amount</span>
                <span className="font-medium text-amber-600">{formatCurrencyFull(spentAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Remaining Budget</span>
                <span className="font-medium text-green-600">{formatCurrencyFull(remainingBudget)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Sidebar Widgets */}
      <div className="flex flex-col" style={{ gap: "24px" }}>
        {/* Upcoming Tasks */}
        <div className="premium-card p-0">
          <div className="border-b border-gray-100 flex items-center justify-between" style={{ padding: "16px" }}>
            <h3 className="font-bold text-gray-900">Upcoming Tasks</h3>
            {onNavigateToTasks && (
              <button
                type="button"
                onClick={onNavigateToTasks}
                className="text-xs text-amber-600 font-medium hover:underline cursor-pointer"
              >
                View All
              </button>
            )}
          </div>
          <div className="flex flex-col" style={{ padding: "16px", gap: "16px" }}>
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map(task => (
                <div key={task.id} className="flex gap-3">
                  <div className="mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{task.title}</h4>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {task.due_date ? `Due ${formatDateShort(task.due_date)}` : "No due date"}
                      </p>
                      {task.assigned_to_name && (
                        <span className="text-[11px] text-gray-500 truncate">
                          {task.assigned_to_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No upcoming tasks</p>
            )}
          </div>
        </div>

        {/* Priority Tasks */}
        <div className="premium-card p-0">
          <div className="border-b border-gray-100 flex items-center justify-between" style={{ padding: "16px" }}>
            <h3 className="font-bold text-gray-900">Priority Tasks</h3>
            {onNavigateToTasks && (
              <button
                type="button"
                onClick={onNavigateToTasks}
                className="text-xs text-amber-600 font-medium hover:underline cursor-pointer"
              >
                View All
              </button>
            )}
          </div>
          <div className="flex flex-col" style={{ padding: "16px", gap: "16px" }}>
            {priorityTasks.length > 0 ? (
              priorityTasks.map(task => (
                <div key={task.id} className="flex gap-3">
                  <div className="mt-0.5">
                    {task.priority === "critical" || task.priority === "high" ? (
                      <AlertTriangle size={16} className="text-red-500" />
                    ) : (
                      <Clock size={16} className="text-amber-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned to: {task.assigned_to_name || "Unassigned"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No priority tasks</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="premium-card p-0">
          <div className="border-b border-gray-100" style={{ padding: "16px" }}>
            <h3 className="font-bold text-gray-900">Recent Activity</h3>
          </div>
          <div className="flex flex-col" style={{ padding: "16px", gap: "20px" }}>
            {recentActivity.length > 0 ? (
              recentActivity.map(activity => (
                <div key={activity.id} className="flex gap-3 relative">
                  {/* Activity Timeline Line */}
                  <div className="absolute left-4 top-6 bottom-[-20px] w-px bg-gray-200 last:hidden" />
                  
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 relative z-10 text-xs font-medium text-gray-600">
                    {activity.actor_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.actor_name}</span> {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDateShort(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
