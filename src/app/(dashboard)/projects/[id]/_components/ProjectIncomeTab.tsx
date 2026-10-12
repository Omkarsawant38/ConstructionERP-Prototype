"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Plus, 
  Search, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Trash2, 
  FileCheck,
  AlertCircle,
  TrendingUp,
  Wallet,
  X
} from "lucide-react";
import type { Project, ProjectUnitIncome, UnitIncomeFormData, UnitPaymentStatus } from "@/types";
import { formatCurrencyFull, formatDateShort } from "@/lib/utils";
import { useProjectIncome } from "@/lib/incomeStore";
import AddUnitIncomeModal from "./AddUnitIncomeModal";
import RecordPaymentModal from "./RecordPaymentModal";

interface ProjectIncomeTabProps {
  project: Project;
}

export default function ProjectIncomeTab({ project }: ProjectIncomeTabProps) {
  const {
    units,
    loading,
    totalUnits,
    totalSalesValue,
    totalReceived,
    totalPending,
    collectionPercentage,
    fullyPaidCount,
    partiallyPaidCount,
    bookedCount,
    addUnit,
    recordPayment,
    deleteUnit,
  } = useProjectIncome(project);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUnitForPayment, setSelectedUnitForPayment] = useState<ProjectUnitIncome | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filtered units
  const filteredUnits = units.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      u.unit_number.toLowerCase().includes(query) ||
      u.owner_name.toLowerCase().includes(query) ||
      (u.owner_phone && u.owner_phone.includes(query)) ||
      (u.unit_type && u.unit_type.toLowerCase().includes(query)) ||
      (u.payment_milestone && u.payment_milestone.toLowerCase().includes(query));

    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: UnitPaymentStatus) => {
    switch (status) {
      case "full_paid":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#ECFDF5",
              color: "#047857",
              border: "1px solid #A7F3D0",
              whiteSpace: "nowrap",
            }}
          >
            <CheckCircle2 size={13} /> Fully Paid
          </span>
        );
      case "partially_paid":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#FFFBEB",
              color: "#B45309",
              border: "1px solid #FDE68A",
              whiteSpace: "nowrap",
            }}
          >
            <Clock size={13} /> Partially Paid
          </span>
        );
      case "booked":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#EFF6FF",
              color: "#1D4ED8",
              border: "1px solid #BFDBFE",
              whiteSpace: "nowrap",
            }}
          >
            <FileCheck size={13} /> Booked / Token
          </span>
        );
      case "cancelled":
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#FEF2F2",
              color: "#B91C1C",
              border: "1px solid #FECACA",
              whiteSpace: "nowrap",
            }}
          >
            <AlertCircle size={13} /> Cancelled
          </span>
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: 500,
            backgroundColor: "#ECFDF5",
            color: "#065F46",
            border: "1px solid #A7F3D0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Total Sales Value */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Sales Value
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {formatCurrencyFull(totalSalesValue)}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
              From {totalUnits} owned rooms/units
            </div>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#FFF9EB",
              border: "1px solid #FFE4A0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#D97706",
            }}
          >
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Income Received */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1, paddingRight: "12px" }}>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Income Received
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#16A34A", marginTop: "4px" }}>
              {formatCurrencyFull(totalReceived)}
            </div>
            <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ flex: 1, backgroundColor: "#E2E8F0", height: "6px", borderRadius: "9999px", overflow: "hidden" }}>
                <div
                  style={{
                    backgroundColor: "#16A34A",
                    height: "100%",
                    borderRadius: "9999px",
                    width: `${collectionPercentage}%`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#15803D" }}>{collectionPercentage}%</span>
            </div>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#ECFDF5",
              border: "1px solid #A7F3D0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#16A34A",
              flexShrink: 0,
            }}
          >
            <Wallet size={24} />
          </div>
        </div>

        {/* Pending Balance */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Pending Balance
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#D97706", marginTop: "4px" }}>
              {formatCurrencyFull(totalPending)}
            </div>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
              {totalSalesValue > 0 ? `${100 - collectionPercentage}% receivable balance` : "No active sales"}
            </div>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#FFFBEB",
              border: "1px solid #FDE68A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#B45309",
            }}
          >
            <Clock size={24} />
          </div>
        </div>

        {/* Units Ownership */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Units Ownership
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {totalUnits} Sold Units
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px", display: "flex", gap: "6px" }}>
              <span style={{ color: "#16A34A", fontWeight: 600 }}>{fullyPaidCount} Paid</span>
              <span>•</span>
              <span style={{ color: "#D97706", fontWeight: 600 }}>{partiallyPaidCount} In Progress</span>
              <span>•</span>
              <span style={{ color: "#2563EB", fontWeight: 600 }}>{bookedCount} Booked</span>
            </div>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563EB",
            }}
          >
            <Building2 size={24} />
          </div>
        </div>
      </div>

      {/* Action & Filter Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: 1 }}>
          {/* Search Input */}
          <div style={{ position: "relative", minWidth: "260px", maxWidth: "400px", flex: 1 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search room, owner name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                paddingLeft: "38px",
                paddingRight: searchQuery ? "34px" : "14px",
                borderRadius: "10px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#FFFFFF",
                fontSize: "13px",
                color: "#1E293B",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#FFB000";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#CBD5E1";
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: "40px",
              padding: "0 14px",
              borderRadius: "10px",
              border: "1px solid #CBD5E1",
              backgroundColor: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 500,
              color: "#334155",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Payment Statuses</option>
            <option value="full_paid">Fully Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="booked">Booked / Token Paid</option>
          </select>
        </div>

        {/* Add Unit Button */}
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
          <span>Add Unit / Owner</span>
        </button>
      </div>

      {/* Units & Ownership Income Table */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "1050px" }}>
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
                <th style={{ padding: "14px 20px", minWidth: "180px" }}>Room / Unit</th>
                <th style={{ padding: "14px 18px", minWidth: "220px" }}>Owner / Buyer</th>
                <th style={{ padding: "14px 18px", minWidth: "150px", textAlign: "right" }}>Agreed Price</th>
                <th style={{ padding: "14px 18px", minWidth: "160px", textAlign: "right" }}>Received Amount</th>
                <th style={{ padding: "14px 18px", minWidth: "150px", textAlign: "right" }}>Pending Balance</th>
                <th style={{ padding: "14px 18px", minWidth: "140px" }}>Status</th>
                <th style={{ padding: "14px 18px", minWidth: "180px" }}>Milestone Stage</th>
                <th style={{ padding: "14px 18px", minWidth: "90px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#64748B" }}>
                    <div
                      style={{
                        display: "inline-block",
                        width: "24px",
                        height: "24px",
                        border: "2px solid #FFB000",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <p style={{ marginTop: "10px", fontSize: "13px" }}>Loading unit income records...</p>
                  </td>
                </tr>
              ) : filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => {
                  const paidPercent =
                    unit.total_amount > 0 ? Math.round((unit.received_amount / unit.total_amount) * 100) : 0;

                  return (
                    <tr
                      key={unit.id}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#FFFDF8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {/* Room / Unit */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                          {unit.unit_number}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: "#F1F5F9",
                              color: "#475569",
                            }}
                          >
                            {unit.unit_type}
                          </span>
                          {unit.carpet_area_sqft ? (
                            <span style={{ fontSize: "11px", color: "#64748B" }}>{unit.carpet_area_sqft} sq.ft</span>
                          ) : null}
                          {unit.floor && (
                            <span style={{ fontSize: "11px", color: "#94A3B8" }}>• {unit.floor}</span>
                          )}
                        </div>
                      </td>

                      {/* Owner details */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                          <User size={14} style={{ color: "#D97706", flexShrink: 0 }} />
                          <span>{unit.owner_name}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "3px", fontSize: "11px", color: "#64748B" }}>
                          {unit.owner_phone && (
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Phone size={10} style={{ color: "#94A3B8" }} />
                              {unit.owner_phone}
                            </span>
                          )}
                          {unit.owner_email && (
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Mail size={10} style={{ color: "#94A3B8" }} />
                              {unit.owner_email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Agreed Price */}
                      <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                          {formatCurrencyFull(unit.total_amount)}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>
                          Booked: {formatDateShort(unit.booking_date)}
                        </div>
                      </td>

                      {/* Received Amount */}
                      <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#16A34A" }}>
                          {formatCurrencyFull(unit.received_amount)}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px", marginTop: "3px" }}>
                          <div style={{ width: "60px", height: "4px", backgroundColor: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${paidPercent}%`,
                                height: "100%",
                                backgroundColor: "#16A34A",
                                borderRadius: "9999px",
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "10px", fontWeight: 600, color: "#15803D" }}>{paidPercent}%</span>
                        </div>
                      </td>

                      {/* Pending Balance */}
                      <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: unit.pending_amount > 0 ? "#D97706" : "#64748B",
                          }}
                        >
                          {unit.pending_amount > 0 ? formatCurrencyFull(unit.pending_amount) : "₹ 0 (Cleared)"}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        {getStatusBadge(unit.status)}
                      </td>

                      {/* Milestone Stage */}
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontSize: "12px", color: "#334155", fontWeight: 500 }}>
                          {unit.payment_milestone || "Standard Booking"}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: "14px 18px", textAlign: "center", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                          {unit.pending_amount > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedUnitForPayment(unit)}
                              style={{
                                padding: "4px 10px",
                                fontSize: "11px",
                                fontWeight: 700,
                                borderRadius: "6px",
                                backgroundColor: "#ECFDF5",
                                color: "#047857",
                                border: "1px solid #A7F3D0",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#D1FAE5";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#ECFDF5";
                              }}
                              title="Record payment installment"
                            >
                              + Pay
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove unit ${unit.unit_number} (${unit.owner_name})?`)) {
                                deleteUnit(unit.id);
                                showFeedback(`Unit ${unit.unit_number} removed.`);
                              }
                            }}
                            style={{
                              padding: "5px",
                              border: "none",
                              background: "none",
                              color: "#94A3B8",
                              cursor: "pointer",
                              borderRadius: "6px",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#DC2626";
                              e.currentTarget.style.backgroundColor = "#FEE2E2";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#94A3B8";
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                            title="Delete unit record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 24px", textAlign: "center", color: "#64748B" }}>
                    <Building2 size={36} style={{ margin: "0 auto 8px auto", opacity: 0.3 }} />
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#334155" }}>No unit ownership records found</p>
                    <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
                      Click &ldquo;Add Unit / Owner&rdquo; to record a room allocation or clear search filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Unit Modal */}
      <AddUnitIncomeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(data) => {
          addUnit(data);
          showFeedback(`Unit ${data.unit_number} allocated to ${data.owner_name} successfully!`);
        }}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!selectedUnitForPayment}
        unit={selectedUnitForPayment}
        onClose={() => setSelectedUnitForPayment(null)}
        onRecord={(unitId, amount, milestone, notes) => {
          recordPayment(unitId, amount, milestone, notes);
          showFeedback(`Payment of ${formatCurrencyFull(amount)} recorded successfully!`);
        }}
      />
    </div>
  );
}
