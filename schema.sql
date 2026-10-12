-- ==============================================================================
-- Construction ERP Database Schema & Seed Data
-- 
-- INSTRUCTIONS FOR SUPABASE:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/pyimwdjzgrfhoeohgdev
-- 2. Click on "SQL Editor" in the left sidebar (icon with ">_")
-- 3. Click "New query"
-- 4. Copy and paste all the content of this file
-- 5. Click "Run" (or Ctrl + Enter)
-- 6. Go to "Table Editor" — all tables and demo records will now be visible!
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM TYPES / ENUMS
DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('planning', 'active', 'on-hold', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('not-started', 'in-progress', 'blocked', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE po_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'delivered', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Profiles (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  phone TEXT,
  designation TEXT,
  organization_id TEXT DEFAULT 'org1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  project_type TEXT DEFAULT 'Residential',
  construction_category TEXT DEFAULT 'High-Rise',
  site_address TEXT,
  city TEXT,
  state TEXT DEFAULT 'Maharashtra',
  postal_code TEXT,
  start_date DATE,
  end_date DATE,
  actual_end_date DATE,
  approved_budget NUMERIC(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  financial_notes TEXT,
  project_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_manager_name TEXT,
  status project_status DEFAULT 'planning',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  health_status TEXT DEFAULT 'on-track',
  thumbnail_url TEXT,
  organization_id TEXT DEFAULT 'org1',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'not-started',
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  organization_id TEXT DEFAULT 'org1',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_date DATE,
  organization_id TEXT DEFAULT 'org1',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  description TEXT,
  supplier TEXT,
  receipt_url TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_id TEXT DEFAULT 'org1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials / Inventory
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'units',
  current_stock NUMERIC(12, 2) DEFAULT 0,
  reorder_level NUMERIC(12, 2) DEFAULT 0,
  unit_price NUMERIC(12, 2) DEFAULT 0,
  supplier_name TEXT,
  organization_id TEXT DEFAULT 'org1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  category TEXT,
  rating NUMERIC(2, 1) DEFAULT 5.0,
  organization_id TEXT DEFAULT 'org1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  expected_delivery DATE,
  status po_status DEFAULT 'draft',
  notes TEXT,
  organization_id TEXT DEFAULT 'org1',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contractors
CREATE TABLE IF NOT EXISTS public.contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  specialization TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  license_number TEXT,
  rating NUMERIC(2, 1) DEFAULT 5.0,
  organization_id TEXT DEFAULT 'org1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Updates / Daily Logs
CREATE TABLE IF NOT EXISTS public.site_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weather TEXT,
  workforce_count INTEGER DEFAULT 0,
  summary TEXT NOT NULL,
  issues TEXT,
  safety_incident BOOLEAN DEFAULT false,
  safety_incident_notes TEXT,
  photos TEXT[],
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_id TEXT DEFAULT 'org1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Team Members
CREATE TABLE IF NOT EXISTS public.project_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  designation TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  assignment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  is_sample BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON public.project_team_members(project_id);

-- 4. TIMESTAMPS TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_milestones BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_expenses BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_project_team_members BEFORE UPDATE ON public.project_team_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. AUTH USER AUTO-PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['profiles', 'projects', 'tasks', 'milestones', 'expenses', 'materials', 'suppliers', 'purchase_orders', 'contractors', 'site_updates', 'project_team_members']) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow select for all" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "Allow select for all" ON public.%I FOR SELECT USING (true)', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Allow insert for all" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "Allow insert for all" ON public.%I FOR INSERT WITH CHECK (true)', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Allow update for all" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "Allow update for all" ON public.%I FOR UPDATE USING (true)', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Allow delete for all" ON public.%I', tbl);
    EXECUTE format('CREATE POLICY "Allow delete for all" ON public.%I FOR DELETE USING (true)', tbl);
  END LOOP;
END $$;

-- 7. INITIAL SEED DATA
INSERT INTO public.projects (
  id, project_code, name, description, client_name, project_type, construction_category,
  site_address, city, state, postal_code, start_date, end_date, approved_budget,
  currency, project_manager_name, status, health_status, progress, thumbnail_url
) VALUES
(
  'a1111111-1111-1111-1111-111111111111',
  'PRJ-001',
  'Green Valley Residency',
  'Premium 3-tower residential complex with 120 apartments, clubhouse, swimming pool, and landscaped gardens. Located in the heart of Pune.',
  'ABC Developers',
  'Residential',
  'High-Rise',
  'Survey No. 45, Baner Road',
  'Pune',
  'Maharashtra',
  '411045',
  '2024-01-15',
  '2025-12-30',
  105000000.00,
  'INR',
  'Omkar Sawant',
  'active',
  'on-track',
  65,
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop'
),
(
  'a2222222-2222-2222-2222-222222222222',
  'PRJ-002',
  'Skyline Towers',
  'Commercial office tower with 15 floors, state-of-the-art amenities, rooftop garden, and underground parking for 200 vehicles.',
  'Metro Corp Ltd',
  'Commercial',
  'High-Rise',
  'Plot 12, BKC',
  'Mumbai',
  'Maharashtra',
  '400051',
  '2024-03-01',
  '2025-12-31',
  250000000.00,
  'INR',
  'Rajesh Sharma',
  'active',
  'at-risk',
  42,
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop'
),
(
  'a3333333-3333-3333-3333-333333333333',
  'PRJ-003',
  'Metro Express Highway Flyover',
  '6-lane elevated expressway segment including ramp connections, intelligent traffic systems, and sound barriers.',
  'State Infrastructure Board',
  'Infrastructure',
  'Highways',
  'Western Highway Km 42-48',
  'Thane',
  'Maharashtra',
  '400601',
  '2023-08-01',
  '2025-06-30',
  420000000.00,
  'INR',
  'Amit Kulkarni',
  'active',
  'delayed',
  58,
  'https://images.unsplash.com/photo-1541888086225-ee5315f5c71c?w=800&auto=format&fit=crop'
),
(
  'a4444444-4444-4444-4444-444444444444',
  'PRJ-004',
  'Sunrise Industrial Warehouse',
  'Pre-engineered steel building warehouse facility with loading docks, automated storage racks, and temperature-controlled zone.',
  'Apex Logistics',
  'Industrial',
  'Warehouse',
  'MIDC Industrial Zone, Phase 2',
  'Chakan',
  'Maharashtra',
  '410501',
  '2024-06-01',
  '2025-04-15',
  68000000.00,
  'INR',
  'Priya Patel',
  'planning',
  'on-track',
  15,
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop'
),
(
  'a5555555-5555-5555-5555-555555555555',
  'PRJ-005',
  'Palm Grove Luxury Villas',
  'Gated community of 24 ultra-luxury villas with private plunge pools, home automation, and clubhouse.',
  'Royal Palm Estates',
  'Residential',
  'Villas',
  'Alibaug Coastal Road',
  'Alibaug',
  'Maharashtra',
  '402201',
  '2023-01-10',
  '2024-08-30',
  180000000.00,
  'INR',
  'Omkar Sawant',
  'completed',
  'on-track',
  100,
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop'
)
ON CONFLICT (project_code) DO NOTHING;

-- Initial Tasks
INSERT INTO public.tasks (
  project_id, title, description, priority, status, start_date, due_date, progress, assigned_to_name
) VALUES
('a1111111-1111-1111-1111-111111111111', 'Tower A Foundation Concrete Pour', 'Pouring 800 cu.m M30 grade concrete for raft foundation', 'critical', 'completed', '2024-02-01', '2024-02-15', 100, 'Omkar Sawant'),
('a1111111-1111-1111-1111-111111111111', 'Tower B 8th Floor Slab Casting', 'Shuttering, reinforcement inspection and casting', 'high', 'in-progress', '2024-10-05', '2024-10-18', 70, 'Suresh Patil'),
('a1111111-1111-1111-1111-111111111111', 'Plumbing Rough-In Tower A (Floors 1-5)', 'Installing internal drainage and supply lines', 'medium', 'in-progress', '2024-10-10', '2024-10-25', 40, 'Ramesh Plumbers'),
('a2222222-2222-2222-2222-222222222222', 'Facade Glass Installation (Floors 6-10)', 'Double-glazed tempered curtain wall panels', 'high', 'in-progress', '2024-09-15', '2024-10-30', 45, 'GlassTech India')
ON CONFLICT DO NOTHING;

-- Initial Milestones
INSERT INTO public.milestones (
  project_id, title, description, due_date, is_completed
) VALUES
('a1111111-1111-1111-1111-111111111111', 'Foundation & Basement Completion', 'All basements and raft foundation finished', '2024-03-31', true),
('a1111111-1111-1111-1111-111111111111', 'Structural Frame Completion', 'Cast all 18 floors structure across 3 towers', '2024-11-30', false),
('a1111111-1111-1111-1111-111111111111', 'MEP & Finishing Works', 'Plumbing, electrical, and interior plaster', '2025-06-30', false)
ON CONFLICT DO NOTHING;

-- Initial Materials
INSERT INTO public.materials (
  name, category, unit, current_stock, reorder_level, unit_price, supplier_name
) VALUES
('Ultratech PPC Cement 50kg', 'cement', 'bags', 450, 200, 380.00, 'Ultratech Building Solutions'),
('Tata Tiscon TMT Steel 16mm', 'steel', 'MT', 14.5, 10.0, 68000.00, 'Tata Steel Distributors'),
('Tata Tiscon TMT Steel 12mm', 'steel', 'MT', 8.2, 10.0, 69500.00, 'Tata Steel Distributors'),
('Crushed Sand (M-Sand)', 'sand', 'brass', 65, 30, 4200.00, 'Sahyadri Aggregate Supplies'),
('20mm Coarse Aggregate', 'aggregate', 'brass', 80, 40, 3600.00, 'Sahyadri Aggregate Supplies'),
('Fly Ash Bricks (9x4x3)', 'bricks', 'pcs', 12500, 5000, 9.50, 'EcoBricks Manufacturing')
ON CONFLICT DO NOTHING;

-- Initial Suppliers
INSERT INTO public.suppliers (
  name, contact_person, email, phone, address, category, rating
) VALUES
('Ultratech Building Solutions', 'Vikas Deshmukh', 'orders@ultratech-dist.com', '+91 98220 11223', 'MIDC Bhosari, Pune', 'Cement & Concrete', 4.8),
('Tata Steel Distributors', 'Mahesh Agarwal', 'sales@agarwalsteel.com', '+91 98231 44556', 'Kalamboli Steel Market, Navi Mumbai', 'TMT & Structural Steel', 4.9),
('Sahyadri Aggregate Supplies', 'Pramod Jadhav', 'sahyadri.aggregates@gmail.com', '+91 94220 77889', 'Wagholi, Pune', 'Sand & Aggregates', 4.5)
ON CONFLICT DO NOTHING;

-- Initial Contractors
INSERT INTO public.contractors (
  name, company, specialization, email, phone, rating
) VALUES
('Om Electricals & MEP', 'Om Engineering Works', 'Electrical & HVAC', 'omelectricals@gmail.com', '+91 98223 33445', 4.7),
('Shree Ganesh Steel Fixers', 'Shree Ganesh Infra', 'Bar Bending & Structural', 'ganeshsteel@gmail.com', '+91 97654 32100', 4.9),
('Apex Water Proofing', 'Apex Solutions Ltd', 'Waterproofing & Chemical Treatment', 'info@apexwaterproof.com', '+91 98221 99887', 4.6)
ON CONFLICT DO NOTHING;

-- Initial Project Team Members
INSERT INTO public.project_team_members (
  project_id, full_name, email, phone, designation, role, department, assignment_date, status, notes, is_sample
) VALUES
  ('p1', 'Omkar Sawant', 'omkar.sawant@triples.com', '+91 98201 11223', 'Senior Project Manager', 'Project Manager', 'Project Management', '2024-01-15', 'active', 'Direct lead in charge of schedule, site milestone sign-offs, and client delivery.', true),
  ('p1', 'Priya Sharma', 'priya.sharma@triples.com', '+91 98202 22334', 'Lead Site Engineer', 'Site Engineer', 'Site Operations', '2024-01-20', 'active', 'Manages RCC structural pouring, rebar checks, and contractor shift coordination.', true),
  ('p1', 'Kavita Verma', 'kavita.verma@triples.com', '+91 98203 33445', 'Senior Project Accountant', 'Accountant', 'Finance & Accounts', '2024-02-01', 'active', 'Processes contractor RA bills, petty cash disbursements, and monthly cost reconciliations.', true),
  ('p1', 'Rohan Mane', 'rohan.mane@triples.com', '+91 98204 44556', 'Structural Civil Engineer', 'Civil Engineer', 'Engineering & Design', '2024-02-05', 'active', 'Oversees QA/QC testing, cube test certifications, and architectural alignment.', true),
  ('p1', 'Siddharth Rao', 'siddharth.rao@triples.com', '+91 98205 55667', 'Procurement & Vendor Lead', 'Procurement Manager', 'Procurement & Supply', '2024-02-10', 'active', 'Issues purchase orders for TMT steel, bulk cement, and specialty facade fittings.', true),
  ('p1', 'Ganesh Kadam', 'ganesh.kadam@triples.com', '+91 98206 66778', 'Site Inventory & Yard Manager', 'Store / Inventory Manager', 'Inventory & Store', '2024-02-18', 'active', 'Controls Goods Receipt Notes (GRN), store dispatch chits, and steel inventory ledger.', true),
  ('p1', 'Nitin Joshi', 'nitin.joshi@triples.com', '+91 98207 77889', 'EHS Officer', 'Safety Officer', 'Quality & Safety', '2024-03-01', 'active', 'Conducts daily morning toolbox talks, scaffolding safety audits, and PPE enforcement.', true),
  ('p1', 'Rajesh Kumar', 'rajesh.kumar@triples.com', '+91 98208 88990', 'Site Execution Supervisor', 'Supervisor', 'Site Operations', '2024-03-10', 'active', 'Coordinates daily workforce attendance, equipment operators, and sub-tier mason gangs.', true),
  ('PRJ-001', 'Omkar Sawant', 'omkar.sawant@triples.com', '+91 98201 11223', 'Senior Project Manager', 'Project Manager', 'Project Management', '2024-01-15', 'active', 'Direct lead in charge of schedule, site milestone sign-offs, and client delivery.', true),
  ('PRJ-001', 'Priya Sharma', 'priya.sharma@triples.com', '+91 98202 22334', 'Lead Site Engineer', 'Site Engineer', 'Site Operations', '2024-01-20', 'active', 'Manages RCC structural pouring, rebar checks, and contractor shift coordination.', true),
  ('PRJ-001', 'Kavita Verma', 'kavita.verma@triples.com', '+91 98203 33445', 'Senior Project Accountant', 'Accountant', 'Finance & Accounts', '2024-02-01', 'active', 'Processes contractor RA bills, petty cash disbursements, and monthly cost reconciliations.', true),
  ('PRJ-001', 'Rohan Mane', 'rohan.mane@triples.com', '+91 98204 44556', 'Structural Civil Engineer', 'Civil Engineer', 'Engineering & Design', '2024-02-05', 'active', 'Oversees QA/QC testing, cube test certifications, and architectural alignment.', true),
  ('PRJ-001', 'Siddharth Rao', 'siddharth.rao@triples.com', '+91 98205 55667', 'Procurement & Vendor Lead', 'Procurement Manager', 'Procurement & Supply', '2024-02-10', 'active', 'Issues purchase orders for TMT steel, bulk cement, and specialty facade fittings.', true),
  ('PRJ-001', 'Ganesh Kadam', 'ganesh.kadam@triples.com', '+91 98206 66778', 'Site Inventory & Yard Manager', 'Store / Inventory Manager', 'Inventory & Store', '2024-02-18', 'active', 'Controls Goods Receipt Notes (GRN), store dispatch chits, and steel inventory ledger.', true),
  ('PRJ-001', 'Nitin Joshi', 'nitin.joshi@triples.com', '+91 98207 77889', 'EHS Officer', 'Safety Officer', 'Quality & Safety', '2024-03-01', 'active', 'Conducts daily morning toolbox talks, scaffolding safety audits, and PPE enforcement.', true),
  ('PRJ-001', 'Rajesh Kumar', 'rajesh.kumar@triples.com', '+91 98208 88990', 'Site Execution Supervisor', 'Supervisor', 'Site Operations', '2024-03-10', 'active', 'Coordinates daily workforce attendance, equipment operators, and sub-tier mason gangs.', true)
ON CONFLICT DO NOTHING;

