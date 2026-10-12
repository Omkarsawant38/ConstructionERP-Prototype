-- Migration: 20261012210000_accountant_projects_view.sql
-- Description: Grant 'projects.view' permission to the 'accountant' role so accountants
--              can navigate to Dashboard, Finance & Billing, and Projects.

DO $$
DECLARE
  v_role_id UUID;
  v_perm_id UUID;
BEGIN
  -- Get Accountant role
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'accountant';

  -- Get projects.view permission
  SELECT id INTO v_perm_id FROM public.permissions WHERE name = 'projects.view';

  IF v_role_id IS NOT NULL AND v_perm_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (v_role_id, v_perm_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END $$;
