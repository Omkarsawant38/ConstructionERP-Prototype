"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ProjectTeamMember, TeamMemberFormData } from "@/types";

const LOCAL_STORAGE_KEY_PREFIX = "construction_erp_team_members_";

function getLocalFallbackKey(projectId: string): string {
  return `${LOCAL_STORAGE_KEY_PREFIX}${projectId}`;
}

function getStoredLocalMembers(projectId: string): ProjectTeamMember[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getLocalFallbackKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read team members from localStorage:", err);
    return [];
  }
}

function saveStoredLocalMembers(projectId: string, members: ProjectTeamMember[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getLocalFallbackKey(projectId), JSON.stringify(members));
  } catch (err) {
    console.error("Failed to save team members to localStorage:", err);
  }
}

/**
 * Generate standard sample members for any project
 */
export function getDefaultTeamMembers(project: Project): ProjectTeamMember[] {
  const pmName = project.project_manager_name && project.project_manager_name !== "Unassigned" 
    ? project.project_manager_name 
    : "Omkar Sawant";

  return [
    {
      id: `sample-${project.id}-1`,
      project_id: project.id,
      full_name: pmName,
      email: `${pmName.toLowerCase().replace(/\s+/g, ".")}@triples.com`,
      phone: "+91 98201 11223",
      designation: "Senior Project Manager",
      role: "Project Manager",
      department: "Project Management",
      assignment_date: project.start_date || "2024-01-15",
      status: "active",
      notes: "Direct lead in charge of schedule, site milestone sign-offs, and client delivery.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-2`,
      project_id: project.id,
      full_name: "Priya Sharma",
      email: "priya.sharma@triples.com",
      phone: "+91 98202 22334",
      designation: "Lead Site Engineer",
      role: "Site Engineer",
      department: "Site Operations",
      assignment_date: "2024-01-20",
      status: "active",
      notes: "Manages RCC structural pouring, rebar checks, and contractor shift coordination.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-3`,
      project_id: project.id,
      full_name: "Kavita Verma",
      email: "kavita.verma@triples.com",
      phone: "+91 98203 33445",
      designation: "Senior Project Accountant",
      role: "Accountant",
      department: "Finance & Accounts",
      assignment_date: "2024-02-01",
      status: "active",
      notes: "Processes contractor RA bills, petty cash disbursements, and monthly cost reconciliations.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-4`,
      project_id: project.id,
      full_name: "Rohan Mane",
      email: "rohan.mane@triples.com",
      phone: "+91 98204 44556",
      designation: "Structural Civil Engineer",
      role: "Civil Engineer",
      department: "Engineering & Design",
      assignment_date: "2024-02-05",
      status: "active",
      notes: "Oversees QA/QC testing, cube test certifications, and architectural alignment.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-5`,
      project_id: project.id,
      full_name: "Siddharth Rao",
      email: "siddharth.rao@triples.com",
      phone: "+91 98205 55667",
      designation: "Procurement & Vendor Lead",
      role: "Procurement Manager",
      department: "Procurement & Supply",
      assignment_date: "2024-02-10",
      status: "active",
      notes: "Issues purchase orders for TMT steel, bulk cement, and specialty facade fittings.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-6`,
      project_id: project.id,
      full_name: "Ganesh Kadam",
      email: "ganesh.kadam@triples.com",
      phone: "+91 98206 66778",
      designation: "Site Inventory & Yard Manager",
      role: "Store / Inventory Manager",
      department: "Inventory & Store",
      assignment_date: "2024-02-18",
      status: "active",
      notes: "Controls Goods Receipt Notes (GRN), store dispatch chits, and steel inventory ledger.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-7`,
      project_id: project.id,
      full_name: "Nitin Joshi",
      email: "nitin.joshi@triples.com",
      phone: "+91 98207 77889",
      designation: "EHS Officer",
      role: "Safety Officer",
      department: "Quality & Safety",
      assignment_date: "2024-03-01",
      status: "active",
      notes: "Conducts daily morning toolbox talks, scaffolding safety audits, and PPE enforcement.",
      is_sample: true,
    },
    {
      id: `sample-${project.id}-8`,
      project_id: project.id,
      full_name: "Rajesh Kumar",
      email: "rajesh.kumar@triples.com",
      phone: "+91 98208 88990",
      designation: "Site Execution Supervisor",
      role: "Supervisor",
      department: "Site Operations",
      assignment_date: "2024-03-10",
      status: "active",
      notes: "Coordinates daily workforce attendance, equipment operators, and sub-tier mason gangs.",
      is_sample: true,
    },
  ];
}

/**
 * Hook to manage project team members with Supabase PostgreSQL database
 */
