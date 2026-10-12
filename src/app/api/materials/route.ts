import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CATALOGUE_MATERIALS } from "@/lib/materialStore";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const supabase = await createClient();

    let query = supabase
      .from("materials")
      .select("*")
      .order("name", { ascending: true });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data: dbMaterials, error: dbError } = await query;

    let materials = dbMaterials && dbMaterials.length > 0 ? dbMaterials : DEFAULT_CATALOGUE_MATERIALS;

    if (search && search.trim() !== "") {
      const q = search.toLowerCase().trim();
      materials = materials.filter(
        (m: any) =>
          m.name?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q) ||
          m.supplier_name?.toLowerCase().includes(q)
      );
    }

    if (category && category !== "all") {
      materials = materials.filter((m: any) => m.category === category);
    }

    return NextResponse.json({ materials });
  } catch (err: any) {
    console.error("API /api/materials GET error:", err);
    return NextResponse.json({ materials: DEFAULT_CATALOGUE_MATERIALS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Allow project managers, store, procurement, site engineers, directors, super admin
    const canCreateCatalogue =
      user.roles.includes("super_admin") ||
      user.roles.includes("procurement_manager") ||
      user.roles.includes("store_inventory_manager") ||
      user.roles.includes("project_manager") ||
      user.roles.includes("owner_director") ||
      user.roles.includes("site_engineer") ||
      user.permissions.includes("inventory.purchase") ||
      user.permissions.includes("inventory.request") ||
      user.permissions.includes("projects.update");

    if (!canCreateCatalogue) {
      return NextResponse.json(
        { error: "Permission denied: inventory catalogue creation requires appropriate role or permission" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, category, unit, unit_price, reorder_level, current_stock, supplier_name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Material name is required" }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!unit) {
      return NextResponse.json({ error: "Unit of measurement is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const newMaterial = {
      name: name.trim(),
      category: category.toLowerCase().trim(),
      unit: unit.trim(),
      unit_price: Number(unit_price) || 0,
      reorder_level: Number(reorder_level) || 0,
      current_stock: Number(current_stock) || 0,
      supplier_name: supplier_name?.trim() || null,
      organization_id: "org1",
    };

    const { data, error } = await supabase
      .from("materials")
      .insert(newMaterial)
      .select()
      .single();

    if (error) {
      console.warn("DB insert material catalogue error, fallback:", error);
      return NextResponse.json({
        material: {
          id: `mat-${Date.now()}`,
          ...newMaterial,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ material: data }, { status: 201 });
  } catch (err: any) {
    console.error("API /api/materials POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to create material" }, { status: 500 });
  }
}
