"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { formatCurrencyFull, formatDateShort } from "@/lib/utils";
import { usePermissions } from "@/lib/rbac/client";
import { useAuth } from "@/contexts/AuthContext";
import type {
  Project,
  Material,
  MaterialRequest,
  StockMovement,
  ProjectMaterialRegisterItem,
} from "@/types";
import {
  Package,
  Plus,
  PackageCheck,
  ArrowUpRight,
  Search,
  Filter,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  RotateCcw,
  Eye,
  Building2,
  Boxes,
  AlertCircle,
  X,
  Wallet,
  Calendar,
} from "lucide-react";
import { MaterialRequestModal } from "./materials/MaterialRequestModal";
import { MaterialReceiptModal } from "./materials/MaterialReceiptModal";
import { MaterialIssueModal } from "./materials/MaterialIssueModal";
import { MaterialDetailModal } from "./materials/MaterialDetailModal";
import { AddMaterialModal } from "./materials/AddMaterialModal";
import { Select, type SelectOption } from "@/components/ui/Select";
import {
  DEFAULT_CATALOGUE_MATERIALS,
  INITIAL_DEMO_REQUESTS,
  INITIAL_DEMO_MOVEMENTS,
  getStoredCatalogue,
  saveStoredCatalogue,
  getStoredRequests,
  getStoredMovements,
  saveStoredRequests,
  saveStoredMovements,
  calculateProjectMaterials,
} from "@/lib/materialStore";

interface ProjectMaterialsTabProps {
  project: Project;
}

// Category badge styles
const CATEGORY_TAG_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  cement: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  steel: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  sand: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  aggregate: { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0" },
  bricks: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  plumbing: { bg: "#F0FDFA", text: "#0F766E", border: "#99F6E4" },
  electrical: { bg: "#FEFCE8", text: "#A16207", border: "#FEF08A" },
  paints: { bg: "#FDF2F8", text: "#BE185D", border: "#FBCFE8" },
  flooring: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  hardware: { bg: "#F1F5F9", text: "#334155", border: "#CBD5E1" },
  general: { bg: "#F8FAFC", text: "#475569", border: "#E2E8F0" },
};

// Deduplicate catalogue items by normalized name to eliminate duplicate rows
function deduplicateMaterials(list: Material[]): Material[] {
  const map = new Map<string, Material>();
  for (const m of list) {
    const key = (m.name || "").trim().toLowerCase();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, m);
    } else {
      const existing = map.get(key)!;
      if ((m.current_stock || 0) > (existing.current_stock || 0)) {
        map.set(key, { ...existing, ...m });
      }
    }
  }
  return Array.from(map.values());
}

