import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // RBAC check: only accountant or super_admin can approve expenses
    const canApprove =
      user.roles.includes("super_admin") ||
      user.roles.includes("accountant") ||
      user.permissions.includes("expenses.approve") ||
      user.permissions.includes("finance.approve");

    if (!canApprove) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to approve expenses" }, { status: 403 });
    }

    const body = await request.json();
    const { action, rejection_reason } = body; // action: 'approve' | 'reject'

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check expense
    const { data: existingExpense, error: findError } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existingExpense) {
      return NextResponse.json({ error: "Expense record not found" }, { status: 404 });
    }

    // Workflow rule: Users cannot approve their own submission if created by them
    if (existingExpense.recorded_by === user.id && !user.roles.includes("super_admin")) {
      return NextResponse.json(
        { error: "Separation of duties: You cannot approve an expense recorded by yourself." },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    const { data: updated, error: updateError } = await supabase
      .from("expenses")
      .update({
        status: newStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: action === "reject" ? rejection_reason || "Rejected by accountant" : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Recalculate project totals
    if (existingExpense.project_id) {
      try {
        const { data: allApproved } = await supabase
          .from("expenses")
          .select("amount")
          .eq("project_id", existingExpense.project_id)
          .eq("status", "approved");

        const totalActual = (allApproved || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        await supabase
          .from("projects")
          .update({ actual_expenses: totalActual })
          .eq("id", existingExpense.project_id);
      } catch (e) {
        console.warn("Budget recalculation note:", e);
      }
    }

    return NextResponse.json({
      success: true,
      expense: updated,
      message: `Expense ${newStatus} successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Approval process failed" }, { status: 500 });
  }
}
