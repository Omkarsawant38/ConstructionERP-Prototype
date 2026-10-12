"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Shield, 
  Users, 
  UserCheck, 
  Check, 
  AlertCircle, 
  Search, 
  RefreshCw,
  Mail,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Phone,
  Briefcase,
  User as UserIcon,
  X
} from "lucide-react";
import { ROLE_DISPLAY_NAMES, RoleName, VALID_ROLES } from "@/types/rbac";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string;
  phone?: string;
  designation?: string;
  created_at: string;
  assigned_roles: {
    id: string;
    name: RoleName;
    display_name: string;
  }[];
}

const ROLE_BADGE_PALETTES: Record<string, { bg: string; text: string; border: string }> = {
  super_admin: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  owner_director: { bg: "#EEF2FF", text: "#3730A3", border: "#E0E7FF" },
  project_manager: { bg: "#E0F2FE", text: "#0369A1", border: "#BAE6FD" },
  accountant: { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" },
  site_engineer: { bg: "#FFEDD5", text: "#C2410C", border: "#FED7AA" },
  procurement_manager: { bg: "#F3E8FF", text: "#6B21A8", border: "#E9D5FF" },
  store_inventory_manager: { bg: "#CCFBF1", text: "#0F766E", border: "#99F6E4" },
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: "Full administrative access, user permissions, and ERP settings.",
  owner_director: "Executive dashboards, financial balance, high-level reports.",
  project_manager: "Project tracking, task allocation, workforce, and updates.",
  accountant: "Billing, invoices, vouchers, payments, and financial ledgers.",
  site_engineer: "Daily site work logs, material consumption, and field requisitions.",
  procurement_manager: "Purchase orders, vendor bids, rate comparisons, and RFQs.",
  store_inventory_manager: "Material stock, warehouse intake (GRN), and site dispatches.",
};

export default function UserManagementPage() {
  const { roles: myRoles, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRoleNames, setSelectedRoleNames] = useState<RoleName[]>([]);
  const [isSaving, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      const list = data.users || [];
      setUsers(list);
      // Auto-select first user if none currently selected
      if (!selectedUser && list.length > 0) {
        handleSelectUser(list[0]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    const existingRoles = (user.assigned_roles || []).map((r) => r.name);
    if (existingRoles.length === 0 && VALID_ROLES.includes(user.role as RoleName)) {
      setSelectedRoleNames([user.role as RoleName]);
    } else {
      setSelectedRoleNames(existingRoles);
    }
    setStatusMessage(null);
  };

  const handleToggleRole = (role: RoleName) => {
    if (selectedRoleNames.includes(role)) {
      if (selectedRoleNames.length === 1) return; // Keep at least 1 role
      setSelectedRoleNames(selectedRoleNames.filter((r) => r !== role));
    } else {
      setSelectedRoleNames([...selectedRoleNames, role]);
    }
  };

  const handleSaveRoles = () => {
    if (!selectedUser) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/users/assign-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUserId: selectedUser.id,
            roleNames: selectedRoleNames,
          }),
        });
        const result = await res.json();
        if (!res.ok && !result.success) {
          throw new Error(result.error || "Failed to update roles");
        }

        // Instantly update user in state
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === selectedUser.id) {
              const updatedAssigned = selectedRoleNames.map((rn) => ({
                id: `role-${rn}`,
                name: rn,
                display_name: ROLE_DISPLAY_NAMES[rn] || rn,
              }));
              return {
                ...u,
                role: selectedRoleNames[0] || u.role,
                assigned_roles: updatedAssigned,
              };
            }
            return u;
          })
        );

        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                role: selectedRoleNames[0] || prev.role,
                assigned_roles: selectedRoleNames.map((rn) => ({
                  id: `role-${rn}`,
                  name: rn,
                  display_name: ROLE_DISPLAY_NAMES[rn] || rn,
                })),
              }
            : null
        );

        setStatusMessage({ type: "success", text: "Role assignments updated successfully!" });
        setTimeout(() => setStatusMessage(null), 3500);
      } catch (err: any) {
        setStatusMessage({ type: "error", text: err.message || "Failed to update roles" });
      }
    });
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.designation?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1440px", margin: "0 auto", width: "100%" }}>
      {/* Top Breadcrumb & Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link
          href="/settings"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#64748B",
            textDecoration: "none",
            padding: "6px 14px",
            borderRadius: "10px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#0F172A";
            e.currentTarget.style.borderColor = "#CBD5E1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#64748B";
            e.currentTarget.style.borderColor = "#E2E8F0";
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Settings</span>
        </Link>

        {statusMessage && (
          <div
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              backgroundColor: statusMessage.type === "success" ? "#ECFDF5" : "#FEF2F2",
              color: statusMessage.type === "success" ? "#065F46" : "#991B1B",
              border: `1px solid ${statusMessage.type === "success" ? "#A7F3D0" : "#FECACA"}`,
              animation: "fadeIn 0.2s ease",
            }}
          >
            {statusMessage.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Main Page Header */}
      <PageHeader
        title="User & Role Management"
        description="Configure role-based access permissions, team assignments, and module privileges."
        icon={<Shield size={24} />}
        action={
          <button
            onClick={fetchUsers}
            className="btn btn-secondary"
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* 2-Column Split: Clean Table on Left + Clean Drawer on Right */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left Column: Organization Team Members */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header & Search Bar */}
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#FFF9EB",
                  color: "#D97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  Organization Team Members
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      backgroundColor: "#F1F5F9",
                      color: "#475569",
                      padding: "2px 8px",
                      borderRadius: "12px",
                    }}
                  >
                    {filteredUsers.length}
                  </span>
                </h3>
              </div>
            </div>

            {/* Clean Rounded Search Bar */}
            <div style={{ position: "relative", minWidth: "260px" }}>
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
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: "36px",
                  paddingLeft: "36px",
                  paddingRight: searchQuery ? "32px" : "14px",
                  borderRadius: "20px",
                  border: "1px solid #E2E8F0",
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
                  e.currentTarget.style.borderColor = "#E2E8F0";
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
          </div>

          {/* Clean User Directory Table */}
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
                  <th style={{ padding: "12px 20px" }}>User</th>
                  <th style={{ padding: "12px 16px" }}>Department</th>
                  <th style={{ padding: "12px 16px" }}>Assigned Roles</th>
                  <th style={{ padding: "12px 20px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                      <RefreshCw size={20} className="animate-spin" style={{ margin: "0 auto 8px auto", color: "#FFB000" }} />
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>Loading team members...</div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "48px", textAlign: "center", color: "#94A3B8" }}>
                      <Users size={28} style={{ margin: "0 auto 8px auto", color: "#CBD5E1" }} />
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>No users found</div>
                      <div style={{ fontSize: "12px", marginTop: "2px" }}>No members match "{searchQuery}"</div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelected = selectedUser?.id === u.id;
                    const primaryBadgeStyle = ROLE_BADGE_PALETTES[u.role] || {
                      bg: "#F1F5F9",
                      text: "#475569",
                      border: "#E2E8F0",
                    };

                    return (
                      <tr
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        style={{
                          borderBottom: "1px solid #F1F5F9",
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#FFFDF5" : "transparent",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "#F8FAFC";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        {/* User Profile Column */}
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {/* Avatar */}
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "10px",
                                backgroundColor: isSelected ? "#FFB000" : "#F1F5F9",
                                color: isSelected ? "#FFFFFF" : "#1E293B",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "14px",
                                flexShrink: 0,
                                transition: "all 0.15s ease",
                              }}
                            >
                              {u.full_name ? u.full_name.charAt(0).toUpperCase() : <UserIcon size={16} />}
                            </div>

                            {/* Details */}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "13px", color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>{u.full_name || "Unnamed"}</span>
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748B", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                                <Mail size={12} style={{ color: "#94A3B8" }} />
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Designation Column */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 500, color: "#334155" }}>
                            {u.designation || "Enterprise Staff"}
                          </div>
                        </td>

                        {/* Assigned Roles Badges */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {(u.assigned_roles && u.assigned_roles.length > 0) ? (
                              u.assigned_roles.map((r) => {
                                const bStyle = ROLE_BADGE_PALETTES[r.name] || primaryBadgeStyle;
                                return (
                                  <span
                                    key={r.id || r.name}
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: 600,
                                      padding: "3px 8px",
                                      borderRadius: "6px",
                                      backgroundColor: bStyle.bg,
                                      color: bStyle.text,
                                      border: `1px solid ${bStyle.border}`,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {r.display_name || ROLE_DISPLAY_NAMES[r.name] || r.name}
                                  </span>
                                );
                              })
                            ) : (
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: primaryBadgeStyle.bg,
                                  color: primaryBadgeStyle.text,
                                  border: `1px solid ${primaryBadgeStyle.border}`,
                                }}
                              >
                                {ROLE_DISPLAY_NAMES[u.role as RoleName] || u.role}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action Column */}
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUser(u);
                            }}
                            style={{
                              padding: "5px 12px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              border: isSelected ? "1px solid #FFB000" : "1px solid #E2E8F0",
                              backgroundColor: isSelected ? "#FFB000" : "#FFFFFF",
                              color: isSelected ? "#0F172A" : "#475569",
                              transition: "all 0.15s ease",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>{isSelected ? "Selected" : "Edit Roles"}</span>
                            {isSelected ? <Check size={13} strokeWidth={2.5} /> : <ChevronRight size={13} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Clean Assign Roles Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
            padding: "24px",
            position: "sticky",
            top: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Card Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              paddingBottom: "16px",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#FFF9EB",
                color: "#D97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Assign Roles
              </h3>
              <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                Manage role access and permissions
              </p>
            </div>
          </div>

          {selectedUser ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Selected User Header Card */}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: "#FFB000",
                    color: "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {selectedUser.full_name ? selectedUser.full_name.charAt(0).toUpperCase() : "U"}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Selected User
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedUser.full_name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selectedUser.email}
                  </div>
                </div>
              </div>

              {/* Roles Selection (All roles visible, no ugly scrollbar cutting off top items) */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Assign System Roles ({selectedRoleNames.length})
                  </label>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>Multi-select</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {VALID_ROLES.map((roleKey) => {
                    const checked = selectedRoleNames.includes(roleKey);
                    return (
                      <div
                        key={roleKey}
                        onClick={() => handleToggleRole(roleKey)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: checked ? "1.5px solid #FFB000" : "1px solid #E2E8F0",
                          backgroundColor: checked ? "#FFFDF5" : "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {/* Custom Theme Checkbox */}
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "5px",
                            border: checked ? "2px solid #FFB000" : "2px solid #CBD5E1",
                            backgroundColor: checked ? "#FFB000" : "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: "2px",
                            flexShrink: 0,
                            transition: "all 0.15s ease",
                          }}
                        >
                          {checked && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                        </div>

                        {/* Title & Description */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                            {ROLE_DISPLAY_NAMES[roleKey]}
                          </div>
                          <p style={{ fontSize: "11px", color: "#64748B", margin: "2px 0 0 0", lineHeight: "1.3" }}>
                            {ROLE_DESCRIPTIONS[roleKey] || "Enterprise system module permissions."}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <div style={{ paddingTop: "4px" }}>
                <button
                  type="button"
                  onClick={handleSaveRoles}
                  disabled={isSaving}
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#FFB000",
                    color: "#0F172A",
                    fontWeight: 700,
                    fontSize: "13px",
                    border: "none",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 2px 6px rgba(255, 176, 0, 0.25)",
                    transition: "all 0.15s ease",
                    opacity: isSaving ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = "#E69E00";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = "#FFB000";
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving Assignments...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} strokeWidth={2.5} />
                      <span>Save Role Assignments</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 20px",
                textAlign: "center",
                color: "#94A3B8",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                  color: "#CBD5E1",
                }}
              >
                <UserIcon size={24} />
              </div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>
                Select a Team Member
              </div>
              <div style={{ fontSize: "12px", marginTop: "4px", maxWidth: "220px", lineHeight: 1.4 }}>
                Select any member from the directory on the left to configure their roles.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
