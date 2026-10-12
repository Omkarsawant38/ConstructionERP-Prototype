-- ==============================================================================
-- Migration: 20261012000003_project_team_members.sql
-- Description: Create project_team_members table with RLS, triggers, and demo seed data
-- ==============================================================================

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

-- Index on project_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON public.project_team_members(project_id);

-- Auto-update updated_at timestamp trigger
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_project_team_members
    BEFORE UPDATE ON public.project_team_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for all" ON public.project_team_members;
CREATE POLICY "Allow select for all" ON public.project_team_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all" ON public.project_team_members;
CREATE POLICY "Allow insert for all" ON public.project_team_members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update for all" ON public.project_team_members;
CREATE POLICY "Allow update for all" ON public.project_team_members FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete for all" ON public.project_team_members;
CREATE POLICY "Allow delete for all" ON public.project_team_members FOR DELETE USING (true);

-- Seed initial team members for demo projects (p1 / PRJ-001)
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
  ('p1', 'Rajesh Kumar', 'rajesh.kumar@triples.com', '+91 98208 88990', 'Site Execution Supervisor', 'Supervisor', 'Site Operations', '2024-03-10', 'active', 'Coordinates daily workforce attendance, equipment operators, and sub-tier mason gangs.', true)
ON CONFLICT DO NOTHING;

-- Also seed by project_code 'PRJ-001' so querying by either ID works immediately
INSERT INTO public.project_team_members (
  project_id, full_name, email, phone, designation, role, department, assignment_date, status, notes, is_sample
) VALUES
  ('PRJ-001', 'Omkar Sawant', 'omkar.sawant@triples.com', '+91 98201 11223', 'Senior Project Manager', 'Project Manager', 'Project Management', '2024-01-15', 'active', 'Direct lead in charge of schedule, site milestone sign-offs, and client delivery.', true),
  ('PRJ-001', 'Priya Sharma', 'priya.sharma@triples.com', '+91 98202 22334', 'Lead Site Engineer', 'Site Engineer', 'Site Operations', '2024-01-20', 'active', 'Manages RCC structural pouring, rebar checks, and contractor shift coordination.', true),
  ('PRJ-001', 'Kavita Verma', 'kavita.verma@triples.com', '+91 98203 33445', 'Senior Project Accountant', 'Accountant', 'Finance & Accounts', '2024-02-01', 'active', 'Processes contractor RA bills, petty cash disbursements, and monthly cost reconciliations.', true),
  ('PRJ-001', 'Rohan Mane', 'rohan.mane@triples.com', '+91 98204 44556', 'Structural Civil Engineer', 'Civil Engineer', 'Engineering & Design', '2024-02-05', 'active', 'Oversees QA/QC testing, cube test certifications, and architectural alignment.', true),
  ('PRJ-001', 'Siddharth Rao', 'siddharth.rao@triples.com', '+91 98205 55667', 'Procurement & Vendor Lead', 'Procurement Manager', 'Procurement & Supply', '2024-02-10', 'active', 'Issues purchase orders for TMT steel, bulk cement, and specialty facade fittings.', true),
  ('PRJ-001', 'Ganesh Kadam', 'ganesh.kadam@triples.com', '+91 98206 66778', 'Site Inventory & Yard Manager', 'Store / Inventory Manager', 'Inventory & Store', '2024-02-18', 'active', 'Controls Goods Receipt Notes (GRN), store dispatch chits, and steel inventory ledger.', true),
  ('PRJ-001', 'Nitin Joshi', 'nitin.joshi@triples.com', '+91 98207 77889', 'EHS Officer', 'Safety Officer', 'Quality & Safety', '2024-03-01', 'active', 'Conducts daily morning toolbox talks, scaffolding safety audits, and PPE enforcement.', true),
  ('PRJ-001', 'Rajesh Kumar', 'rajesh.kumar@triples.com', '+91 98208 88990', 'Site Execution Supervisor', 'Supervisor', 'Site Operations', '2024-03-10', 'active', 'Coordinates daily workforce attendance, equipment operators, and sub-tier mason gangs.', true)
ON CONFLICT DO NOTHING;
