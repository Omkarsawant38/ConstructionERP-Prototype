"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, 
  UserCheck, 
  HardHat, 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  User as UserIcon,
  RotateCcw
} from "lucide-react";
import type { Project, ProjectTeamMember, TeamMemberFormData, TeamMemberRole, TeamDepartment } from "@/types";
import { Select } from "@/components/ui/Select";
import { formatDateShort } from "@/lib/utils";
import { useProjectTeamMembers } from "@/lib/teamStore";

interface ProjectTeamTabProps {
  project: Project;
}

const ROLE_OPTIONS: { value: TeamMemberRole; label: string; color: string }[] = [
  { value: "Project Manager", label: "Project Manager", color: "#3B82F6" },
  { value: "Site Engineer", label: "Site Engineer", color: "#F59E0B" },
  { value: "Civil Engineer", label: "Civil Engineer", color: "#EC4899" },
  { value: "Safety Officer", label: "Safety Officer", color: "#EF4444" },
  { value: "Supervisor", label: "Supervisor", color: "#F97316" },
  { value: "Accountant", label: "Accountant", color: "#10B981" },
  { value: "Procurement Manager", label: "Procurement Manager", color: "#8B5CF6" },
  { value: "Store / Inventory Manager", label: "Store / Inventory Manager", color: "#06B6D4" },
];

const DEPARTMENT_OPTIONS: { value: TeamDepartment; label: string }[] = [
  { value: "Project Management", label: "Project Management" },
  { value: "Site Operations", label: "Site Operations" },
  { value: "Finance & Accounts", label: "Finance & Accounts" },
  { value: "Procurement & Supply", label: "Procurement & Supply" },
  { value: "Inventory & Store", label: "Inventory & Store" },
  { value: "Quality & Safety", label: "Quality & Safety" },
  { value: "Engineering & Design", label: "Engineering & Design" },
];

