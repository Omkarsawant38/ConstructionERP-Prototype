-- ==============================================================================
-- Migration: 20261012000001_initial_schema.sql
-- Description: Construction ERP Database Schema
-- Includes: Enums, Profiles, Projects, Tasks, Milestones, Expenses, Materials,
--           Suppliers, Purchase Orders, Contractors, Site Updates, RLS, and Triggers.
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

-- 3. PROFILES TABLE (Extends Supabase Auth users)
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

-- 4. PROJECTS TABLE
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

-- 5. TASKS TABLE
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

-- 6. MILESTONES TABLE
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

-- 7. EXPENSES TABLE
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

-- 8. MATERIALS / INVENTORY TABLE
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

-- 9. SUPPLIERS TABLE
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

-- 10. PURCHASE ORDERS TABLE
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

-- 11. CONTRACTORS TABLE
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

-- 12. SITE UPDATES / DAILY LOGS TABLE
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

-- ==============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER FUNCTION
-- ==============================================================================
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

-- ==============================================================================
-- AUTHENTICATION NEW USER TRIGGER
-- Automatically creates a public profile row when an auth.user signs up
-- ==============================================================================
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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Configured to allow authenticated users full access, and allow anon access
-- for frontend demo & development mode.
-- ==============================================================================
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

-- Helper to set permissive policies for development & demo
DROP POLICY IF EXISTS "Allow select for all" ON public.profiles;
CREATE POLICY "Allow select for all" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for all" ON public.profiles;
CREATE POLICY "Allow insert for all" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for all" ON public.profiles;
CREATE POLICY "Allow update for all" ON public.profiles FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete for all" ON public.profiles;
CREATE POLICY "Allow delete for all" ON public.profiles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow select for all" ON public.projects;
CREATE POLICY "Allow select for all" ON public.projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for all" ON public.projects;
CREATE POLICY "Allow insert for all" ON public.projects FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for all" ON public.projects;
CREATE POLICY "Allow update for all" ON public.projects FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete for all" ON public.projects;
CREATE POLICY "Allow delete for all" ON public.projects FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow select for all" ON public.tasks;
CREATE POLICY "Allow select for all" ON public.tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for all" ON public.tasks;
CREATE POLICY "Allow insert for all" ON public.tasks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for all" ON public.tasks;
CREATE POLICY "Allow update for all" ON public.tasks FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete for all" ON public.tasks;
CREATE POLICY "Allow delete for all" ON public.tasks FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow select for all" ON public.milestones;
CREATE POLICY "Allow select for all" ON public.milestones FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for all" ON public.milestones;
CREATE POLICY "Allow insert for all" ON public.milestones FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for all" ON public.milestones;
CREATE POLICY "Allow update for all" ON public.milestones FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete for all" ON public.milestones;
CREATE POLICY "Allow delete for all" ON public.milestones FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow select for all" ON public.expenses;
CREATE POLICY "Allow select for all" ON public.expenses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for all" ON public.expenses;
CREATE POLICY "Allow insert for all" ON public.expenses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for all" ON public.expenses;
CREATE POLICY "Allow update for all" ON public.expenses FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete for all" ON public.expenses;
CREATE POLICY "Allow delete for all" ON public.expenses FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow select for all" ON public.materials;
CREATE POLICY "Allow select for all" ON public.materials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for all" ON public.materials;
CREATE POLICY "Allow insert for all" ON public.materials FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for all" ON public.materials;
CREATE POLICY "Allow update for all" ON public.materials FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete for all" ON public.materials;
CREATE POLICY "Allow delete for all" ON public.materials FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow select for all" ON public.suppliers;
CREATE POLICY "Allow select for all" ON public.suppliers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for all" ON public.suppliers;
CREATE POLICY "Allow insert for all" ON public.suppliers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for all" ON public.suppliers;
CREATE POLICY "Allow update for all" ON public.suppliers FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete for all" ON public.suppliers;
CREATE POLICY "Allow delete for all" ON public.suppliers FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow select for all" ON public.purchase_orders;
CREATE POLICY "Allow select for all" ON public.purchase_orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for all" ON public.purchase_orders;
CREATE POLICY "Allow insert for all" ON public.purchase_orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for all" ON public.purchase_orders;
CREATE POLICY "Allow update for all" ON public.purchase_orders FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete for all" ON public.purchase_orders;
CREATE POLICY "Allow delete for all" ON public.purchase_orders FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow select for all" ON public.contractors;
CREATE POLICY "Allow select for all" ON public.contractors FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for all" ON public.contractors;
CREATE POLICY "Allow insert for all" ON public.contractors FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for all" ON public.contractors;
CREATE POLICY "Allow update for all" ON public.contractors FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete for all" ON public.contractors;
CREATE POLICY "Allow delete for all" ON public.contractors FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow select for all" ON public.site_updates;
CREATE POLICY "Allow select for all" ON public.site_updates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert for all" ON public.site_updates;
CREATE POLICY "Allow insert for all" ON public.site_updates FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow update for all" ON public.site_updates;
CREATE POLICY "Allow update for all" ON public.site_updates FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow delete for all" ON public.site_updates;
CREATE POLICY "Allow delete for all" ON public.site_updates FOR DELETE USING (true);

