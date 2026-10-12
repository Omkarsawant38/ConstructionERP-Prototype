import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTE_PERMISSION_MAP, DEFAULT_ROLE_PERMISSIONS, RoleName } from "@/types/rbac";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. If user is not logged in and trying to access protected routes
  if (
    !user &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/auth") &&
    !pathname.startsWith("/api") &&
    pathname !== "/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. If user is logged in and trying to access login page
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 3. Redirect root to dashboard if logged in
  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 4. Route-level RBAC check for authenticated users
  if (user && !pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.startsWith("/auth")) {
    const isUserManagement = pathname.startsWith("/settings/users");
    const matchedRoute = Object.keys(ROUTE_PERMISSION_MAP).find(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (matchedRoute || isUserManagement) {
      try {
        // Query user roles from user_roles
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role_id, roles:role_id(name)")
          .eq("user_id", user.id);

        let roles: RoleName[] = (userRoles || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((ur: any) => ur.roles?.name)
          .filter(Boolean) as RoleName[];

        // If no user_roles rows exist, check profiles.role fallback
        if (roles.length === 0) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile?.role === "super_admin" || profile?.role === "admin") {
            roles = ["super_admin"];
          } else if (profile?.role) {
            roles = [profile.role as RoleName];
          }
        }

        // If still unassigned (new user / bootstrap), allow access without blocking
        if (roles.length === 0) {
          return supabaseResponse;
        }

        // Super Admin has unrestricted access to everything
        if (roles.includes("super_admin")) {
          return supabaseResponse;
        }

        // User Management is exclusive to super_admin
        if (isUserManagement) {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard";
          url.searchParams.set("error", "unauthorized");
          return NextResponse.redirect(url);
        }

        if (matchedRoute) {
          const requiredPermission = ROUTE_PERMISSION_MAP[matchedRoute];

          // Fetch permissions from role_permissions
          let permissions: string[] = [];
          const roleIds = (userRoles || [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((ur: any) => ur.role_id)
            .filter(Boolean);

          if (roleIds.length > 0) {
            const { data: rolePermissions } = await supabase
              .from("role_permissions")
              .select("permissions:permission_id(name)")
              .in("role_id", roleIds);

            permissions = (rolePermissions || [])
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((rp: any) => rp.permissions?.name)
              .filter(Boolean);
          }

          // Merge permissions with DEFAULT_ROLE_PERMISSIONS to guarantee baseline role capabilities
          const combinedSet = new Set<string>(permissions);
          for (const r of roles) {
            const rolePerms = DEFAULT_ROLE_PERMISSIONS[r] || [];
            rolePerms.forEach((p) => combinedSet.add(p));
          }
          permissions = Array.from(combinedSet);

          // If user lacks permission, redirect to their first accessible route
          if (requiredPermission && !permissions.includes(requiredPermission)) {
            // Find an allowed route
            const fallbackRoute = Object.keys(ROUTE_PERMISSION_MAP).find(
              (r) => r !== matchedRoute && permissions.includes(ROUTE_PERMISSION_MAP[r])
            ) || "/dashboard";

            if (pathname !== fallbackRoute) {
              const url = request.nextUrl.clone();
              url.pathname = fallbackRoute;
              return NextResponse.redirect(url);
            }
          }
        }
      } catch (err) {
        console.error("RBAC middleware check failed:", err);
      }
    }
  }

  return supabaseResponse;
}
