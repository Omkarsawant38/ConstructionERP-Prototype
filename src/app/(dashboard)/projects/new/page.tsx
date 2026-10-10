"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { Save, X, Building2, MapPin, Calendar, IndianRupee, Users } from "lucide-react";
import type { ProjectFormData } from "@/types";

export default function NewProjectPage() {
  const router = useRouter();
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
      // Simulate API call for now. In a real app, this would be a Supabase insert.
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addToast("success", "Project Created", `Project ${formData.project_code} has been successfully created.`);
      router.push("/projects");
    } catch (error) {
      addToast("error", "Error", "Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-24 relative flex flex-col gap-6" style={{ gap: "24px" }}>
      <div>
        <PageHeader 
          title="Create New Project" 
          description="Set up a new construction project and allocate budget."
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative" style={{ gap: "24px" }}>
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
              <select
                id="project_type"
                name="project_type"
                value={formData.project_type}
                onChange={handleChange}
                className="form-input h-11"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-6">
              <label className="form-label" htmlFor="construction_category">Construction Category</label>
              <select
                id="construction_category"
                name="construction_category"
                value={formData.construction_category}
                onChange={handleChange}
                className="form-input h-11"
              >
                <option value="High-Rise">High-Rise</option>
                <option value="Mid-Rise">Mid-Rise</option>
                <option value="Villas">Villas</option>
                <option value="Commercial Complex">Commercial Complex</option>
                <option value="Warehouse">Warehouse</option>
              </select>
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
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-input h-11 bg-blue-50/50"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                </select>
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

        {/* Sticky Form Actions */}
        <div 
          className="fixed bottom-0 left-0 right-0 lg:left-[var(--sidebar-width)] z-30 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-lg flex items-center justify-end transition-all duration-300"
          style={{ padding: "16px" }}
        >
          <div className="max-w-[1000px] w-full mx-auto flex items-center justify-end" style={{ gap: "16px" }}>
            <button 
              type="button" 
              onClick={() => router.back()}
              className="btn btn-secondary h-11 px-6 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary h-11 px-8 font-semibold shadow-md"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <>
                  <Save size={18} />
                  Create Project
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
