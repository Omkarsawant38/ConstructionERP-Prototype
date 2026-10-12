import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("API /api/projects GET DB error:", error.message);
      return NextResponse.json({ projects: [], error: error.message }, { status: 200 });
    }

    return NextResponse.json({ projects: data || [] }, { status: 200 });
  } catch (err: any) {
    console.error("API /api/projects GET unexpected error:", err);
    return NextResponse.json({ projects: [], error: err.message }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    // Case 1: Batch sync of local cached projects
    if (Array.isArray(body.projectsToSync)) {
      const results: any[] = [];
      const errors: any[] = [];

      for (const p of body.projectsToSync) {
        if (!p.project_code || !p.name) continue;

        const payload: Record<string, any> = {
          name: p.name.trim(),
          project_code: p.project_code.trim(),
          description: p.description || null,
          client_name: p.client_name || null,
          project_type: p.project_type || "Residential",
          construction_category: p.construction_category || "High-Rise",
          site_address: p.site_address || null,
          city: p.city || null,
          state: p.state || "Maharashtra",
          postal_code: p.postal_code || null,
          start_date: p.start_date || null,
          end_date: p.end_date || null,
          actual_end_date: p.actual_end_date || null,
          approved_budget: Number(p.approved_budget) || 0,
          currency: p.currency || "INR",
          financial_notes: p.financial_notes || null,
          project_manager_name: p.project_manager_name || "Unassigned",
          status: p.status || "planning",
          progress: Number(p.progress) || 0,
          health_status: p.health_status || "on-track",
          organization_id: p.organization_id || "org1",
        };

        // Only include id if it is a valid UUID
        if (p.id && UUID_REGEX.test(p.id)) {
          payload.id = p.id;
        }

        // Only include created_by if it is a valid UUID
        if (p.created_by && UUID_REGEX.test(p.created_by)) {
          payload.created_by = p.created_by;
        }

        const { data, error } = await supabase
          .from("projects")
          .upsert(payload, { onConflict: "project_code" })
          .select()
          .maybeSingle();

        if (error) {
          errors.push({ code: p.project_code, error: error.message });
        } else if (data) {
          results.push(data);
        }
      }

      return NextResponse.json({
        success: true,
        synced: results,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // Case 2: Single project creation
    const {
      name,
      project_code,
      description,
      client_name,
      project_type,
      construction_category,
      site_address,
      city,
      state,
      postal_code,
      start_date,
      end_date,
      actual_end_date,
      approved_budget,
      currency,
      financial_notes,
      project_manager_name,
      status,
      progress,
      health_status,
      userId,
    } = body;

    if (!project_code || !project_code.trim()) {
      return NextResponse.json({ error: "Project code is required" }, { status: 400 });
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const payload: Record<string, any> = {
      project_code: project_code.trim(),
      name: name.trim(),
      description: description?.trim() || null,
      client_name: client_name?.trim() || null,
      project_type: project_type || "Residential",
      construction_category: construction_category || "High-Rise",
      site_address: site_address?.trim() || null,
      city: city?.trim() || null,
      state: state || "Maharashtra",
      postal_code: postal_code?.trim() || null,
      start_date: start_date || null,
      end_date: end_date || null,
      actual_end_date: actual_end_date || null,
      approved_budget: Number(approved_budget) || 0,
      currency: currency || "INR",
      financial_notes: financial_notes?.trim() || null,
      project_manager_name: project_manager_name?.trim() || "Unassigned",
      status: status || "planning",
      progress: Number(progress) || 0,
      health_status: health_status || "on-track",
      organization_id: "org1",
    };

    // Safely attach valid UUID for created_by only if it matches UUID format
    if (userId && UUID_REGEX.test(userId)) {
      payload.created_by = userId;
    }

    const { data: createdProject, error: insertError } = await supabase
      .from("projects")
      .upsert(payload, { onConflict: "project_code" })
      .select()
      .single();

    if (insertError) {
      console.error("API /api/projects insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      project: createdProject,
      message: "Project successfully saved to database",
    });
  } catch (err: any) {
    console.error("API /api/projects POST unexpected error:", err);
    return NextResponse.json({ error: err.message || "Failed to create project" }, { status: 500 });
  }
}