const ROLE_BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Project Manager": { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  "Site Engineer": { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  "Civil Engineer": { bg: "#FDF2F8", text: "#BE185D", border: "#FBCFE8" },
  "Safety Officer": { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  "Supervisor": { bg: "#FFF7ED", text: "#C2410C", border: "#FFEDD5" },
  "Accountant": { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
  "Procurement Manager": { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  "Store / Inventory Manager": { bg: "#ECFEFF", text: "#0E7490", border: "#A5F3FC" },
};

/**
 * Generate 6-8 fictional sample members per project, ensuring isolation by project ID
 */
function getInitialSampleMembers(project: Project): ProjectTeamMember[] {
  const pmName = project.project_manager_name && project.project_manager_name !== "Unassigned" 
    ? project.project_manager_name 
    : "Omkar Sawant";

  return [
    {
      id: `sample-${project.id}-1`,
      project_id: project.id,
      full_name: pmName,
      email: `${pmName.toLowerCase().replace(/\s+/g, ".")}@triples.com`,
      phone: "+91 98201 11223",
      designation: "Senior Project Manager",
      role: "Project Manager",
      department: "Project Management",
      assignment_date: project.start_date || "2024-01-15",
      status: "active",
      notes: "Direct lead in charge of schedule, site milestone sign-offs, and client delivery.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-2`,
      project_id: project.id,
      full_name: "Priya Sharma",
      email: "priya.sharma@triples.com",
      phone: "+91 98202 22334",
      designation: "Lead Site Engineer",
      role: "Site Engineer",
      department: "Site Operations",
      assignment_date: "2024-02-01",
      status: "active",
      notes: "Supervises civil structural alignment, daily contractor inspections, and safety checks.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-3`,
      project_id: project.id,
      full_name: "Suresh Patil",
      email: "suresh.patil@triples.com",
      phone: "+91 98203 33445",
      designation: "Senior Structural & Civil Engineer",
      role: "Civil Engineer",
      department: "Engineering & Design",
      assignment_date: "2024-02-15",
      status: "active",
      notes: "Verifies bar bending schedules (BBS), concrete grade cube tests, and soil compaction.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-4`,
      project_id: project.id,
      full_name: "Rahul Mehta",
      email: "rahul.mehta@triples.com",
      phone: "+91 98204 44556",
      designation: "Senior Finance Controller",
      role: "Accountant",
      department: "Finance & Accounts",
      assignment_date: "2024-01-20",
      status: "active",
      notes: "Manages contractor RA bills, vendor disbursements, GST invoicing, and petty cash.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-5`,
      project_id: project.id,
      full_name: "Vikram Singh",
      email: "vikram.singh@triples.com",
      phone: "+91 98205 55667",
      designation: "Head of Materials Procurement",
      role: "Procurement Manager",
      department: "Procurement & Supply",
      assignment_date: "2024-02-10",
      status: "active",
      notes: "Leads bulk negotiations for cement, TMT rebars, ready-mix concrete, and equipment rentals.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-6`,
      project_id: project.id,
      full_name: "Ganesh Kadam",
      email: "ganesh.kadam@triples.com",
      phone: "+91 98206 66778",
      designation: "Site Inventory & Yard Manager",
      role: "Store / Inventory Manager",
      department: "Inventory & Store",
      assignment_date: "2024-02-18",
      status: "active",
      notes: "Controls Goods Receipt Notes (GRN), store dispatch chits, and steel inventory ledger.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-7`,
      project_id: project.id,
      full_name: "Nitin Joshi",
      email: "nitin.joshi@triples.com",
      phone: "+91 98207 77889",
      designation: "EHS Officer",
      role: "Safety Officer",
      department: "Quality & Safety",
      assignment_date: "2024-03-01",
      status: "active",
      notes: "Conducts daily morning toolbox talks, scaffolding safety audits, and PPE enforcement.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-8`,
      project_id: project.id,
      full_name: "Rajesh Kumar",
      email: "rajesh.kumar@triples.com",
      phone: "+91 98208 88990",
      designation: "Site Execution Supervisor",
      role: "Supervisor",
      department: "Site Operations",
      assignment_date: "2024-03-10",
      status: "active",
      notes: "Coordinates daily workforce attendance, equipment operators, and sub-tier mason gangs.",
      is_sample: true,
    },
  ];
}

export default function ProjectTeamTab({ project }: ProjectTeamTabProps) {
  // Database-backed team members state
  const {
    members,
    loading,
    isDatabaseSynced,
    addMember,
    updateMember,
    removeMember,
  } = useProjectTeamMembers(project);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectTeamMember | null>(null);
  const [viewingMember, setViewingMember] = useState<ProjectTeamMember | null>(null);
  const [removingMember, setRemovingMember] = useState<ProjectTeamMember | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "info"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPI calculations
  const totalCount = members.length;
  const pmCount = members.filter(m => m.role === "Project Manager").length;
  const siteTeamCount = members.filter(m => 
    ["Site Engineer", "Civil Engineer", "Safety Officer", "Supervisor"].includes(m.role)
  ).length;
  const otherCount = totalCount - pmCount - siteTeamCount;

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return members.filter((member) => {
      const matchesSearch =
        !q ||
        member.full_name.toLowerCase().includes(q) ||
        (member.email && member.email.toLowerCase().includes(q)) ||
        (member.phone && member.phone.includes(q)) ||
        member.designation.toLowerCase().includes(q);

      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      const matchesDept = departmentFilter === "all" || member.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || member.status === statusFilter;

      return matchesSearch && matchesRole && matchesDept && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, departmentFilter, statusFilter]);

  const hasActiveFilters = searchQuery !== "" || roleFilter !== "all" || departmentFilter !== "all" || statusFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingMember(null);
    setIsFormModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (member: ProjectTeamMember) => {
    setEditingMember(member);
    setIsFormModalOpen(true);
  };

  // Save (Add or Edit) member to database
  const handleSaveMember = async (formData: TeamMemberFormData) => {
    try {
      if (editingMember) {
        await updateMember(editingMember.id, formData);
        showToast(`Updated details for "${formData.full_name}" in database`);
      } else {
        await addMember(formData);
        showToast(`Saved "${formData.full_name}" to database`);
      }
    } catch (err) {
      console.error("Error saving team member:", err);
      showToast("Error saving team member", "info");
    } finally {
      setIsFormModalOpen(false);
      setEditingMember(null);
    }
  };

  // Confirm Remove from database
  const handleConfirmRemove = async () => {
    if (!removingMember) return;
    try {
      await removeMember(removingMember.id);
      showToast(`Removed "${removingMember.full_name}" from database`, "info");
    } catch (err) {
      console.error("Error removing member:", err);
      showToast("Error removing member", "info");
    } finally {
      setRemovingMember(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: toastMessage.type === "success" ? "#ECFDF5" : "#EFF6FF",
            color: toastMessage.type === "success" ? "#065F46" : "#1E40AF",
            border: `1px solid ${toastMessage.type === "success" ? "#A7F3D0" : "#BFDBFE"}`,
            boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
          }}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={16} /> : <Info size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 4 Team KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Total Team Members */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "18px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Members
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {totalCount}
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
              Assigned to this project
            </div>
          </div>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#FFF9EB",
              border: "1px solid #FFE4A0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#D97706",
            }}
          >
            <Users size={22} />
          </div>
        </div>

        {/* Project Managers */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "18px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Project Managers
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {pmCount}
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
              Lead execution managers
            </div>
          </div>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1D4ED8",
            }}
          >
            <UserCheck size={22} />
          </div>
        </div>

        {/* Site Team Members */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "18px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Site Team Members
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {siteTeamCount}
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
              Engineers & supervisors
            </div>
          </div>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#FFF7ED",
              border: "1px solid #FFEDD5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#C2410C",
            }}
          >
            <HardHat size={22} />
          </div>
        </div>

        {/* Other Team Members */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "18px 22px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Other Support Leads
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {otherCount}
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
              Finance, store & supply
            </div>
          </div>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#F5F3FF",
              border: "1px solid #DDD6FE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6D28D9",
            }}
          >
            <Briefcase size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Add Member Button */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px", flex: 1 }}>
          {/* Search Input */}
          <div style={{ position: "relative", minWidth: "240px", flex: 1, maxWidth: "300px" }}>
            <Search
              size={15}
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
              placeholder="Search by name, email, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: "38px",
                paddingLeft: "36px",
                paddingRight: searchQuery ? "32px" : "12px",
                borderRadius: "10px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#F8FAFC",
                fontSize: "13px",
                color: "#0F172A",
                outline: "none",
                transition: "all 0.15s ease",
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
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <Select
            width="170px"
            placeholder="All Roles"
            options={[
              { value: "all", label: "All Roles" },
              ...ROLE_OPTIONS.map(r => ({ value: r.value, label: r.label, color: r.color }))
            ]}
            value={roleFilter}
            onChange={setRoleFilter}
          />

          {/* Department Filter */}
          <Select
            width="180px"
            placeholder="All Departments"
            options={[
              { value: "all", label: "All Departments" },
              ...DEPARTMENT_OPTIONS.map(d => ({ value: d.value, label: d.label }))
            ]}
            value={departmentFilter}
            onChange={setDepartmentFilter}
          />

          {/* Status Filter */}
          <Select
            width="135px"
            placeholder="All Status"
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active", color: "#10B981" },
              { value: "inactive", label: "Inactive", color: "#94A3B8" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          {/* Clear Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#F8FAFC",
                color: "#64748B",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Reset all search filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Add Member CTA */}
        <button
          type="button"
          onClick={handleOpenAdd}
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
          <span>Add Member</span>
        </button>
      </div>

      {/* Team Members List Table */}
      <div
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
                <th style={{ padding: "14px 20px" }}>Team Member</th>
                <th style={{ padding: "14px 16px" }}>Role & Designation</th>
                <th style={{ padding: "14px 16px" }}>Department</th>
                <th style={{ padding: "14px 16px" }}>Contact</th>
                <th style={{ padding: "14px 16px" }}>Assigned</th>
                <th style={{ padding: "14px 16px" }}>Status</th>
                <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const badgeStyle = ROLE_BADGE_STYLES[member.role] || {
                    bg: "#F1F5F9",
                    text: "#475569",
                    border: "#E2E8F0",
                  };

                  return (
                    <tr
                      key={member.id}
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
                      {/* Name & Avatar */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "10px",
                              backgroundColor: "#FFF9EB",
                              border: "1px solid #FFE4A0",
                              color: "#D97706",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            {member.full_name ? member.full_name.charAt(0).toUpperCase() : <UserIcon size={16} />}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontWeight: 600, fontSize: "14px", color: "#0F172A" }}>
                                {member.full_name}
                              </span>
                              {!member.is_sample && (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    backgroundColor: "#DCFCE7",
                                    color: "#15803D",
                                    border: "1px solid #BBF7D0",
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  Manual
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                              {member.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: badgeStyle.bg,
                            color: badgeStyle.text,
                            border: `1px solid ${badgeStyle.border}`,
                          }}
                        >
                          {member.role}
                        </span>
                      </td>

                      {/* Department */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "13px", color: "#334155", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                          <Building2 size={13} style={{ color: "#94A3B8" }} />
                          <span>{member.department}</span>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontSize: "12px", color: "#64748B", display: "flex", flexDirection: "column", gap: "2px" }}>
                          {member.email && (
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <Mail size={12} style={{ color: "#94A3B8" }} />
                              <span>{member.email}</span>
                            </div>
                          )}
                          {member.phone && (
                            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <Phone size={12} style={{ color: "#94A3B8" }} />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {!member.email && !member.phone && (
                            <span style={{ color: "#94A3B8" }}>No contact provided</span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Date */}
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748B", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Calendar size={12} style={{ color: "#94A3B8" }} />
                          <span>{formatDateShort(member.assignment_date)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: "12px",
                            backgroundColor: member.status === "active" ? "#ECFDF5" : "#F1F5F9",
                            color: member.status === "active" ? "#047857" : "#64748B",
                            border: `1px solid ${member.status === "active" ? "#A7F3D0" : "#E2E8F0"}`,
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: member.status === "active" ? "#10B981" : "#94A3B8",
                            }}
                          />
                          <span>{member.status === "active" ? "Active" : "Inactive"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => setViewingMember(member)}
                            title="View Member Profile"
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid #E2E8F0",
                              backgroundColor: "#FFFFFF",
                              color: "#475569",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#F8FAFC";
                              e.currentTarget.style.color = "#0F172A";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#FFFFFF";
                              e.currentTarget.style.color = "#475569";
                            }}
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(member)}
                            title="Edit Assignment"
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid #E2E8F0",
                              backgroundColor: "#FFFFFF",
                              color: "#0284C7",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#F0F9FF";
                              e.currentTarget.style.borderColor = "#BAE6FD";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#FFFFFF";
                              e.currentTarget.style.borderColor = "#E2E8F0";
                            }}
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setRemovingMember(member)}
                            title="Remove from Project"
                            style={{
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid #E2E8F0",
                              backgroundColor: "#FFFFFF",
                              color: "#DC2626",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#FEF2F2";
                              e.currentTarget.style.borderColor = "#FECACA";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#FFFFFF";
                              e.currentTarget.style.borderColor = "#E2E8F0";
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                      <Users size={28} />
                    </div>
                    <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: "0 0 6px 0" }}>
                      {hasActiveFilters ? "No team members match your filters" : "No team members found"}
                    </h4>
                    <p style={{ fontSize: "13px", color: "#64748B", margin: "0 0 20px 0", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
                      {hasActiveFilters
                        ? "Try resetting your search query or selecting different role and department filters."
                        : "Assign project managers, site engineers, and operational staff to coordinate site activities."}
                    </p>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        style={{
                          padding: "8px 18px",
                          borderRadius: "10px",
                          backgroundColor: "#F1F5F9",
                          color: "#334155",
                          fontSize: "13px",
                          fontWeight: 600,
                          border: "1px solid #CBD5E1",
                          cursor: "pointer",
                        }}
                      >
                        Reset All Filters
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenAdd}
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
                        <span>Add First Member</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {isFormModalOpen && (
        <MemberFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingMember(null);
          }}
          onSave={handleSaveMember}
          initialData={editingMember}
          projectTitle={project.name}
        />
      )}

      {/* View Member Profile Modal */}
      {viewingMember && (
        <MemberViewModal
          member={viewingMember}
          project={project}
          onClose={() => setViewingMember(null)}
          onEdit={() => {
            const m = viewingMember;
            setViewingMember(null);
            handleOpenEdit(m);
          }}
        />
      )}

      {/* Remove Confirmation Dialog */}
      {removingMember && (
        <RemoveConfirmModal
          member={removingMember}
          projectName={project.name}
          onClose={() => setRemovingMember(null)}
          onConfirm={handleConfirmRemove}
        />
      )}
    </div>
  );
}