export function useProjectTeamMembers(project: Project) {
  const [members, setMembers] = useState<ProjectTeamMember[]>(() => {
    const local = getStoredLocalMembers(project.id);
    return local.length > 0 ? local : getDefaultTeamMembers(project);
  });
  const [loading, setLoading] = useState(true);
  const [isDatabaseSynced, setIsDatabaseSynced] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const queryIds = Array.from(new Set([
      project.id,
      project.project_code,
      project.project_code.toLowerCase(),
      project.project_code.toUpperCase(),
    ])).filter(Boolean);

    try {
      const { data, error } = await supabase
        .from("project_team_members")
        .select("*")
        .in("project_id", queryIds)
        .order("created_at", { ascending: true });

      if (!error && data && data.length > 0) {
        const formatted: ProjectTeamMember[] = data.map((item: any) => ({
          id: item.id,
          project_id: project.id,
          full_name: item.full_name,
          email: item.email || "",
          phone: item.phone || "",
          designation: item.designation,
          role: item.role,
          department: item.department,
          assignment_date: item.assignment_date || "",
          status: item.status || "active",
          notes: item.notes || "",
          is_sample: item.is_sample ?? false,
        }));

        setMembers(formatted);
        saveStoredLocalMembers(project.id, formatted);
        setIsDatabaseSynced(true);
      } else if (!error && data && data.length === 0) {
        // If the table exists in Supabase but no records exist for this project, auto-seed defaults to DB!
        const initialMembers = getDefaultTeamMembers(project);
        const toInsert = initialMembers.map(m => ({
          project_id: project.id,
          full_name: m.full_name,
          email: m.email,
          phone: m.phone,
          designation: m.designation,
          role: m.role,
          department: m.department,
          assignment_date: m.assignment_date || null,
          status: m.status,
          notes: m.notes,
          is_sample: true,
        }));

        const { data: inserted, error: insertErr } = await supabase
          .from("project_team_members")
          .insert(toInsert)
          .select();

        if (!insertErr && inserted && inserted.length > 0) {
          const insertedFormatted: ProjectTeamMember[] = inserted.map((item: any) => ({
            id: item.id,
            project_id: project.id,
            full_name: item.full_name,
            email: item.email || "",
            phone: item.phone || "",
            designation: item.designation,
            role: item.role,
            department: item.department,
            assignment_date: item.assignment_date || "",
            status: item.status || "active",
            notes: item.notes || "",
            is_sample: item.is_sample ?? false,
          }));
          setMembers(insertedFormatted);
          saveStoredLocalMembers(project.id, insertedFormatted);
          setIsDatabaseSynced(true);
        } else {
          // Table may not have been migrated yet, use memory/local fallback
          setMembers(initialMembers);
          saveStoredLocalMembers(project.id, initialMembers);
        }
      } else {
        // Error reading from DB (e.g. table not yet created)
        const local = getStoredLocalMembers(project.id);
        const fallback = local.length > 0 ? local : getDefaultTeamMembers(project);
        setMembers(fallback);
      }
    } catch (err) {
      console.warn("Failed to query project_team_members from database:", err);
      const local = getStoredLocalMembers(project.id);
      setMembers(local.length > 0 ? local : getDefaultTeamMembers(project));
    } finally {
      setLoading(false);
    }
  }, [project.id, project.project_code, project.project_manager_name, project.start_date]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Add Member to Database
  const addMember = async (formData: TeamMemberFormData): Promise<ProjectTeamMember> => {
    const supabase = createClient();
    const tempId = `temp-${Date.now()}`;
    const newMember: ProjectTeamMember = {
      id: tempId,
      project_id: project.id,
      ...formData,
      is_sample: false,
    };

    // Optimistic UI update
    setMembers(prev => [newMember, ...prev]);

    try {
      const { data, error } = await supabase
        .from("project_team_members")
        .insert([{
          project_id: project.id,
          full_name: formData.full_name,
          email: formData.email || null,
          phone: formData.phone || null,
          designation: formData.designation,
          role: formData.role,
          department: formData.department,
          assignment_date: formData.assignment_date || null,
          status: formData.status,
          notes: formData.notes || null,
          is_sample: false,
        }])
        .select()
        .single();

      if (!error && data) {
        newMember.id = data.id;
        setMembers(prev => prev.map(m => m.id === tempId ? { ...newMember, id: data.id } : m));
        setIsDatabaseSynced(true);
      }
    } catch (err) {
      console.warn("Error inserting team member to database:", err);
    }

    const updated = members.map(m => m.id === tempId ? newMember : m);
    saveStoredLocalMembers(project.id, [newMember, ...members]);
    return newMember;
  };

  // Update Member in Database
  const updateMember = async (id: string, formData: TeamMemberFormData): Promise<void> => {
    // Optimistic UI update
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...formData } : m));

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_team_members")
        .update({
          full_name: formData.full_name,
          email: formData.email || null,
          phone: formData.phone || null,
          designation: formData.designation,
          role: formData.role,
          department: formData.department,
          assignment_date: formData.assignment_date || null,
          status: formData.status,
          notes: formData.notes || null,
        })
        .eq("id", id);

      if (!error) {
        setIsDatabaseSynced(true);
      }
    } catch (err) {
      console.warn("Error updating team member in database:", err);
    }

    const updated = members.map(m => m.id === id ? { ...m, ...formData } : m);
    saveStoredLocalMembers(project.id, updated);
  };

  // Delete Member from Database
  const removeMember = async (id: string): Promise<void> => {
    // Optimistic UI update
    setMembers(prev => prev.filter(m => m.id !== id));

    try {
      const supabase = createClient();
      await supabase
        .from("project_team_members")
        .delete()
        .eq("id", id);
    } catch (err) {
      console.warn("Error deleting team member from database:", err);
    }

    const updated = members.filter(m => m.id !== id);
    saveStoredLocalMembers(project.id, updated);
  };

  return {
    members,
    loading,
    isDatabaseSynced,
    addMember,
    updateMember,
    removeMember,
    refreshMembers: fetchMembers,
  };
}
