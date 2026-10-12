import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac/server";
import { createClient } from "@/lib/supabase/server";
import { demoProjects } from "@/lib/demo-data";
import { DEFAULT_CATALOGUE_MATERIALS } from "@/lib/materialStore";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    let dbProjects: any[] = [];
    let dbMaterials: any[] = [];
    let dbContractors: any[] = [];
    let dbWorkers: any[] = [];

    try {
      const supabase = await createClient();

      // 1. Fetch Projects from Supabase
      const { data: pData } = await supabase
        .from("projects")
        .select("id, project_code, name, approved_budget, actual_expenses, status, city")
        .order("created_at", { ascending: false });
      if (pData && pData.length > 0) dbProjects = pData;

      // 2. Fetch Materials from Supabase
      const { data: mData } = await supabase
        .from("materials")
        .select("id, name, category, unit, unit_price, current_stock, supplier_name")
        .order("name", { ascending: true });
      if (mData && mData.length > 0) dbMaterials = mData;

      // 3. Fetch Contractors & Workers
      const { data: cData } = await supabase
        .from("contractors")
        .select("id, name, company, specialization, phone, email")
        .order("name", { ascending: true });
      if (cData && cData.length > 0) dbContractors = cData;

      // 4. Fetch Profiles
      const { data: wData } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, designation")
        .order("full_name", { ascending: true });
      if (wData && wData.length > 0) dbWorkers = wData;
    } catch (dbErr) {
      console.warn("DB fetch error in reference-data, falling back to local seeds:", dbErr);
    }

    // Projects list with fallback
    const projectsList =
      dbProjects.length > 0
        ? dbProjects
        : demoProjects.map((p) => ({
            id: p.id,
            project_code: p.project_code,
            name: p.name,
            approved_budget: p.approved_budget,
            actual_expenses: p.actual_expenses || 0,
            status: p.status,
            city: p.city,
          }));

    // Materials list with fallback
    const materialsList =
      dbMaterials.length > 0
        ? dbMaterials.map((m: any) => ({
            id: m.id,
            name: m.name,
            category: m.category,
            unit: m.unit || "units",
            unit_price: Number(m.unit_price) || 0,
            current_stock: Number(m.current_stock) || 0,
            supplier_name: m.supplier_name,
          }))
        : DEFAULT_CATALOGUE_MATERIALS.map((m) => ({
            id: m.id,
            name: m.name,
            category: m.category,
            unit: m.unit,
            unit_price: m.unit_price || 0,
            current_stock: m.current_stock || 0,
            supplier_name: m.supplier_name,
          }));

    // Format worker list combining contractors and staff for flexible labor billing
    const fallbackWorkers = [
      { id: "c1", name: "Apex Water Proofing (Apex Solutions Ltd) — Waterproofing", trade: "Waterproofing", unit: "Day", default_rate: 1200, type: "Contractor Labor" },
      { id: "c2", name: "Om Electricals & MEP (Om Engineering Works) — Electrical & HVAC", trade: "Electrical & HVAC", unit: "Day", default_rate: 1400, type: "Contractor Labor" },
      { id: "c3", name: "Shree Ganesh Steel Fixers (Shree Ganesh Infra) — Bar Bending", trade: "Structural Bar Bending", unit: "MT", default_rate: 4500, type: "Contractor Labor" },
      { id: "w1", name: "Site Labor Gang A (10 Masons + Helpers)", trade: "Civil & Masonry", unit: "Shift", default_rate: 9500, type: "Daily Labor Gang" },
      { id: "w2", name: "PCC Concrete Pouring Workforce (8 Workers)", trade: "Concreting", unit: "Shift", default_rate: 7600, type: "Daily Labor Gang" },
    ];

    const workersList =
      dbContractors.length > 0 || dbWorkers.length > 0
        ? [
            ...dbContractors.map((c: any) => ({
              id: c.id,
              name: `${c.name} (${c.company || c.specialization || "Contractor"})`,
              trade: c.specialization || "General Construction",
              unit: "Day",
              default_rate: 1200,
              type: "Contractor Labor",
            })),
            ...dbWorkers.map((w: any) => ({
              id: w.id,
              name: `${w.full_name || w.email} (${w.designation || w.role || "Staff"})`,
              trade: w.designation || "Site Work",
              unit: "Shift",
              default_rate: 950,
              type: "Internal Workforce",
            })),
          ]
        : fallbackWorkers;

    return NextResponse.json({
      projects: projectsList,
      materials: materialsList,
      workers: workersList,
    });
  } catch (err: any) {
    console.error("API /api/expenses/reference-data error:", err);
    return NextResponse.json(
      {
        projects: demoProjects.map((p) => ({
          id: p.id,
          project_code: p.project_code,
          name: p.name,
          approved_budget: p.approved_budget,
          actual_expenses: p.actual_expenses || 0,
          status: p.status,
          city: p.city,
        })),
        materials: DEFAULT_CATALOGUE_MATERIALS,
        workers: [],
      },
      { status: 200 }
    );
  }
}
