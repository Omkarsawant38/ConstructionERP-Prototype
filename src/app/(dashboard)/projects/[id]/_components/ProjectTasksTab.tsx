"use client";

import React, { useState } from "react";
import { formatDateShort } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Check, 
  User as UserIcon,
  Sparkles,
  ClipboardList
} from "lucide-react";
import type { Project, Task, TaskFormData, TaskStatus } from "@/types";
import { Select } from "@/components/ui/Select";
import { useProjectTasks } from "@/lib/taskStore";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";

const taskStatusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "not-started", label: "Not Started", color: "#94A3B8" },
  { value: "in-progress", label: "In Progress", color: "#3B82F6" },
  { value: "completed", label: "Completed", color: "#10B981" },
  { value: "blocked", label: "Blocked", color: "#EF4444" },
];

export default function ProjectTasksTab({ project }: { project: Project }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const { tasks, loading, addTask, editTask, removeTask } = useProjectTasks(project);

  const handleCreateTask = async (formData: TaskFormData) => {
    try {
      const created = await addTask(formData);
      setFeedback({ message: `Task "${formData.title}" added successfully!`, type: "success" });
      setTimeout(() => setFeedback(null), 3500);
    } catch {
      setFeedback({ message: "Failed to create task", type: "error" });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleStatusChange = async (task: Task, nextStatus: TaskStatus) => {
    const nextProgress = nextStatus === "completed" ? 100 : nextStatus === "not-started" ? 0 : Math.max(25, task.progress);
    await editTask(task.id, {
      status: nextStatus,
      progress: nextProgress,
      completed_date: nextStatus === "completed" ? new Date().toISOString().split("T")[0] : undefined,
    });
    setActiveMenuTaskId(null);
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    await removeTask(taskId);
    setActiveMenuTaskId(null);
    setFeedback({ message: `Task "${title}" removed`, type: "success" });
    setTimeout(() => setFeedback(null), 3500);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.assigned_to_name && task.assigned_to_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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

      {/* Top Search & Filter Bar */}
      <div
        className="premium-card"
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
              placeholder="Search tasks, assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: "38px",
                paddingLeft: "36px",
                paddingRight: "14px",
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
          </div>

          {/* Status Filter */}
          <Select
            width="170px"
            options={taskStatusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        {/* Action Button: Add Task */}
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
          <span>Add Task</span>
        </button>
      </div>

      {/* Tasks Table */}
      <div
        className="premium-card"
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
                <th style={{ padding: "14px 20px" }}>Task Name</th>
                <th style={{ padding: "14px 16px" }}>Assignee</th>
                <th style={{ padding: "14px 16px" }}>Timeline</th>
                <th style={{ padding: "14px 16px" }}>Priority</th>
                <th style={{ padding: "14px 16px", minWidth: "150px" }}>Progress</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "#64748B" }}>
                    <div style={{ display: "inline-block", width: "24px", height: "24px", border: "2px solid #FFB000", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <p style={{ marginTop: "10px", fontSize: "13px" }}>Loading project tasks...</p>
                  </td>
                </tr>
              ) : filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr
                    key={task.id}
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
                    {/* Task Title */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F172A" }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px", maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {task.description}
                        </div>
                      )}
                    </td>

                    {/* Assignee */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            backgroundColor: "#FFF9EB",
                            border: "1px solid #FFE4A0",
                            color: "#D97706",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {task.assigned_to_name ? task.assigned_to_name.charAt(0).toUpperCase() : <UserIcon size={12} />}
                        </div>
                        <span style={{ fontSize: "13px", color: "#334155", fontWeight: 500 }}>
                          {task.assigned_to_name || "Unassigned"}
                        </span>
                      </div>
                    </td>

                    {/* Dates */}
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748B" }}>
                      {task.start_date && task.due_date ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Calendar size={13} style={{ color: "#94A3B8" }} />
                          <span>
                            {formatDateShort(task.start_date)} – {formatDateShort(task.due_date)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>Not scheduled</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          textTransform: "capitalize",
                          backgroundColor:
                            task.priority === "critical"
                              ? "#FEE2E2"
                              : task.priority === "high"
                              ? "#FFEDD5"
                              : task.priority === "medium"
                              ? "#FEF3C7"
                              : "#EFF6FF",
                          color:
                            task.priority === "critical"
                              ? "#B91C1C"
                              : task.priority === "high"
                              ? "#C2410C"
                              : task.priority === "medium"
                              ? "#B45309"
                              : "#1D4ED8",
                          border:
                            task.priority === "critical"
                              ? "1px solid #FECACA"
                              : task.priority === "high"
                              ? "1px solid #FED7AA"
                              : task.priority === "medium"
                              ? "1px solid #FDE68A"
                              : "1px solid #BFDBFE",
                        }}
                      >
                        {task.priority}
                      </span>
                    </td>

                    {/* Progress */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ width: "130px" }}>
                        <ProgressBar value={task.progress} showLabel />
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge status={task.status} size="sm" />
                    </td>

                    {/* Action Menu */}
                    <td style={{ padding: "14px 16px", textAlign: "right", position: "relative" }}>
                      <div style={{ display: "inline-block", position: "relative" }}>
                        <button
                          type="button"
                          onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
                          style={{
                            padding: "6px",
                            borderRadius: "8px",
                            border: "1px solid transparent",
                            backgroundColor: activeMenuTaskId === task.id ? "#F1F5F9" : "transparent",
                            color: "#64748B",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#F1F5F9";
                            e.currentTarget.style.color = "#0F172A";
                          }}
                          onMouseLeave={(e) => {
                            if (activeMenuTaskId !== task.id) {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = "#64748B";
                            }
                          }}
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuTaskId === task.id && (
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
                              width: "170px",
                              zIndex: 30,
                              padding: "4px",
                              textAlign: "left",
                            }}
                          >
                            <div style={{ padding: "4px 8px", fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
                              Set Status
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(task, "not-started")}
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
                                color: "#334155",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              Not Started
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(task, "in-progress")}
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
                                color: "#2563EB",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EFF6FF")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              In Progress
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(task, "completed")}
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
                                color: "#16A34A",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ECFDF5")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              Completed (100%)
                            </button>

                            <div style={{ height: "1px", backgroundColor: "#F1F5F9", margin: "4px 0" }} />

                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id, task.title)}
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
                              <span>Delete Task</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
                      <ClipboardList size={28} />
                    </div>
                    <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>
                      {searchQuery || statusFilter !== "all"
                        ? "No tasks found matching your filters"
                        : "No tasks created for this project yet"}
                    </h4>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 20px 0", maxWidth: "400px", marginLeft: "auto", marginRight: "auto" }}>
                      {searchQuery || statusFilter !== "all"
                        ? "Try clearing your search query or selecting a different status filter."
                        : "Break down construction deliverables, allocate team members, and track site progress."}
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
                      <span>Create First Task</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        project={project}
        onTaskCreated={handleCreateTask}
      />
    </div>
  );
}
