-- ==============================================================================
-- Migration: 20261012200000_accountant_expenses_enhancement.sql
-- Description: Enhances the expenses table with fields needed for the complete
--              Accountant workflow (worker, material, quantity, rate, payment method,
--              status, approval tracking, storage bucket).
-- SAFE: Safe incremental migration, preserves all existing tables and data.
-- ==============================================================================

-- 1. Add missing accountant columns to public.expenses if they do not exist
ALTER TABLE public.expenses 
  ADD COLUMN IF NOT EXISTS expense_type TEXT DEFAULT 'Material' CHECK (expense_type IN ('Labor', 'Material', 'Other')),
  ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS worker_name TEXT,
  ADD COLUMN IF NOT EXISTS material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS material_name TEXT,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(15, 3) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'units',
  ADD COLUMN IF NOT EXISTS rate NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Bank Transfer',
  ADD COLUMN IF NOT EXISTS payee TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Index for high-performance accountant dashboard queries
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_type ON public.expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);

-- 3. Storage bucket for expense bills/receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload receipts' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can upload receipts"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'receipts');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view receipts' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public can view receipts"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'receipts');
  END IF;
END $$;
