"use client";

import React from "react";
import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { Settings, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/lib/rbac/client";

export default function SettingsPage() {
  const { hasRole } = usePermissions();

  return (
    <RouteGuard permission="settings.view">
      <div className="flex flex-col gap-6">
        <ModulePlaceholder 
          title="Settings" 
          subtitle="Configure application settings, user roles, organization details, and integrations."
          icon={<Settings size={32} className="text-amber-500" />}
        />

        <div 
          className="max-w-2xl mx-auto w-full"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
            padding: "24px 28px",
            transition: "all 0.2s ease",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div 
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: "#FFF9EB",
                  border: "1px solid #FDE68A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D97706",
                  flexShrink: 0,
                }}
              >
                <Shield size={24} strokeWidth={2} />
              </div>
              <div>
                <h4 style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  User &amp; Role Management
                </h4>
                <p style={{ fontSize: "13px", color: "#64748B", marginTop: "3px", margin: "3px 0 0 0" }}>
                  Configure team permissions, system access levels, and assign roles.
                </p>
              </div>
            </div>

            <Link 
              href="/settings/users"
              className="btn btn-primary self-start sm:self-auto cursor-pointer"
              style={{
                height: "42px",
                padding: "0 20px",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontWeight: 600,
                backgroundColor: "#FFB000",
                color: "#172033",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 8px rgba(255, 176, 0, 0.25)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span>Manage Users</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
