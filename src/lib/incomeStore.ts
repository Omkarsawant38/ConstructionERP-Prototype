"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project, ProjectUnitIncome, UnitIncomeFormData, UnitPaymentStatus } from "@/types";

const LOCAL_STORAGE_KEY_PREFIX = "construction_erp_unit_income_";
const UPDATE_EVENT = "construction_erp_unit_income_updated";

function getLocalKey(projectId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${projectId}`;
}

export function getStoredUnits(projectId: string): ProjectUnitIncome[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getLocalKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read unit income records from localStorage:", err);
    return [];
  }
}

export function saveStoredUnits(projectId: string, units: ProjectUnitIncome[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getLocalKey(projectId), JSON.stringify(units));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { projectId } }));
  } catch (err) {
    console.error("Failed to save unit income records to localStorage:", err);
  }
}

/**
 * Standard default units data tailored to projects
 */
export function getDefaultUnits(project: Project): ProjectUnitIncome[] {
  const isGreenValley =
    project.id === "p1" ||
    project.project_code?.toLowerCase() === "prj-001" ||
    project.name.toLowerCase().includes("green valley");

  const isSkyline =
    project.id === "p2" ||
    project.project_code?.toLowerCase() === "prj-002" ||
    project.name.toLowerCase().includes("skyline");

  if (isGreenValley) {
    return [
      {
        id: `unit-${project.id}-1`,
        project_id: project.id,
        unit_number: "Flat A-101",
        unit_type: "2 BHK Executive",
        floor: "1st Floor (Tower A)",
        carpet_area_sqft: 980,
        owner_name: "Anita & Ramesh Kulkarni",
        owner_phone: "+91 98201 44521",
        owner_email: "ramesh.kulkarni@gmail.com",
        total_amount: 6500000,
        received_amount: 6500000,
        pending_amount: 0,
        status: "full_paid",
        booking_date: "2024-02-10",
        payment_milestone: "100% Paid (Possession Ready)",
        notes: "Full payment cleared via HDFC Home Loan. Registration completed.",
        is_sample: true,
        created_at: "2024-02-10T10:00:00Z",
        updated_at: "2024-08-15T12:00:00Z",
      },
      {
        id: `unit-${project.id}-2`,
        project_id: project.id,
        unit_number: "Flat A-203",
        unit_type: "3 BHK Premium",
        floor: "2nd Floor (Tower A)",
        carpet_area_sqft: 1450,
        owner_name: "Dr. Vikram & Sneha Joshi",
        owner_phone: "+91 98902 33412",
        owner_email: "dr.vikram.joshi@punehealth.org",
        total_amount: 9800000,
        received_amount: 7800000,
        pending_amount: 2000000,
        status: "partially_paid",
        booking_date: "2024-03-05",
        payment_milestone: "7th Slab Cast Stage Completed",
        notes: "Next installment of ₹ 20L due upon completion of external plastering.",
        is_sample: true,
        created_at: "2024-03-05T10:00:00Z",
        updated_at: "2024-09-01T14:30:00Z",
      },
      {
        id: `unit-${project.id}-3`,
        project_id: project.id,
        unit_number: "Flat B-501",
        unit_type: "3 BHK Garden View",
        floor: "5th Floor (Tower B)",
        carpet_area_sqft: 1580,
        owner_name: "Suresh & Neha Deshmukh",
        owner_phone: "+91 97654 88910",
        owner_email: "suresh.deshmukh@tcs.com",
        total_amount: 11500000,
        received_amount: 7000000,
        pending_amount: 4500000,
        status: "partially_paid",
        booking_date: "2024-04-18",
        payment_milestone: "Brickwork & Internal Piping Complete",
        notes: "₹ 45L balance linked to flooring & MEP final sign-off.",
        is_sample: true,
        created_at: "2024-04-18T10:00:00Z",
        updated_at: "2024-09-12T11:15:00Z",
      },
      {
        id: `unit-${project.id}-4`,
        project_id: project.id,
        unit_number: "Flat B-902",
        unit_type: "4 BHK Royal Penthouse",
        floor: "9th Floor (Tower B)",
        carpet_area_sqft: 2450,
        owner_name: "Meera & Rahul Singhania",
        owner_phone: "+91 99220 55667",
        owner_email: "rahul@singhaniaexports.in",
        total_amount: 19500000,
        received_amount: 6000000,
        pending_amount: 13500000,
        status: "booked",
        booking_date: "2024-06-25",
        payment_milestone: "Booking Token & Plinth Stage Complete",
        notes: "Agreement registered. Next milestone demand letter sent for 4th slab.",
        is_sample: true,
        created_at: "2024-06-25T10:00:00Z",
        updated_at: "2024-08-20T16:00:00Z",
      },
      {
        id: `unit-${project.id}-5`,
        project_id: project.id,
        unit_number: "Flat C-304",
        unit_type: "2 BHK Compact",
        floor: "3rd Floor (Tower C)",
        carpet_area_sqft: 920,
        owner_name: "Priya & Amit Sharma",
        owner_phone: "+91 98112 77890",
        owner_email: "priya.sharma@infosys.com",
        total_amount: 6200000,
        received_amount: 6200000,
        pending_amount: 0,
        status: "full_paid",
        booking_date: "2024-01-20",
        payment_milestone: "100% Paid (Keys Handed Over)",
        notes: "Possession letter signed. Maintenance agreement paid in advance.",
        is_sample: true,
        created_at: "2024-01-20T10:00:00Z",
        updated_at: "2024-07-10T09:30:00Z",
      },
      {
        id: `unit-${project.id}-6`,
        project_id: project.id,
        unit_number: "Shop G-02",
        unit_type: "Commercial Retail Store",
        floor: "Ground Floor Commercial Plaza",
        carpet_area_sqft: 540,
        owner_name: "Mahavir Traders (Nitin Shah)",
        owner_phone: "+91 98230 11988",
        owner_email: "nitin.shah@mahavirtraders.com",
        total_amount: 8500000,
        received_amount: 5500000,
        pending_amount: 3000000,
        status: "partially_paid",
        booking_date: "2024-05-12",
        payment_milestone: "RCC Structure & Glass Facade Done",
        notes: "Final balance payable on occupancy certificate issuance.",
        is_sample: true,
        created_at: "2024-05-12T10:00:00Z",
        updated_at: "2024-09-05T15:20:00Z",
      },
    ];
  }

  if (isSkyline) {
    return [
      {
        id: `unit-${project.id}-1`,
        project_id: project.id,
        unit_number: "Office Suite 401",
        unit_type: "Grade-A Commercial Office",
        floor: "4th Floor",
        carpet_area_sqft: 1850,
        owner_name: "Apex Tech Solutions LLP",
        owner_phone: "+91 98200 66778",
        owner_email: "accounts@apextech.co.in",
        total_amount: 24000000,
        received_amount: 18000000,
        pending_amount: 6000000,
        status: "partially_paid",
        booking_date: "2024-04-01",
        payment_milestone: "Facade & Core MEP Ready",
        notes: "Final tranche pending interior handover inspection.",
        is_sample: true,
        created_at: "2024-04-01T10:00:00Z",
        updated_at: "2024-09-10T11:00:00Z",
      },
      {
        id: `unit-${project.id}-2`,
        project_id: project.id,
        unit_number: "Office Suite 702",
        unit_type: "Corporate Headquarters Suite",
        floor: "7th Floor",
        carpet_area_sqft: 3200,
        owner_name: "Horizon Wealth Advisors",
        owner_phone: "+91 99880 11223",
        owner_email: "invest@horizonwealth.com",
        total_amount: 42000000,
        received_amount: 42000000,
        pending_amount: 0,
        status: "full_paid",
        booking_date: "2024-02-15",
        payment_milestone: "100% Cleared (All Milestones)",
        notes: "Title registered in Mumbai Sub-Registrar Office.",
        is_sample: true,
        created_at: "2024-02-15T10:00:00Z",
        updated_at: "2024-08-30T14:00:00Z",
      },
    ];
  }

  // Generic fallback for any other site/project
  return [
    {
      id: `unit-${project.id}-1`,
      project_id: project.id,
      unit_number: "Unit 101",
      unit_type: "2 BHK Premium",
      floor: "1st Floor",
      carpet_area_sqft: 1050,
      owner_name: "Sunil Gaikwad",
      owner_phone: "+91 98220 12345",
      owner_email: "sunil.gaikwad@example.com",
      total_amount: 6800000,
      received_amount: 4800000,
      pending_amount: 2000000,
      status: "partially_paid",
      booking_date: project.start_date || "2024-03-01",
      payment_milestone: "Foundation & Slab 2 Cast",
      notes: "Standard construction linked payment plan.",
      is_sample: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: `unit-${project.id}-2`,
      project_id: project.id,
      unit_number: "Unit 202",
      unit_type: "3 BHK Deluxe",
      floor: "2nd Floor",
      carpet_area_sqft: 1400,
      owner_name: "Pooja & Rohan Verma",
      owner_phone: "+91 98450 67890",
      owner_email: "rohan.verma@example.com",
      total_amount: 9200000,
      received_amount: 9200000,
      pending_amount: 0,
      status: "full_paid",
      booking_date: project.start_date || "2024-02-15",
      payment_milestone: "100% Payment Cleared",
      notes: "Full payment received by bank transfer.",
      is_sample: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

/**
 * Hook to manage project unit income & owner allocations
 */
export function useProjectIncome(project: Project | null | undefined) {
  const [units, setUnits] = useState<ProjectUnitIncome[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    if (!project) {
      setUnits([]);
      setLoading(false);
      return;
    }

    const stored = getStoredUnits(project.id);
    if (stored.length > 0) {
      setUnits(stored);
    } else {
      const defaults = getDefaultUnits(project);
      setUnits(defaults);
      saveStoredUnits(project.id, defaults);
    }
    setLoading(false);
  }, [project?.id, project?.name, project?.project_code]);

  useEffect(() => {
    loadData();

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.projectId || detail.projectId === project?.id) {
        loadData();
      }
    };

    window.addEventListener(UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(UPDATE_EVENT, handleUpdate);
  }, [loadData, project?.id]);

  const addUnit = (formData: UnitIncomeFormData) => {
    if (!project) return;
    const now = new Date().toISOString();
    const total = Number(formData.total_amount) || 0;
    const received = Math.min(total, Number(formData.received_amount) || 0);
    const pending = Math.max(0, total - received);

    let calculatedStatus = formData.status;
    if (received >= total && total > 0) {
      calculatedStatus = "full_paid";
    } else if (received > 0) {
      calculatedStatus = "partially_paid";
    }

    const newUnit: ProjectUnitIncome = {
      id: `unit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      project_id: project.id,
      unit_number: formData.unit_number.trim(),
      unit_type: formData.unit_type.trim(),
      floor: formData.floor?.trim(),
      carpet_area_sqft: Number(formData.carpet_area_sqft) || 0,
      owner_name: formData.owner_name.trim(),
      owner_phone: formData.owner_phone?.trim(),
      owner_email: formData.owner_email?.trim(),
      total_amount: total,
      received_amount: received,
      pending_amount: pending,
      status: calculatedStatus,
      booking_date: formData.booking_date || now.split("T")[0],
      payment_milestone: formData.payment_milestone?.trim(),
      notes: formData.notes?.trim(),
      created_at: now,
      updated_at: now,
    };

    const updated = [newUnit, ...units];
    setUnits(updated);
    saveStoredUnits(project.id, updated);
    return newUnit;
  };

  const updateUnit = (unitId: string, formData: Partial<UnitIncomeFormData>) => {
    if (!project) return;
    const now = new Date().toISOString();

    const updated = units.map(u => {
      if (u.id !== unitId) return u;

      const total = formData.total_amount !== undefined ? Number(formData.total_amount) || 0 : u.total_amount;
      const received = formData.received_amount !== undefined ? Number(formData.received_amount) || 0 : u.received_amount;
      const pending = Math.max(0, total - received);

      let status = formData.status || u.status;
      if (received >= total && total > 0) {
        status = "full_paid";
      } else if (received > 0 && status === "booked") {
        status = "partially_paid";
      }

      return {
        ...u,
        unit_number: formData.unit_number !== undefined ? formData.unit_number.trim() : u.unit_number,
        unit_type: formData.unit_type !== undefined ? formData.unit_type.trim() : u.unit_type,
        floor: formData.floor !== undefined ? formData.floor?.trim() : u.floor,
        carpet_area_sqft: formData.carpet_area_sqft !== undefined ? Number(formData.carpet_area_sqft) || 0 : u.carpet_area_sqft,
        owner_name: formData.owner_name !== undefined ? formData.owner_name.trim() : u.owner_name,
        owner_phone: formData.owner_phone !== undefined ? formData.owner_phone?.trim() : u.owner_phone,
        owner_email: formData.owner_email !== undefined ? formData.owner_email?.trim() : u.owner_email,
        total_amount: total,
        received_amount: received,
        pending_amount: pending,
        status,
        booking_date: formData.booking_date || u.booking_date,
        payment_milestone: formData.payment_milestone !== undefined ? formData.payment_milestone?.trim() : u.payment_milestone,
        notes: formData.notes !== undefined ? formData.notes?.trim() : u.notes,
        updated_at: now,
      };
    });

    setUnits(updated);
    saveStoredUnits(project.id, updated);
  };

  const recordPayment = (unitId: string, paymentAmount: number, paymentMilestone?: string, notes?: string) => {
    if (!project || paymentAmount <= 0) return;
    const now = new Date().toISOString();

    const updated = units.map(u => {
      if (u.id !== unitId) return u;
      const newReceived = Math.min(u.total_amount, u.received_amount + paymentAmount);
      const newPending = Math.max(0, u.total_amount - newReceived);
      const newStatus: UnitPaymentStatus = newReceived >= u.total_amount ? "full_paid" : "partially_paid";

      return {
        ...u,
        received_amount: newReceived,
        pending_amount: newPending,
        status: newStatus,
        payment_milestone: paymentMilestone || u.payment_milestone,
        notes: notes ? (u.notes ? `${u.notes} | ${notes}` : notes) : u.notes,
        updated_at: now,
      };
    });

    setUnits(updated);
    saveStoredUnits(project.id, updated);
  };

  const deleteUnit = (unitId: string) => {
    if (!project) return;
    const updated = units.filter(u => u.id !== unitId);
    setUnits(updated);
    saveStoredUnits(project.id, updated);
  };

  // Financial calculations
  const totalUnits = units.length;
  const totalSalesValue = units.reduce((acc, u) => acc + (u.total_amount || 0), 0);
  const totalReceived = units.reduce((acc, u) => acc + (u.received_amount || 0), 0);
  const totalPending = Math.max(0, totalSalesValue - totalReceived);
  const collectionPercentage = totalSalesValue > 0 ? Math.round((totalReceived / totalSalesValue) * 100) : 0;
  const fullyPaidCount = units.filter(u => u.status === "full_paid").length;
  const partiallyPaidCount = units.filter(u => u.status === "partially_paid").length;
  const bookedCount = units.filter(u => u.status === "booked").length;

  return {
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
    updateUnit,
    recordPayment,
    deleteUnit,
    refreshUnits: loadData,
  };
}
