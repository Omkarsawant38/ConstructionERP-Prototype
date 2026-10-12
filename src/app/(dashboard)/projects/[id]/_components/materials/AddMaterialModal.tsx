"use client";

import React, { useState } from "react";
import { formatCurrencyFull } from "@/lib/utils";
import type { Material, StockMovement } from "@/types";
import {
  X,
  Package,
  Plus,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Tag,
  Scale,
  Truck,
  ShieldAlert,
  Layers,
} from "lucide-react";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newMaterial: Material) => void;
  projectId: string;
  projectName: string;
  projectCode: string;
}

const CATEGORIES = [
  { value: "cement", label: "Cement & Binder" },
  { value: "steel", label: "Steel & Rebar" },
  { value: "sand", label: "Sand & Fine Aggregates" },
  { value: "aggregate", label: "Coarse Aggregates" },
  { value: "bricks", label: "Bricks & Blocks" },
  { value: "plumbing", label: "Plumbing & Piping" },
  { value: "electrical", label: "Electrical & Cabling" },
  { value: "paints", label: "Paints & Chemicals" },
  { value: "flooring", label: "Flooring & Tiles" },
  { value: "hardware", label: "Hardware & Fasteners" },
  { value: "wood", label: "Timber & Formwork" },
  { value: "tools", label: "Equipment & Tools" },
  { value: "general", label: "General Site Consumables" },
];

const COMMON_UNITS = [
  "bags",
  "MT",
  "brass",
  "pcs",
  "lengths",
  "coils",
  "sq.ft",
  "cu.m",
  "kg",
  "liters",
  "boxes",
  "meters",
];

