import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac/server";
import { createClient } from "@/lib/supabase/server";

const DEMO_ORGANIZATION_USERS = [
  {
    id: "usr-001",
    email: "rajesh.sharma@triples.com",
    full_name: "Rajesh Sharma",
    role: "super_admin",
    organization_id: "org1",
    phone: "+91 98201 12345",
    designation: "Executive Director & Owner",
    created_at: "2024-01-01T00:00:00Z",
    assigned_roles: [
      { id: "r1", name: "super_admin", display_name: "Super Admin" },
    ],
  },
  {
    id: "usr-002",
    email: "omkar.sawant@triples.com",
    full_name: "Omkar Sawant",
    role: "project_manager",
    organization_id: "org1",
    phone: "+91 98202 23456",
    designation: "Senior Project Manager",
    created_at: "2024-01-10T00:00:00Z",
    assigned_roles: [
      { id: "r2", name: "project_manager", display_name: "Project Manager" },
    ],
  },
  {
    id: "usr-003",
    email: "priya.sharma@triples.com",
    full_name: "Priya Sharma",
    role: "site_engineer",
    organization_id: "org1",
    phone: "+91 98203 34567",
    designation: "Lead Site Engineer",
    created_at: "2024-02-01T00:00:00Z",
    assigned_roles: [
      { id: "r3", name: "site_engineer", display_name: "Site Engineer" },
    ],
  },
  {
    id: "usr-004",
    email: "rahul.mehta@triples.com",
    full_name: "Rahul Mehta",
    role: "accountant",
    organization_id: "org1",
    phone: "+91 98204 45678",
    designation: "Senior Finance Controller",
    created_at: "2024-02-15T00:00:00Z",
    assigned_roles: [
      { id: "r4", name: "accountant", display_name: "Accountant" },
    ],
  },
  {
    id: "usr-005",
    email: "vikram.singh@triples.com",
    full_name: "Vikram Singh",
    role: "procurement_manager",
    organization_id: "org1",
    phone: "+91 98205 56789",
    designation: "Head of Procurement & Vendors",
    created_at: "2024-03-01T00:00:00Z",
    assigned_roles: [
      { id: "r5", name: "procurement_manager", display_name: "Procurement Manager" },
    ],
  },
  {
    id: "usr-006",
    email: "suresh.patil@triples.com",
    full_name: "Suresh Patil",
    role: "store_inventory_manager",
    organization_id: "org1",
    phone: "+91 98206 67890",
    designation: "Central Store & Inventory Lead",
    created_at: "2024-03-10T00:00:00Z",
    assigned_roles: [
      { id: "r6", name: "store_inventory_manager", display_name: "Store / Inventory Manager" },
    ],
  },
];

export async function GET() {
  try {
    const supabase = await createClient();

    // Query profiles with user roles and role details
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        role,
        organization_id,
        phone,
        designation,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (profilesError || !profiles || profiles.length === 0) {
      return NextResponse.json({ users: DEMO_ORGANIZATION_USERS });
    }

    // Try fetching user_roles if table exists
    let userRoles: any[] = [];
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          role_id,
          assigned_at,
          roles:role_id (
            id,
            name,
            display_name
          )
        `);
      if (!error && data) {
        userRoles = data;
      }
    } catch {
      // Table might not be migrated yet
    }

    // Map roles to profiles
    const usersWithRoles = (profiles || []).map((profile) => {
      const assigned = (userRoles || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((ur: any) => ur.user_id === profile.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((ur: any) => ur.roles)
        .filter(Boolean);

      return {
        ...profile,
        assigned_roles: assigned,
      };
    });

    return NextResponse.json({ users: usersWithRoles.length > 0 ? usersWithRoles : DEMO_ORGANIZATION_USERS });
  } catch (err: any) {
    console.error("API /api/users fallback:", err);
    return NextResponse.json({ users: DEMO_ORGANIZATION_USERS });
  }
}
