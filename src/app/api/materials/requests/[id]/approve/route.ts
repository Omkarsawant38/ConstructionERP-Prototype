import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: requestId } = await context.params;
    const body = await request.json();
    const { action, notes, rejection_reason } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Action must be 'approve' or 'reject'" }, { status: 400 });
    }

    // RBAC check: Must have inventory.approve permission or be super_admin / owner_director / project_manager
    const canApprove =
      user.roles.includes("super_admin") ||
      user.roles.includes("owner_director") ||
      user.roles.includes("project_manager") ||
      user.permissions.includes("inventory.approve");

    if (!canApprove) {
      return NextResponse.json(
        { error: "Permission denied: inventory.approve permission required to approve or reject requests" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Fetch existing request to verify creator and current status
    const { data: existingReq } = await supabase
      .from("material_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    // Anti-self-approval rule: users cannot approve their own requests unless super_admin
    if (existingReq && existingReq.requested_by === user.id && !user.roles.includes("super_admin")) {
      return NextResponse.json(
        { error: "Separation of duties: You cannot approve your own material request. Another authorized manager must approve it." },
        { status: 403 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const updatePayload = {
      status: newStatus,
      approved_by: user.id,
      approved_by_name: user.email || "Approver",
      approved_at: new Date().toISOString(),
      approval_notes: notes || null,
      rejection_reason: action === "reject" ? rejection_reason || notes || "Rejected by reviewer" : null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedReq, error: updateError } = await supabase
      .from("material_requests")
      .update(updatePayload)
      .eq("id", requestId)
      .select(`
        *,
        items:material_request_items (*)
      `)
      .single();

    if (updateError) {
      console.warn("DB update request warning, fallback response:", updateError);
      return NextResponse.json({
        request: {
          id: requestId,
          ...updatePayload,
        },
      });
    }

    return NextResponse.json({ request: updatedReq });
  } catch (err: any) {
    console.error("API /api/materials/requests/[id]/approve error:", err);
    return NextResponse.json({ error: err.message || "Failed to process request approval" }, { status: 500 });
  }
}
