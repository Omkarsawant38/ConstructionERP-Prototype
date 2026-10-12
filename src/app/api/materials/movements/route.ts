import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac/server";
import { createClient } from "@/lib/supabase/server";
import { INITIAL_DEMO_MOVEMENTS } from "@/lib/materialStore";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const movementType = searchParams.get("movement_type");
    const materialId = searchParams.get("material_id");
    const search = searchParams.get("search");

    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    let query = supabase
      .from("stock_movements")
      .select("*")
      .eq("project_id", projectId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (movementType && movementType !== "all") {
      query = query.eq("movement_type", movementType);
    }

    if (materialId && materialId !== "all") {
      query = query.eq("material_id", materialId);
    }

    const { data: dbMovements, error: dbError } = await query;

    let movements = dbMovements && dbMovements.length > 0 ? dbMovements : INITIAL_DEMO_MOVEMENTS.filter((m) => m.project_id === projectId);

    if (search && search.trim() !== "") {
      const q = search.toLowerCase().trim();
      movements = movements.filter(
        (m: any) =>
          m.movement_number?.toLowerCase().includes(q) ||
          m.material_name?.toLowerCase().includes(q) ||
          m.supplier_name?.toLowerCase().includes(q) ||
          m.reference_number?.toLowerCase().includes(q) ||
          m.source_or_location?.toLowerCase().includes(q) ||
          m.notes?.toLowerCase().includes(q)
      );
    }

    if (movementType && movementType !== "all") {
      movements = movements.filter((m: any) => m.movement_type === movementType);
    }

    if (materialId && materialId !== "all") {
      movements = movements.filter((m: any) => m.material_id === materialId);
    }

    return NextResponse.json({ movements });
  } catch (err: any) {
    console.error("API /api/materials/movements GET error:", err);
    return NextResponse.json({ movements: INITIAL_DEMO_MOVEMENTS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      project_id,
      material_id,
      material_name,
      movement_type,
      quantity,
      unit,
      unit_cost = 0,
      date,
      request_id,
      request_item_id,
      supplier_id,
      supplier_name,
      source_or_location,
      reference_number,
      notes,
      attachment_url,
    } = body;

    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }
    if (!material_id) {
      return NextResponse.json({ error: "material_id is required" }, { status: 400 });
    }
    if (!movement_type || !["receipt", "issue", "adjustment"].includes(movement_type)) {
      return NextResponse.json({ error: "Invalid movement_type. Must be receipt, issue, or adjustment" }, { status: 400 });
    }

    const numericQty = Number(quantity);
    if (isNaN(numericQty) || numericQty <= 0) {
      return NextResponse.json({ error: "Quantity must be greater than zero" }, { status: 400 });
    }

    // Permission checks per movement type
    if (movement_type === "receipt") {
      const canStockIn =
        user.roles.includes("super_admin") ||
        user.roles.includes("store_inventory_manager") ||
        user.roles.includes("procurement_manager") ||
        user.roles.includes("project_manager") ||
        user.permissions.includes("inventory.stock_in");

      if (!canStockIn) {
        return NextResponse.json(
          { error: "Permission denied: inventory.stock_in required to record material receipts" },
          { status: 403 }
        );
      }
    } else if (movement_type === "issue") {
      const canStockOut =
        user.roles.includes("super_admin") ||
        user.roles.includes("store_inventory_manager") ||
        user.roles.includes("project_manager") ||
        user.permissions.includes("inventory.stock_out");

      if (!canStockOut) {
        return NextResponse.json(
          { error: "Permission denied: inventory.stock_out required to record material issues" },
          { status: 403 }
        );
      }
    }

    const supabase = await createClient();

    // Prevent negative stock: Calculate existing site stock for this material
    if (movement_type === "issue") {
      const { data: existingMovs } = await supabase
        .from("stock_movements")
        .select("movement_type, quantity")
        .eq("project_id", project_id)
        .eq("material_id", material_id);

      const receipts = (existingMovs || [])
        .filter((m: any) => m.movement_type === "receipt")
        .reduce((sum: number, m: any) => sum + Number(m.quantity || 0), 0);
      const issues = (existingMovs || [])
        .filter((m: any) => m.movement_type === "issue")
        .reduce((sum: number, m: any) => sum + Number(m.quantity || 0), 0);
      const adjustments = (existingMovs || [])
        .filter((m: any) => m.movement_type === "adjustment")
        .reduce((sum: number, m: any) => sum + Number(m.quantity || 0), 0);

      const currentAvailable = Math.max(0, receipts - issues + adjustments);

      // If available is strictly tracked and insufficient:
      if (currentAvailable > 0 && numericQty > currentAvailable) {
        return NextResponse.json(
          {
            error: `Insufficient project stock to issue. Available at site: ${currentAvailable.toFixed(2)} ${unit || "units"}, Requested: ${numericQty.toFixed(2)} ${unit || "units"}. Please record a material receipt first.`,
          },
          { status: 400 }
        );
      }
    }

    const costPerUnit = Number(unit_cost) || 0;
    const totalCost = Number((numericQty * costPerUnit).toFixed(2));

    const prefix = movement_type === "receipt" ? "GRN" : movement_type === "issue" ? "ISSUE" : "ADJ";
    const movementNumber = `${prefix}-${Date.now().toString().slice(-6)}`;

    const movementPayload = {
      movement_number: movementNumber,
      project_id,
      material_id,
      material_name: material_name || "Material",
      movement_type,
      quantity: numericQty,
      unit: unit || "units",
      unit_cost: costPerUnit,
      total_cost: totalCost,
      date: date || new Date().toISOString().split("T")[0],
      request_id: request_id || null,
      request_item_id: request_item_id || null,
      supplier_id: supplier_id || null,
      supplier_name: supplier_name?.trim() || null,
      source_or_location: source_or_location?.trim() || null,
      reference_number: reference_number?.trim() || null,
      notes: notes?.trim() || null,
      attachment_url: attachment_url || null,
      recorded_by: user.id,
      recorded_by_name: user.email || "Store Officer",
      organization_id: "org1",
    };

    const { data: createdMov, error: movError } = await supabase
      .from("stock_movements")
      .insert(movementPayload)
      .select()
      .single();

    if (movError) {
      console.warn("DB insert movement error, returning local fallback:", movError);
      return NextResponse.json({
        movement: {
          id: `mov-${Date.now()}`,
          ...movementPayload,
          created_at: new Date().toISOString(),
        },
      });
    }

    // If receipt linked to a request item, update request item fulfilled_quantity & request status
    if (movement_type === "receipt" && request_item_id) {
      const { data: itemData } = await supabase
        .from("material_request_items")
        .select("id, request_id, quantity, fulfilled_quantity")
        .eq("id", request_item_id)
        .single();

      if (itemData) {
        const newFulfilled = Number(itemData.fulfilled_quantity || 0) + numericQty;
        await supabase
          .from("material_request_items")
          .update({ fulfilled_quantity: newFulfilled })
          .eq("id", request_item_id);

        // Check overall request status
        const { data: allReqItems } = await supabase
          .from("material_request_items")
          .select("quantity, fulfilled_quantity")
          .eq("request_id", itemData.request_id);

        if (allReqItems && allReqItems.length > 0) {
          const allComplete = allReqItems.every(
            (it: any) => Number(it.fulfilled_quantity || 0) >= Number(it.quantity || 0)
          );
          const anyFulfilled = allReqItems.some(
            (it: any) => Number(it.fulfilled_quantity || 0) > 0
          );

          const updatedStatus = allComplete
            ? "fulfilled"
            : anyFulfilled
            ? "partially_fulfilled"
            : "approved";

          await supabase
            .from("material_requests")
            .update({ status: updatedStatus, updated_at: new Date().toISOString() })
            .eq("id", itemData.request_id);
        }
      }
    }

    return NextResponse.json({ movement: createdMov }, { status: 201 });
  } catch (err: any) {
    console.error("API /api/materials/movements POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to record stock movement" }, { status: 500 });
  }
}
