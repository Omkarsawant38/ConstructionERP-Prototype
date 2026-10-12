-- ==============================================================================
-- RBAC Migration for Construction ERP
-- Creates roles, permissions, role_permissions, user_roles, project_members,
-- audit_logs tables and seeds initial data.
-- SAFE: Does not drop or reset existing tables.
-- ==============================================================================

-- 1. RBAC TABLES

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,           -- internal identifier: e.g. 'super_admin'
  display_name TEXT NOT NULL,          -- UI label: e.g. 'Super Admin'
  description TEXT,
  is_system BOOLEAN DEFAULT true,      -- system roles cannot be deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,           -- e.g. 'projects.create'
  module TEXT NOT NULL,                -- e.g. 'projects'
  action TEXT NOT NULL,                -- e.g. 'create'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-Permission mapping (many-to-many)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- User-Role mapping (supports multiple roles per user)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Project Members (project-level access)
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',  -- 'manager', 'engineer', 'member'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(project_id, user_id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,                -- e.g. 'role.assigned', 'user.deactivated'
  target_type TEXT,                    -- e.g. 'user', 'project', 'expense'
  target_id TEXT,                      -- UUID of affected record
  details JSONB DEFAULT '{}',          -- extra context (old/new values, etc.)
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on new tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. TIMESTAMPS TRIGGERS for new tables
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_roles BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 4. HELPER FUNCTIONS (used by RLS policies)

-- Get all role names for a user (non-recursive, safe for RLS)
CREATE OR REPLACE FUNCTION public.get_user_role_names(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(r.name), ARRAY[]::TEXT[])
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = p_user_id;
$$;

-- Check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND p.name = p_permission
  );
$$;

-- Check if a user has any of the specified roles
CREATE OR REPLACE FUNCTION public.user_has_role(p_user_id UUID, p_role_names TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND r.name = ANY(p_role_names)
  );
$$;

-- Check if a user is a member of a project
CREATE OR REPLACE FUNCTION public.user_is_project_member(p_user_id UUID, p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE user_id = p_user_id AND project_id = p_project_id
  )
  OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id AND project_manager_id = p_user_id
  );
$$;

-- 5. SEED ROLES
INSERT INTO public.roles (name, display_name, description, is_system) VALUES
  ('super_admin', 'Super Admin', 'Full system access. Manages users, roles, and system configuration.', true),
  ('owner_director', 'Owner / Director', 'Organization-wide visibility. Views dashboards, financials, and reports.', true),
  ('project_manager', 'Project Manager', 'Creates and manages projects, tasks, milestones, and schedules.', true),
  ('accountant', 'Accountant', 'Manages expenses, payments, receipts, and financial reporting.', true),
  ('site_engineer', 'Site Engineer', 'Records site progress, submits material requests and expense records.', true),
  ('procurement_manager', 'Procurement Manager', 'Manages procurement, suppliers, and purchase orders.', true),
  ('store_inventory_manager', 'Store / Inventory Manager', 'Manages inventory stock movements and material records.', true)
ON CONFLICT (name) DO NOTHING;

