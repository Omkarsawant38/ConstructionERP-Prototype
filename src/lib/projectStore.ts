"use client";

import { useEffect, useState, useCallback } from "react";
import { demoProjects } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectFormData } from "@/types";

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
