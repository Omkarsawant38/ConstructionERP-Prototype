"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { demoProjects } from "@/lib/demo-data";
import { Edit, Share, MapPin, Calendar, Building2, User } from "lucide-react";
import { formatDateShort, formatCurrencyFull } from "@/lib/utils";

// Tabs imports will go here as they are built
import ProjectOverviewTab from "./_components/ProjectOverviewTab";
import ProjectTasksTab from "./_components/ProjectTasksTab";
import ProjectMilestonesTab from "./_components/ProjectMilestonesTab";
import ProjectExpensesTab from "./_components/ProjectExpensesTab";

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Find project
  const project = demoProjects.find(p => p.id === id);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Project Not Found</h2>
        <p className="text-gray-500 mb-6">The project you are looking for does not exist or has been removed.</p>
        <button onClick={() => router.push("/projects")} className="btn btn-primary">
          Back to Projects
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: "Tasks" },
    { id: "milestones", label: "Milestones" },
    { id: "expenses", label: "Expenses" },
    { id: "materials", label: "Materials" },
    { id: "documents", label: "Documents" },
    { id: "team", label: "Team" },
    { id: "photos", label: "Site Photos" },
  ];

  return (
    <div className="flex flex-col gap-6 pb-12" style={{ gap: "24px" }}>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            {project.name}
            <StatusBadge status={project.status} />
            <StatusBadge status={project.health_status || "on-track"} showDot={false} />
          </div>
        }
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.name }
        ]}
        actions={
          <>
            <button className="btn btn-secondary">
              <Share size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button className="btn btn-primary" style={{ background: "var(--color-primary)" }}>
              <Edit size={16} />
              <span className="hidden sm:inline">Edit Project</span>
            </button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-800">{project.project_code}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={16} className="text-gray-400" />
            {project.city}, {project.state}
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 size={16} className="text-gray-400" />
            {project.client_name}
          </div>
          <div className="flex items-center gap-1.5">
            <User size={16} className="text-gray-400" />
            PM: {project.project_manager_name}
          </div>
        </div>
      </PageHeader>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto hide-scrollbar">
        <nav className="flex gap-6 min-w-max px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${activeTab === tab.id 
                  ? "border-amber-500 text-amber-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content Area */}
      <div>
        {activeTab === "overview" && <ProjectOverviewTab project={project} />}
        {activeTab === "tasks" && <ProjectTasksTab project={project} />}
        {activeTab === "milestones" && <ProjectMilestonesTab project={project} />}
        {activeTab === "expenses" && <ProjectExpensesTab project={project} />}
        
        {/* Render placeholder for unbuilt tabs */}
        {!["overview", "tasks", "milestones", "expenses"].includes(activeTab) && (
          <div className="premium-card p-12 text-center">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
               <Building2 size={32} />
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-2">{tabs.find(t=>t.id===activeTab)?.label} Module</h3>
             <p className="text-gray-500 max-w-md mx-auto">
               This module is part of the secondary implementation phase. Data models and core UI are ready.
             </p>
             <span className="inline-block mt-4 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
               Preview Available Soon
             </span>
          </div>
        )}
      </div>
    </div>
  );
}
