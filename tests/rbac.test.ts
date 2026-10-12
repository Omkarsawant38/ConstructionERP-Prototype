/**
 * RBAC Verification Script
 * Validates role names, permission configurations, and route mappings.
 * Run directly using node/tsx/ts-node.
 */

import {
  ROLE_DISPLAY_NAMES,
  VALID_ROLES,
  ROUTE_PERMISSION_MAP,
  type RoleName,
} from '../src/types/rbac';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runRbacTests() {
  console.log('Running RBAC Suite Verification...');

  // 1. Verify all 7 roles exist
  const expectedRoles: RoleName[] = [
    'super_admin',
    'owner_director',
    'project_manager',
    'accountant',
    'site_engineer',
    'procurement_manager',
    'store_inventory_manager',
  ];

  assert(VALID_ROLES.length === 7, `Expected 7 roles, found ${VALID_ROLES.length}`);

  for (const role of expectedRoles) {
    assert(VALID_ROLES.includes(role), `Missing role in VALID_ROLES: ${role}`);
    assert(!!ROLE_DISPLAY_NAMES[role], `Missing display name for: ${role}`);
  }
  console.log('✔ All 7 construction roles properly defined.');

  // 2. Verify all dashboard routes map to required permissions
  const expectedRouteMaps: Record<string, string> = {
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

  for (const [route, perm] of Object.entries(expectedRouteMaps)) {
    assert(
      ROUTE_PERMISSION_MAP[route] === perm,
      `Route ${route} expected ${perm}, got ${ROUTE_PERMISSION_MAP[route]}`
    );
  }
  console.log('✔ All 12 route permission mappings verified.');

  console.log('\nAll RBAC suite validations passed successfully!');
}

runRbacTests();
