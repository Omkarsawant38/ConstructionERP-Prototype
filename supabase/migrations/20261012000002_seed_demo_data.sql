-- ==============================================================================
-- Migration: 20261012000002_seed_demo_data.sql
-- Description: Seed initial demo projects, materials, suppliers, and contractors
-- ==============================================================================

-- 1. SEED PROJECTS
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

-- 2. SEED INITIAL TASKS
INSERT INTO public.tasks (
  project_id, title, description, priority, status, start_date, due_date, progress, assigned_to_name
) VALUES
('a1111111-1111-1111-1111-111111111111', 'Tower A Foundation Concrete Pour', 'Pouring 800 cu.m M30 grade concrete for raft foundation', 'critical', 'completed', '2024-02-01', '2024-02-15', 100, 'Omkar Sawant'),
('a1111111-1111-1111-1111-111111111111', 'Tower B 8th Floor Slab Casting', 'Shuttering, reinforcement inspection and casting', 'high', 'in-progress', '2024-10-05', '2024-10-18', 70, 'Suresh Patil'),
('a1111111-1111-1111-1111-111111111111', 'Plumbing Rough-In Tower A (Floors 1-5)', 'Installing internal drainage and supply lines', 'medium', 'in-progress', '2024-10-10', '2024-10-25', 40, 'Ramesh Plumbers'),
('a2222222-2222-2222-2222-222222222222', 'Facade Glass Installation (Floors 6-10)', 'Double-glazed tempered curtain wall panels', 'high', 'in-progress', '2024-09-15', '2024-10-30', 45, 'GlassTech India')
ON CONFLICT DO NOTHING;

-- 3. SEED INITIAL MILESTONES
INSERT INTO public.milestones (
  project_id, title, description, due_date, is_completed
) VALUES
('a1111111-1111-1111-1111-111111111111', 'Foundation & Basement Completion', 'All basements and raft foundation finished', '2024-03-31', true),
('a1111111-1111-1111-1111-111111111111', 'Structural Frame Completion', 'Cast all 18 floors structure across 3 towers', '2024-11-30', false),
('a1111111-1111-1111-1111-111111111111', 'MEP & Finishing Works', 'Plumbing, electrical, and interior plaster', '2025-06-30', false)
ON CONFLICT DO NOTHING;

-- 4. SEED MATERIALS / INVENTORY
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

-- 5. SEED SUPPLIERS
INSERT INTO public.suppliers (
  name, contact_person, email, phone, address, category, rating
) VALUES
('Ultratech Building Solutions', 'Vikas Deshmukh', 'orders@ultratech-dist.com', '+91 98220 11223', 'MIDC Bhosari, Pune', 'Cement & Concrete', 4.8),
('Tata Steel Distributors', 'Mahesh Agarwal', 'sales@agarwalsteel.com', '+91 98231 44556', 'Kalamboli Steel Market, Navi Mumbai', 'TMT & Structural Steel', 4.9),
('Sahyadri Aggregate Supplies', 'Pramod Jadhav', 'sahyadri.aggregates@gmail.com', '+91 94220 77889', 'Wagholi, Pune', 'Sand & Aggregates', 4.5)
ON CONFLICT DO NOTHING;

-- 6. SEED CONTRACTORS
INSERT INTO public.contractors (
  name, company, specialization, email, phone, rating
) VALUES
('Om Electricals & MEP', 'Om Engineering Works', 'Electrical & HVAC', 'omelectricals@gmail.com', '+91 98223 33445', 4.7),
('Shree Ganesh Steel Fixers', 'Shree Ganesh Infra', 'Bar Bending & Structural', 'ganeshsteel@gmail.com', '+91 97654 32100', 4.9),
('Apex Water Proofing', 'Apex Solutions Ltd', 'Waterproofing & Chemical Treatment', 'info@apexwaterproof.com', '+91 98221 99887', 4.6)
ON CONFLICT DO NOTHING;