export function AddMaterialModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  projectName,
  projectCode,
}: AddMaterialModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("cement");
  const [unit, setUnit] = useState("bags");
  const [customUnit, setCustomUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [currentStock, setCurrentStock] = useState<string>("0");
  const [reorderLevel, setReorderLevel] = useState<string>("20");
  const [supplierName, setSupplierName] = useState("");
  const [initialSiteStock, setInitialSiteStock] = useState<string>("0");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Please enter the material name.");
      return;
    }

    const finalUnit = unit === "other" ? customUnit.trim() : unit;
    if (!finalUnit) {
      setErrorMsg("Please select or specify a unit of measurement.");
      return;
    }

    const priceNum = parseFloat(unitPrice) || 0;
    if (priceNum < 0) {
      setErrorMsg("Unit rate cannot be negative.");
      return;
    }

    const warehouseStockNum = parseFloat(currentStock) || 0;
    const reorderLevelNum = parseFloat(reorderLevel) || 0;
    const initialSiteStockNum = parseFloat(initialSiteStock) || 0;

    setLoading(true);

    try {
      // 1. Create in backend catalogue
      const payload = {
        name: trimmedName,
        category,
        unit: finalUnit,
        unit_price: priceNum,
        current_stock: warehouseStockNum,
        reorder_level: reorderLevelNum,
        supplier_name: supplierName.trim() || undefined,
        organization_id: "org1",
      };

      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok && !resJson.material) {
        throw new Error(resJson.error || "Failed to add material to catalogue");
      }

      const createdMaterial: Material = resJson.material || {
        id: `mat-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 2. If user specified initial site stock for this project, record an opening stock movement
      if (initialSiteStockNum > 0) {
        try {
          await fetch("/api/materials/movements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project_id: projectId,
              material_id: createdMaterial.id,
              material_name: createdMaterial.name,
              movement_type: "receipt",
              quantity: initialSiteStockNum,
              unit: finalUnit,
              unit_cost: priceNum,
              date: new Date().toISOString().split("T")[0],
              source_or_location: "Opening Site Stock Allocation",
              reference_number: `OPN-${projectCode}`,
              notes: notes.trim() || "Initial project site stock allocation",
            }),
          });
        } catch (movErr) {
          console.warn("Could not record opening stock movement:", movErr);
        }
      }

      onSuccess(createdMaterial);
      handleReset();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to create material");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName("");
    setCategory("cement");
    setUnit("bags");
    setCustomUnit("");
    setUnitPrice("");
    setCurrentStock("0");
    setReorderLevel("20");
    setSupplierName("");
    setInitialSiteStock("0");
    setNotes("");
    setErrorMsg(null);
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
          maxWidth: "720px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.25)",
          border: "1px solid #E2E8F0",
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
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                Add New Material
              </h3>
              <p style={{ fontSize: "12px", color: "#64748B", margin: "2px 0 0 0" }}>
                Register material into catalogue and allocate for{" "}
                <strong style={{ color: "#D97706" }}>{projectCode}</strong>
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
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Form & Scrollable Content */}
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
            {errorMsg && (
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
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Section 1: Item Core Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Material Item Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ultratech PPC Cement 50kg, Tata Tiscon TMT 16mm, River Sand"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "13px",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Category <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: "100%",
                      height: "42px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "13px",
                      color: "#0F172A",
                      outline: "none",
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                    Unit of Measurement <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      style={{
                        flex: 1,
                        height: "42px",
                        padding: "0 12px",
                        borderRadius: "10px",
                        border: "1px solid #CBD5E1",
                        backgroundColor: "#FFFFFF",
                        fontSize: "13px",
                        color: "#0F172A",
                        outline: "none",
                      }}
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                      <option value="other">Other (Custom unit)</option>
                    </select>
                    {unit === "other" && (
                      <input
                        type="text"
                        placeholder="e.g. bundle"
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        style={{
                          width: "110px",
                          height: "42px",
                          padding: "0 10px",
                          borderRadius: "10px",
                          border: "1px solid #CBD5E1",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Pricing & Inventory Controls Box */}
            <div
              style={{
                padding: "18px 20px",
                borderRadius: "14px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#F8FAFC",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Pricing & Inventory Controls
              </span>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                {/* Standard Rate */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                    Standard Rate (₹ / {unit})
                  </label>
                  <div style={{ position: "relative" }}>
                    <span
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94A3B8",
                        fontWeight: 700,
                        fontSize: "13px",
                      }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      style={{
                        width: "100%",
                        height: "40px",
                        paddingLeft: "28px",
                        paddingRight: "10px",
                        borderRadius: "10px",
                        border: "1px solid #CBD5E1",
                        backgroundColor: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#0F172A",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Warehouse Stock */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                    Warehouse Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
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
                  />
                </div>

                {/* Low Stock Alert */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                    Low Stock Alert Level
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="20"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
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
                  />
                </div>
              </div>

              {/* Initial Site Allocation */}
              <div
                style={{
                  paddingTop: "14px",
                  borderTop: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>
                    Opening Site Stock for {projectCode}
                  </label>
                  <p style={{ fontSize: "11px", color: "#64748B", margin: "2px 0 0 0" }}>
                    Directly allocate physical units currently available on this job site.
                  </p>
                </div>
                <div style={{ width: "130px" }}>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={initialSiteStock}
                    onChange={(e) => setInitialSiteStock(e.target.value)}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "10px",
                      border: "1px solid #CBD5E1",
                      backgroundColor: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#0F172A",
                      textAlign: "right",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Supplier & Specs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Primary Supplier / Vendor (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Tata Steel Distributors, UltraTech Building Solutions"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "13px",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Notes / Technical Specification
                </label>
                <textarea
                  rows={2}
                  placeholder="Grade, brand preference, batch testing standards, or storage precautions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    fontSize: "13px",
                    color: "#0F172A",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
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
              style={{
                padding: "9px 20px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                backgroundColor: "#FFFFFF",
                border: "1px solid #CBD5E1",
                color: "#475569",
                cursor: "pointer",
              }}
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
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Material...</span>
                </>
              ) : (
                <>
                  <Plus size={16} className="stroke-[2.5]" />
                  <span>Register Material</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
