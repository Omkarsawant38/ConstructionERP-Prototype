"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { Save, X, Building2, MapPin, Calendar, IndianRupee, Users } from "lucide-react";
import type { ProjectFormData } from "@/types";
import { createProject } from "@/lib/projectStore";
import { useAuth } from "@/contexts/AuthContext";
import { Select } from "@/components/ui/Select";
import { RouteGuard } from "@/components/ui/RouteGuard";

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

const initialStatusOptions = [
  { value: "planning", label: "Planning", color: "#3B82F6" },
  { value: "active", label: "Active", color: "#16A34A" },
  { value: "on-hold", label: "On Hold", color: "#F59E0B" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    project_code: "",
    description: "",
    client_name: "",
    project_type: "Residential",
    construction_category: "High-Rise",
    site_address: "",
    city: "",
    state: "Maharashtra",
    postal_code: "",
    start_date: "",
    end_date: "",
    actual_end_date: "",
    approved_budget: 0,
    currency: "INR",
    financial_notes: "",
    project_manager_name: "",
    status: "planning",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'approved_budget' ? Number(value) : value 
    }));
    // Clear error when user types
    if (errors[name as keyof ProjectFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Project Name is required";
    if (!formData.project_code.trim()) newErrors.project_code = "Project Code is required";
    if (!formData.start_date) newErrors.start_date = "Start Date is required";
    if (!formData.end_date) newErrors.end_date = "End Date is required";
    if (formData.approved_budget <= 0) newErrors.approved_budget = "Budget must be greater than 0";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast("error", "Validation Error", "Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    
    try {
      const created = await createProject(formData, user?.id);
      addToast("success", "Project Created", `Project "${created.name}" (${created.project_code}) has been successfully created.`);
      router.push("/projects");
    } catch (error) {
      console.error("Error creating project:", error);
      addToast("error", "Error", "Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RouteGuard permission="projects.create">
      <div className="max-w-[1000px] mx-auto relative flex flex-col gap-6" style={{ gap: "24px", paddingBottom: "48px" }}>
      <div>
        <PageHeader 
          title="Create New Project" 
          description="Set up a new construction project and allocate budget."
          actions={
            <div className="flex items-center" style={{ gap: "12px" }}>
              <button 
                type="button" 
                onClick={() => router.back()}
                className="btn btn-secondary cursor-pointer"
                style={{ 
                  padding: "0 18px", 
                  height: "40px", 
                  borderRadius: "10px", 
                  fontWeight: 500,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#475569"
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="project-form"
                className="btn btn-primary cursor-pointer"
                style={{ 
                  padding: "0 22px", 
                  height: "40px", 
                  borderRadius: "10px", 
                  fontWeight: 600,
                  backgroundColor: "#FFB000",
                  color: "#172033",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                disabled={loading}
              >
                <Save size={16} />
                Create Project
              </button>
            </div>
          }
        />
      </div>

      <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-6 relative" style={{ gap: "24px" }}>
        {/* Basic Information */}
        <div className="premium-card" style={{ padding: "32px" }}>
          <div className="flex items-center border-b border-gray-100" style={{ gap: "12px", marginBottom: "24px", paddingBottom: "16px" }}>
            <div className="bg-amber-50 rounded-lg flex items-center justify-center" style={{ padding: "8px", width: "36px", height: "36px" }}>
              <Building2 className="text-amber-500" size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12" style={{ gap: "24px" }}>
            <div className="col-span-1 md:col-span-12">
              <label className="form-label" htmlFor="name">Project Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`form-input h-11 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="e.g. Green Valley Residency"
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="col-span-1 md:col-span-6">
              <label className="form-label" htmlFor="project_code">Project Code *</label>
              <input
                id="project_code"
                name="project_code"
                type="text"
                value={formData.project_code}
                onChange={handleChange}
                className={`form-input h-11 ${errors.project_code ? 'border-red-500' : ''}`}
                placeholder="e.g. PRJ-001"
              />
              {errors.project_code && <p className="form-error">{errors.project_code}</p>}
            </div>

            <div className="col-span-1 md:col-span-6">
              <label className="form-label" htmlFor="client_name">Client Name</label>
              <input
                id="client_name"
                name="client_name"
                type="text"
                value={formData.client_name}
                onChange={handleChange}
                className="form-input h-11"
                placeholder="e.g. ABC Developers"
              />
            </div>

            <div className="col-span-1 md:col-span-12">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input min-h-[120px] resize-y"
                placeholder="Brief description of the project scope and objectives..."
              />
            </div>

            <div className="col-span-1 md:col-span-6">
              <label className="form-label" htmlFor="project_type">Project Type</label>
              <Select
                id="project_type"
                name="project_type"
                size="lg"
                options={projectTypeOptions}
                value={formData.project_type}
                onChange={(val) => setFormData((prev) => ({ ...prev, project_type: val }))}
              />
            </div>

            <div className="col-span-1 md:col-span-6">
              <label className="form-label" htmlFor="construction_category">Construction Category</label>
              <Select
                id="construction_category"
                name="construction_category"
                size="lg"
                options={categoryOptions}
                value={formData.construction_category}
                onChange={(val) => setFormData((prev) => ({ ...prev, construction_category: val }))}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="premium-card" style={{ padding: "32px" }}>
          <div className="flex items-center border-b border-gray-100" style={{ gap: "12px", marginBottom: "24px", paddingBottom: "16px" }}>
            <div className="bg-amber-50 rounded-lg flex items-center justify-center" style={{ padding: "8px", width: "36px", height: "36px" }}>
              <MapPin className="text-amber-500" size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Location Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12" style={{ gap: "24px" }}>
            <div className="col-span-1 md:col-span-12">
              <label className="form-label" htmlFor="site_address">Site Address</label>
              <input
                id="site_address"
                name="site_address"
                type="text"
                value={formData.site_address}
                onChange={handleChange}
                className="form-input h-11"
                placeholder="e.g. Survey No. 45, Baner Road"
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <label className="form-label" htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className="form-input h-11"
                placeholder="e.g. Pune"
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <label className="form-label" htmlFor="state">State</label>
              <input
                id="state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
                className="form-input h-11"
              />
            </div>

            <div className="col-span-1 md:col-span-4">
              <label className="form-label" htmlFor="postal_code">PIN Code</label>
              <input
                id="postal_code"
                name="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={handleChange}
                className="form-input h-11"
              />
            </div>
          </div>
        </div>

        {/* Schedule & Financials */}
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "32px" }}>
          {/* Schedule Card */}
          <div className="premium-card" style={{ padding: "32px" }}>
            <div className="flex items-center border-b border-gray-100" style={{ gap: "12px", marginBottom: "24px", paddingBottom: "16px" }}>
              <div className="bg-amber-50 rounded-lg flex items-center justify-center" style={{ padding: "8px", width: "36px", height: "36px" }}>
                <Calendar className="text-amber-500" size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Timeline</h2>
            </div>
            
            <div className="flex flex-col" style={{ gap: "20px" }}>
              <div>
                <label className="form-label" htmlFor="start_date">Start Date *</label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={`form-input h-11 ${errors.start_date ? 'border-red-500' : ''}`}
                />
                {errors.start_date && <p className="form-error">{errors.start_date}</p>}
              </div>

              <div>
                <label className="form-label" htmlFor="end_date">Planned End Date *</label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className={`form-input h-11 ${errors.end_date ? 'border-red-500' : ''}`}
                />
                {errors.end_date && <p className="form-error">{errors.end_date}</p>}
              </div>
              
              <div>
                <label className="form-label" htmlFor="status">Initial Status</label>
                <Select
                  id="status"
                  name="status"
                  size="lg"
                  options={initialStatusOptions}
                  value={formData.status}
                  onChange={(val) => setFormData((prev) => ({ ...prev, status: val as ProjectFormData["status"] }))}
                />
              </div>
            </div>
          </div>

          {/* Financials Card */}
          <div className="premium-card" style={{ padding: "32px" }}>
            <div className="flex items-center border-b border-gray-100" style={{ gap: "12px", marginBottom: "24px", paddingBottom: "16px" }}>
              <div className="bg-amber-50 rounded-lg flex items-center justify-center" style={{ padding: "8px", width: "36px", height: "36px" }}>
                <IndianRupee className="text-amber-500" size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Financial Setup</h2>
            </div>
            
            <div className="flex flex-col" style={{ gap: "20px" }}>
              <div>
                <label className="form-label" htmlFor="approved_budget">Approved Budget *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    id="approved_budget"
                    name="approved_budget"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.approved_budget || ""}
                    onChange={handleChange}
                    className={`form-input h-11 ${errors.approved_budget ? 'border-red-500' : ''}`}
                    style={{ paddingLeft: "32px" }}
                    placeholder="0.00"
                  />
                </div>
                {errors.approved_budget && <p className="form-error">{errors.approved_budget}</p>}
              </div>

              <div>
                <label className="form-label" htmlFor="project_manager_name">Project Manager</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    id="project_manager_name"
                    name="project_manager_name"
                    type="text"
                    value={formData.project_manager_name}
                    onChange={handleChange}
                    className="form-input h-11"
                    style={{ paddingLeft: "36px" }}
                    placeholder="Assign a manager"
                  />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="financial_notes">Financial Notes</label>
                <textarea
                  id="financial_notes"
                  name="financial_notes"
                  value={formData.financial_notes}
                  onChange={handleChange}
                  className="form-input min-h-[90px] resize-y"
                  placeholder="Budget remarks or funding sources..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions (In-flow so they never obscure form inputs) */}
        <div 
          className="flex items-center justify-end"
          style={{ 
            gap: "16px", 
            paddingTop: "16px", 
            paddingBottom: "32px",
            marginTop: "8px"
          }}
        >
          <button 
            type="button" 
            onClick={() => router.back()}
            className="btn btn-secondary cursor-pointer"
            style={{ 
              padding: "0 24px", 
              height: "44px", 
              borderRadius: "10px", 
              fontWeight: 500,
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              color: "#475569"
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary cursor-pointer"
            style={{ 
              padding: "0 28px", 
              height: "44px", 
              borderRadius: "10px", 
              fontWeight: 600,
              backgroundColor: "#FFB000",
              color: "#172033",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 2px 8px rgba(255, 176, 0, 0.25)"
            }}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="w-4 h-4 border-2 border-slate-800/30 border-t-slate-800 rounded-full animate-spin" />
                <span>Creating...</span>
              </div>
            ) : (
              <>
                <Save size={18} />
                <span>Create Project</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
    </RouteGuard>
  );
}
