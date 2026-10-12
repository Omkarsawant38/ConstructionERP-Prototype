"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";
import type { RoleName } from "@/types/rbac";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  roles: RoleName[];
  permissions: string[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  roles: [],
  permissions: [],
  loading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<RoleName[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUserData = async (authUser: User) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch user roles
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role_id, roles:role_id(name)")
        .eq("user_id", authUser.id);

      let userRoleNames: RoleName[] = (userRoles || [])
        .map((ur: any) => ur.roles?.name)
        .filter(Boolean) as RoleName[];

      // Fallback: If user_roles table is unseeded or user has no assigned role record,
      // fallback to profile.role. Do NOT default unknown users to super_admin!
      if (userRoleNames.length === 0) {
        if (profileData?.role && profileData?.role !== "user") {
          userRoleNames = [profileData.role as RoleName];
        } else if (authUser.email?.startsWith("admin@")) {
          userRoleNames = ["super_admin"];
        } else if (authUser.email?.startsWith("director@")) {
          userRoleNames = ["owner_director"];
        } else if (authUser.email?.startsWith("pm@")) {
          userRoleNames = ["project_manager"];
        } else if (authUser.email?.startsWith("accounts@")) {
          userRoleNames = ["accountant"];
        } else if (authUser.email?.startsWith("site.")) {
          userRoleNames = ["site_engineer"];
        } else if (authUser.email?.startsWith("procurement@")) {
          userRoleNames = ["procurement_manager"];
        } else if (authUser.email?.startsWith("store@")) {
          userRoleNames = ["store_inventory_manager"];
        } else {
          userRoleNames = [(profileData?.role as RoleName) || "project_manager"];
        }
      }
      setRoles(userRoleNames);

      // Fetch permissions from role_permissions
      let permNames: string[] = [];
      if (userRoles && userRoles.length > 0) {
        const roleIds = userRoles.map((ur: any) => ur.role_id);
        const { data: rolePerms } = await supabase
          .from("role_permissions")
          .select("permissions:permission_id(name)")
          .in("role_id", roleIds);

        permNames = [
          ...new Set(
            (rolePerms || [])
              .map((rp: any) => rp.permissions?.name)
              .filter(Boolean)
          ),
        ];
      }

      // If permissions are not in DB, populate from DEFAULT_ROLE_PERMISSIONS
      if (permNames.length === 0) {
        const { DEFAULT_ROLE_PERMISSIONS } = await import("@/types/rbac");
        const fallbackSet = new Set<string>();
        for (const r of userRoleNames) {
          const perms = DEFAULT_ROLE_PERMISSIONS[r] || [];
          perms.forEach((p) => fallbackSet.add(p));
        }
        permNames = Array.from(fallbackSet);
      }

      setPermissions(permNames);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const refreshAuth = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      setUser(authUser);
      await fetchUserData(authUser);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          await fetchUserData(user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserData(session.user);
      } else {
        setProfile(null);
        setRoles([]);
        setPermissions([]);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRoles([]);
    setPermissions([]);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, roles, permissions, loading, signOut, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
