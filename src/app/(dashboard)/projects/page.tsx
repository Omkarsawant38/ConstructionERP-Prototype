"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useProjects } from "@/lib/projectStore";
import { formatCurrencyFull, formatDateShort, getProjectImageUrl } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  MoreHorizontal,
  MapPin,
  Calendar,
  Building2,
  FolderKanban
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { PermissionGate } from "@/lib/rbac/client";
import { RouteGuard } from "@/components/ui/RouteGuard";

const statusFilterOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active", color: "#16A34A" },
  { value: "planning", label: "Planning", color: "#3B82F6" },
  { value: "on-hold", label: "On Hold", color: "#F59E0B" },
  { value: "completed", label: "Completed", color: "#10B981" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const { projects } = useProjects();
  const [view, setView] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Dynamic client options from project data
  const clientFilterOptions = [
    { value: "all", label: "All Clients" },
    ...Array.from(new Set(projects.map((p) => p.client_name).filter(Boolean))).map((client) => ({
      value: client as string,
      label: client as string,
    })),
  ];

  const priorityFilterOptions = [
    { value: "all", label: "All Priorities" },
    { value: "critical", label: "Critical", color: "#DC2626" },
    { value: "high", label: "High", color: "#EF4444" },
    { value: "medium", label: "Medium", color: "#F59E0B" },
    { value: "low", label: "Low", color: "#3B82F6" },
  ];

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.city && project.city.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesClient = clientFilter === "all" || project.client_name === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  // Calculate pagination
  const totalItems = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProjects = filteredProjects.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  return (
    <RouteGuard permission="projects.view">
      <div className="flex flex-col gap-6" style={{ gap: "24px" }}>
        <div>
        <PageHeader 
          title="Projects" 
          description="Track operational milestones, client delivery pipelines, and team assignments."
          icon={<FolderKanban size={24} />}
          action={
            <PermissionGate permission="projects.create">
              <Link href="/projects/new" className="btn btn-primary">
                <Plus size={18} />
                New Project
              </Link>
            </PermissionGate>
          }
        />
      </div>

      {/* Filters UI matching reference */}
      <div className="premium-card" style={{ padding: "24px" }}>
        <div className="flex items-center border-b border-gray-100" style={{ gap: "8px", paddingBottom: "16px", marginBottom: "16px" }}>
          <Filter size={16} className="text-gray-700" />
          <h3 className="text-sm font-bold text-gray-900">Filter Projects</h3>
        </div>
        
        <div className="flex flex-wrap items-end" style={{ gap: "16px" }}>
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search projects by name, client, or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-input w-full h-10"
                style={{ paddingLeft: "36px" }}
              />
            </div>
          </div>
          
          <div className="w-full sm:w-44">
            <Select
              label="Status"
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              label="Client"
              options={clientFilterOptions}
              value={clientFilter}
              onChange={(val) => {
                setClientFilter(val);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              label="Priority"
              options={priorityFilterOptions}
              value={priorityFilter}
              onChange={(val) => {
                setPriorityFilter(val);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200 h-10 w-full sm:w-auto" style={{ gap: "4px", padding: "4px" }}>
            <button
              onClick={() => setView("grid")}
              className={`rounded-md text-sm font-medium transition-colors ${view === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              style={{ padding: "6px 16px" }}
            >
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded-md text-sm font-medium transition-colors ${view === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              style={{ padding: "6px 16px" }}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Project Content */}
      {filteredProjects.length === 0 ? (
        <div className="premium-card py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No projects found</h3>
          <p className="text-gray-500 max-w-sm mb-6">
            We couldn't find any projects matching your current filters. Try adjusting your search criteria.
          </p>
          <button 
            onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      ) : view === "list" ? (
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Code</th>
                  <th>Project Name</th>
                  <th>Location</th>
                  <th>Dates</th>
                  <th className="text-center" style={{ width: "90px" }}>Progress</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map((project) => (
                  <tr 
                    key={project.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <td className="font-medium text-gray-600">{project.project_code}</td>
                    <td>
                      <div className="font-semibold text-gray-900">{project.name}</div>
                      <div className="text-xs text-gray-500">{project.client_name}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin size={14} />
                        {project.city}
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">
                      <div>{formatDateShort(project.start_date)} -</div>
                      <div>{formatDateShort(project.end_date)}</div>
                    </td>
                    <td className="text-center" style={{ width: "90px", padding: "10px 8px" }}>
                      <CircularProgress value={project.progress} showPercentageBelow size={36} strokeWidth={3.5} />
                    </td>
                    <td>
                      <StatusBadge status={project.status} size="sm" />
                    </td>
                    <td className="font-medium">
                      {formatCurrencyFull(project.approved_budget)}
                    </td>
                    <td>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add action menu logic here
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div 
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}
        >
          {paginatedProjects.map((project) => (
            <div 
              key={project.id} 
              className="premium-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              {/* Card Header with generic construction background */}
              <div 
                className="h-32 bg-gray-200 relative flex flex-col justify-between"
                style={{
                  padding: "16px",
                  backgroundImage: `url('${getProjectImageUrl(project)}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                <div className="relative flex justify-between items-start">
                  <span className="bg-black/50 text-white text-xs font-medium rounded backdrop-blur-sm" style={{ padding: "4px 8px" }}>
                    {project.project_code}
                  </span>
                  <StatusBadge status={project.status} size="sm" />
                </div>
                <div className="relative">
                  <h3 className="text-white font-bold text-lg leading-tight truncate group-hover:text-amber-400 transition-colors">
                    {project.name}
                  </h3>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col" style={{ padding: "20px" }}>
                <div className="flex items-start text-sm text-gray-600" style={{ gap: "8px", marginBottom: "16px" }}>
                  <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{project.site_address}, {project.city}</span>
                </div>
                
                <div className="flex flex-col flex-1" style={{ gap: "12px", marginBottom: "16px" }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Budget:</span>
                    <span className="font-semibold">{formatCurrencyFull(project.approved_budget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Expenses:</span>
                    <span className="font-medium text-amber-600">{formatCurrencyFull(project.actual_expenses || 0)}</span>
                  </div>
                </div>
                
                <div className="mt-auto">
                  <div className="flex justify-between text-xs text-gray-500" style={{ marginBottom: "6px" }}>
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} />
                  
                  <div className="flex items-center justify-between border-t border-gray-100 text-xs text-gray-500" style={{ marginTop: "16px", paddingTop: "16px" }}>
                    <div className="flex items-center" style={{ gap: "6px" }}>
                      <Calendar size={14} />
                      {formatDateShort(project.end_date)}
                    </div>
                    <div className="flex items-center" style={{ gap: "6px" }}>
                      <Building2 size={14} />
                      {project.client_name?.substring(0, 15)}
                      {project.client_name && project.client_name.length > 15 ? '...' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredProjects.length > 0 && (
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[6, 10, 20]}
          itemName="projects"
        />
      )}
    </div>
    </RouteGuard>
  );
}