// ==============================================================================
// MODAL 1: Add & Edit Member Form Modal
// ==============================================================================

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TeamMemberFormData) => void;
  initialData: ProjectTeamMember | null;
  projectTitle: string;
}

function MemberFormModal({ isOpen, onClose, onSave, initialData, projectTitle }: MemberFormModalProps) {
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [designation, setDesignation] = useState(initialData?.designation || "");
  const [role, setRole] = useState<TeamMemberRole>(initialData?.role || "Site Engineer");
  const [department, setDepartment] = useState<TeamDepartment>(initialData?.department || "Site Operations");
  const [assignmentDate, setAssignmentDate] = useState(
    initialData?.assignment_date || new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<"active" | "inactive">(initialData?.status || "active");
  const [notes, setNotes] = useState(initialData?.notes || "");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isEdit = Boolean(initialData);

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!fullName.trim()) {
      errs.fullName = "Full name is required";
    }

    if (!designation.trim()) {
      errs.designation = "Job designation is required";
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = "Please enter a valid email address (e.g. name@company.com)";
      }
    }

    if (phone.trim()) {
      // Basic phone check (at least 8 chars digits/symbols)
      const phoneDigits = phone.replace(/[^\d]/g, "");
      if (phoneDigits.length < 8) {
        errs.phone = "Please enter a valid phone number with at least 8 digits";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      full_name: fullName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      designation: designation.trim(),
      role,
      department,
      assignment_date: assignmentDate,
      status,
      notes: notes.trim() || undefined,
    });
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
        if (e.target === e.currentTarget) onClose();
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
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
              {isEdit ? "Edit Team Member" : "Add Team Member"}
            </h2>
            <p style={{ fontSize: "12px", color: "#64748B", margin: "4px 0 0 0" }}>
              {isEdit ? `Update role and department details for ${initialData?.full_name}` : `Assign an operational resource to ${projectTitle}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
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
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflowY: "auto", flex: 1 }}>
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Full Name */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Full Name <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Ramesh Deshmukh, Arvind Verma"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors(prev => ({ ...prev, fullName: "" }));
                }}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 14px",
                  borderRadius: "10px",
                  border: errors.fullName ? "1px solid #DC2626" : "1px solid #CBD5E1",
                  fontSize: "14px",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
              {errors.fullName && <div style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px" }}>{errors.fullName}</div>}
            </div>

            {/* Designation & Team Role */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Designation <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Site Engineer"
                  value={designation}
                  onChange={(e) => {
                    setDesignation(e.target.value);
                    if (errors.designation) setErrors(prev => ({ ...prev, designation: "" }));
                  }}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: errors.designation ? "1px solid #DC2626" : "1px solid #CBD5E1",
                    fontSize: "13px",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
                {errors.designation && <div style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px" }}>{errors.designation}</div>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Team Role <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <Select
                  options={ROLE_OPTIONS}
                  value={role}
                  onChange={(val) => setRole(val as TeamMemberRole)}
                  width="100%"
                />
              </div>
            </div>

            {/* Department & Assignment Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Department
                </label>
                <Select
                  options={DEPARTMENT_OPTIONS}
                  value={department}
                  onChange={(val) => setDepartment(val as TeamDepartment)}
                  width="100%"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Assignment Date
                </label>
                <input
                  type="date"
                  value={assignmentDate}
                  onChange={(e) => setAssignmentDate(e.target.value)}
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

            {/* Email & Phone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. member@triples.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                  }}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: errors.email ? "1px solid #DC2626" : "1px solid #CBD5E1",
                    fontSize: "13px",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
                {errors.email && <div style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px" }}>{errors.email}</div>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 98200 12345"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                  }}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: errors.phone ? "1px solid #DC2626" : "1px solid #CBD5E1",
                    fontSize: "13px",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
                {errors.phone && <div style={{ fontSize: "11px", color: "#DC2626", marginTop: "4px" }}>{errors.phone}</div>}
              </div>
            </div>

            {/* Status (Active / Inactive) */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Assignment Status
              </label>
              <div style={{ display: "flex", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="member-status"
                    checked={status === "active"}
                    onChange={() => setStatus("active")}
                    style={{ accentColor: "#FFB000" }}
                  />
                  <span style={{ fontWeight: 600, color: "#047857" }}>Active on Site</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="member-status"
                    checked={status === "inactive"}
                    onChange={() => setStatus("inactive")}
                    style={{ accentColor: "#FFB000" }}
                  />
                  <span style={{ fontWeight: 600, color: "#64748B" }}>Inactive / Relieved</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Notes / Scope of Duties
              </label>
              <textarea
                rows={2}
                placeholder="Specific site responsibilities, shifts, or certifications..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  fontSize: "13px",
                  color: "#0F172A",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
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
              style={{
                padding: "9px 18px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 600,
                color: "#64748B",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                padding: "9px 22px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#FFB000",
                fontSize: "13px",
                fontWeight: 700,
                color: "#0F172A",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(255, 176, 0, 0.25)",
              }}
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{isEdit ? "Update Member" : "Save Member"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==============================================================================
// MODAL 2: View Member Details Modal
// ==============================================================================

interface MemberViewModalProps {
  member: ProjectTeamMember;
  project: Project;
  onClose: () => void;
  onEdit: () => void;
}

function MemberViewModal({ member, project, onClose, onEdit }: MemberViewModalProps) {
  const badgeStyle = ROLE_BADGE_STYLES[member.role] || {
    bg: "#F1F5F9",
    text: "#475569",
    border: "#E2E8F0",
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "480px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#D97706", textTransform: "uppercase" }}>
            Team Member Profile
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              color: "#94A3B8",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                backgroundColor: "#FFF9EB",
                border: "1px solid #FFE4A0",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 800,
              }}
            >
              {member.full_name ? member.full_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                {member.full_name}
              </h3>
              <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                {member.designation}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "6px",
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.text,
                border: `1px solid ${badgeStyle.border}`,
              }}
            >
              {member.role}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "6px",
                backgroundColor: member.status === "active" ? "#ECFDF5" : "#F1F5F9",
                color: member.status === "active" ? "#047857" : "#64748B",
                border: `1px solid ${member.status === "active" ? "#A7F3D0" : "#E2E8F0"}`,
              }}
            >
              {member.status === "active" ? "Active on Site" : "Inactive"}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: "6px",
                backgroundColor: "#F8FAFC",
                color: "#475569",
                border: "1px solid #E2E8F0",
              }}
            >
              {member.is_sample ? "Demo Seed Entry" : "Manual User Entry"}
            </span>
          </div>

          <div
            style={{
              backgroundColor: "#F8FAFC",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Project:</span>
              <strong style={{ color: "#0F172A" }}>{project.name} ({project.project_code})</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Department:</span>
              <strong style={{ color: "#0F172A" }}>{member.department}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Assignment Date:</span>
              <strong style={{ color: "#0F172A" }}>{formatDateShort(member.assignment_date)}</strong>
            </div>
            {member.email && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Email:</span>
                <span style={{ color: "#0284C7" }}>{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Phone:</span>
                <span style={{ color: "#0F172A" }}>{member.phone}</span>
              </div>
            )}
          </div>

          {member.notes && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "4px" }}>
                Operational Notes
              </div>
              <p style={{ fontSize: "13px", color: "#334155", margin: 0, lineHeight: "1.4", backgroundColor: "#FFFBEB", padding: "10px 12px", borderRadius: "8px", border: "1px solid #FDE68A" }}>
                {member.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #F1F5F9",
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#FFB000",
              fontSize: "13px",
              fontWeight: 700,
              color: "#0F172A",
              cursor: "pointer",
            }}
          >
            Edit Member
          </button>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// MODAL 3: Remove Member Confirmation Dialog
// ==============================================================================

interface RemoveConfirmModalProps {
  member: ProjectTeamMember;
  projectName: string;
  onClose: () => void;
  onConfirm: () => void;
}

function RemoveConfirmModal({ member, projectName, onClose, onConfirm }: RemoveConfirmModalProps) {
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "440px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#FEE2E2",
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertCircle size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
              Remove Team Member?
            </h3>
            <p style={{ fontSize: "13px", color: "#64748B", margin: "6px 0 0 0", lineHeight: "1.4" }}>
              Are you sure you want to remove <strong style={{ color: "#0F172A" }}>{member.full_name}</strong> from{" "}
              <strong>{projectName}</strong>? This action updates the local project team list immediately.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#DC2626",
              fontSize: "13px",
              fontWeight: 700,
              color: "#FFFFFF",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)",
            }}
          >
            Remove from Project
          </button>
        </div>
      </div>
    </div>
  );
}
