/**
 * Server-side RBAC authorization helpers.
 * These functions run ONLY on the server (in Server Components, API routes, Server Actions).
 * They query the database directly using the server Supabase client.
 */

import { createClient } from '@/lib/supabase/server';
import type { RoleName } from '@/types/rbac';
import { DEFAULT_ROLE_PERMISSIONS } from '@/types/rbac';

export interface AuthUser {
  id: string;
  email: string;
  roles: RoleName[];
  permissions: string[];
}

/**
 * Get the currently authenticated user with their roles and permissions.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch user roles from user_roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role_id, roles:role_id(name)')
    .eq('user_id', user.id);

  let roles: RoleName[] = (userRoles || [])
    .map((ur: any) => ur.roles?.name)
    .filter(Boolean) as RoleName[];

  // 2. Fallback to profiles.role if user_roles is unseeded or empty
  if (roles.length === 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role && profile?.role !== 'user') {
      roles = [profile.role as RoleName];
    } else if (user.email?.startsWith('admin@')) {
      roles = ['super_admin'];
    } else if (user.email?.startsWith('director@')) {
      roles = ['owner_director'];
    } else if (user.email?.startsWith('pm@')) {
      roles = ['project_manager'];
    } else if (user.email?.startsWith('accounts@')) {
      roles = ['accountant'];
    } else if (user.email?.startsWith('site.')) {
      roles = ['site_engineer'];
    } else if (user.email?.startsWith('procurement@')) {
      roles = ['procurement_manager'];
    } else if (user.email?.startsWith('store@')) {
      roles = ['store_inventory_manager'];
    } else {
      roles = [(profile?.role as RoleName) || 'project_manager'];
    }
  }

  // 3. Fetch permissions via role_permissions
  let permissions: string[] = [];
  const roleIds = (userRoles || []).map((ur: any) => ur.role_id).filter(Boolean);

  if (roleIds.length > 0) {
    const { data: rolePermissions } = await supabase
      .from('role_permissions')
      .select('permissions:permission_id(name)')
      .in('role_id', roleIds);

    permissions = [
      ...new Set(
        (rolePermissions || [])
          .map((rp: any) => rp.permissions?.name)
          .filter(Boolean)
      ),
    ];
  }

  // 4. Merge permissions with DEFAULT_ROLE_PERMISSIONS to guarantee baseline role capabilities
  const combinedSet = new Set<string>(permissions);
  for (const r of roles) {
    const perms = DEFAULT_ROLE_PERMISSIONS[r] || [];
    perms.forEach((p) => combinedSet.add(p));
  }
  permissions = Array.from(combinedSet);

  return {
    id: user.id,
    email: user.email || '',
    roles,
    permissions,
  };
}

/**
 * Get the roles for a specific user.
 */
export async function getUserRoles(userId: string): Promise<RoleName[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('user_roles')
    .select('roles:role_id(name)')
    .eq('user_id', userId);

  return (data || [])
    .map((ur: any) => ur.roles?.name)
    .filter(Boolean) as RoleName[];
}

/**
 * Get all permissions for a specific user.
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const supabase = await createClient();

  // First get role IDs
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId);

  if (!userRoles || userRoles.length === 0) return [];

  const roleIds = userRoles.map((ur) => ur.role_id);

  // Then get permissions for those roles
  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select('permissions:permission_id(name)')
    .in('role_id', roleIds);

  return [...new Set(
    (rolePermissions || [])
      .map((rp: any) => rp.permissions?.name)
      .filter(Boolean)
  )];
}

/**
 * Check if the current user has a specific permission.
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // Super admins have all permissions
  if (user.roles.includes('super_admin')) return true;

  return user.permissions.includes(permission);
}

/**
 * Require a specific permission, throws if not authorized.
 * Use in API routes and Server Actions.
 */
export async function requirePermission(permission: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('Authentication required', 401);
  }

  if (!user.roles.includes('super_admin') && !user.permissions.includes(permission)) {
    throw new AuthorizationError(
      `Permission '${permission}' required`,
      403
    );
  }

  return user;
}

/**
 * Check if the current user has any of the specified roles.
 */
export async function hasRole(...roleNames: RoleName[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return roleNames.some(r => user.roles.includes(r));
}

/**
 * Require any of the specified roles, throws if not authorized.
 */
export async function requireRole(...roleNames: RoleName[]): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('Authentication required', 401);
  }

  if (!roleNames.some(r => user.roles.includes(r))) {
    throw new AuthorizationError(
      `One of the following roles is required: ${roleNames.join(', ')}`,
      403
    );
  }

  return user;
}

/**
 * Check if the current user can access a specific project.
 * Super admins, owners, and project managers can access all projects.
 * Site engineers and other roles need project membership.
 */
export async function canAccessProject(projectId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // These roles have broad project access
  if (['super_admin', 'owner_director', 'project_manager'].some(r => user.roles.includes(r as RoleName))) {
    return true;
  }

  // Check project membership
  const supabase = await createClient();
  const { data } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (data) return true;

  // Check if assigned as project manager
  const { data: project } = await supabase
    .from('projects')
    .select('project_manager_id')
    .eq('id', projectId)
    .maybeSingle();

  return project?.project_manager_id === user.id;
}

/**
 * Require project access, throws if not authorized.
 */
export async function requireProjectAccess(projectId: string): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError('Authentication required', 401);
  }

  const hasAccess = await canAccessProject(projectId);
  if (!hasAccess) {
    throw new AuthorizationError('Project access denied', 403);
  }

  return user;
}

/**
 * Log an audit event.
 */
export async function logAuditEvent(
  actorId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  await supabase.from('audit_logs').insert({
    actor_id: actorId,
    action,
    target_type: targetType || null,
    target_id: targetId || null,
    details: details || {},
  });
}

/**
 * Custom error for authorization failures.
 */
export class AuthorizationError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = statusCode;
  }
}

/**
 * Helper to create a JSON error response from AuthorizationError.
 */
export function authErrorResponse(error: unknown): Response {
  if (error instanceof AuthorizationError) {
    return Response.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
