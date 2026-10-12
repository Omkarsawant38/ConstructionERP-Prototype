"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Building2, MapPin, Calendar, IndianRupee, User, Activity, AlertCircle, Loader2 } from "lucide-react";
import type { Project, ProjectFormData } from "@/types";
import { updateProject } from "@/lib/projectStore";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSuccess: (updated: Project) => void;
}

const projectTypeOptions = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Industrial", label: "Industrial" },
  { value: "Infrastructure", label: "Infrastructure" },
];

const categoryOptions = [
  { value: "High-Rise", label: "High-Rise" },
  { value: "Mid-Rise", label: "Mid-Rise" },
  { value: "Villas", label: "Villas" },
  { value: "Commercial Complex", label: "Commercial Complex" },
  { value: "Warehouse", label: "Warehouse" },
];

const statusOptions = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

const healthOptions = [
  { value: "on-track", label: "On Track" },
  { value: "at-risk", label: "At Risk" },
  { value: "delayed", label: "Delayed" },
];

export function EditProjectModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    name: project.name || "",
    project_code: project.project_code || "",
    description: project.description || "",
    client_name: project.client_name || "",
    project_type: project.project_type || "Residential",
    construction_category: project.construction_category || "High-Rise",
    site_address: project.site_address || "",
    city: project.city || "",
    state: project.state || "Maharashtra",
    postal_code: project.postal_code || "",
    start_date: project.start_date || "",
    end_date: project.end_date || "",
    actual_end_date: project.actual_end_date || "",
    approved_budget: project.approved_budget || 0,
    status: project.status || "planning",
    health_status: project.health_status || "on-track",
    progress: project.progress ?? 0,
    project_manager_name: project.project_manager_name || "Unassigned",
    financial_notes: project.financial_notes || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever project changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: project.name || "",
        project_code: project.project_code || "",
        description: project.description || "",
        client_name: project.client_name || "",
        project_type: project.project_type || "Residential",
        construction_category: project.construction_category || "High-Rise",
        site_address: project.site_address || "",
        city: project.city || "",
        state: project.state || "Maharashtra",
        postal_code: project.postal_code || "",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        actual_end_date: project.actual_end_date || "",
        approved_budget: project.approved_budget || 0,
        status: project.status || "planning",
        health_status: project.health_status || "on-track",
        progress: project.progress ?? 0,
        project_manager_name: project.project_manager_name || "Unassigned",
        financial_notes: project.financial_notes || "",
      });
      setError(null);
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "approved_budget" || name === "progress"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Project Name is required.");
      return;
    }

    if (!formData.project_code.trim()) {
      setError("Project Code is required.");
      return;
    }

    if (formData.approved_budget <= 0) {
      setError("Approved Budget must be greater than 0.");
      return;
    }

    setLoading(true);

    try {
      const updated = await updateProject(
        project.id,
        {
          name: formData.name.trim(),
          project_code: formData.project_code.trim(),
          description: formData.description,
          client_name: formData.client_name,
          project_type: formData.project_type,
          construction_category: formData.construction_category,
          site_address: formData.site_address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          start_date: formData.start_date,
          end_date: formData.end_date,
          actual_end_date: formData.actual_end_date,
          approved_budget: Number(formData.approved_budget),
          status: formData.status as any,
          health_status: formData.health_status as any,
          progress: Number(formData.progress),
          project_manager_name: formData.project_manager_name,
          financial_notes: formData.financial_notes,
        },
        project
      );

      if (updated) {
        onSuccess(updated);
        onClose();
      } else {
        throw new Error("Could not update project");
      }
    } catch (err: any) {
      console.error("Failed to update project:", err);
      setError(err?.message || "Failed to save project changes");
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: "800px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
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
                backgroundColor: "#FEF3C7",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Edit Project: {project.name}
              </h2>
              <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                Update construction parameters, schedule, budget, and operational status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
          <div
            style={{
              padding: "24px 28px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {error && (
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
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Basic Information */}
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Basic Information
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Project Code *
                  </label>
                  <input
                    type="text"
                    name="project_code"
                    value={formData.project_code}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Client Name
                  </label>
                  <input
                    type="text"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Project Type
                  </label>
                  <select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleChange}
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
                    {projectTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Construction Category
                  </label>
                  <select
                    name="construction_category"
                    value={formData.construction_category}
                    onChange={handleChange}
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
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Budget & Management */}
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Budget & Leadership
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Approved Budget (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    name="approved_budget"
                    value={formData.approved_budget}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Project Manager
                  </label>
                  <input
                    type="text"
                    name="project_manager_name"
                    value={formData.project_manager_name}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Status, Health & Progress */}
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Status & Progress
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Operational Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
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
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Health Status
                  </label>
                  <select
                    name="health_status"
                    value={formData.health_status}
                    onChange={handleChange}
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
                    {healthOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Progress ({formData.progress}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    name="progress"
                    value={formData.progress}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "40px",
                      accentColor: "#FFB000",
                      cursor: "pointer",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Schedule */}
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Project Timeline
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Location */}
            <div>
              <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Location & Site Address
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Site Address
                  </label>
                  <input
                    type="text"
                    name="site_address"
                    value={formData.site_address}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Description */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                Description & Notes
              </label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleChange}
                placeholder="Overview of project scope, phase highlights..."
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  fontSize: "13px",
                  color: "#0F172A",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              disabled={loading}
              className="btn btn-secondary"
              style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600 }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "9px 22px",
                borderRadius: "10px",
                backgroundColor: "#FFB000",
                color: "#0F172A",
                fontWeight: 700,
                fontSize: "13px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(255, 176, 0, 0.25)",
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{loading ? "Saving Changes..." : "Save Project"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
