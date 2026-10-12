"use client";

import { useEffect, useState, useCallback } from "react";
import { demoProjects } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectFormData, ProjectHealthStatus } from "@/types";

const LOCAL_STORAGE_KEY = "construction_erp_custom_projects";
const UPDATE_EVENT = "construction_erp_projects_updated";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get all custom projects saved by the user in localStorage
 */
export function getCustomProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read projects from localStorage:", error);
    return [];
  }
}

/**
 * Save custom projects to localStorage
 */
export function saveCustomProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch (error) {
    console.error("Failed to save projects to localStorage:", error);
  }
}

/**
 * Sync unsaved or locally cached projects directly into the Supabase database
 */
export async function syncLocalProjectsToDatabase(): Promise<void> {
  if (typeof window === "undefined") return;
  const localProjects = getCustomProjects();
  if (localProjects.length === 0) return;

  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectsToSync: localProjects }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.synced && Array.isArray(data.synced) && data.synced.length > 0) {
        // Update local storage IDs to match database UUIDs
        const updated = localProjects.map((lp) => {
          const match = data.synced.find(
            (sp: any) => sp.project_code?.toLowerCase() === lp.project_code.toLowerCase()
          );
          if (match && match.id) {
            return { ...lp, id: match.id };
          }
          return lp;
        });
        saveCustomProjects(updated);
      }
    }
  } catch (err) {
    console.warn("Background project DB sync notice:", err);
  }
}

/**
 * Returns merged list of demo projects and custom user-created projects
 */
export function getAllProjects(): Project[] {
  const custom = getCustomProjects();
  const customIds = new Set(custom.map((p) => p.id));
  const customCodes = new Set(custom.map((p) => p.project_code.toLowerCase()));

  // Filter out any demo projects if user created custom projects with matching code or ID
  const remainingDemo = demoProjects.filter(
    (p) => !customIds.has(p.id) && !customCodes.has(p.project_code.toLowerCase())
  );

  // Sort custom projects newest first
  const sortedCustom = [...custom].sort((a, b) => {
    const timeA = new Date(a.created_at || a.updated_at || a.start_date || 0).getTime();
    const timeB = new Date(b.created_at || b.updated_at || b.start_date || 0).getTime();
    return timeB - timeA;
  });

  return [...sortedCustom, ...remainingDemo];
}

/**
 * Find single project by ID or project_code
 */
export function getProjectById(idOrCode: string): Project | undefined {
  const all = getAllProjects();
  return all.find(
    (p) => p.id === idOrCode || p.project_code.toLowerCase() === idOrCode.toLowerCase()
  );
}

/**
 * Increment or adjust actual_expenses for a project and recalculate remaining_budget
 */
export function updateProjectExpensesTotal(projectIdOrCode: string, amountToAdd: number) {
  if (typeof window === "undefined") return;
  const custom = getCustomProjects();
  const index = custom.findIndex(
    (p) => p.id === projectIdOrCode || p.project_code.toLowerCase() === projectIdOrCode.toLowerCase()
  );

  if (index >= 0) {
    const updated = [...custom];
    const newExpenses = (updated[index].actual_expenses || 0) + amountToAdd;
    const newRemaining = Math.max(0, (updated[index].approved_budget || 0) - newExpenses);
    updated[index] = {
      ...updated[index],
      actual_expenses: newExpenses,
      remaining_budget: newRemaining,
    };
    saveCustomProjects(updated);
  } else {
    // If it's a demo project not yet in custom projects, copy it into custom projects with updated values
    const demo = demoProjects.find(
      (p) => p.id === projectIdOrCode || p.project_code.toLowerCase() === projectIdOrCode.toLowerCase()
    );
    if (demo) {
      const newExpenses = (demo.actual_expenses || 0) + amountToAdd;
      const newRemaining = Math.max(0, (demo.approved_budget || 0) - newExpenses);
      const cloned: Project = {
        ...demo,
        actual_expenses: newExpenses,
        remaining_budget: newRemaining,
      };
      saveCustomProjects([cloned, ...custom]);
    }
  }
}