-- 6. SEED PERMISSIONS
INSERT INTO public.permissions (name, module, action, description) VALUES
  -- Dashboard
  ('dashboard.view', 'dashboard', 'view', 'View dashboard and KPIs'),
  -- Projects
  ('projects.view', 'projects', 'view', 'View project list and details'),
  ('projects.create', 'projects', 'create', 'Create new projects'),
  ('projects.update', 'projects', 'update', 'Update project details'),
  ('projects.archive', 'projects', 'archive', 'Archive or cancel projects'),
  -- Planning & Tasks
  ('planning.view', 'planning', 'view', 'View tasks and milestones'),
  ('planning.create', 'planning', 'create', 'Create tasks and milestones'),
  ('planning.update', 'planning', 'update', 'Update tasks and milestones'),
  -- Expenses
  ('expenses.view', 'expenses', 'view', 'View expense records'),
  ('expenses.create', 'expenses', 'create', 'Create expense records'),
  ('expenses.update', 'expenses', 'update', 'Update expense records'),
  ('expenses.approve', 'expenses', 'approve', 'Approve expense records'),
  ('expenses.delete', 'expenses', 'delete', 'Delete expense records'),
  -- Finance & Billing
  ('finance.view', 'finance', 'view', 'View financial summaries'),
  ('finance.create', 'finance', 'create', 'Create financial records'),
  ('finance.approve', 'finance', 'approve', 'Approve financial transactions'),
  -- Payments
  ('payments.view', 'payments', 'view', 'View payment records'),
  ('payments.create', 'payments', 'create', 'Create payment records'),
  ('payments.approve', 'payments', 'approve', 'Approve payments'),
  -- Receipts
  ('receipts.generate', 'receipts', 'generate', 'Generate receipt documents'),
  -- Inventory
  ('inventory.view', 'inventory', 'view', 'View materials and inventory'),
  ('inventory.request', 'inventory', 'request', 'Submit material requests'),
  ('inventory.purchase', 'inventory', 'purchase', 'Process material purchases'),
  ('inventory.stock_in', 'inventory', 'stock_in', 'Record stock inward'),
  ('inventory.stock_out', 'inventory', 'stock_out', 'Record stock outward'),
  -- Procurement
  ('procurement.view', 'procurement', 'view', 'View purchase orders and suppliers'),
  ('procurement.create', 'procurement', 'create', 'Create purchase orders'),
  ('procurement.update', 'procurement', 'update', 'Update purchase orders'),
  ('procurement.approve', 'procurement', 'approve', 'Approve purchase orders'),
  -- Contractors & Vendors
  ('contractors.view', 'contractors', 'view', 'View contractor records'),
  ('contractors.manage', 'contractors', 'manage', 'Create and update contractors'),
  -- Workforce
  ('workforce.view', 'workforce', 'view', 'View workforce data'),
  ('workforce.manage', 'workforce', 'manage', 'Manage workforce assignments'),
  -- Documents
  ('documents.view', 'documents', 'view', 'View project documents'),
  ('documents.upload', 'documents', 'upload', 'Upload documents'),
  ('documents.delete', 'documents', 'delete', 'Delete documents'),
  -- Site Progress
  ('site_progress.view', 'site_progress', 'view', 'View site updates and logs'),
  ('site_progress.create', 'site_progress', 'create', 'Create site updates'),
  ('site_progress.update', 'site_progress', 'update', 'Update site logs'),
  -- Reports
  ('reports.view', 'reports', 'view', 'View reports and analytics'),
  ('reports.export', 'reports', 'export', 'Export reports'),
  -- User Management
  ('users.view', 'users', 'view', 'View user list'),
  ('users.create', 'users', 'create', 'Create or invite users'),
  ('users.update', 'users', 'update', 'Update user profiles'),
  ('users.assign_roles', 'users', 'assign_roles', 'Assign roles to users'),
  -- Settings
  ('settings.view', 'settings', 'view', 'View application settings'),
  ('settings.manage', 'settings', 'manage', 'Manage application settings')
ON CONFLICT (name) DO NOTHING;

-- 7. SEED ROLE-PERMISSION MAPPINGS
-- Helper: assign permissions to a role by names
DO $$
DECLARE
  v_role_id UUID;
  v_perm_id UUID;
  v_perm TEXT;
  v_perms TEXT[];