export default function ProjectMaterialsTab({ project }: ProjectMaterialsTabProps) {
  const { user } = useAuth();
  const { hasPermission, hasRole } = usePermissions();

  // Navigation Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<"register" | "requests" | "receipts" | "movements">("register");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Data State
  const [catalogue, setCatalogue] = useState<Material[]>([]);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals state
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<MaterialRequest | null>(null);
  const [preselectedRequestIdForReceipt, setPreselectedRequestIdForReceipt] = useState<string | undefined>(undefined);
  const [preselectedMaterialIdForIssue, setPreselectedMaterialIdForIssue] = useState<string | undefined>(undefined);

  // Permissions check
  const canAddMaterial =
    hasRole("super_admin", "project_manager", "store_inventory_manager", "procurement_manager", "owner_director") ||
    hasPermission("inventory.purchase") ||
    hasPermission("inventory.request");

  const canRequest =
    hasRole("super_admin", "project_manager", "site_engineer") ||
    hasPermission("inventory.request");

  const canStockIn =
    hasRole("super_admin", "store_inventory_manager", "procurement_manager", "project_manager") ||
    hasPermission("inventory.stock_in");

  const canStockOut =
    hasRole("super_admin", "store_inventory_manager", "project_manager") ||
    hasPermission("inventory.stock_out");

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch / Sync materials data
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      // 1. Fetch Catalogue
      let catData: Material[] = getStoredCatalogue();
      try {
        const catRes = await fetch("/api/materials");
        if (catRes.ok) {
          const resJson = await catRes.json();
          if (resJson.materials && resJson.materials.length > 0) {
            catData = resJson.materials;
          }
        }
      } catch (e) {
        console.warn("Using local catalogue fallback:", e);
      }
      const cleanCatalogue = deduplicateMaterials(catData);
      setCatalogue(cleanCatalogue);
      saveStoredCatalogue(cleanCatalogue);

      // 2. Fetch Requests
      let reqData: MaterialRequest[] = getStoredRequests().filter((r) => r.project_id === project.id);
      try {
        const reqRes = await fetch(`/api/materials/requests?project_id=${project.id}`);
        if (reqRes.ok) {
          const resJson = await reqRes.json();
          if (resJson.requests && resJson.requests.length > 0) {
            reqData = resJson.requests;
          }
        }
      } catch (e) {
        console.warn("Using local requests fallback:", e);
      }
      setRequests(reqData);

      // 3. Fetch Movements
      let movData: StockMovement[] = getStoredMovements().filter((m) => m.project_id === project.id);
      try {
        const movRes = await fetch(`/api/materials/movements?project_id=${project.id}`);
        if (movRes.ok) {
          const resJson = await movRes.json();
          if (resJson.movements && resJson.movements.length > 0) {
            movData = resJson.movements;
          }
        }
      } catch (e) {
        console.warn("Using local movements fallback:", e);
      }
      setMovements(movData);
    } catch (err: any) {
      console.error("Failed to load materials data:", err);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculated Project Material Register (with deduplicated items)
  const registerItems: ProjectMaterialRegisterItem[] = useMemo(() => {
    return calculateProjectMaterials(project.id, catalogue, movements);
  }, [project.id, catalogue, movements]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const activeWithStock = registerItems.filter((m) => m.current_stock > 0 || m.received_quantity > 0);
    const pendingRequests = requests.filter(
      (r) => r.status === "pending_approval" || r.status === "draft"
    ).length;
    const totalReceivedQuantity = registerItems.reduce((sum, m) => sum + m.received_quantity, 0);

    const goodsReceivedValue = movements
      .filter((m) => m.movement_type === "receipt")
      .reduce((sum, m) => sum + (Number(m.total_cost) || 0), 0);

    return {
      totalCatalogueCount: registerItems.length,
      activeWithStockCount: activeWithStock.length,
      pendingRequests,
      totalReceivedQuantity: Number(totalReceivedQuantity.toFixed(2)),
      materialCost: goodsReceivedValue,
    };
  }, [registerItems, requests, movements]);

  // Categories list for dropdown
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    catalogue.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [catalogue]);

  const categoryOptions: SelectOption[] = useMemo(() => [
    { value: "all", label: "All Categories" },
    ...categoriesList.map((c) => ({
      value: c,
      label: c.charAt(0).toUpperCase() + c.slice(1),
    })),
  ], [categoriesList]);

  const registerStatusOptions: SelectOption[] = [
    { value: "all", label: "All Stock Statuses" },
    { value: "in_stock", label: "In Stock", color: "#16A34A" },
    { value: "low_stock", label: "Low Stock Alert", color: "#D97706" },
    { value: "out_of_stock", label: "Zero Stock", color: "#64748B" },
  ];

  const requestStatusOptions: SelectOption[] = [
    { value: "all", label: "All Statuses" },
    { value: "pending_approval", label: "Pending Approval", color: "#D97706" },
    { value: "approved", label: "Approved", color: "#16A34A" },
    { value: "partially_fulfilled", label: "Partially Fulfilled", color: "#2563EB" },
    { value: "fulfilled", label: "Fulfilled", color: "#059669" },
    { value: "rejected", label: "Rejected", color: "#DC2626" },
  ];

  const movementTypeOptions: SelectOption[] = [
    { value: "all", label: "All Movement Types" },
    { value: "receipt", label: "Receipt (Stock In)", color: "#16A34A" },
    { value: "issue", label: "Issue (Site Usage)", color: "#EA580C" },
  ];

  const currentStatusOptions =
    activeSubTab === "register"
      ? registerStatusOptions
      : activeSubTab === "requests"
      ? requestStatusOptions
      : movementTypeOptions;

  // Handlers for modal submissions
  const handleMaterialAdded = (newMat: Material) => {
    setCatalogue((prev) => {
      const merged = deduplicateMaterials([newMat, ...prev]);
      saveStoredCatalogue(merged);
      return merged;
    });
    showNotification("success", `"${newMat.name}" added to material catalogue!`);
    fetchData();
  };

  const handleRequestCreated = (newReq: MaterialRequest) => {
    setRequests((prev) => [newReq, ...prev]);
    const stored = getStoredRequests();
    saveStoredRequests([newReq, ...stored.filter((r) => r.id !== newReq.id)]);
    showNotification("success", `Material request ${newReq.request_number} submitted!`);
  };

  const handleMovementCreated = (newMov: StockMovement) => {
    setMovements((prev) => [newMov, ...prev]);
    const stored = getStoredMovements();
    saveStoredMovements([newMov, ...stored.filter((m) => m.id !== newMov.id)]);

    if (newMov.movement_type === "receipt") {
      showNotification("success", `Goods receipt ${newMov.movement_number} recorded!`);
    } else {
      showNotification("success", `Material issue ${newMov.movement_number} dispatched!`);
    }

    if (newMov.movement_type === "receipt" && newMov.request_id) {
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== newMov.request_id) return r;
          const updatedItems = (r.items || []).map((it) => {
            if (newMov.request_item_id && it.id === newMov.request_item_id) {
              return {
                ...it,
                fulfilled_quantity: (it.fulfilled_quantity || 0) + newMov.quantity,
              };
            } else if (!newMov.request_item_id && it.material_id === newMov.material_id) {
              return {
                ...it,
                fulfilled_quantity: (it.fulfilled_quantity || 0) + newMov.quantity,
              };
            }
            return it;
          });

          const allFulfilled = updatedItems.every((it) => (it.fulfilled_quantity || 0) >= it.quantity);
          const anyFulfilled = updatedItems.some((it) => (it.fulfilled_quantity || 0) > 0);

          return {
            ...r,
            items: updatedItems,
            status: allFulfilled ? "fulfilled" : anyFulfilled ? "partially_fulfilled" : r.status,
          };
        })
      );
    }
  };

  const handleRequestApproved = (updatedReq: MaterialRequest) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === updatedReq.id ? { ...r, ...updatedReq } : r))
    );
    const stored = getStoredRequests();
    saveStoredRequests(stored.map((r) => (r.id === updatedReq.id ? { ...r, ...updatedReq } : r)));
    showNotification("success", `Request ${updatedReq.request_number} approved!`);
  };

  // Filtered views
  const filteredRegister = useMemo(() => {
    return registerItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.material_name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "in_stock" && item.stock_status === "in-stock") ||
        (statusFilter === "low_stock" && item.stock_status === "low-stock") ||
        (statusFilter === "out_of_stock" && item.stock_status === "out-of-stock");

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [registerItems, searchQuery, categoryFilter, statusFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.request_number.toLowerCase().includes(q) ||
        r.requested_by_name?.toLowerCase().includes(q) ||
        (r.items || []).some((it) => it.material_name?.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const receiptMovements = useMemo(() => {
    return movements.filter((m) => m.movement_type === "receipt");
  }, [movements]);

  const filteredReceipts = useMemo(() => {
    return receiptMovements.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        m.movement_number.toLowerCase().includes(q) ||
        m.material_name?.toLowerCase().includes(q) ||
        m.supplier_name?.toLowerCase().includes(q) ||
        m.reference_number?.toLowerCase().includes(q)
      );
    });
  }, [receiptMovements, searchQuery]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.movement_number.toLowerCase().includes(q) ||
        m.material_name?.toLowerCase().includes(q) ||
        m.source_or_location?.toLowerCase().includes(q) ||
        m.reference_number?.toLowerCase().includes(q);

      const matchesType =
        statusFilter === "all" ||
        (statusFilter === "receipt" && m.movement_type === "receipt") ||
        (statusFilter === "issue" && m.movement_type === "issue") ||
        (statusFilter === "adjustment" && m.movement_type === "adjustment");

      return matchesSearch && matchesType;
    });
  }, [movements, searchQuery, statusFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Header Card with Title and Actions */}
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
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
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
              flexShrink: 0,
            }}
          >
            <Boxes size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Project Materials
              </h2>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  backgroundColor: "#FEF3C7",
                  border: "1px solid #FDE68A",
                  color: "#92400E",
                }}
              >
                {project.project_code}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#64748B", marginTop: "4px", margin: 0 }}>
              Live site inventory, stock indents, goods receipts, and consumption for{" "}
              <strong style={{ color: "#1E293B" }}>{project.name}</strong>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {canStockOut && (
            <button
              type="button"
              onClick={() => {
                setPreselectedMaterialIdForIssue(undefined);
                setIsIssueModalOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                backgroundColor: "#FFF7ED",
                border: "1px solid #FFEDD5",
                color: "#C2410C",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <ArrowUpRight size={15} />
              <span>Issue to Site</span>
            </button>
          )}

          {canStockIn && (
            <button
              type="button"
              onClick={() => {
                setPreselectedRequestIdForReceipt(undefined);
                setIsReceiptModalOpen(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                backgroundColor: "#F0FDF4",
                border: "1px solid #DCFCE7",
                color: "#15803D",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <PackageCheck size={15} />
              <span>Record Receipt</span>
            </button>
          )}

          {canRequest && (
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "10px",
                backgroundColor: "#EFF6FF",
                border: "1px solid #DBEAFE",
                color: "#1D4ED8",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <FileText size={15} />
              <span>Indent Request</span>
            </button>
          )}

          {/* Primary CTA: Add Material */}
          {canAddMaterial && (
            <button
              type="button"
              onClick={() => setIsAddMaterialModalOpen(true)}
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
              <span>Add Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: feedback.type === "success" ? "#ECFDF5" : "#FEF2F2",
            border: `1px solid ${feedback.type === "success" ? "#A7F3D0" : "#FECACA"}`,
            color: feedback.type === "success" ? "#065F46" : "#991B1B",
          }}
        >
          {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.7 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 2. Four Clean KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Material Types */}
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
            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Material Types
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {kpis.totalCatalogueCount}
            </div>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
              {kpis.activeWithStockCount} items active on site
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
            <Package size={22} />
          </div>
        </div>

        {/* Pending Requests */}
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
            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Pending Requests
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {kpis.pendingRequests}
            </div>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
              Awaiting approval or dispatch
            </div>
          </div>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "#EFF6FF",
              border: "1px solid #DBEAFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2563EB",
            }}
          >
            <Clock size={22} />
          </div>
        </div>

        {/* Received Materials */}
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
            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Received Materials
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
              {kpis.totalReceivedQuantity.toLocaleString()}
            </div>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
              Total physical units received
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
              color: "#059669",
            }}
          >
            <PackageCheck size={22} />
          </div>
        </div>

        {/* Goods Received Cost */}
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
            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Goods Received Cost
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#B45309", marginTop: "4px" }}>
              {formatCurrencyFull(kpis.materialCost)}
            </div>
            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
              Audited goods receipt value
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
            <Wallet size={22} />
          </div>
        </div>
      </div>

      {/* 3. Sub-Tab Bar & Filters Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {/* Segmented Pill Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "register", label: "Material Register", count: registerItems.length, icon: Layers },
            { id: "requests", label: "Material Requests", count: requests.length, icon: FileText },
            { id: "receipts", label: "Receipts & GRN", count: receiptMovements.length, icon: PackageCheck },
            { id: "movements", label: "Stock Ledger", count: movements.length, icon: Truck },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  border: isActive ? "1px solid #FDE68A" : "1px solid transparent",
                  backgroundColor: isActive ? "#FFF9EB" : "transparent",
                  color: isActive ? "#92400E" : "#64748B",
                }}
              >
                <Icon size={15} style={{ color: isActive ? "#B45309" : "#94A3B8" }} />
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "1px 7px",
                    borderRadius: "6px",
                    backgroundColor: isActive ? "#FDE68A" : "#F1F5F9",
                    color: isActive ? "#78350F" : "#64748B",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            paddingTop: "12px",
            borderTop: "1px solid #F1F5F9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px", flexWrap: "wrap" }}>
            {/* Search Input */}
            <div style={{ position: "relative", width: "100%", maxWidth: "320px" }}>
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
                placeholder={
                  activeSubTab === "register"
                    ? "Search material name or category..."
                    : activeSubTab === "requests"
                    ? "Search request #, requester..."
                    : "Search movement #, reference, item..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: "38px",
                  paddingLeft: "38px",
                  paddingRight: searchQuery ? "32px" : "14px",
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

            {/* Category Select for Register */}
            {activeSubTab === "register" && (
              <Select
                width="170px"
                size="sm"
                options={categoryOptions}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            )}

            {/* Status Select */}
            <Select
              width="185px"
              size="sm"
              options={currentStatusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {(searchQuery || categoryFilter !== "all" || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                }}
                style={{
                  height: "36px",
                  padding: "0 12px",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#64748B",
                  cursor: "pointer",
                }}
              >
                Clear Filters
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchData()}
              disabled={loading}
              title="Refresh"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                border: "1px solid #CBD5E1",
                backgroundColor: "#F8FAFC",
                color: "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <RotateCcw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Professional Data Table Card */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748B" }}>
            <div
              style={{
                display: "inline-block",
                width: "28px",
                height: "28px",
                border: "3px solid #FFB000",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ marginTop: "12px", fontSize: "13px", fontWeight: 500 }}>
              Synchronizing project materials ledger...
            </p>
          </div>
        ) : (
          <>
            {/* VIEW 1: MATERIAL REGISTER */}
            {activeSubTab === "register" && (
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
                      <th style={{ padding: "14px 20px" }}>Material Catalogue Item</th>
                      <th style={{ padding: "14px 14px" }}>Category</th>
                      <th style={{ padding: "14px 14px" }}>Unit</th>
                      <th style={{ padding: "14px 16px", textAlign: "right" }}>Warehouse Stock</th>
                      <th style={{ padding: "14px 16px", textAlign: "right" }}>Site Received</th>
                      <th style={{ padding: "14px 16px", textAlign: "right" }}>Site Issued</th>
                      <th style={{ padding: "14px 18px", textAlign: "right", color: "#0F172A", fontWeight: 800 }}>
                        Current Site Stock
                      </th>
                      <th style={{ padding: "14px 16px", textAlign: "right" }}>Unit Rate</th>
                      <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 800 }}>Total Project Cost</th>
                      <th style={{ padding: "14px 14px", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegister.length > 0 ? (
                      filteredRegister.map((item) => {
                        const catStyle = CATEGORY_TAG_STYLES[item.category.toLowerCase()] || {
                          bg: "#F1F5F9",
                          text: "#475569",
                          border: "#E2E8F0",
                        };

                        return (
                          <tr
                            key={item.material_id}
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
                            {/* Material Name */}
                            <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                                {item.material_name}
                              </div>
                            </td>

                            {/* Category Badge */}
                            <td style={{ padding: "14px 14px", whiteSpace: "nowrap" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: catStyle.bg,
                                  color: catStyle.text,
                                  border: `1px solid ${catStyle.border}`,
                                  textTransform: "capitalize",
                                }}
                              >
                                {item.category}
                              </span>
                            </td>

                            {/* Unit */}
                            <td style={{ padding: "14px 14px", fontSize: "13px", color: "#64748B", fontWeight: 500 }}>
                              {item.unit}
                            </td>

                            {/* Warehouse Stock */}
                            <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>
                              {item.warehouse_stock.toLocaleString()}
                            </td>

                            {/* Site Received */}
                            <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "13px", fontWeight: 700, color: "#15803D", fontFamily: "monospace" }}>
                              {item.received_quantity.toLocaleString()}
                            </td>

                            {/* Site Issued */}
                            <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "13px", fontWeight: 700, color: "#C2410C", fontFamily: "monospace" }}>
                              {item.issued_quantity.toLocaleString()}
                            </td>

                            {/* Current Site Stock (Highlighted column) */}
                            <td
                              style={{
                                padding: "14px 18px",
                                textAlign: "right",
                                fontSize: "14px",
                                fontWeight: 800,
                                color: "#0F172A",
                                fontFamily: "monospace",
                                backgroundColor: item.current_stock > 0 ? "#FFFDF5" : "transparent",
                              }}
                            >
                              {item.current_stock.toLocaleString()}
                            </td>

                            {/* Unit Rate */}
                            <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "13px", color: "#475569", fontFamily: "monospace" }}>
                              {formatCurrencyFull(item.unit_cost)}
                            </td>

                            {/* Total Cost */}
                            <td style={{ padding: "14px 20px", textAlign: "right", fontSize: "13px", fontWeight: 800, color: "#92400E", fontFamily: "monospace" }}>
                              {formatCurrencyFull(item.total_project_cost)}
                            </td>

                            {/* Status Pill */}
                            <td style={{ padding: "14px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                              {item.stock_status === "in-stock" && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    backgroundColor: "#DCFCE7",
                                    color: "#166534",
                                    border: "1px solid #BBF7D0",
                                  }}
                                >
                                  In Stock
                                </span>
                              )}
                              {item.stock_status === "low-stock" && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    backgroundColor: "#FEF3C7",
                                    color: "#92400E",
                                    border: "1px solid #FDE68A",
                                  }}
                                >
                                  Low Stock
                                </span>
                              )}
                              {item.stock_status === "out-of-stock" && (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    padding: "2px 8px",
                                    borderRadius: "6px",
                                    backgroundColor: "#F1F5F9",
                                    color: "#64748B",
                                    border: "1px solid #E2E8F0",
                                  }}
                                >
                                  Zero Stock
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                                {canStockOut && item.current_stock > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPreselectedMaterialIdForIssue(item.material_id);
                                      setIsIssueModalOpen(true);
                                    }}
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      border: "1px solid #FFEDD5",
                                      backgroundColor: "#FFF7ED",
                                      color: "#C2410C",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Issue
                                  </button>
                                )}
                                {canStockIn && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsReceiptModalOpen(true);
                                    }}
                                    style={{
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      border: "1px solid #DCFCE7",
                                      backgroundColor: "#F0FDF4",
                                      color: "#15803D",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Receive
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={11} style={{ padding: "48px", textAlign: "center", color: "#64748B" }}>
                          <Package size={36} style={{ margin: "0 auto 8px auto", color: "#CBD5E1" }} />
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>No materials found</p>
                          <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
                            No materials match your search criteria.
                          </p>
                          {canAddMaterial && (
                            <button
                              type="button"
                              onClick={() => setIsAddMaterialModalOpen(true)}
                              style={{
                                marginTop: "12px",
                                padding: "6px 14px",
                                borderRadius: "8px",
                                backgroundColor: "#FFB000",
                                color: "#0F172A",
                                fontSize: "12px",
                                fontWeight: 700,
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              + Add New Material
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW 2: MATERIAL REQUESTS */}
            {activeSubTab === "requests" && (
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
                      <th style={{ padding: "14px 20px" }}>Request #</th>
                      <th style={{ padding: "14px 14px" }}>Priority</th>
                      <th style={{ padding: "14px 14px" }}>Required By</th>
                      <th style={{ padding: "14px 16px" }}>Site Destination</th>
                      <th style={{ padding: "14px 16px" }}>Line Items</th>
                      <th style={{ padding: "14px 16px" }}>Requested By</th>
                      <th style={{ padding: "14px 14px" }}>Approval Status</th>
                      <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map((req) => (
                        <tr
                          key={req.id}
                          style={{ borderBottom: "1px solid #F1F5F9", transition: "background-color 0.15s ease" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#F8FAFC";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
                            <button
                              type="button"
                              onClick={() => setSelectedRequestForDetail(req)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                fontSize: "13px",
                                fontWeight: 800,
                                color: "#B45309",
                                cursor: "pointer",
                                textDecoration: "underline",
                              }}
                            >
                              {req.request_number}
                            </button>
                          </td>
                          <td style={{ padding: "14px 14px" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                textTransform: "uppercase",
                                backgroundColor:
                                  req.priority === "critical"
                                    ? "#FEE2E2"
                                    : req.priority === "high"
                                    ? "#FFEDD5"
                                    : "#F1F5F9",
                                color:
                                  req.priority === "critical"
                                    ? "#991B1B"
                                    : req.priority === "high"
                                    ? "#C2410C"
                                    : "#475569",
                              }}
                            >
                              {req.priority}
                            </span>
                          </td>
                          <td style={{ padding: "14px 14px", fontSize: "13px", color: "#64748B", whiteSpace: "nowrap" }}>
                            {req.required_date}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "13px", color: "#1E293B", maxWidth: "240px" }}>
                            {req.delivery_location}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#334155" }}>
                            {(req.items || []).map((it, idx) => (
                              <div key={idx} style={{ marginBottom: "2px" }}>
                                {it.material_name}: <strong>{it.quantity} {it.unit}</strong>
                                {Number(it.fulfilled_quantity || 0) > 0 && (
                                  <span style={{ color: "#15803D", marginLeft: "4px", fontWeight: 700 }}>
                                    ({it.fulfilled_quantity} received)
                                  </span>
                                )}
                              </div>
                            ))}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "13px", color: "#64748B", whiteSpace: "nowrap" }}>
                            {req.requested_by_name}
                          </td>
                          <td style={{ padding: "14px 14px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                textTransform: "capitalize",
                                backgroundColor:
                                  req.status === "fulfilled"
                                    ? "#DCFCE7"
                                    : req.status === "partially_fulfilled"
                                    ? "#DBEAFE"
                                    : req.status === "approved"
                                    ? "#DCFCE7"
                                    : req.status === "rejected"
                                    ? "#FEE2E2"
                                    : "#FEF3C7",
                                color:
                                  req.status === "fulfilled"
                                    ? "#166534"
                                    : req.status === "partially_fulfilled"
                                    ? "#1E40AF"
                                    : req.status === "approved"
                                    ? "#166534"
                                    : req.status === "rejected"
                                    ? "#991B1B"
                                    : "#92400E",
                              }}
                            >
                              {req.status.replace("_", " ")}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => setSelectedRequestForDetail(req)}
                                style={{
                                  padding: "5px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid #E2E8F0",
                                  backgroundColor: "#FFFFFF",
                                  color: "#64748B",
                                  cursor: "pointer",
                                }}
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              {(req.status === "approved" || req.status === "partially_fulfilled") && canStockIn && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreselectedRequestIdForReceipt(req.id);
                                    setIsReceiptModalOpen(true);
                                  }}
                                  style={{
                                    padding: "5px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    border: "1px solid #DCFCE7",
                                    backgroundColor: "#F0FDF4",
                                    color: "#15803D",
                                    cursor: "pointer",
                                  }}
                                >
                                  Receive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#64748B" }}>
                          No material requests found for this project.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW 3: RECEIPTS (GRN) */}
            {activeSubTab === "receipts" && (
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
                      <th style={{ padding: "14px 20px" }}>GRN #</th>
                      <th style={{ padding: "14px 14px" }}>Receipt Date</th>
                      <th style={{ padding: "14px 16px" }}>Material Item</th>
                      <th style={{ padding: "14px 16px" }}>Supplier / Quarry</th>
                      <th style={{ padding: "14px 14px" }}>Challan / Ref #</th>
                      <th style={{ padding: "14px 16px", textAlign: "right" }}>Qty Received</th>
                      <th style={{ padding: "14px 16px", textAlign: "right" }}>Unit Rate</th>
                      <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 800 }}>Total Value</th>
                      <th style={{ padding: "14px 16px" }}>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.length > 0 ? (
                      filteredReceipts.map((mov) => (
                        <tr
                          key={mov.id}
                          style={{ borderBottom: "1px solid #F1F5F9", transition: "background-color 0.15s ease" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#F8FAFC";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 800, color: "#15803D", fontFamily: "monospace" }}>
                            {mov.movement_number}
                          </td>
                          <td style={{ padding: "14px 14px", fontSize: "13px", color: "#64748B", whiteSpace: "nowrap" }}>
                            {formatDateShort(mov.date)}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                            {mov.material_name}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "13px", color: "#475569" }}>
                            {mov.supplier_name || "—"}
                          </td>
                          <td style={{ padding: "14px 14px", fontSize: "12px", color: "#64748B", fontFamily: "monospace" }}>
                            {mov.reference_number || "—"}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "13px", fontWeight: 800, color: "#15803D", fontFamily: "monospace" }}>
                            +{mov.quantity} {mov.unit}
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "right", fontSize: "13px", color: "#64748B", fontFamily: "monospace" }}>
                            {formatCurrencyFull(mov.unit_cost)}
                          </td>
                          <td style={{ padding: "14px 20px", textAlign: "right", fontSize: "13px", fontWeight: 800, color: "#92400E", fontFamily: "monospace" }}>
                            {formatCurrencyFull(mov.total_cost)}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748B" }}>
                            {mov.recorded_by_name || "Store"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} style={{ padding: "48px", textAlign: "center", color: "#64748B" }}>
                          No material receipts recorded for this project yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW 4: STOCK MOVEMENTS LEDGER */}
            {activeSubTab === "movements" && (
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
                      <th style={{ padding: "14px 20px" }}>Movement #</th>
                      <th style={{ padding: "14px 14px" }}>Date</th>
                      <th style={{ padding: "14px 14px" }}>Type</th>
                      <th style={{ padding: "14px 16px" }}>Material</th>
                      <th style={{ padding: "14px 16px", textAlign: "right" }}>Quantity</th>
                      <th style={{ padding: "14px 18px" }}>Task / Activity Location</th>
                      <th style={{ padding: "14px 14px" }}>Reference #</th>
                      <th style={{ padding: "14px 16px" }}>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.length > 0 ? (
                      filteredMovements.map((mov) => (
                        <tr
                          key={mov.id}
                          style={{ borderBottom: "1px solid #F1F5F9", transition: "background-color 0.15s ease" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#F8FAFC";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 800, color: "#0F172A", fontFamily: "monospace" }}>
                            {mov.movement_number}
                          </td>
                          <td style={{ padding: "14px 14px", fontSize: "13px", color: "#64748B", whiteSpace: "nowrap" }}>
                            {formatDateShort(mov.date)}
                          </td>
                          <td style={{ padding: "14px 14px" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                textTransform: "uppercase",
                                backgroundColor:
                                  mov.movement_type === "receipt"
                                    ? "#DCFCE7"
                                    : mov.movement_type === "issue"
                                    ? "#FFEDD5"
                                    : "#DBEAFE",
                                color:
                                  mov.movement_type === "receipt"
                                    ? "#166534"
                                    : mov.movement_type === "issue"
                                    ? "#C2410C"
                                    : "#1E40AF",
                              }}
                            >
                              {mov.movement_type}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                            {mov.material_name}
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              textAlign: "right",
                              fontSize: "13px",
                              fontWeight: 800,
                              fontFamily: "monospace",
                              color: mov.movement_type === "receipt" ? "#15803D" : "#C2410C",
                            }}
                          >
                            {mov.movement_type === "receipt" ? "+" : "-"}
                            {mov.quantity} {mov.unit}
                          </td>
                          <td style={{ padding: "14px 18px", fontSize: "13px", color: "#334155", maxWidth: "260px" }}>
                            {mov.source_or_location || "—"}
                          </td>
                          <td style={{ padding: "14px 14px", fontSize: "12px", color: "#64748B", fontFamily: "monospace" }}>
                            {mov.reference_number || "—"}
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748B" }}>
                            {mov.recorded_by_name || "Store"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: "#64748B" }}>
                          No stock movements recorded for this project yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Add Material Modal */}
      <AddMaterialModal
        isOpen={isAddMaterialModalOpen}
        onClose={() => setIsAddMaterialModalOpen(false)}
        onSuccess={handleMaterialAdded}
        projectId={project.id}
        projectName={project.name}
        projectCode={project.project_code}
      />

      {/* 2. Indent Request Modal */}
      <MaterialRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={handleRequestCreated}
        projectId={project.id}
        projectName={project.name}
        projectCode={project.project_code}
        catalogue={catalogue}
      />

      {/* 3. Record Goods Receipt Modal */}
      <MaterialReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setPreselectedRequestIdForReceipt(undefined);
        }}
        onSuccess={handleMovementCreated}
        projectId={project.id}
        projectName={project.name}
        projectCode={project.project_code}
        catalogue={catalogue}
        requests={requests}
        preselectedRequestId={preselectedRequestIdForReceipt}
      />

      {/* 4. Issue to Site Modal */}
      <MaterialIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setPreselectedMaterialIdForIssue(undefined);
        }}
        onSuccess={handleMovementCreated}
        projectId={project.id}
        projectName={project.name}
        projectCode={project.project_code}
        catalogue={catalogue}
        registerItems={registerItems}
        preselectedMaterialId={preselectedMaterialIdForIssue}
      />

      {/* 5. Material Request Detail Modal */}
      <MaterialDetailModal
        isOpen={selectedRequestForDetail !== null}
        onClose={() => setSelectedRequestForDetail(null)}
        request={selectedRequestForDetail}
        onApproveSuccess={handleRequestApproved}
        onOpenReceiptForRequest={(reqId) => {
          setPreselectedRequestIdForReceipt(reqId);
          setIsReceiptModalOpen(true);
        }}
      />
    </div>
  );
}
