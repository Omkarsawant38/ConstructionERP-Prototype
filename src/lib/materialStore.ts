"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  Material,
  MaterialRequest,
  MaterialRequestItem,
  StockMovement,
  ProjectMaterialRegisterItem,
} from "@/types";

export const DEFAULT_CATALOGUE_MATERIALS: Material[] = [
  {
    id: "mat-001",
    name: "Ultratech PPC Cement 50kg",
    category: "cement",
    unit: "bags",
    current_stock: 450,
    reorder_level: 200,
    unit_price: 380,
    supplier_name: "Ultratech Building Solutions",
    organization_id: "org1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "mat-002",
    name: "Tata Tiscon TMT Steel 16mm",
    category: "steel",
    unit: "MT",
    current_stock: 14.5,
    reorder_level: 10,
    unit_price: 68000,
    supplier_name: "Tata Steel Distributors",
    organization_id: "org1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "mat-003",
    name: "Tata Tiscon TMT Steel 12mm",
    category: "steel",
    unit: "MT",
    current_stock: 8.2,
    reorder_level: 10,
    unit_price: 69500,
    supplier_name: "Tata Steel Distributors",
    organization_id: "org1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "mat-004",
    name: "Crushed Sand (M-Sand)",
    category: "sand",
    unit: "brass",
    current_stock: 65,
    reorder_level: 30,
    unit_price: 4200,
    supplier_name: "Sahyadri Aggregate Supplies",
    organization_id: "org1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "mat-005",
    name: "20mm Coarse Aggregate",
    category: "aggregate",
    unit: "brass",
    current_stock: 80,
    reorder_level: 40,
    unit_price: 3600,
    supplier_name: "Sahyadri Aggregate Supplies",
    organization_id: "org1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "mat-006",
    name: "Fly Ash Bricks (9x4x3)",
    category: "bricks",
    unit: "pcs",
    current_stock: 12500,
    reorder_level: 5000,
    unit_price: 9.5,
    supplier_name: "EcoBricks Manufacturing",
    organization_id: "org1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "mat-007",
    name: "Astral CPVC Pipes 1-inch",
    category: "plumbing",
    unit: "lengths",
    current_stock: 150,
    reorder_level: 50,
    unit_price: 520,
    supplier_name: "Supreme Piping Systems",
    organization_id: "org1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "mat-008",
    name: "Finolex 2.5 sq mm Copper Wire",
    category: "electrical",
    unit: "coils",
    current_stock: 45,
    reorder_level: 20,
    unit_price: 2450,
    supplier_name: "Polycab & Finolex Electricals",
    organization_id: "org1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

// Initial demo requests for default projects
export const INITIAL_DEMO_REQUESTS: MaterialRequest[] = [
  {
    id: "req-101",
    request_number: "MR-PRJ01-001",
    project_id: "a1111111-1111-1111-1111-111111111111", // Green Valley Residency
    status: "partially_fulfilled",
    priority: "high",
    required_date: "2025-05-15",
    delivery_location: "Tower B - Foundation Bay 4",
    requested_by_name: "Omkar Sawant (Project Manager)",
    approved_by_name: "Rajesh Sharma (Director)",
    approved_at: "2025-05-10T10:30:00Z",
    approval_notes: "Approved for Tower B foundation pour.",
    notes: "Critical requirement for scheduled slab concreting.",
    items: [
      {
        id: "item-101-1",
        request_id: "req-101",
        material_id: "mat-001",
        material_name: "Ultratech PPC Cement 50kg",
        quantity: 300,
        unit: "bags",
        estimated_unit_cost: 380,
        fulfilled_quantity: 200,
        notes: "Grade 53 PPC required",
      },
      {
        id: "item-101-2",
        request_id: "req-101",
        material_id: "mat-002",
        material_name: "Tata Tiscon TMT Steel 16mm",
        quantity: 5,
        unit: "MT",
        estimated_unit_cost: 68000,
        fulfilled_quantity: 3.5,
        notes: "Fe 550D grade",
      },
    ],
    organization_id: "org1",
    created_at: "2025-05-09T08:00:00Z",
    updated_at: "2025-05-12T14:00:00Z",
  },
  {
    id: "req-102",
    request_number: "MR-PRJ01-002",
    project_id: "a1111111-1111-1111-1111-111111111111",
    status: "fulfilled",
    priority: "medium",
    required_date: "2025-05-18",
    delivery_location: "Central Site Batching Plant",
    requested_by_name: "Suresh Patil (Site Engineer)",
    approved_by_name: "Omkar Sawant (Project Manager)",
    approved_at: "2025-05-12T11:00:00Z",
    approval_notes: "Verified with batch plant supervisor.",
    notes: "Aggregates for plinth PCC work",
    items: [
      {
        id: "item-102-1",
        request_id: "req-102",
        material_id: "mat-004",
        material_name: "Crushed Sand (M-Sand)",
        quantity: 40,
        unit: "brass",
        estimated_unit_cost: 4200,
        fulfilled_quantity: 40,
      },
    ],
    organization_id: "org1",
    created_at: "2025-05-11T09:15:00Z",
    updated_at: "2025-05-14T16:20:00Z",
  },
  {
    id: "req-103",
    request_number: "MR-PRJ01-003",
    project_id: "a1111111-1111-1111-1111-111111111111",
    status: "pending_approval",
    priority: "critical",
    required_date: "2025-05-25",
    delivery_location: "Tower A & B Masonry Staging Yard",
    requested_by_name: "Suresh Patil (Site Engineer)",
    notes: "Masonry work starting next week. High priority.",
    items: [
      {
        id: "item-103-1",
        request_id: "req-103",
        material_id: "mat-006",
        material_name: "Fly Ash Bricks (9x4x3)",
        quantity: 8000,
        unit: "pcs",
        estimated_unit_cost: 9.5,
        fulfilled_quantity: 0,
      },
    ],
    organization_id: "org1",
    created_at: "2025-05-18T10:00:00Z",
    updated_at: "2025-05-18T10:00:00Z",
  },
];

// Initial demo stock movements
export const INITIAL_DEMO_MOVEMENTS: StockMovement[] = [
  {
    id: "mov-201",
    movement_number: "GRN-PRJ01-001",
    project_id: "a1111111-1111-1111-1111-111111111111",
    material_id: "mat-001",
    material_name: "Ultratech PPC Cement 50kg",
    request_id: "req-101",
    request_item_id: "item-101-1",
    movement_type: "receipt",
    quantity: 200,
    unit: "bags",
    unit_cost: 380,
    total_cost: 76000,
    date: "2025-05-12",
    supplier_name: "Ultratech Building Solutions",
    source_or_location: "Ultratech Bhosari Plant via Truck MH-12-RN-8899",
    reference_number: "DC-78902",
    notes: "200 bags received in dry, intact condition. Batch 2025-05.",
    recorded_by_name: "Ganesh Shinde (Store In-charge)",
    organization_id: "org1",
    created_at: "2025-05-12T11:45:00Z",
  },
  {
    id: "mov-202",
    movement_number: "ISSUE-PRJ01-001",
    project_id: "a1111111-1111-1111-1111-111111111111",
    material_id: "mat-001",
    material_name: "Ultratech PPC Cement 50kg",
    request_id: "req-101",
    movement_type: "issue",
    quantity: 120,
    unit: "bags",
    unit_cost: 380,
    total_cost: 45600,
    date: "2025-05-13",
    source_or_location: "Issued to Tower B Raft Concreting Shift 1",
    reference_number: "ISS-0012",
    notes: "Dispatched to concrete pump mixer unit #2.",
    recorded_by_name: "Ganesh Shinde (Store In-charge)",
    organization_id: "org1",
    created_at: "2025-05-13T09:00:00Z",
  },
  {
    id: "mov-203",
    movement_number: "GRN-PRJ01-002",
    project_id: "a1111111-1111-1111-1111-111111111111",
    material_id: "mat-002",
    material_name: "Tata Tiscon TMT Steel 16mm",
    request_id: "req-101",
    request_item_id: "item-101-2",
    movement_type: "receipt",
    quantity: 3.5,
    unit: "MT",
    unit_cost: 68000,
    total_cost: 238000,
    date: "2025-05-12",
    supplier_name: "Tata Steel Distributors",
    source_or_location: "Kalamboli Yard Trailer DL-01-9988",
    reference_number: "TSD-INV-4412",
    notes: "Mill test certificate MT-9923 verified and archived.",
    recorded_by_name: "Ganesh Shinde (Store In-charge)",
    organization_id: "org1",
    created_at: "2025-05-12T14:30:00Z",
  },
  {
    id: "mov-204",
    movement_number: "ISSUE-PRJ01-002",
    project_id: "a1111111-1111-1111-1111-111111111111",
    material_id: "mat-002",
    material_name: "Tata Tiscon TMT Steel 16mm",
    request_id: "req-101",
    movement_type: "issue",
    quantity: 2.0,
    unit: "MT",
    unit_cost: 68000,
    total_cost: 136000,
    date: "2025-05-14",
    source_or_location: "Issued to Bar Bending Yard for Column C1-C12 Cages",
    reference_number: "ISS-0015",
    notes: "Cut and bent as per BBS revision 2.",
    recorded_by_name: "Ganesh Shinde (Store In-charge)",
    organization_id: "org1",
    created_at: "2025-05-14T10:15:00Z",
  },
  {
    id: "mov-205",
    movement_number: "GRN-PRJ01-003",
    project_id: "a1111111-1111-1111-1111-111111111111",
    material_id: "mat-004",
    material_name: "Crushed Sand (M-Sand)",
    request_id: "req-102",
    request_item_id: "item-102-1",
    movement_type: "receipt",
    quantity: 40,
    unit: "brass",
    unit_cost: 4200,
    total_cost: 168000,
    date: "2025-05-14",
    supplier_name: "Sahyadri Aggregate Supplies",
    source_or_location: "Wagholi Quarry Dumper Fleet",
    reference_number: "SAS-CHALLAN-901",
    notes: "Passed silt test < 3%.",
    recorded_by_name: "Ganesh Shinde (Store In-charge)",
    organization_id: "org1",
    created_at: "2025-05-14T15:00:00Z",
  },
  {
    id: "mov-206",
    movement_number: "ISSUE-PRJ01-003",
    project_id: "a1111111-1111-1111-1111-111111111111",
    material_id: "mat-004",
    material_name: "Crushed Sand (M-Sand)",
    request_id: "req-102",
    movement_type: "issue",
    quantity: 25,
    unit: "brass",
    unit_cost: 4200,
    total_cost: 105000,
    date: "2025-05-15",
    source_or_location: "Issued to Basement Retaining Wall Concreting",
    reference_number: "ISS-0018",
    notes: "Mixed in batch plant M25 concrete mix.",
    recorded_by_name: "Ganesh Shinde (Store In-charge)",
    organization_id: "org1",
    created_at: "2025-05-15T11:30:00Z",
  },
];

const STORAGE_CATALOGUE_KEY = "construction_erp_material_catalogue";
const STORAGE_REQUESTS_KEY = "construction_erp_material_requests";
const STORAGE_MOVEMENTS_KEY = "construction_erp_stock_movements";

// Storage helpers
export function getStoredCatalogue(): Material[] {
  if (typeof window === "undefined") return DEFAULT_CATALOGUE_MATERIALS;
  try {
    const raw = localStorage.getItem(STORAGE_CATALOGUE_KEY);
    if (!raw) return DEFAULT_CATALOGUE_MATERIALS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATALOGUE_MATERIALS;
  } catch {
    return DEFAULT_CATALOGUE_MATERIALS;
  }
}

export function saveStoredCatalogue(materials: Material[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_CATALOGUE_KEY, JSON.stringify(materials));
  } catch (e) {
    console.error("Failed to save material catalogue locally", e);
  }
}

export function getStoredRequests(): MaterialRequest[] {
  if (typeof window === "undefined") return INITIAL_DEMO_REQUESTS;
  try {
    const raw = localStorage.getItem(STORAGE_REQUESTS_KEY);
    if (!raw) return INITIAL_DEMO_REQUESTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_REQUESTS;
  } catch {
    return INITIAL_DEMO_REQUESTS;
  }
}

export function saveStoredRequests(requests: MaterialRequest[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error("Failed to save material requests locally", e);
  }
}

export function getStoredMovements(): StockMovement[] {
  if (typeof window === "undefined") return INITIAL_DEMO_MOVEMENTS;
  try {
    const raw = localStorage.getItem(STORAGE_MOVEMENTS_KEY);
    if (!raw) return INITIAL_DEMO_MOVEMENTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_MOVEMENTS;
  } catch {
    return INITIAL_DEMO_MOVEMENTS;
  }
}

export function saveStoredMovements(movements: StockMovement[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_MOVEMENTS_KEY, JSON.stringify(movements));
  } catch (e) {
    console.error("Failed to save stock movements locally", e);
  }
}