/**
 * Update an existing project both locally and in the Supabase database
 */
export async function updateProject(
  idOrCode: string,
  updates: Partial<Project>,
  existingProject?: Project
): Promise<Project | null> {
  let updatedProject: Project | null = null;
  const custom = getCustomProjects();
  const index = custom.findIndex(
    (p) => p.id === idOrCode || p.project_code.toLowerCase() === idOrCode.toLowerCase()
  );

  if (index >= 0) {
    const base = custom[index];
    const newBudget = updates.approved_budget !== undefined ? Number(updates.approved_budget) : base.approved_budget;
    const actualExpenses = updates.actual_expenses !== undefined ? Number(updates.actual_expenses) : (base.actual_expenses || 0);
    const newRemaining = Math.max(0, newBudget - actualExpenses);

    updatedProject = {
      ...base,
      ...updates,
      approved_budget: newBudget,
      remaining_budget: newRemaining,
      actual_expenses: actualExpenses,
      updated_at: new Date().toISOString(),
    };

    const newCustom = [...custom];
    newCustom[index] = updatedProject;
    saveCustomProjects(newCustom);
  } else {
    // Check if demo project
    const demoIndex = demoProjects.findIndex(
      (p) => p.id === idOrCode || p.project_code.toLowerCase() === idOrCode.toLowerCase()
    );
    if (demoIndex >= 0) {
      const base = demoProjects[demoIndex];
      const newBudget = updates.approved_budget !== undefined ? Number(updates.approved_budget) : base.approved_budget;
      const actualExpenses = updates.actual_expenses !== undefined ? Number(updates.actual_expenses) : (base.actual_expenses || 0);
      const newRemaining = Math.max(0, newBudget - actualExpenses);

      updatedProject = {
        ...base,
        ...updates,
        approved_budget: newBudget,
        remaining_budget: newRemaining,
        actual_expenses: actualExpenses,
        updated_at: new Date().toISOString(),
      };

      saveCustomProjects([updatedProject, ...custom]);
    }
  }

  // Persist update to database via API or Supabase client
  try {
    const targetId = updatedProject?.id || idOrCode;
    await fetch(`/api/projects/${encodeURIComponent(targetId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  } catch (apiErr) {
    console.warn("API project PATCH warning:", apiErr);
  }

  return updatedProject;
}

/**
 * Create and persist a new project to the database and local cache
 */
export async function createProject(
  formData: ProjectFormData,
  userId?: string | null
): Promise<Project> {
  const localId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `proj-${Date.now()}`;

  const now = new Date().toISOString();

  let newProject: Project = {
    id: localId,
    project_code: formData.project_code.trim(),
    name: formData.name.trim(),
    description: formData.description || "",
    client_name: formData.client_name || "",
    project_type: formData.project_type || "Residential",
    construction_category: formData.construction_category || "High-Rise",
    site_address: formData.site_address || "",
    city: formData.city || "",
    state: formData.state || "Maharashtra",
    postal_code: formData.postal_code || "",
    start_date: formData.start_date,
    end_date: formData.end_date,
    actual_end_date: formData.actual_end_date || "",
    approved_budget: Number(formData.approved_budget) || 0,
    currency: formData.currency || "INR",
    financial_notes: formData.financial_notes || "",
    project_manager_name: formData.project_manager_name || "Unassigned",
    status: formData.status || "planning",
    health_status: "on-track",
    progress: 0,
    actual_expenses: 0,
    remaining_budget: Number(formData.approved_budget) || 0,
    tasks_count: 0,
    completed_tasks: 0,
    milestones_count: 0,
    completed_milestones: 0,
    organization_id: "org1",
    created_by: userId && UUID_REGEX.test(userId) ? userId : "user1",
    created_at: now,
    updated_at: now,
  };

  // 1. Immediately save to Local Storage cache
  const existing = getCustomProjects();
  saveCustomProjects([newProject, ...existing.filter((p) => p.project_code !== newProject.project_code)]);

  // 2. Persist to Supabase Database via API endpoint
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        userId: userId && UUID_REGEX.test(userId) ? userId : undefined,
      }),
    });

    const data = await res.json();

    if (res.ok && data.project && data.project.id) {
      // Map saved database project
      newProject = {
        ...newProject,
        id: data.project.id,
        created_at: data.project.created_at || newProject.created_at,
        updated_at: data.project.updated_at || newProject.updated_at,
      };

      // Update local storage with the confirmed database UUID
      const updatedCustom = getCustomProjects().map((p) =>
        p.id === localId || p.project_code.toLowerCase() === newProject.project_code.toLowerCase()
          ? newProject
          : p
      );
      saveCustomProjects(updatedCustom);
    } else {
      console.warn("Database response warning, will sync in background:", data.error);
    }
  } catch (err) {
    console.warn("Failed to reach /api/projects directly, fallback to direct client insert:", err);
    // Direct client fallback
    try {
      const supabase = createClient();
      const payload: Record<string, any> = {
        name: newProject.name,
        project_code: newProject.project_code,
        description: newProject.description || null,
        client_name: newProject.client_name || null,
        project_type: newProject.project_type,
        construction_category: newProject.construction_category,
        site_address: newProject.site_address || null,
        city: newProject.city || null,
        state: newProject.state,
        postal_code: newProject.postal_code || null,
        start_date: newProject.start_date || null,
        end_date: newProject.end_date || null,
        approved_budget: newProject.approved_budget,
        currency: newProject.currency,
        financial_notes: newProject.financial_notes || null,
        project_manager_name: newProject.project_manager_name,
        status: newProject.status,
        progress: newProject.progress,
        health_status: newProject.health_status,
      };

      if (userId && UUID_REGEX.test(userId)) {
        payload.created_by = userId;
      }

      const { data: dbData } = await supabase
        .from("projects")
        .upsert(payload, { onConflict: "project_code" })
        .select()
        .maybeSingle();

      if (dbData && dbData.id) {
        newProject.id = dbData.id;
        const updatedCustom = getCustomProjects().map((p) =>
          p.id === localId ? { ...p, id: dbData.id } : p
        );
        saveCustomProjects(updatedCustom);
      }
    } catch (directErr) {
      console.warn("Direct Supabase fallback error:", directErr);
    }
  }

  return newProject;
}

/**
 * React hook to access, synchronize, and subscribe to projects
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => getAllProjects());
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    // 1. Synchronous read of localStorage + demo data
    const localMerged = getAllProjects();
    setProjects(localMerged);

    // 2. Trigger background sync of any unsynced local projects to database
    syncLocalProjectsToDatabase();

    // 3. Fetch from database to merge latest cloud projects
    try {
      const res = await fetch("/api/projects");
      let dbProjects: any[] = [];

      if (res.ok) {
        const body = await res.json();
        dbProjects = body.projects || [];
      } else {
        const supabase = createClient();
        const { data } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });
        dbProjects = data || [];
      }

      if (dbProjects.length > 0) {
        const supabaseProjects: Project[] = dbProjects.map((item: any) => {
          const demoMatch = demoProjects.find(
            (dp) => dp.id === item.id || dp.project_code?.toLowerCase() === (item.project_code || "").toLowerCase()
          );
          const localCustom = getCustomProjects();
          const customMatch = localCustom.find(
            (cp) => cp.id === item.id || cp.project_code?.toLowerCase() === (item.project_code || "").toLowerCase()
          );

          const actualExpenses = customMatch?.actual_expenses !== undefined
            ? customMatch.actual_expenses
            : (item.actual_expenses !== undefined && item.actual_expenses !== null
              ? Number(item.actual_expenses)
              : (demoMatch?.actual_expenses ?? 0));

          const approvedBudget = Number(item.approved_budget) || (demoMatch?.approved_budget ?? 0);
          const remainingBudget = customMatch?.remaining_budget !== undefined
            ? customMatch.remaining_budget
            : (item.remaining_budget !== undefined && item.remaining_budget !== null
              ? Number(item.remaining_budget)
              : (demoMatch?.remaining_budget ?? Math.max(0, approvedBudget - actualExpenses)));

          return {
            id: item.id,
            project_code: item.project_code || demoMatch?.project_code || "PRJ-000",
            name: item.name,
            description: item.description || demoMatch?.description || "",
            client_name: item.client_name || demoMatch?.client_name || "",
            project_type: item.project_type || demoMatch?.project_type || "Residential",
            construction_category: item.construction_category || demoMatch?.construction_category || "High-Rise",
            site_address: item.site_address || demoMatch?.site_address || "",
            city: item.city || demoMatch?.city || "",
            state: item.state || demoMatch?.state || "Maharashtra",
            postal_code: item.postal_code || demoMatch?.postal_code || "",
            start_date: item.start_date || demoMatch?.start_date || "",
            end_date: item.end_date || demoMatch?.end_date || "",
            actual_end_date: item.actual_end_date || demoMatch?.actual_end_date || "",
            approved_budget: approvedBudget,
            currency: item.currency || demoMatch?.currency || "INR",
            financial_notes: item.financial_notes || demoMatch?.financial_notes || "",
            project_manager_name: item.project_manager_name || demoMatch?.project_manager_name || "Unassigned",
            status: item.status || demoMatch?.status || "planning",
            health_status: item.health_status || demoMatch?.health_status || "on-track",
            progress: item.progress ?? demoMatch?.progress ?? 0,
            organization_id: item.organization_id || "org1",
            created_by: item.created_by || "user1",
            created_at: item.created_at || demoMatch?.created_at || new Date().toISOString(),
            updated_at: item.updated_at || demoMatch?.updated_at || new Date().toISOString(),
            actual_expenses: actualExpenses,
            remaining_budget: remainingBudget,
            tasks_count: demoMatch?.tasks_count || 0,
            completed_tasks: demoMatch?.completed_tasks || 0,
            milestones_count: demoMatch?.milestones_count || 0,
            completed_milestones: demoMatch?.completed_milestones || 0,
          };
        });

        // Merge: Supabase + local + demo, sorting newest created_at first
        const seenIds = new Set<string>();
        const seenCodes = new Set<string>();
        const merged: Project[] = [];

        // All candidates sorted by created_at descending (newest first)
        const allCandidates = [...supabaseProjects, ...localMerged].sort((a, b) => {
          const isDemoA = demoProjects.some(
            (dp) => dp.id === a.id || dp.project_code.toLowerCase() === a.project_code.toLowerCase()
          );
          const isDemoB = demoProjects.some(
            (dp) => dp.id === b.id || dp.project_code.toLowerCase() === b.project_code.toLowerCase()
          );

          // User-created custom projects always precede demo seeds
          if (!isDemoA && isDemoB) return -1;
          if (isDemoA && !isDemoB) return 1;

          const timeA = new Date(a.created_at || a.updated_at || a.start_date || 0).getTime();
          const timeB = new Date(b.created_at || b.updated_at || b.start_date || 0).getTime();
          return timeB - timeA;
        });

        for (const p of allCandidates) {
          if (!seenIds.has(p.id) && !seenCodes.has(p.project_code.toLowerCase())) {
            seenIds.add(p.id);
            seenCodes.add(p.project_code.toLowerCase());
            merged.push(p);
          }
        }
        setProjects(merged);
      }
    } catch {
      // Local data is already active
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();

    const handleUpdate = () => {
      setProjects(getAllProjects());
    };

    window.addEventListener(UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadProjects]);

  return { projects, loading, refresh: loadProjects, refreshProjects: loadProjects };
}
