"use client";

import React, { useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { KPICard } from "@/components/dashboard/KPICard";
import { demoExpenses, demoTasks, demoMaterials } from "@/lib/demo-data";
import { useProjects } from "@/lib/projectStore";
import { formatCurrencyFull, formatCurrency } from "@/lib/utils";
import { 
  FolderKanban, 
  Banknote, 
  Wallet, 
  ClipboardCheck, 
  AlertTriangle,
  Clock,
  PackageX
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import Link from "next/link";
import { PermissionGate } from "@/lib/rbac/client";
import { RouteGuard } from "@/components/ui/RouteGuard";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_DISPLAY_NAMES, type RoleName } from "@/types/rbac";

export default function DashboardPage() {
  const { projects } = useProjects();
  const { profile } = useAuth();

  const roleKey = (profile?.role || "project_manager") as RoleName;
  const userRoleTitle = ROLE_DISPLAY_NAMES[roleKey] || (roleKey ? roleKey.replace(/_/g, " ") : "Team Member");
  const rawName = profile?.full_name || profile?.email?.split("@")[0] || "";
  const capitalizedName = rawName
    ? rawName.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : userRoleTitle;
  const welcomeGreeting = userRoleTitle ? `Welcome back, ${userRoleTitle}!` : `Welcome back, ${capitalizedName}!`;

  // Calculate KPIs
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "active").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  
  const totalBudget = projects.reduce((sum, p) => sum + (p.approved_budget || 0), 0);
  const totalExpenses = projects.reduce((sum, p) => sum + (p.actual_expenses || 0), 0);
  
  const pendingTasks = demoTasks.filter(t => t.status !== "completed").length;
  const lowStockMaterials = demoMaterials.filter(m => m.current_stock <= m.reorder_level).length;

  // Chart Data: Budget vs Actual
  const budgetVsActualData = projects
    .filter(p => p.status !== "planning")
    .map(p => ({
      name: p.project_code,
      budget: p.approved_budget,
      actual: p.actual_expenses || 0,
    }))
    .slice(0, 6); // Top 6 projects

  // Chart Data: Project Status Distribution
  const statusData = [
    { name: "Active", value: activeProjects, color: "var(--color-success)" },
    { name: "Planning", value: projects.filter(p => p.status === "planning").length, color: "var(--color-info)" },
    { name: "Completed", value: completedProjects, color: "var(--color-primary)" },
    { name: "On Hold", value: projects.filter(p => p.status === "on-hold").length, color: "var(--color-warning)" },
  ].filter(item => item.value > 0);

  return (
    <RouteGuard permission="dashboard.view">
      <div className="flex flex-col gap-8 pb-12" style={{ gap: "32px" }}>
        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden min-h-[220px] flex items-center bg-slate-900 shadow-md">
          <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1541888086225-ee5315f5c71c?q=80&w=2000&auto=format&fit=crop')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          />
          <div className="relative z-10 flex flex-col justify-center w-full" style={{ padding: "48px" }}>
            <h1 className="font-bold text-white" style={{ fontSize: "32px", marginBottom: "12px" }}>
              {welcomeGreeting}
            </h1>
            <p className="text-gray-300 leading-relaxed" style={{ fontSize: "16px", maxWidth: "640px", marginBottom: "32px", lineHeight: "1.6" }}>
              Here's what's happening with your projects today. You have <strong className="text-white">{pendingTasks} pending tasks</strong> and <strong className="text-white">{lowStockMaterials} materials</strong> requiring attention.
            </p>
            <PermissionGate permission="projects.create">
              <div>
                <Link 
                  href="/projects/new" 
                  className="transition-transform hover:-translate-y-0.5 shadow-sm"
                  style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    padding: "12px 24px", 
                    borderRadius: "8px", 
                    background: "var(--color-primary)", 
                    color: "var(--color-text-primary)", 
                    fontWeight: 600,
                    fontSize: "15px"
                  }}
                >
                  <FolderKanban size={18} />
                  New Project
                </Link>
              </div>
            </PermissionGate>
          </div>
        </div>

      <div>
        <PageHeader 
          title="Dashboard Overview" 
          description="Monitor your construction projects, budgets, and key performance indicators."
        />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard
          title="Active Projects"
          value={activeProjects}
          subtitle={`Out of ${totalProjects} total projects`}
          icon={<FolderKanban size={20} />}
          iconBgColor="#DBEAFE"
          iconColor="#2563EB"
          trend="up"
          trendValue="+2 from last month"
        />
        <KPICard
          title="Total Project Value"
          value={formatCurrency(totalBudget)}
          subtitle="Approved budget across all projects"
          icon={<Banknote size={20} />}
          iconBgColor="#DCFCE7"
          iconColor="#16A34A"
        />
        <KPICard
          title="Actual Expenses"
          value={formatCurrency(totalExpenses)}
          subtitle={`${Math.round((totalExpenses / totalBudget) * 100)}% of total budget`}
          icon={<Wallet size={20} />}
          iconBgColor="#FEF3C7"
          iconColor="#D97706"
        />
        <KPICard
          title="Materials Low Stock"
          value={lowStockMaterials}
          subtitle="Items below reorder level"
          icon={<PackageX size={20} />}
          iconBgColor="#FEE2E2"
          iconColor="#DC2626"
          trend="down"
          trendValue="Requires attention"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Project Progress Overview */}
        <div className="premium-card lg:col-span-1" style={{ padding: "24px" }}>
          <h3 className="text-base font-bold" style={{ color: "var(--color-text-primary)", marginBottom: "24px" }}>
            Project Status Overview
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} Projects`, 'Count']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget vs Actual Chart */}
        <div className="premium-card lg:col-span-2" style={{ padding: "24px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: "24px" }}>
            <h3 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
              Budget vs Actual (Top Projects)
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetVsActualData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  tickFormatter={(value) => `₹${value / 10000000}Cr`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrencyFull(value), '']}
                  cursor={{ fill: 'var(--color-main-bg)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="budget" name="Budget" fill="var(--color-text-secondary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="actual" name="Actual" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ongoing Projects Widget */}
      <div className="premium-card overflow-hidden" style={{ padding: 0 }}>
        <div className="border-b border-gray-100 flex items-center justify-between" style={{ padding: "24px" }}>
          <h3 className="text-lg font-bold text-gray-900">Ongoing Projects</h3>
          <Link href="/projects" className="text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="font-semibold" style={{ padding: "16px", paddingLeft: "24px" }}>Project</th>
                <th className="font-semibold" style={{ padding: "16px" }}>Location</th>
                <th className="font-semibold" style={{ padding: "16px" }}>Progress</th>
                <th className="font-semibold" style={{ padding: "16px" }}>Status</th>
                <th className="font-semibold text-right" style={{ padding: "16px", paddingRight: "24px" }}>Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.filter(p => p.status === "active").slice(0, 5).map(project => (
                <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                  <td style={{ padding: "16px", paddingLeft: "24px" }}>
                    <div className="font-semibold text-gray-900">{project.name}</div>
                    <div className="text-xs text-gray-500" style={{ marginTop: "4px" }}>{project.project_code}</div>
                  </td>
                  <td className="text-sm text-gray-600" style={{ padding: "16px" }}>{project.city}</td>
                  <td style={{ padding: "16px", width: "192px" }}>
                    <ProgressBar value={project.progress} showLabel />
                  </td>
                  <td style={{ padding: "16px" }}>
                    <StatusBadge status={project.health_status || "on-track"} size="sm" />
                  </td>
                  <td className="text-right font-medium text-gray-900" style={{ padding: "16px", paddingRight: "24px" }}>
                    {formatCurrencyFull(project.approved_budget)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </RouteGuard>
  );
}
