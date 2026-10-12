"use client";

import { useEffect, useState, useCallback } from "react";
import { demoProjects } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectFormData, ProjectHealthStatus } from "@/types";

const LOCAL_STORAGE_KEY = "construction_erp_custom_projects";
const UPDATE_EVENT = "construction_erp_projects_updated";

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
 * Returns merged list of demo projects and custom user-created projects
 */
export function getAllProjects(): Project[] {
  const custom = getCustomProjects();
  // Filter out any duplicates if IDs collide
  const customIds = new Set(custom.map(p => p.id));
  const remainingDemo = demoProjects.filter(p => !customIds.has(p.id));
  // Custom projects come first
  return [...custom, ...remainingDemo];
}

/**
 * Find single project by ID or project_code
 */
export function getProjectById(idOrCode: string): Project | undefined {
  const all = getAllProjects();
  return all.find(p => p.id === idOrCode || p.project_code.toLowerCase() === idOrCode.toLowerCase());
}

/**
 * Increment or adjust actual_expenses for a project and recalculate remaining_budget
 */
export function updateProjectExpensesTotal(projectIdOrCode: string, amountToAdd: number) {
  if (typeof window === "undefined") return;
  const custom = getCustomProjects();
  const index = custom.findIndex(
    p => p.id === projectIdOrCode || p.project_code.toLowerCase() === projectIdOrCode.toLowerCase()
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
      p => p.id === projectIdOrCode || p.project_code.toLowerCase() === projectIdOrCode.toLowerCase()
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
 * Update an existing project
 */
export async function updateProject(
  idOrCode: string,
  updates: Partial<ProjectFormData & { progress?: number; health_status?: ProjectHealthStatus }>,
  fallbackProject?: Project
): Promise<Project | null> {
  if (typeof window === "undefined") return null;

  const custom = getCustomProjects();
  const index = custom.findIndex(
    p => p.id === idOrCode || (p.project_code && p.project_code.toLowerCase() === idOrCode.toLowerCase())
  );

  let updatedProject: Project;

  if (index >= 0) {
    const existing = custom[index];
    const newBudget = updates.approved_budget !== undefined ? Number(updates.approved_budget) : existing.approved_budget;
    const actualExpenses = existing.actual_expenses || 0;
    const newRemaining = Math.max(0, newBudget - actualExpenses);

    updatedProject = {
      ...existing,
      ...updates,
      health_status: (updates.health_status || existing.health_status) as ProjectHealthStatus,
      approved_budget: newBudget,
      remaining_budget: newRemaining,
      updated_at: new Date().toISOString(),
    };

    const newCustom = [...custom];
    newCustom[index] = updatedProject;
    saveCustomProjects(newCustom);
  } else {
    // 1. Try finding in demoProjects
    const demo = demoProjects.find(
      p => p.id === idOrCode || (p.project_code && p.project_code.toLowerCase() === idOrCode.toLowerCase())
    );

    // 2. Base project: fallbackProject > demo
    const base = fallbackProject || demo;

    if (base) {
      const newBudget = updates.approved_budget !== undefined ? Number(updates.approved_budget) : (base.approved_budget || 0);
      const actualExpenses = base.actual_expenses || 0;
      const newRemaining = Math.max(0, newBudget - actualExpenses);

      updatedProject = {
        ...base,
        ...updates,
        health_status: (updates.health_status || base.health_status || "on-track") as ProjectHealthStatus,
        approved_budget: newBudget,
        remaining_budget: newRemaining,
        updated_at: new Date().toISOString(),
      };

      saveCustomProjects([updatedProject, ...custom]);
    } else {
      // 3. Fallback: query Supabase if available
      try {
        const supabase = createClient();
        const { data: dbProj } = await supabase.from("projects").select("*").eq("id", idOrCode).maybeSingle();
        if (dbProj) {
          const newBudget = updates.approved_budget !== undefined ? Number(updates.approved_budget) : (Number(dbProj.approved_budget) || 0);
          const actualExpenses = Number(dbProj.actual_expenses) || 0;
          const newRemaining = Math.max(0, newBudget - actualExpenses);

          updatedProject = {
            id: dbProj.id,
            project_code: updates.project_code || dbProj.project_code || "PRJ-000",
            name: updates.name || dbProj.name,
            description: updates.description !== undefined ? updates.description : (dbProj.description || ""),
            client_name: updates.client_name !== undefined ? updates.client_name : (dbProj.client_name || ""),
            project_type: updates.project_type || dbProj.project_type || "Residential",
            construction_category: updates.construction_category || dbProj.construction_category || "High-Rise",
            site_address: updates.site_address !== undefined ? updates.site_address : (dbProj.site_address || ""),
            city: updates.city !== undefined ? updates.city : (dbProj.city || ""),
            state: updates.state !== undefined ? updates.state : (dbProj.state || "Maharashtra"),
            postal_code: updates.postal_code !== undefined ? updates.postal_code : (dbProj.postal_code || ""),
            start_date: updates.start_date || dbProj.start_date || "",
            end_date: updates.end_date || dbProj.end_date || "",
            actual_end_date: updates.actual_end_date || dbProj.actual_end_date || "",
            approved_budget: newBudget,
            currency: dbProj.currency || "INR",
            financial_notes: updates.financial_notes !== undefined ? updates.financial_notes : (dbProj.financial_notes || ""),
            project_manager_name: updates.project_manager_name || dbProj.project_manager_name || "Unassigned",
            status: (updates.status || dbProj.status || "planning") as any,
            health_status: (updates.health_status || dbProj.health_status || "on-track") as any,
            progress: updates.progress ?? dbProj.progress ?? 0,
            organization_id: dbProj.organization_id || "org1",
            created_by: dbProj.created_by || "user1",
            created_at: dbProj.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            actual_expenses: actualExpenses,
            remaining_budget: newRemaining,
            tasks_count: 0,
            completed_tasks: 0,
            milestones_count: 0,
            completed_milestones: 0,
          };

          saveCustomProjects([updatedProject, ...custom]);
        } else {
          return null;
        }
      } catch {
        return null;
      }
    }
  }

  // Attempt Supabase update
  try {
    const supabase = createClient();
    const supabasePayload: Record<string, any> = {};
    if (updates.name !== undefined) supabasePayload.name = updates.name;
    if (updates.project_code !== undefined) supabasePayload.project_code = updates.project_code;
    if (updates.description !== undefined) supabasePayload.description = updates.description;
    if (updates.client_name !== undefined) supabasePayload.client_name = updates.client_name;
    if (updates.project_type !== undefined) supabasePayload.project_type = updates.project_type;
    if (updates.construction_category !== undefined) supabasePayload.construction_category = updates.construction_category;
    if (updates.site_address !== undefined) supabasePayload.site_address = updates.site_address;
    if (updates.city !== undefined) supabasePayload.city = updates.city;
    if (updates.state !== undefined) supabasePayload.state = updates.state;
    if (updates.postal_code !== undefined) supabasePayload.postal_code = updates.postal_code;
    if (updates.start_date !== undefined) supabasePayload.start_date = updates.start_date;
    if (updates.end_date !== undefined) supabasePayload.end_date = updates.end_date;
    if (updates.approved_budget !== undefined) supabasePayload.approved_budget = Number(updates.approved_budget);
    if (updates.status !== undefined) supabasePayload.status = updates.status;
    if (updates.progress !== undefined) supabasePayload.progress = updates.progress;
    if (updates.health_status !== undefined) supabasePayload.health_status = updates.health_status;
    if (updates.project_manager_name !== undefined) supabasePayload.project_manager_name = updates.project_manager_name;
    if (updates.financial_notes !== undefined) supabasePayload.financial_notes = updates.financial_notes;
    supabasePayload.updated_at = new Date().toISOString();

    await supabase
      .from("projects")
      .update(supabasePayload)
      .eq("id", updatedProject.id);
  } catch (err) {
    console.warn("Supabase project update warning:", err);
  }

  return updatedProject;
}

/**
 * Create and persist a new project
 */
export async function createProject(
  formData: ProjectFormData,
  userId?: string | null
): Promise<Project> {
  const id = typeof crypto !== "undefined" && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `proj-${Date.now()}`;

  const now = new Date().toISOString();

  const newProject: Project = {
    id,
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
    created_by: userId || "user1",
    created_at: now,
    updated_at: now,
  };

  // 1. Save to Local Storage immediately
  const existing = getCustomProjects();
  saveCustomProjects([newProject, ...existing]);

  // 2. Attempt to save to Supabase if connected
  try {
    const supabase = createClient();
    const supabasePayload: Record<string, any> = {
      name: newProject.name,
      project_code: newProject.project_code,
      description: newProject.description,
      client_name: newProject.client_name,
      project_type: newProject.project_type,
      construction_category: newProject.construction_category,
      site_address: newProject.site_address,
      city: newProject.city,
      state: newProject.state,
      postal_code: newProject.postal_code,
      start_date: newProject.start_date || null,
      end_date: newProject.end_date || null,
      approved_budget: newProject.approved_budget,
      currency: newProject.currency,
      financial_notes: newProject.financial_notes,
      status: newProject.status,
      progress: newProject.progress,
      health_status: newProject.health_status,
    };

    if (userId) {
      supabasePayload.created_by = userId;
    }

    const { data, error } = await supabase
      .from("projects")
      .insert([supabasePayload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn("Supabase insert warning (project safely saved locally):", error.message);
    } else if (data && data.id) {
      // If Supabase created it with its own ID, update our stored project id to match
      const updatedCustom = getCustomProjects().map(p => 
        p.id === id ? { ...p, id: data.id } : p
      );
      saveCustomProjects(updatedCustom);
      newProject.id = data.id;
    }
  } catch (err) {
    console.warn("Supabase request skipped or errored, saved locally:", err);
  }

  return newProject;
}

/**
 * React hook to access and subscribe to projects
 */
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(demoProjects);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    // 1. Synchronous read of localStorage + demo data
    const localMerged = getAllProjects();
    setProjects(localMerged);

    // 2. Try fetching from Supabase to merge any cloud projects
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      
      if (!error && data && data.length > 0) {
        // Map supabase projects to Project interface
        const supabaseProjects: Project[] = data.map((item: any) => {
          const demoMatch = demoProjects.find(
            dp => dp.id === item.id || dp.project_code?.toLowerCase() === (item.project_code || "").toLowerCase()
          );
          const localCustom = getCustomProjects();
          const customMatch = localCustom.find(
            cp => cp.id === item.id || cp.project_code?.toLowerCase() === (item.project_code || "").toLowerCase()
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

        // Merge: Supabase + local + demo (deduplicating by id and project_code)
        const seenIds = new Set<string>();
        const seenCodes = new Set<string>();
        const merged: Project[] = [];

        for (const p of [...supabaseProjects, ...localMerged]) {
          if (!seenIds.has(p.id) && !seenCodes.has(p.project_code.toLowerCase())) {
            seenIds.add(p.id);
            seenCodes.add(p.project_code.toLowerCase());
            merged.push(p);
          }
        }
        setProjects(merged);
      }
    } catch {
      // Ignore Supabase connection errors, local data is already active
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

  return { projects, loading, refreshProjects: loadProjects };
}
