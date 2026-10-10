// ===== Organization =====
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

// ===== Profile =====
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: "admin" | "manager" | "member" | "viewer";
  organization_id: string;
  phone?: string;
  designation?: string;
  created_at: string;
  updated_at: string;
}

// ===== Client =====
export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  organization_id: string;
  created_at: string;
}

// ===== Project =====
export type ProjectStatus = "planning" | "active" | "on-hold" | "completed" | "cancelled";
export type ProjectHealthStatus = "on-track" | "at-risk" | "delayed";

export interface Project {
  id: string;
  project_code: string;
  name: string;
  description?: string;
  client_name?: string;
  project_type?: string;
  construction_category?: string;
  site_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  start_date: string;
  end_date: string;
  actual_end_date?: string;
  approved_budget: number;
  currency: string;
  financial_notes?: string;
  project_manager_id?: string;
  project_manager_name?: string;
  status: ProjectStatus;
  health_status?: ProjectHealthStatus;
  progress: number;
  thumbnail_url?: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  actual_expenses?: number;
  remaining_budget?: number;
  tasks_count?: number;
  completed_tasks?: number;
  milestones_count?: number;
  completed_milestones?: number;
}

// ===== Task =====
export type TaskStatus = "not-started" | "in-progress" | "blocked" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  progress: number;
  assigned_to?: string;
  assigned_to_name?: string;
  created_by: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// ===== Milestone =====
export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  due_date: string;
  completed_date?: string;
  is_completed: boolean;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ===== Expense =====
export type ExpenseCategory =
  | "materials"
  | "labor"
  | "equipment"
  | "transport"
  | "permits"
  | "professional-fees"
  | "utilities"
  | "subcontractor"
  | "overhead"
  | "miscellaneous";

export interface ProjectExpense {
  id: string;
  project_id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  supplier?: string;
  description?: string;
  receipt_url?: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ===== Material =====
export type MaterialCategory =
  | "cement"
  | "steel"
  | "aggregate"
  | "bricks"
  | "sand"
  | "wood"
  | "electrical"
  | "plumbing"
  | "paint"
  | "hardware"
  | "tiles"
  | "glass"
  | "other";

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: string;
  current_stock: number;
  reorder_level: number;
  unit_price?: number;
  supplier_name?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  material_id: string;
  movement_type: "receipt" | "issue" | "adjustment";
  quantity: number;
  project_id?: string;
  notes?: string;
  organization_id: string;
  created_by: string;
  created_at: string;
}

// ===== Supplier =====
export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  rating?: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// ===== Purchase Order =====
export type POStatus = "draft" | "pending" | "approved" | "rejected" | "delivered" | "cancelled";

export interface PurchaseOrder {
  id: string;
  po_number: string;
  project_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  total_amount: number;
  expected_delivery?: string;
  status: POStatus;
  notes?: string;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  material_id?: string;
  material_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

// ===== Contractor =====
export interface Contractor {
  id: string;
  name: string;
  company?: string;
  specialization?: string;
  email?: string;
  phone?: string;
  address?: string;
  license_number?: string;
  rating?: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

// ===== Site Update =====
export interface SiteUpdate {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  update_type: "progress" | "observation" | "issue" | "milestone" | "daily-summary";
  date: string;
  author_id: string;
  author_name?: string;
  photos?: string[];
  organization_id: string;
  created_at: string;
}

// ===== Project Document =====
export interface ProjectDocument {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  category?: string;
  uploaded_by: string;
  uploader_name?: string;
  organization_id: string;
  created_at: string;
}

// ===== Activity =====
export interface ProjectActivity {
  id: string;
  project_id: string;
  action: string;
  description: string;
  actor_id: string;
  actor_name?: string;
  entity_type?: string;
  entity_id?: string;
  organization_id: string;
  created_at: string;
}

// ===== Dashboard Types =====
export interface DashboardKPI {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  color: string;
}

export interface ChartDataPoint {
  name: string;
  budget?: number;
  actual?: number;
  value?: number;
  [key: string]: string | number | undefined;
}

// ===== Filter Types =====
export interface ProjectFilters {
  search: string;
  status: string;
  location: string;
  manager: string;
  dateFrom: string;
  dateTo: string;
}

// ===== Form Types =====
export interface ProjectFormData {
  name: string;
  project_code: string;
  description: string;
  client_name: string;
  project_type: string;
  construction_category: string;
  site_address: string;
  city: string;
  state: string;
  postal_code: string;
  start_date: string;
  end_date: string;
  actual_end_date: string;
  approved_budget: number;
  currency: string;
  financial_notes: string;
  project_manager_name: string;
  status: ProjectStatus;
}

export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string;
  due_date: string;
  progress: number;
  assigned_to_name: string;
}

export interface MilestoneFormData {
  title: string;
  description: string;
  due_date: string;
}

export interface ExpenseFormData {
  date: string;
  category: ExpenseCategory;
  amount: number;
  supplier: string;
  description: string;
}
