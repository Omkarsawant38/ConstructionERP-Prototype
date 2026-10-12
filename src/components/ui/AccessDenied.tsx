"use client";

import React from "react";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_DISPLAY_NAMES } from "@/types/rbac";

export function AccessDenied({ 
  message = "You don't have permission to access this page.",
  requiredPermission,
}: { 
  message?: string;
  requiredPermission?: string;
}) {
  const router = useRouter();
  const { roles } = useAuth();

  const currentRoleLabels = roles
    .map((r) => ROLE_DISPLAY_NAMES[r] || r)
    .join(", ");

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{
            background: "var(--color-error-light)",
            marginBottom: "24px",
          }}
        >
          <ShieldX size={36} style={{ color: "var(--color-error)" }} />
        </div>

        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-primary)", marginBottom: "12px" }}
        >
          Access Denied
        </h1>

        <p
          className="text-base"
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "24px",
            lineHeight: "1.6",
          }}
        >
          {message}
        </p>

        {currentRoleLabels && (
          <p
            className="text-sm"
            style={{
              color: "var(--color-text-muted)",
              marginBottom: "8px",
            }}
          >
            Your current role: <strong style={{ color: "var(--color-text-secondary)" }}>{currentRoleLabels || "No role assigned"}</strong>
          </p>
        )}

        {requiredPermission && (
          <p
            className="text-xs font-mono"
            style={{
              color: "var(--color-text-muted)",
              marginBottom: "24px",
              background: "var(--color-main-bg)",
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              display: "inline-block",
            }}
          >
            Required: {requiredPermission}
          </p>
        )}

        <div
          className="flex items-center justify-center"
          style={{ gap: "12px", marginTop: "16px" }}
        >
          <button
            onClick={() => router.back()}
            className="btn btn-secondary"
            style={{ gap: "8px" }}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn btn-primary"
            style={{ gap: "8px" }}
          >
            <Home size={16} />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