BEGIN
  -- SUPER ADMIN: all permissions
  SELECT id INTO v_role_id FROM roles WHERE name = 'super_admin';
  FOR v_perm_id IN SELECT id FROM permissions LOOP
    INSERT INTO role_permissions (role_id, permission_id)
    VALUES (v_role_id, v_perm_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  -- OWNER / DIRECTOR
  SELECT id INTO v_role_id FROM roles WHERE name = 'owner_director';
  v_perms := ARRAY[
    'dashboard.view',
    'projects.view',
    'planning.view',
    'expenses.view',
    'finance.view',
    'payments.view',
    'contractors.view',
    'workforce.view',
    'documents.view',
    'site_progress.view',
    'reports.view',
    'reports.export',
    'settings.view'
  ];
  FOREACH v_perm IN ARRAY v_perms LOOP
    SELECT id INTO v_perm_id FROM permissions WHERE name = v_perm;
    IF v_perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END LOOP;

  -- PROJECT MANAGER
  SELECT id INTO v_role_id FROM roles WHERE name = 'project_manager';
  v_perms := ARRAY[
    'dashboard.view',
    'projects.view', 'projects.create', 'projects.update', 'projects.archive',
    'planning.view', 'planning.create', 'planning.update',
    'expenses.view',
    'inventory.view', 'inventory.request',
    'procurement.view',
    'contractors.view',
    'workforce.view', 'workforce.manage',
    'documents.view', 'documents.upload',
    'site_progress.view',
    'reports.view'
  ];
  FOREACH v_perm IN ARRAY v_perms LOOP
    SELECT id INTO v_perm_id FROM permissions WHERE name = v_perm;
    IF v_perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END LOOP;

  -- ACCOUNTANT
  SELECT id INTO v_role_id FROM roles WHERE name = 'accountant';
  v_perms := ARRAY[
    'dashboard.view',
    'expenses.view', 'expenses.create', 'expenses.update', 'expenses.approve',
    'finance.view', 'finance.create', 'finance.approve',
    'payments.view', 'payments.create', 'payments.approve',
    'receipts.generate',
    'documents.view', 'documents.upload',
    'reports.view', 'reports.export'
  ];
  FOREACH v_perm IN ARRAY v_perms LOOP
    SELECT id INTO v_perm_id FROM permissions WHERE name = v_perm;
    IF v_perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END LOOP;

  -- SITE ENGINEER
  SELECT id INTO v_role_id FROM roles WHERE name = 'site_engineer';
  v_perms := ARRAY[
    'projects.view',
    'planning.view',
    'expenses.view', 'expenses.create',
    'inventory.view', 'inventory.request',
    'workforce.view',
    'documents.view', 'documents.upload',
    'site_progress.view', 'site_progress.create', 'site_progress.update'
  ];
  FOREACH v_perm IN ARRAY v_perms LOOP
    SELECT id INTO v_perm_id FROM permissions WHERE name = v_perm;
    IF v_perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END LOOP;

  -- PROCUREMENT MANAGER
  SELECT id INTO v_role_id FROM roles WHERE name = 'procurement_manager';
  v_perms := ARRAY[
    'inventory.view', 'inventory.purchase',
    'procurement.view', 'procurement.create', 'procurement.update',
    'contractors.view', 'contractors.manage',
    'documents.view', 'documents.upload'
  ];
  FOREACH v_perm IN ARRAY v_perms LOOP
    SELECT id INTO v_perm_id FROM permissions WHERE name = v_perm;
    IF v_perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END LOOP;

  -- STORE / INVENTORY MANAGER
  SELECT id INTO v_role_id FROM roles WHERE name = 'store_inventory_manager';
  v_perms := ARRAY[
    'inventory.view', 'inventory.stock_in', 'inventory.stock_out',
    'documents.view'
  ];
  FOREACH v_perm IN ARRAY v_perms LOOP
    SELECT id INTO v_perm_id FROM permissions WHERE name = v_perm;
    IF v_perm_id IS NOT NULL THEN
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id)
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- 8. RLS POLICIES FOR NEW TABLES

