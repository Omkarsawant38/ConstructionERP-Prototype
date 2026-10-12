"use client";

import { useEffect, useState, useCallback } from "react";
import { demoTasks } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskFormData, Project } from "@/types";

const LOCAL_STORAGE_KEY = "construction_erp_custom_tasks";
const UPDATE_EVENT = "construction_erp_tasks_updated";

// Map demo project IDs to project codes and vice versa
const DEMO_PROJECT_MAP: Record<string, string[]> = {
  "p1": ["p1", "prj-001", "PRJ-001"],
  "prj-001": ["p1", "prj-001", "PRJ-001"],
  "PRJ-001": ["p1", "prj-001", "PRJ-001"],
  "p2": ["p2", "prj-002", "PRJ-002"],
  "prj-002": ["p2", "prj-002", "PRJ-002"],
  "PRJ-002": ["p2", "prj-002", "PRJ-002"],
  "p3": ["p3", "prj-003", "PRJ-003"],
  "prj-003": ["p3", "prj-003", "PRJ-003"],
  "PRJ-003": ["p3", "prj-003", "PRJ-003"],
  "p4": ["p4", "prj-004", "PRJ-004"],
  "prj-004": ["p4", "prj-004", "PRJ-004"],
  "PRJ-004": ["p4", "prj-004", "PRJ-004"],
  "p5": ["p5", "prj-005", "PRJ-005"],
  "prj-005": ["p5", "prj-005", "PRJ-005"],
  "PRJ-005": ["p5", "prj-005", "PRJ-005"],
  "p6": ["p6", "prj-006", "PRJ-006"],
  "prj-006": ["p6", "prj-006", "PRJ-006"],
  "PRJ-006": ["p6", "prj-006", "PRJ-006"],
};

/**
 * Get all custom tasks saved in localStorage
 */
export function getCustomTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read tasks from localStorage:", error);
    return [];
  }
}

/**
 * Save custom tasks to localStorage
 */
export function saveCustomTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch (error) {
    console.error("Failed to save tasks to localStorage:", error);
  }
}

/**
 * Check if a task belongs to a project by ID or Code
 */
export function doesTaskBelongToProject(task: Task, projectId: string, projectCode?: string): boolean {
  if (task.project_id === projectId) return true;
  if (projectCode && task.project_id === projectCode) return true;

  // Check demo map aliases
  const aliasesForId = DEMO_PROJECT_MAP[projectId] || [];
  if (aliasesForId.includes(task.project_id)) return true;

  if (projectCode) {
    const aliasesForCode = DEMO_PROJECT_MAP[projectCode] || [];
    if (aliasesForCode.includes(task.project_id)) return true;
  }

  return false;
}

/**
 * Returns merged list of demo tasks and custom user tasks for a given project
 */
export function getProjectTasks(projectId: string, projectCode?: string): Task[] {
  const custom = getCustomTasks();
  const customForProject = custom.filter(t => doesTaskBelongToProject(t, projectId, projectCode));
  const customIds = new Set(customForProject.map(t => t.id));

  const demoForProject = demoTasks
    .filter(t => doesTaskBelongToProject(t, projectId, projectCode))
    .filter(t => !customIds.has(t.id));

  // Custom tasks first, then demo tasks
  return [...customForProject, ...demoForProject];
}

/**
 * Create and persist a new task for a project
 */
export async function createTask(
  projectId: string,
  formData: TaskFormData,
  userId?: string | null,
  projectCode?: string
): Promise<Task> {
  const id = typeof crypto !== "undefined" && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `task-${Date.now()}`;

  const now = new Date().toISOString();

  const newTask: Task = {
    id,
    project_id: projectId,
    title: formData.title.trim(),
    description: formData.description || "",
    status: formData.status || "not-started",
    priority: formData.priority || "medium",
    start_date: formData.start_date || undefined,
    due_date: formData.due_date || undefined,
    progress: Number(formData.progress) || 0,
    assigned_to_name: formData.assigned_to_name || "Unassigned",
    created_by: userId || "user1",
    organization_id: "org1",
    created_at: now,
    updated_at: now,
  };

  // 1. Save to LocalStorage immediately
  const existing = getCustomTasks();
  saveCustomTasks([newTask, ...existing]);

  // 2. Attempt to save to Supabase if connected
  try {
    const supabase = createClient();
    await supabase.from("tasks").insert({
      id: newTask.id,
      project_id: newTask.project_id,
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      start_date: newTask.start_date || null,
      due_date: newTask.due_date || null,
      progress: newTask.progress,
      assigned_to_name: newTask.assigned_to_name,
      organization_id: newTask.organization_id,
    });
  } catch (err) {
    console.warn("Supabase task sync failed (running in offline/demo mode):", err);
  }

  return newTask;
}

/**
 * Update an existing task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<void> {
  const custom = getCustomTasks();
  const index = custom.findIndex(t => t.id === taskId);

  if (index !== -1) {
    const updated = { ...custom[index], ...updates, updated_at: new Date().toISOString() };
    custom[index] = updated;
    saveCustomTasks([...custom]);
  } else {
    // If it was a demo task being modified for the first time, clone it into custom tasks
    const demo = demoTasks.find(t => t.id === taskId);
    if (demo) {
      const cloned = { ...demo, ...updates, updated_at: new Date().toISOString() };
      saveCustomTasks([cloned, ...custom]);
    }
  }

  // Attempt Supabase update
  try {
    const supabase = createClient();
    await supabase.from("tasks").update(updates).eq("id", taskId);
  } catch {
    // ignore in demo mode
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const custom = getCustomTasks();
  const filtered = custom.filter(t => t.id !== taskId);
  saveCustomTasks(filtered);

  try {
    const supabase = createClient();
    await supabase.from("tasks").delete().eq("id", taskId);
  } catch {
    // ignore
  }
}

/**
 * React hook to access and manage tasks for a project
 */
export function useProjectTasks(project?: Project | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTasks = useCallback(() => {
    if (!project) {
      setTasks([]);
      setLoading(false);
      return;
    }
    const currentTasks = getProjectTasks(project.id, project.project_code);
    setTasks(currentTasks);
    setLoading(false);
  }, [project?.id, project?.project_code]);

  useEffect(() => {
    refreshTasks();

    const handleUpdate = () => {
      refreshTasks();
    };

    window.addEventListener(UPDATE_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
    };
  }, [refreshTasks]);

  const addTask = async (formData: TaskFormData, userId?: string | null) => {
    if (!project) return;
    const created = await createTask(project.id, formData, userId, project.project_code);
    refreshTasks();
    return created;
  };

  const editTask = async (taskId: string, updates: Partial<Task>) => {
    await updateTask(taskId, updates);
    refreshTasks();
  };

  const removeTask = async (taskId: string) => {
    await deleteTask(taskId);
    refreshTasks();
  };

  return {
    tasks,
    loading,
    refreshTasks,
    addTask,
    editTask,
    removeTask,
  };
}
