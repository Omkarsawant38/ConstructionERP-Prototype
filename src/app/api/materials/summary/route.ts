import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac/server";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_CATALOGUE_MATERIALS,
  INITIAL_DEMO_REQUESTS,
  INITIAL_DEMO_MOVEMENTS,
  calculateProjectMaterials,
} from "@/lib/materialStore";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch materials catalogue
    const { data: dbMaterials } = await supabase
      .from("materials")
      .select("*")
      .order("name", { ascending: true });
    const catalogue = dbMaterials && dbMaterials.length > 0 ? dbMaterials : DEFAULT_CATALOGUE_MATERIALS;

    // 2. Fetch movements for this project
    const { data: dbMovements } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("project_id", projectId)
      .order("date", { ascending: false });
    const movements =
      dbMovements && dbMovements.length > 0
        ? dbMovements
        : INITIAL_DEMO_MOVEMENTS.filter((m) => m.project_id === projectId);

    // 3. Fetch requests for this project
    const { data: dbRequests } = await supabase
      .from("material_requests")
      .select(`
        *,
        items:material_request_items (*)
      `)
      .eq("project_id", projectId);
    const requests =
      dbRequests && dbRequests.length > 0
        ? dbRequests
        : INITIAL_DEMO_REQUESTS.filter((r) => r.project_id === projectId);

    // 4. Fetch recognized material expenses from expenses table for financial integration
    const { data: dbExpenses } = await supabase
      .from("expenses")
      .select("amount, expense_type, category, status")
      .eq("project_id", projectId);

    const recognizedMaterialExpenses = (dbExpenses || [])
      .filter(
        (e: any) =>
          (e.expense_type === "Material" || e.category === "materials") &&
          e.status !== "rejected" &&
          e.status !== "draft"
      )
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    // Calculate register items
    const registerItems = calculateProjectMaterials(projectId, catalogue, movements);

    // KPI Aggregates
    const activeMaterials = registerItems.filter((m) => m.received_quantity > 0 || m.current_stock > 0);
    const activeMaterialTypes = activeMaterials.length;
    const pendingRequests = requests.filter(
      (r) => r.status === "pending_approval" || r.status === "draft"
    ).length;
    const totalReceivedQuantity = registerItems.reduce((sum, m) => sum + m.received_quantity, 0);

    // Goods Received Value (from stock receipts)
    const goodsReceivedValue = movements
      .filter((m: any) => m.movement_type === "receipt")
      .reduce((sum: number, m: any) => sum + (Number(m.total_cost) || 0), 0);

    // Primary project material cost: uses recognized actual expenses if recorded, otherwise goods received value
    const projectMaterialCost = recognizedMaterialExpenses > 0 ? recognizedMaterialExpenses : goodsReceivedValue;

    return NextResponse.json({
      register: registerItems,
      kpis: {
        activeMaterialTypes,
        pendingRequests,
        totalReceivedQuantity: Number(totalReceivedQuantity.toFixed(2)),
        projectMaterialCost,
        goodsReceivedValue,
        recognizedMaterialExpenses,
        totalRequestsCount: requests.length,
        totalMovementsCount: movements.length,
      },
    });
  } catch (err: any) {
    console.error("API /api/materials/summary error:", err);
    return NextResponse.json({ error: err.message || "Failed to load summary" }, { status: 500 });
  }
}
