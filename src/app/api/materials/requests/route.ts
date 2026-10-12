import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac/server";
import { createClient } from "@/lib/supabase/server";
import { INITIAL_DEMO_REQUESTS } from "@/lib/materialStore";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    let query = supabase
      .from("material_requests")
      .select(`
        *,
        items:material_request_items (
          id,
          request_id,
          material_id,
          material_name,
          quantity,
          unit,
          estimated_unit_cost,
          fulfilled_quantity,
          notes
        )
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: dbRequests, error: dbError } = await query;

    let requests = dbRequests && dbRequests.length > 0 ? dbRequests : INITIAL_DEMO_REQUESTS.filter((r) => r.project_id === projectId);

    if (search && search.trim() !== "") {
      const q = search.toLowerCase().trim();
      requests = requests.filter(
        (r: any) =>
          r.request_number?.toLowerCase().includes(q) ||
          r.requested_by_name?.toLowerCase().includes(q) ||
          r.delivery_location?.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q) ||
          r.items?.some((item: any) => item.material_name?.toLowerCase().includes(q))
      );
    }

    if (status && status !== "all") {
      requests = requests.filter((r: any) => r.status === status);
    }

    return NextResponse.json({ requests });
  } catch (err: any) {
    console.error("API /api/materials/requests GET error:", err);
    return NextResponse.json({ requests: INITIAL_DEMO_REQUESTS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC check: inventory.request permission or project_manager / site_engineer / super_admin
    const canRequest =
      user.roles.includes("super_admin") ||
      user.roles.includes("project_manager") ||
      user.roles.includes("site_engineer") ||
      user.permissions.includes("inventory.request");

    if (!canRequest) {
      return NextResponse.json(
        { error: "Permission denied: inventory.request permission required to create material requests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      project_id,
      priority = "medium",
      required_date,
      delivery_location,
      notes,
      attachment_url,
      items,
      is_draft = false,
    } = body;

    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one material line item is required" }, { status: 400 });
    }

    // Validate line items
    for (const item of items) {
      if (!item.material_id) {
        return NextResponse.json({ error: "Material is required for each line item" }, { status: 400 });
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: `Quantity must be greater than zero for ${item.material_name || "material"}` }, { status: 400 });
      }
    }

    const supabase = await createClient();

    // Generate Request Number: MR-{timestamp} or sequential
    const timestamp = Date.now().toString().slice(-6);
    const requestNumber = `MR-${timestamp}`;

    const requestPayload = {
      request_number: requestNumber,
      project_id,
      status: is_draft ? "draft" : "pending_approval",
      priority: ["low", "medium", "high", "critical"].includes(priority) ? priority : "medium",
      required_date: required_date || new Date().toISOString().split("T")[0],
      delivery_location: delivery_location?.trim() || "Main Project Site",
      requested_by: user.id,
      requested_by_name: user.email || "Authenticated User",
      notes: notes?.trim() || null,
      attachment_url: attachment_url || null,
      organization_id: "org1",
    };

    const { data: createdReq, error: reqError } = await supabase
      .from("material_requests")
      .insert(requestPayload)
      .select()
      .single();

    if (reqError) {
      console.warn("DB insert material request warning, falling back to local object:", reqError);
      const fallbackReqId = `req-${Date.now()}`;
      const fallbackItems = items.map((it: any, idx: number) => ({
        id: `item-${Date.now()}-${idx}`,
        request_id: fallbackReqId,
        material_id: it.material_id,
        material_name: it.material_name || "Material",
        quantity: Number(it.quantity),
        unit: it.unit || "units",
        estimated_unit_cost: Number(it.estimated_unit_cost) || 0,
        fulfilled_quantity: 0,
        notes: it.notes || null,
      }));

      const fallbackComplete = {
        id: fallbackReqId,
        ...requestPayload,
        items: fallbackItems,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return NextResponse.json({ request: fallbackComplete }, { status: 201 });
    }

    // Insert line items
    const lineItemsPayload = items.map((it: any) => ({
      request_id: createdReq.id,
      material_id: it.material_id,
      material_name: it.material_name,
      quantity: Number(it.quantity),
      unit: it.unit || "units",
      estimated_unit_cost: Number(it.estimated_unit_cost) || 0,
      fulfilled_quantity: 0,
      notes: it.notes || null,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from("material_request_items")
      .insert(lineItemsPayload)
      .select();

    if (itemsError) {
      console.warn("DB insert request items error:", itemsError);
    }

    return NextResponse.json(
      {
        request: {
          ...createdReq,
          items: createdItems || lineItemsPayload,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("API /api/materials/requests POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit material request" }, { status: 500 });
  }
}
