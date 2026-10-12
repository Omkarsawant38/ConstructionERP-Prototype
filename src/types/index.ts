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
  created_by?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
  // Accountant module extensions
  expense_type?: "Labor" | "Material" | "Other";
  worker_id?: string;
  worker_name?: string;
  material_id?: string;
  material_name?: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  payment_method?: string;
  payee?: string;
  status?: "draft" | "pending_approval" | "approved" | "rejected";
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  // Joined relation fields
  project?: {
    id: string;
    name: string;
    project_code: string;
    approved_budget: number;
  };
  recorder?: {
    id: string;
    full_name: string;
    email: string;
  };
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
  movement_number: string;
  project_id: string;
  material_id: string;
  material_name?: string;
  material?: Material;
  request_id?: string;
  request_item_id?: string;
  movement_type: "receipt" | "issue" | "adjustment";
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  date: string;
  supplier_id?: string;
  supplier_name?: string;
  source_or_location?: string;
  reference_number?: string;
  notes?: string;
  attachment_url?: string;
  recorded_by?: string;
  recorded_by_name?: string;
  organization_id: string;
  created_at: string;
}

export type MaterialRequestStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "partially_fulfilled"
  | "fulfilled"
  | "rejected";

export type MaterialRequestPriority = "low" | "medium" | "high" | "critical";

export interface MaterialRequestItem {
  id: string;
  request_id: string;
  material_id: string;
  material_name?: string;
  material?: Material;
  quantity: number;
  unit: string;
  estimated_unit_cost: number;
  fulfilled_quantity: number;
  notes?: string;
  created_at?: string;
}

export interface MaterialRequest {
  id: string;
  request_number: string;
  project_id: string;
  status: MaterialRequestStatus;
  priority: MaterialRequestPriority;
  required_date: string;
  delivery_location?: string;
  requested_by?: string;
  requested_by_name?: string;
  notes?: string;
  attachment_url?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  approval_notes?: string;
  rejection_reason?: string;
  items: MaterialRequestItem[];
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMaterialRegisterItem {
  material_id: string;
  material_name: string;
  category: MaterialCategory;
  unit: string;
  warehouse_stock: number;
  received_quantity: number;
  issued_quantity: number;
  current_stock: number;
  reorder_level: number;
  unit_cost: number;
  total_project_cost: number;
  stock_status: "in-stock" | "low-stock" | "out-of-stock";
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

// ===== Project Team Member =====
export type TeamMemberRole =
  | "Project Manager"
  | "Site Engineer"
  | "Accountant"
  | "Procurement Manager"
  | "Store / Inventory Manager"
  | "Civil Engineer"
  | "Safety Officer"
  | "Supervisor";

export type TeamDepartment =
  | "Project Management"
  | "Site Operations"
  | "Finance & Accounts"
  | "Procurement & Supply"
  | "Inventory & Store"
  | "Quality & Safety"
  | "Engineering & Design";

export interface ProjectTeamMember {
  id: string;
  project_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  designation: string;
  role: TeamMemberRole;
  department: TeamDepartment;
  assignment_date: string;
  status: "active" | "inactive";
  notes?: string;
  is_sample?: boolean;
}

export interface TeamMemberFormData {
  full_name: string;
  email?: string;
  phone?: string;
  designation: string;
  role: TeamMemberRole;
  department: TeamDepartment;
  assignment_date: string;
  status: "active" | "inactive";
  notes?: string;
}