/**
 * Calculates current project register and stock balances from valid non-duplicated transactions
 */
export function calculateProjectMaterials(
  projectId: string,
  catalogue: Material[],
  movements: StockMovement[]
): ProjectMaterialRegisterItem[] {
  const projectMovements = movements.filter((m) => m.project_id === projectId);

  return catalogue.map((mat) => {
    const matMovements = projectMovements.filter((m) => m.material_id === mat.id);

    const receivedQty = matMovements
      .filter((m) => m.movement_type === "receipt")
      .reduce((sum, m) => sum + Number(m.quantity || 0), 0);

    const issuedQty = matMovements
      .filter((m) => m.movement_type === "issue")
      .reduce((sum, m) => sum + Number(m.quantity || 0), 0);

    const adjustmentQty = matMovements
      .filter((m) => m.movement_type === "adjustment")
      .reduce((sum, m) => sum + Number(m.quantity || 0), 0);

    const currentSiteStock = Math.max(0, receivedQty - issuedQty + adjustmentQty);
    const unitCost = Number(mat.unit_price) || 0;
    const totalProjectCost = receivedQty * unitCost;

    let stockStatus: "in-stock" | "low-stock" | "out-of-stock" = "in-stock";
    if (currentSiteStock <= 0) {
      stockStatus = "out-of-stock";
    } else if (currentSiteStock <= (mat.reorder_level || 10)) {
      stockStatus = "low-stock";
    }

    return {
      material_id: mat.id,
      material_name: mat.name,
      category: mat.category,
      unit: mat.unit,
      warehouse_stock: Number(mat.current_stock) || 0,
      received_quantity: Number(receivedQty.toFixed(2)),
      issued_quantity: Number(issuedQty.toFixed(2)),
      current_stock: Number(currentSiteStock.toFixed(2)),
      reorder_level: Number(mat.reorder_level) || 0,
      unit_cost: unitCost,
      total_project_cost: Number(totalProjectCost.toFixed(2)),
      stock_status: stockStatus,
    };
  });
}
