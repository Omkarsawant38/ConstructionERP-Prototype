"use client";

import React from "react";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Shield, ChevronRight, Building, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { usePermissions } from "@/lib/rbac/client";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { hasRole } = usePermissions();
  const { profile } = useAuth();

  return (
    <RouteGuard permission="settings.view">
      <div className="flex flex-col gap-6 pb-12">
        <PageHeader 
          title="Settings" 
          description="Manage application preferences, user permissions, and system configuration."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
          {/* User & Role Management Card */}
          <div 
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between hover:border-amber-400 transition-all"
          >
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-200 text-amber-600 shrink-0"
                >
                  <Shield size={24} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 m-0">User &amp; Role Management</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Permissions, role assignments &amp; access control</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Configure team member accounts, adjust permission profiles, and assign granular ERP roles across projects.
              </p>
            </div>

            <Link 
              href="/settings/users"
              className="btn btn-primary w-full justify-between"
              style={{
                backgroundColor: "#FFB000",
                color: "#172033",
                fontWeight: 600,
                height: "42px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(255, 176, 0, 0.25)",
              }}
            >
              <span>Manage Users &amp; Roles</span>
              <ChevronRight size={18} />
            </Link>
          </div>

          {/* Organization Details Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-200 text-blue-600 shrink-0"
                >
                  <Building size={24} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 m-0">Organization Profile</h3>
                  <p className="text-xs text-gray-500 mt-0.5">TripleS Production Construction</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Organization Name</span>
                  <span className="font-semibold text-gray-800">TripleS Production</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Current User</span>
                  <span className="font-semibold text-gray-800">{profile?.email || "Authenticated User"}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-gray-500">System Mode</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} />
                    Production Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Access Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm md:col-span-2">
            <div className="flex items-center gap-3.5 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600 shrink-0"
              >
                <Lock size={24} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 m-0">Security &amp; Policy Status</h3>
                <p className="text-xs text-gray-500 mt-0.5">Enterprise Role-Based Access Control (RBAC)</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Row-Level Security (RLS) is active on Supabase. Access policies are enforced on projects, expense logs, materials tracking, and user profile management.
            </p>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
