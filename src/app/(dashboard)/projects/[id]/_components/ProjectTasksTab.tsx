"use client";

import React, { useState } from "react";
import { formatCurrencyFull, formatDateShort } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Plus, Search, Filter, MoreHorizontal, Calendar } from "lucide-react";
import type { Project } from "@/types";
import { demoTasks } from "@/lib/demo-data";

export default function ProjectTasksTab({ project }: { project: Project }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const projectTasks = demoTasks.filter(t => t.project_id === project.id);

  const filteredTasks = projectTasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.assigned_to_name && task.assigned_to_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center premium-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10 w-full"
            />
          </div>
          <select 
            className="form-input w-full sm:w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <button className="btn btn-primary self-end sm:self-auto shrink-0">
          <Plus size={18} />
          <span className="hidden sm:inline">Add Task</span>
        </button>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Assignee</th>
                <th>Dates</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="font-medium text-gray-900">{task.title}</td>
                    <td className="text-gray-600">{task.assigned_to_name || "Unassigned"}</td>
                    <td className="text-sm text-gray-600">
                      {task.start_date && task.due_date ? (
                         <span>{formatDateShort(task.start_date)} - {formatDateShort(task.due_date)}</span>
                      ) : (
                         <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </td>
                    <td className="w-40">
                      <ProgressBar value={task.progress} showLabel />
                    </td>
                    <td>
                      <StatusBadge status={task.status} size="sm" />
                    </td>
                    <td>
                      <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No tasks found matching your filters.
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
