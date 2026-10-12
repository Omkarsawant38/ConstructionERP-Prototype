import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const supabase = await createClient();

    const supabasePayload: Record<string, any> = {};
    if (updates.name !== undefined) supabasePayload.name = updates.name.trim();
    if (updates.project_code !== undefined) supabasePayload.project_code = updates.project_code.trim();
    if (updates.description !== undefined) supabasePayload.description = updates.description?.trim() || null;
    if (updates.client_name !== undefined) supabasePayload.client_name = updates.client_name?.trim() || null;
    if (updates.project_type !== undefined) supabasePayload.project_type = updates.project_type;
    if (updates.construction_category !== undefined) supabasePayload.construction_category = updates.construction_category;
    if (updates.site_address !== undefined) supabasePayload.site_address = updates.site_address?.trim() || null;
    if (updates.city !== undefined) supabasePayload.city = updates.city?.trim() || null;
    if (updates.state !== undefined) supabasePayload.state = updates.state;
    if (updates.postal_code !== undefined) supabasePayload.postal_code = updates.postal_code?.trim() || null;
    if (updates.start_date !== undefined) supabasePayload.start_date = updates.start_date;
    if (updates.end_date !== undefined) supabasePayload.end_date = updates.end_date;
    if (updates.actual_end_date !== undefined) supabasePayload.actual_end_date = updates.actual_end_date || null;
    if (updates.approved_budget !== undefined) supabasePayload.approved_budget = Number(updates.approved_budget);
    if (updates.currency !== undefined) supabasePayload.currency = updates.currency;
    if (updates.status !== undefined) supabasePayload.status = updates.status;
    if (updates.progress !== undefined) supabasePayload.progress = Number(updates.progress);
    if (updates.health_status !== undefined) supabasePayload.health_status = updates.health_status;
    if (updates.project_manager_name !== undefined) supabasePayload.project_manager_name = updates.project_manager_name?.trim() || "Unassigned";
    if (updates.financial_notes !== undefined) supabasePayload.financial_notes = updates.financial_notes?.trim() || null;
    supabasePayload.updated_at = new Date().toISOString();

    let query = supabase.from("projects").update(supabasePayload);
    if (UUID_REGEX.test(id)) {
      query = query.eq("id", id);
    } else {
      query = query.eq("project_code", id);
    }

    const { data, error } = await query.select().maybeSingle();

    if (error) {
      console.error("API /api/projects/[id] PATCH DB error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      project: data,
      message: "Project updated in database",
    });
  } catch (err: any) {
    console.error("API /api/projects/[id] PATCH error:", err);
    return NextResponse.json({ error: err.message || "Failed to update project" }, { status: 500 });
  }
}
