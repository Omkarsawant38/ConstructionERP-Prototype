// ===== RBAC Types =====

export type RoleName =
  | 'super_admin'
  | 'owner_director'
  | 'project_manager'
  | 'accountant'
  | 'site_engineer'
  | 'procurement_manager'
  | 'store_inventory_manager';

export interface Role {
  id: string;
  name: RoleName;
  display_name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  role?: Role;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  assigned_by: string | null;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  actor?: {
    full_name: string;
    email: string;
  };
}

// Human-readable role display names
export const ROLE_DISPLAY_NAMES: Record<RoleName, string> = {
  super_admin: 'Super Admin',
  owner_director: 'Owner / Director',
  project_manager: 'Project Manager',
  accountant: 'Accountant',
  site_engineer: 'Site Engineer',
  procurement_manager: 'Procurement Manager',
  store_inventory_manager: 'Store / Inventory Manager',
};

// All valid role names for validation
export const VALID_ROLES: RoleName[] = [
  'super_admin',
  'owner_director',
  'project_manager',
  'accountant',
  'site_engineer',
  'procurement_manager',
  'store_inventory_manager',
];

// Module to route prefix mapping for navigation/access control
export const MODULE_ROUTE_MAP: Record<string, string[]> = {
  dashboard: ['/dashboard'],
  projects: ['/projects'],
  planning: ['/planning'],
  expenses: ['/finance'],
  finance: ['/finance'],
  payments: ['/finance'],
  receipts: ['/finance'],
  inventory: ['/materials'],
  procurement: ['/procurement'],
  contractors: ['/contractors'],
  workforce: ['/workforce'],
  documents: ['/documents'],
  site_progress: ['/site-management'],
  reports: ['/reports'],
  users: ['/settings'],
  settings: ['/settings'],
};

// Map sidebar routes to required view permissions
export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/dashboard': 'dashboard.view',
  '/projects': 'projects.view',
  '/planning': 'planning.view',
  '/materials': 'inventory.view',
  '/procurement': 'procurement.view',
  '/finance': 'finance.view',
  '/contractors': 'contractors.view',
  '/workforce': 'workforce.view',
  '/documents': 'documents.view',
  '/site-management': 'site_progress.view',
  '/reports': 'reports.view',
  '/settings': 'settings.view',
};

// Default permissions per role matching the Construction Roles Distribution
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  super_admin: [
    'dashboard.view', 'projects.view', 'planning.view', 'inventory.view',
    'procurement.view', 'finance.view', 'contractors.view', 'workforce.view',
    'documents.view', 'site_progress.view', 'reports.view', 'settings.view',
  ],
  owner_director: [
    'dashboard.view',
    'projects.view',
    'planning.view',
    'finance.view',
    'contractors.view',
    'workforce.view',
    'documents.view',
    'site_progress.view',
    'reports.view',
    'settings.view',
  ],
  project_manager: [
    'dashboard.view',
    'projects.view',
    'projects.create',
    'projects.update',
    'projects.archive',
    'planning.view',
    'planning.create',
    'planning.update',
    'inventory.view',
    'inventory.request',
    'procurement.view',
    'contractors.view',
    'workforce.view',
    'workforce.manage',
    'documents.view',
    'documents.upload',
    'site_progress.view',
    'reports.view',
  ],
  accountant: [
    'dashboard.view',
    'finance.view',
    'finance.create',
    'finance.approve',
    'expenses.view',
    'expenses.create',
    'expenses.update',
    'expenses.approve',
    'payments.view',
    'payments.create',
    'payments.approve',
    'receipts.generate',
    'documents.view',
    'reports.view',
    'reports.export',
  ],
  site_engineer: [
    'projects.view',
    'planning.view',
    'inventory.view',
    'inventory.request',
    'workforce.view',
    'documents.view',
    'documents.upload',
    'site_progress.view',
    'site_progress.create',
    'site_progress.update',
  ],
  procurement_manager: [
    'inventory.view',
    'inventory.purchase',
    'procurement.view',
    'procurement.create',
    'procurement.update',
    'contractors.view',
    'contractors.manage',
    'documents.view',
    'documents.upload',
  ],
  store_inventory_manager: [
    'inventory.view',
    'inventory.stock_in',
    'inventory.stock_out',
    'documents.view',
  ],
};

// Extended profile with roles info
export interface ProfileWithRoles {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  organization_id: string;
  phone?: string;
  designation?: string;
  created_at: string;
  updated_at: string;
  roles: RoleName[];
  permissions: string[];
}
