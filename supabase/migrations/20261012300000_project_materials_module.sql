-- ==============================================================================
-- Migration: 20261012300000_project_materials_module.sql
-- Description: Complete Project Materials Management Module
--              Tables: material_requests, material_request_items, stock_movements
--              RBAC permissions: inventory.approve
--              RLS Policies & Indexes
--              Auditable stock tracking & Storage Bucket
-- SAFE: Safe incremental migration, strictly additive, preserves all existing data.
-- ==============================================================================

-- 1. MATERIAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.material_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('draft', 'pending_approval', 'approved', 'partially_fulfilled', 'fulfilled', 'rejected')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  required_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_location TEXT,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_by_name TEXT,
  notes TEXT,
  attachment_url TEXT,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  rejection_reason TEXT,
  organization_id TEXT DEFAULT 'org1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MATERIAL REQUEST ITEMS TABLE (supports multiple line items per request)
CREATE TABLE IF NOT EXISTS public.material_request_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.material_requests(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  material_name TEXT,
  quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'units',
  estimated_unit_cost NUMERIC(12, 2) DEFAULT 0,
  fulfilled_quantity NUMERIC(12, 2) DEFAULT 0 CHECK (fulfilled_quantity >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STOCK MOVEMENTS TABLE (Auditable Goods Receipts, Site Issues, Adjustments)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movement_number TEXT NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  material_name TEXT,
  request_id UUID REFERENCES public.material_requests(id) ON DELETE SET NULL,
  request_item_id UUID REFERENCES public.material_request_items(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('receipt', 'issue', 'adjustment')),
  quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'units',
  unit_cost NUMERIC(12, 2) DEFAULT 0,
  total_cost NUMERIC(15, 2) DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  source_or_location TEXT,
  reference_number TEXT,
  notes TEXT,
  attachment_url TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_by_name TEXT,
  organization_id TEXT DEFAULT 'org1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_material_requests_project_id ON public.material_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON public.material_requests(status);
CREATE INDEX IF NOT EXISTS idx_material_requests_created_at ON public.material_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON public.material_request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_request_items_material_id ON public.material_request_items(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_project_id ON public.stock_movements(project_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_material_id ON public.stock_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON public.stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON public.stock_movements(date DESC);

-- 5. PERMISSIONS & RBAC SEEDING
INSERT INTO public.permissions (name, module, action, description)
VALUES ('inventory.approve', 'inventory', 'approve', 'Approve or reject material requests')
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
  v_perm_id UUID;
  v_role_id UUID;
BEGIN
  SELECT id INTO v_perm_id FROM public.permissions WHERE name = 'inventory.approve';
  
  IF v_perm_id IS NOT NULL THEN
    -- Grant to super_admin
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'super_admin';
    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id) ON CONFLICT DO NOTHING;
    END IF;

    -- Grant to owner_director
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'owner_director';
    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id) ON CONFLICT DO NOTHING;
    END IF;

    -- Grant to project_manager
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'project_manager';
    IF v_role_id IS NOT NULL THEN
      INSERT INTO public.role_permissions (role_id, permission_id)
      VALUES (v_role_id, v_perm_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES FOR MATERIAL REQUESTS
DROP POLICY IF EXISTS "material_requests_select" ON public.material_requests;
CREATE POLICY "material_requests_select" ON public.material_requests
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'inventory.view')
    OR auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "material_requests_insert" ON public.material_requests;
CREATE POLICY "material_requests_insert" ON public.material_requests
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'inventory.request')
    OR public.user_has_role(auth.uid(), ARRAY['super_admin', 'project_manager', 'site_engineer'])
  );

DROP POLICY IF EXISTS "material_requests_update" ON public.material_requests;
CREATE POLICY "material_requests_update" ON public.material_requests
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'inventory.approve')
    OR public.user_has_role(auth.uid(), ARRAY['super_admin', 'project_manager', 'store_inventory_manager', 'procurement_manager'])
  );

DROP POLICY IF EXISTS "material_requests_delete" ON public.material_requests;
CREATE POLICY "material_requests_delete" ON public.material_requests
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin', 'project_manager'])
  );

-- RLS POLICIES FOR MATERIAL REQUEST ITEMS
DROP POLICY IF EXISTS "material_request_items_select" ON public.material_request_items;
CREATE POLICY "material_request_items_select" ON public.material_request_items
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'inventory.view')
    OR auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "material_request_items_insert" ON public.material_request_items;
CREATE POLICY "material_request_items_insert" ON public.material_request_items
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'inventory.request')
    OR public.user_has_role(auth.uid(), ARRAY['super_admin', 'project_manager', 'site_engineer'])
  );

DROP POLICY IF EXISTS "material_request_items_update" ON public.material_request_items;
CREATE POLICY "material_request_items_update" ON public.material_request_items
  FOR UPDATE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin', 'project_manager', 'store_inventory_manager', 'procurement_manager'])
  );

-- RLS POLICIES FOR STOCK MOVEMENTS
DROP POLICY IF EXISTS "stock_movements_select" ON public.stock_movements;
CREATE POLICY "stock_movements_select" ON public.stock_movements
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'inventory.view')
    OR auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "stock_movements_insert" ON public.stock_movements;
CREATE POLICY "stock_movements_insert" ON public.stock_movements
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'inventory.stock_in')
    OR public.user_has_permission(auth.uid(), 'inventory.stock_out')
    OR public.user_has_role(auth.uid(), ARRAY['super_admin', 'store_inventory_manager', 'procurement_manager', 'project_manager'])
  );

DROP POLICY IF EXISTS "stock_movements_update" ON public.stock_movements;
CREATE POLICY "stock_movements_update" ON public.stock_movements
  FOR UPDATE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

DROP POLICY IF EXISTS "stock_movements_delete" ON public.stock_movements;
CREATE POLICY "stock_movements_delete" ON public.stock_movements
  FOR DELETE USING (
    public.user_has_role(auth.uid(), ARRAY['super_admin'])
  );

-- 8. STORAGE BUCKET FOR MATERIAL ATTACHMENTS
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload material attachments' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Authenticated users can upload material attachments"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'materials');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public can view material attachments' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public can view material attachments"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'materials');
  END IF;
END $$;
