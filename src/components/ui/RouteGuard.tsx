"use client";

import React from "react";
import { usePermissions } from "@/lib/rbac/client";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Client-side route guard component.
 * Wraps page content to check permissions before rendering.
 * 
 * This is a UI-level guard only. Server-side enforcement
 * is handled by RLS policies and API route checks.
 */
export function RouteGuard({
  permission,
  children,
  message,
}: {
  permission: string;
  children: React.ReactNode;
  message?: string;
}) {
  const { loading } = useAuth();
  const { hasPermission } = usePermissions();

  if (loading) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center"
        style={{ background: "var(--color-main-bg)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin"
            style={{ color: "var(--color-primary)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return (
      <AccessDenied
        message={message || "You don't have permission to access this module."}
        requiredPermission={permission}
      />
    );
  }

  return <>{children}</>;
}