-- Roles: readable by all authenticated, writable by super_admin only
CREATE POLICY "roles_select_authenticated" ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "roles_insert_super_admin" ON public.roles
  FOR INSERT WITH CHECK (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

CREATE POLICY "roles_update_super_admin" ON public.roles
  FOR UPDATE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- Permissions: readable by all authenticated
CREATE POLICY "permissions_select_authenticated" ON public.permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Role-Permissions: readable by all authenticated
CREATE POLICY "role_permissions_select_authenticated" ON public.role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "role_permissions_modify_super_admin" ON public.role_permissions
  FOR ALL USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- User-Roles: users can see their own, super_admin can see/modify all
CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

CREATE POLICY "user_roles_modify_super_admin" ON public.user_roles
  FOR INSERT WITH CHECK (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

CREATE POLICY "user_roles_update_super_admin" ON public.user_roles
  FOR UPDATE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

CREATE POLICY "user_roles_delete_super_admin" ON public.user_roles
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- Project Members: project managers and super_admin can manage, members can see own
CREATE POLICY "project_members_select" ON public.project_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.user_has_role(auth.uid(), ARRAY['super_admin', 'owner_director', 'project_manager'])
  );

CREATE POLICY "project_members_insert" ON public.project_members
  FOR INSERT WITH CHECK (
    public.user_has_role(auth.uid(), ARRAY['super_admin', 'project_manager'])
  );

CREATE POLICY "project_members_update" ON public.project_members
  FOR UPDATE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin', 'project_manager'])
  );

CREATE POLICY "project_members_delete" ON public.project_members
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin', 'project_manager'])
  );

-- Audit Logs: readable by super_admin and owner, never modifiable
CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin', 'owner_director'])
  );

CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- No UPDATE or DELETE policies for audit_logs — immutable by design

-- 9. REPLACE EXISTING OPEN RLS POLICIES WITH ROLE-BASED ONES

-- Drop existing "Allow * for all" policies
DROP POLICY IF EXISTS "Allow select for all" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for all" ON public.profiles;
DROP POLICY IF EXISTS "Allow update for all" ON public.profiles;
DROP POLICY IF EXISTS "Allow delete for all" ON public.profiles;

DROP POLICY IF EXISTS "Allow select for all" ON public.projects;
DROP POLICY IF EXISTS "Allow insert for all" ON public.projects;
DROP POLICY IF EXISTS "Allow update for all" ON public.projects;
DROP POLICY IF EXISTS "Allow delete for all" ON public.projects;

DROP POLICY IF EXISTS "Allow select for all" ON public.tasks;
DROP POLICY IF EXISTS "Allow insert for all" ON public.tasks;
DROP POLICY IF EXISTS "Allow update for all" ON public.tasks;
DROP POLICY IF EXISTS "Allow delete for all" ON public.tasks;

DROP POLICY IF EXISTS "Allow select for all" ON public.milestones;
DROP POLICY IF EXISTS "Allow insert for all" ON public.milestones;
DROP POLICY IF EXISTS "Allow update for all" ON public.milestones;
DROP POLICY IF EXISTS "Allow delete for all" ON public.milestones;

DROP POLICY IF EXISTS "Allow select for all" ON public.expenses;
DROP POLICY IF EXISTS "Allow insert for all" ON public.expenses;
DROP POLICY IF EXISTS "Allow update for all" ON public.expenses;
DROP POLICY IF EXISTS "Allow delete for all" ON public.expenses;

DROP POLICY IF EXISTS "Allow select for all" ON public.materials;
DROP POLICY IF EXISTS "Allow insert for all" ON public.materials;
DROP POLICY IF EXISTS "Allow update for all" ON public.materials;
DROP POLICY IF EXISTS "Allow delete for all" ON public.materials;

DROP POLICY IF EXISTS "Allow select for all" ON public.suppliers;
DROP POLICY IF EXISTS "Allow insert for all" ON public.suppliers;
DROP POLICY IF EXISTS "Allow update for all" ON public.suppliers;
DROP POLICY IF EXISTS "Allow delete for all" ON public.suppliers;

DROP POLICY IF EXISTS "Allow select for all" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow insert for all" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow update for all" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow delete for all" ON public.purchase_orders;

DROP POLICY IF EXISTS "Allow select for all" ON public.contractors;
DROP POLICY IF EXISTS "Allow insert for all" ON public.contractors;
DROP POLICY IF EXISTS "Allow update for all" ON public.contractors;
DROP POLICY IF EXISTS "Allow delete for all" ON public.contractors;

