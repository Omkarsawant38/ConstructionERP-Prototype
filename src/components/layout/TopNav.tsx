"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ROLE_DISPLAY_NAMES, type RoleName } from "@/types/rbac";

export function TopNav() {
  const { profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const rawName = profile?.full_name || profile?.email?.split("@")[0] || "User";
  const displayName = rawName
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const roleKey = (profile?.role || "project_manager") as RoleName;
  const displayRole =
    profile?.designation ||
    ROLE_DISPLAY_NAMES[roleKey] ||
    roleKey
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between pr-6 border-b bg-white"
      style={{
        height: "var(--topnav-height)",
        borderColor: "var(--color-border)",
        paddingLeft: "32px",
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search projects, materials, suppliers, documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input py-2 text-sm"
            style={{
              background: "var(--color-main-bg)",
              borderColor: "transparent",
              borderRadius: "var(--radius-lg)",
              paddingLeft: "40px"
            }}
          />
          <kbd
            className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border"
            style={{
              color: "var(--color-text-muted)",
              borderColor: "var(--color-border)",
              background: "white",
            }}
          >
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center ml-4" style={{ gap: "16px" }}>
        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell size={20} style={{ color: "var(--color-text-secondary)" }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "var(--color-primary)" }}
          />
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center rounded-lg transition-colors hover:bg-gray-50"
            style={{ gap: "12px", padding: "6px 12px 6px 6px" }}
          >
            <div
              className="flex items-center justify-center rounded-full text-sm font-semibold"
              style={{
                width: "32px",
                height: "32px",
                background: "var(--color-primary)",
                color: "white",
              }}
            >
              {displayName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="hidden sm:block text-left">
              <p
                className="text-sm font-medium leading-tight"
                style={{ color: "var(--color-text-primary)", marginBottom: "2px" }}
              >
                {displayName}
              </p>
              <p
                className="text-[11px]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {displayRole}
              </p>
            </div>
            <ChevronDown
              size={16}
              style={{ color: "var(--color-text-muted)" }}
            />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border animate-scale-in"
              style={{ padding: "4px 0", borderColor: "var(--color-border)" }}
            >
              <div className="border-b" style={{ padding: "12px 16px", borderColor: "var(--color-border-light)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {displayName}
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {profile?.email || "user@example.com"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  router.push("/settings");
                }}
                className="flex items-center w-full text-sm hover:bg-gray-50 transition-colors"
                style={{ padding: "10px 16px", gap: "12px", color: "var(--color-text-primary)" }}
              >
                <User size={16} />
                Profile
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  router.push("/settings");
                }}
                className="flex items-center w-full text-sm hover:bg-gray-50 transition-colors"
                style={{ padding: "10px 16px", gap: "12px", color: "var(--color-text-primary)" }}
              >
                <Settings size={16} />
                Settings
              </button>
              <div className="border-t my-1" style={{ borderColor: "var(--color-border-light)" }} />
              <button
                onClick={handleSignOut}
                className="flex items-center w-full text-sm hover:bg-red-50 transition-colors"
                style={{ padding: "10px 16px", gap: "12px", color: "var(--color-error)" }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
