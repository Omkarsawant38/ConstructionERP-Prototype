"use client";

import React from "react";
import { formatCurrencyFull, formatDateShort } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Calendar, Clock, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import type { Project } from "@/types";
import { demoTasks, demoMilestones, demoActivities } from "@/lib/demo-data";

export default function ProjectOverviewTab({ project }: { project: Project }) {
  // Get related data
  const upcomingTasks = demoTasks
    .filter(t => t.project_id === project.id && t.status !== "completed")
    .sort((a, b) => new Date(a.due_date || "").getTime() - new Date(b.due_date || "").getTime())
    .slice(0, 3);
    
  const upcomingMilestones = demoMilestones
    .filter(m => m.project_id === project.id && !m.is_completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);
    
  const recentActivity = demoActivities
    .filter(a => a.project_id === project.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  const budgetSpentPercent = Math.round(((project.actual_expenses || 0) / project.approved_budget) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: "32px" }}>
      {/* Left Column - Main Details */}
      <div className="lg:col-span-2 flex flex-col" style={{ gap: "24px" }}>
        {/* Project Image & Details */}
        <div className="premium-card overflow-hidden">
          <div 
            className="h-64 bg-gray-200"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2000&auto=format&fit=crop')",
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
                <span className="font-medium">{project.completed_tasks || 0} / {project.tasks_count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-500" />
                  Milestones Met
                </span>
                <span className="font-medium">{project.completed_milestones || 0} / {project.milestones_count || 0}</span>
              </div>
            </div>
          </div>

          <div className="premium-card" style={{ padding: "24px" }}>
            <h3 className="text-base font-bold text-gray-900" style={{ marginBottom: "16px" }}>Financial Overview</h3>
            <div className="flex items-end justify-between" style={{ marginBottom: "8px" }}>
              <span className="text-3xl font-bold text-gray-900">{formatCurrencyFull(project.actual_expenses || 0)}</span>
              <span className="text-sm font-medium text-amber-600 mb-1">{budgetSpentPercent}% Spent</span>
            </div>
            <ProgressBar value={budgetSpentPercent} height={8} color={budgetSpentPercent > 90 ? "var(--color-error)" : "var(--color-warning)"} />
            
            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Approved Budget</span>
                <span className="font-medium">{formatCurrencyFull(project.approved_budget)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Remaining Budget</span>
                <span className="font-medium text-green-600">{formatCurrencyFull(project.remaining_budget || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Sidebar Widgets */}
      <div className="flex flex-col" style={{ gap: "24px" }}>
        {/* Upcoming Milestones */}
        <div className="premium-card p-0">
          <div className="border-b border-gray-100 flex items-center justify-between" style={{ padding: "16px" }}>
            <h3 className="font-bold text-gray-900">Upcoming Milestones</h3>
            <button className="text-xs text-amber-600 font-medium hover:underline">View All</button>
          </div>
          <div className="flex flex-col" style={{ padding: "16px", gap: "16px" }}>
            {upcomingMilestones.length > 0 ? (
              upcomingMilestones.map(milestone => (
                <div key={milestone.id} className="flex gap-3">
                  <div className="mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{milestone.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar size={12} />
                      Due {formatDateShort(milestone.due_date)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No upcoming milestones</p>
            )}
          </div>
        </div>

        {/* Priority Tasks */}
        <div className="premium-card p-0">
          <div className="border-b border-gray-100 flex items-center justify-between" style={{ padding: "16px" }}>
            <h3 className="font-bold text-gray-900">Priority Tasks</h3>
            <button className="text-xs text-amber-600 font-medium hover:underline">View All</button>
          </div>
          <div className="flex flex-col" style={{ padding: "16px", gap: "16px" }}>
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map(task => (
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
                      Assigned to: {task.assigned_to_name}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">No pending tasks</p>
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
