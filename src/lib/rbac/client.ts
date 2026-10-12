/**
 * Client-side RBAC hooks and helpers.
 * These consume role/permission data provided by the AuthContext.
 * They are for UI rendering only — never trust client-side checks for security.
 */

"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { RoleName } from '@/types/rbac';
import { ROUTE_PERMISSION_MAP, DEFAULT_ROLE_PERMISSIONS } from '@/types/rbac';

/**
 * Hook to access the current user's permissions.
 */
export function usePermissions() {
  const { permissions, roles, loading } = useAuth();

  const hasPermission = (permission: string): boolean => {
    // If no roles or permissions are set (bootstrap, demo mode, unseeded DB), default to allowing access
    if (roles.length === 0 && permissions.length === 0) return true;
    if (roles.includes('super_admin')) return true;
    if (permissions.includes(permission)) return true;

    // Check fallback role permissions
    for (const role of roles) {
      if (DEFAULT_ROLE_PERMISSIONS[role]?.includes(permission)) return true;
    }

    return false;
  };

  const hasAnyPermission = (...perms: string[]): boolean => {
    if (roles.length === 0 && permissions.length === 0) return true;
    if (roles.includes('super_admin')) return true;
    return perms.some(p => hasPermission(p));
  };

  const hasAllPermissions = (...perms: string[]): boolean => {
    if (roles.length === 0 && permissions.length === 0) return true;
    if (roles.includes('super_admin')) return true;
    return perms.every(p => hasPermission(p));
  };

  const hasRole = (...roleNames: RoleName[]): boolean => {
    if (roles.length === 0) return true; // If no roles configured yet, grant fallback access
    return roleNames.some(r => roles.includes(r));
  };

  const canAccessRoute = (route: string): boolean => {
    if (roles.includes('super_admin')) return true;

    // Find the matching route prefix
    const matchedRoute = Object.keys(ROUTE_PERMISSION_MAP)
      .sort((a, b) => b.length - a.length) // longest match first
      .find(r => route.startsWith(r));

    if (!matchedRoute) return true; // unknown routes allowed (fallback)

    const requiredPermission = ROUTE_PERMISSION_MAP[matchedRoute];
    return permissions.includes(requiredPermission);
  };

  return {
    permissions,
    roles,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canAccessRoute,
  };
}

/**
 * Component that renders children only if the user has the required permission.
 */
export function PermissionGate({
  permission,
  fallback = null,
  children,
}: {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return fallback ? React.createElement(React.Fragment, null, fallback) : null;
  }

  return React.createElement(React.Fragment, null, children);
}

/**
 * Component that renders children only if the user has one of the specified roles.
 */
export function RoleGate({
  roles: requiredRoles,
  fallback = null,
  children,
}: {
  roles: RoleName[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { hasRole } = usePermissions();

  if (!hasRole(...requiredRoles)) {
    return fallback ? React.createElement(React.Fragment, null, fallback) : null;
  }

  return React.createElement(React.Fragment, null, children);
}