DROP POLICY IF EXISTS "Allow select for all" ON public.site_updates;
DROP POLICY IF EXISTS "Allow insert for all" ON public.site_updates;
DROP POLICY IF EXISTS "Allow update for all" ON public.site_updates;
DROP POLICY IF EXISTS "Allow delete for all" ON public.site_updates;

-- PROFILES: users can see all profiles in org, update own profile only
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

CREATE POLICY "profiles_insert_trigger" ON public.profiles
  FOR INSERT WITH CHECK (true);
  -- Needed for the auth trigger that creates profiles on signup

-- PROJECTS: role-based access
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin', 'owner_director', 'project_manager', 'accountant'])
    OR public.user_is_project_member(auth.uid(), id)
    OR project_manager_id = auth.uid()
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'projects.create')
  );

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'projects.update')
  );

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- TASKS: similar to projects, scoped by project membership
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'planning.view')
  );

CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'planning.create')
  );

CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'planning.update')
  );

CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- MILESTONES
CREATE POLICY "milestones_select" ON public.milestones
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'planning.view')
  );

CREATE POLICY "milestones_insert" ON public.milestones
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'planning.create')
  );

CREATE POLICY "milestones_update" ON public.milestones
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'planning.update')
  );

CREATE POLICY "milestones_delete" ON public.milestones
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- EXPENSES
CREATE POLICY "expenses_select" ON public.expenses
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'expenses.view')
  );

CREATE POLICY "expenses_insert" ON public.expenses
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'expenses.create')
  );

CREATE POLICY "expenses_update" ON public.expenses
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'expenses.update')
  );

CREATE POLICY "expenses_delete" ON public.expenses
  FOR DELETE USING (
    public.user_has_permission(auth.uid(), 'expenses.delete')
  );

-- MATERIALS
CREATE POLICY "materials_select" ON public.materials
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'inventory.view')
  );

CREATE POLICY "materials_insert" ON public.materials
  FOR INSERT WITH CHECK (
    public.user_has_role(auth.uid(), ARRAY['super_admin', 'procurement_manager', 'store_inventory_manager'])
  );

CREATE POLICY "materials_update" ON public.materials
  FOR UPDATE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin', 'procurement_manager', 'store_inventory_manager'])
  );

CREATE POLICY "materials_delete" ON public.materials
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- SUPPLIERS
CREATE POLICY "suppliers_select" ON public.suppliers
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'procurement.view')
    OR public.user_has_permission(auth.uid(), 'contractors.view')
  );

CREATE POLICY "suppliers_insert" ON public.suppliers
  FOR INSERT WITH CHECK (
    public.user_has_role(auth.uid(), ARRAY['super_admin', 'procurement_manager'])
  );

CREATE POLICY "suppliers_update" ON public.suppliers
  FOR UPDATE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin', 'procurement_manager'])
  );

CREATE POLICY "suppliers_delete" ON public.suppliers
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- PURCHASE ORDERS
CREATE POLICY "purchase_orders_select" ON public.purchase_orders
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'procurement.view')
  );

CREATE POLICY "purchase_orders_insert" ON public.purchase_orders
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'procurement.create')
  );

CREATE POLICY "purchase_orders_update" ON public.purchase_orders
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'procurement.update')
  );

CREATE POLICY "purchase_orders_delete" ON public.purchase_orders
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- CONTRACTORS
CREATE POLICY "contractors_select" ON public.contractors
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'contractors.view')
  );

CREATE POLICY "contractors_insert" ON public.contractors
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'contractors.manage')
  );

CREATE POLICY "contractors_update" ON public.contractors
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'contractors.manage')
  );

CREATE POLICY "contractors_delete" ON public.contractors
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- SITE UPDATES
CREATE POLICY "site_updates_select" ON public.site_updates
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'site_progress.view')
  );

CREATE POLICY "site_updates_insert" ON public.site_updates
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'site_progress.create')
  );

CREATE POLICY "site_updates_update" ON public.site_updates
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'site_progress.update')
  );

CREATE POLICY "site_updates_delete" ON public.site_updates
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- 10. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON public.permissions(name);
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
