"use client";

import React, { useState } from "react";
import { X, Check, Calendar, User, AlertCircle, Clock, Flag, Sparkles } from "lucide-react";
import type { TaskPriority, TaskStatus, TaskFormData, Project } from "@/types";
import { Select } from "@/components/ui/Select";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  onTaskCreated: (taskData: TaskFormData) => Promise<void> | void;
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low Priority", color: "#3B82F6" },
  { value: "medium", label: "Medium Priority", color: "#F59E0B" },
  { value: "high", label: "High Priority", color: "#EF4444" },
  { value: "critical", label: "Critical Priority", color: "#DC2626" },
];

const STATUS_OPTIONS = [
  { value: "not-started", label: "Not Started", color: "#94A3B8" },
  { value: "in-progress", label: "In Progress", color: "#3B82F6" },
  { value: "completed", label: "Completed", color: "#10B981" },
  { value: "blocked", label: "Blocked", color: "#EF4444" },
];

const ASSIGNEE_OPTIONS = [
  { value: "Omkar Sawant", label: "Omkar Sawant (Project Manager)" },
  { value: "Rajesh Kumar", label: "Rajesh Kumar (Site Supervisor)" },
  { value: "Priya Sharma", label: "Priya Sharma (Lead Site Engineer)" },
  { value: "Suresh Patil", label: "Suresh Patil (Civil Engineer)" },
  { value: "Anil Deshmukh", label: "Anil Deshmukh (Contractor Lead)" },
  { value: "Vikram Singh", label: "Vikram Singh (MEP Specialist)" },
  { value: "Manoj Tiwari", label: "Manoj Tiwari (Plumbing Lead)" },
  { value: "Unassigned", label: "Unassigned" },
];

export function AddTaskModal({
  open,
  onClose,
  project,
  onTaskCreated,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToName, setAssignedToName] = useState("Omkar Sawant");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("not-started");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      setError("Due date cannot be before start date");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await onTaskCreated({
        title: title.trim(),
        description: description.trim(),
        assigned_to_name: assignedToName,
        priority,
        status,
        start_date: startDate,
        due_date: dueDate,
        progress: Number(progress) || 0,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setProgress(0);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

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
                Add New Task
              </h2>
            </div>
            <p style={{ fontSize: "12px", color: "#64748B", margin: "4px 0 0 0" }}>
              Create an operational task for <strong style={{ color: "#334155" }}>{project.name}</strong>
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

            {/* Task Title */}
            <div>
              <label
                htmlFor="task-title"
                style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
              >
                Task Name / Scope <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                id="task-title"
                type="text"
                required
                autoFocus
                placeholder="e.g. Foundation Excavation, Brick Work - Tower A, Electrical Conduiting"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
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

            {/* Description */}
            <div>
              <label
                htmlFor="task-desc"
                style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
              >
                Description / Technical Notes
              </label>
              <textarea
                id="task-desc"
                rows={2}
                placeholder="Key deliverables, safety guidelines, material specifications, or site instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  fontSize: "13px",
                  color: "#0F172A",
                  outline: "none",
                  resize: "vertical",
                  backgroundColor: "#FFFFFF",
                  fontFamily: "inherit",
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

            {/* Assignee & Priority */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Assignee
                </label>
                <Select
                  options={ASSIGNEE_OPTIONS}
                  value={assignedToName}
                  onChange={setAssignedToName}
                  width="100%"
                />
              </div>

              <div>
                <label
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Priority
                </label>
                <Select
                  options={PRIORITY_OPTIONS}
                  value={priority}
                  onChange={(val) => setPriority(val as TaskPriority)}
                  width="100%"
                />
              </div>
            </div>

            {/* Status & Progress */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Current Status
                </label>
                <Select
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(val) => {
                    const newStatus = val as TaskStatus;
                    setStatus(newStatus);
                    if (newStatus === "completed") setProgress(100);
                    else if (newStatus === "not-started" && progress === 100) setProgress(0);
                  }}
                  width="100%"
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label
                    style={{ fontSize: "12px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Progress ({progress}%)
                  </label>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", height: "40px" }}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progress}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setProgress(val);
                      if (val === 100) setStatus("completed");
                      else if (val > 0 && status === "not-started") setStatus("in-progress");
                    }}
                    style={{
                      flex: 1,
                      accentColor: "#FFB000",
                      cursor: "pointer",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      minWidth: "40px",
                      textAlign: "right",
                    }}
                  >
                    {progress}%
                  </span>
                </div>
              </div>
            </div>

            {/* Dates: Start & Due Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label
                  htmlFor="start-date"
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
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

              <div>
                <label
                  htmlFor="due-date"
                  style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  Target Due Date
                </label>
                <input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
              disabled={submitting || !title.trim()}
              style={{
                padding: "9px 22px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#FFB000",
                fontSize: "13px",
                fontWeight: 700,
                color: "#0F172A",
                cursor: submitting || !title.trim() ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(255, 176, 0, 0.25)",
                transition: "all 0.15s ease",
                opacity: submitting || !title.trim() ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!submitting && title.trim()) e.currentTarget.style.backgroundColor = "#E69E00";
              }}
              onMouseLeave={(e) => {
                if (!submitting && title.trim()) e.currentTarget.style.backgroundColor = "#FFB000";
              }}
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{submitting ? "Creating Task..." : "Create Task"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
