"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/lib/rbac/client";
import {
  LayoutDashboard,
  FolderKanban,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Hammer,
  Shield,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { name: "Projects", href: "/projects", icon: FolderKanban, permission: "projects.view" },
  { name: "Finance & Billing", href: "/finance", icon: DollarSign, permission: "finance.view" },
  { name: "Settings", href: "/settings", icon: Settings, permission: "settings.view" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { hasPermission, hasRole, roles, permissions, loading } = usePermissions();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // Filter navigation items based on user permissions
  const visibleNavigation = navigation.filter((item) => {
    // Only super_admin bypasses all permissions
    if (hasRole('super_admin')) return true;
    // Check if user has the required permission
    return hasPermission(item.permission);
  });

  const sidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--color-sidebar)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 border-b shrink-0"
        style={{
          height: "var(--topnav-height)",
          borderColor: "var(--color-border)",
          paddingLeft: "28px",
          paddingRight: "20px"
        }}
      >
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 36,
            height: 36,
            background: "var(--color-primary)",
          }}
        >
          <Hammer size={20} color="white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1
              className="text-base font-bold leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              TripleS Production
            </h1>
            <p
              className="text-[10px] font-medium uppercase whitespace-nowrap"
              style={{ color: "var(--color-text-secondary)", letterSpacing: "0.02em" }}
            >
              Construction Management
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "16px 20px 16px 28px" }}>
        <div className="flex flex-col" style={{ gap: "6px" }}>
          {visibleNavigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center rounded-lg transition-all duration-200 group min-w-0"
                style={{
                  height: "42px",
                  padding: "0 14px",
                  gap: "12px",
                  background: active ? "var(--color-primary)" : "transparent",
                  color: active
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
                }}
                title={collapsed ? item.name : undefined}
              >
                <div className="flex items-center justify-center shrink-0 w-[22px]">
                  <item.icon
                    size={20}
                    strokeWidth={active ? 2.2 : 1.8}
                    style={{
                      color: active
                        ? "var(--color-text-primary)"
                        : "var(--color-text-secondary)",
                    }}
                  />
                </div>
                {!collapsed && (
                  <span
                    className="truncate leading-[20px]"
                    style={{
                      fontSize: "14px",
                      fontWeight: active ? 600 : 500
                    }}
                  >
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}

          {/* User Management - shown only to Super Admin */}
          {hasRole('super_admin') && (
            <>
              <div
                className="border-t my-2"
                style={{ borderColor: "var(--color-border)" }}
              />
              <Link
                href="/settings/users"
                onClick={() => setMobileOpen(false)}
                className="flex items-center rounded-lg transition-all duration-200 group min-w-0"
                style={{
                  height: "42px",
                  padding: "0 14px",
                  gap: "12px",
                  background: pathname.startsWith("/settings/users")
                    ? "var(--color-primary)"
                    : "transparent",
                  color: pathname.startsWith("/settings/users")
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
                }}
                title={collapsed ? "User Management" : undefined}
              >
                <div className="flex items-center justify-center shrink-0 w-[22px]">
                  <Shield
                    size={20}
                    strokeWidth={pathname.startsWith("/settings/users") ? 2.2 : 1.8}
                    style={{
                      color: pathname.startsWith("/settings/users")
                        ? "var(--color-text-primary)"
                        : "var(--color-text-secondary)",
                    }}
                  />
                </div>
                {!collapsed && (
                  <span
                    className="truncate leading-[20px]"
                    style={{
                      fontSize: "14px",
                      fontWeight: pathname.startsWith("/settings/users") ? 600 : 500
                    }}
                  >
                    User Management
                  </span>
                )}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Brand Footer */}
      {!collapsed && (
        <div
          className="py-4 border-t shrink-0"
          style={{ 
            borderColor: "var(--color-border)",
            paddingLeft: "28px",
            paddingRight: "20px"
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--color-primary)" }}
            />
            <p
              className="text-[11px] font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Build · Manage · Deliver
            </p>
          </div>
        </div>
      )}

      {/* Collapse Button - Desktop */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center py-3 border-t transition-colors duration-200 hover:bg-black/5"
        style={{ borderColor: "var(--color-border)" }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight size={18} color="var(--color-text-secondary)" />
        ) : (
          <ChevronLeft size={18} color="var(--color-text-secondary)" />
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? (
          <X size={20} color="var(--color-text-primary)" />
        ) : (
          <Menu size={20} color="var(--color-text-primary)" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-40 h-full transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        style={{ width: "var(--sidebar-width)" }}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:block fixed top-0 left-0 h-full z-30 transition-all duration-300 border-r"
        style={{
          width: collapsed
            ? "var(--sidebar-collapsed-width)"
            : "var(--sidebar-width)",
          borderColor: "var(--color-border)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Spacer to push content */}
      <div
        className="hidden lg:block flex-shrink-0 transition-all duration-300"
        style={{
          width: collapsed
            ? "var(--sidebar-collapsed-width)"
            : "var(--sidebar-width)",
        }}
      />
    </>
  );
}
