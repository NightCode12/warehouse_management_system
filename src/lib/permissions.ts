import { UserRole } from '@/types'

// ─── Feature Permissions ────────────────────────────────────
// Granular actions that can be restricted per role

export type Permission =
  | 'orders:edit_status'
  | 'inventory:adjust'
  | 'picklist:pick'
  | 'receiving:manage_clients'
  | 'manual_entry:access'
  | 'admin:users'
  | 'admin:settings'
  | 'admin:activity_logs'
  | 'admin:inventory_logs'

// ─── Role → Permission Map ──────────────────────────────────
//
//  ADMIN   – Full access to everything
//  PICKER  – Pick orders, receive inventory, view logs
//  VIEWER  – Read-only on dashboard, orders, pick list, inventory, inv. logs (stakeholders)
//
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'orders:edit_status',        // Change order status (Go Pick, Mark Packed, Ship)
    'inventory:adjust',          // +/- inventory quantities directly
    'picklist:pick',             // Pick orders, use scanner mode
    'receiving:manage_clients',  // Add / delete clients on receiving page
    'manual_entry:access',       // Create orders manually
    'admin:users',               // User management page
    'admin:settings',            // Stores, barcode aliases, permissions
    'admin:activity_logs',       // Activity log viewer
    'admin:inventory_logs',      // Inventory log viewer
  ],
  picker: [
    'picklist:pick',             // Can pick orders and use scanner
    'admin:inventory_logs',      // Can view inventory logs (read-only)
  ],
  viewer: [
    'admin:inventory_logs',      // Can view inventory logs (read-only)
  ],
}

// ─── Page Access ────────────────────────────────────────────
//
//  Page                    Admin   Picker   Viewer   File
//  ──────────────────────  ─────   ──────   ──────   ──────────────────────────────────
//  /dashboard              ✓       ✓        ✓(view)  src/app/dashboard/page.tsx
//  /orders                 ✓       ✓(view)  ✓(view)  src/app/orders/page.tsx
//  /picklist               ✓       ✓        ✓(view)  src/app/picklist/page.tsx
//  /inventory              ✓       ✓(view)  ✓(view)  src/app/inventory/page.tsx
//  /receiving              ✓       ✓        ✗        src/app/receiving/page.tsx
//  /manual-entry           ✓       ✗        ✗        src/app/manual-entry/page.tsx
//  /admin/users            ✓       ✗        ✗        src/app/admin/users/page.tsx
//  /admin/settings         ✓       ✗        ✗        src/app/admin/settings/page.tsx
//  /admin/activity-logs    ✓       ✗        ✗        src/app/admin/activity-logs/page.tsx
//  /admin/inventory-logs   ✓       ✓(view)  ✓(view)  src/app/admin/inventory-logs/page.tsx
//
//  (view) = page accessible but write actions hidden
//
//  Navigation config:      src/components/layout/Sidebar.tsx  (ROLE_NAV, ADMIN_NAV)
//  Auth context:           src/lib/AuthContext.tsx
//

// Pages that require a specific permission to access (redirect if denied)
const PAGE_PERMISSION: Record<string, Permission> = {
  '/manual-entry':         'manual_entry:access',
  '/admin/users':          'admin:users',
  '/admin/settings':       'admin:settings',
  '/admin/activity-logs':  'admin:activity_logs',
  '/admin/inventory-logs': 'admin:inventory_logs',
}

// Viewer is restricted to ONLY these pages (whitelist)
const VIEWER_ALLOWED_PAGES = ['/dashboard', '/orders', '/picklist', '/inventory', '/admin/inventory-logs', '/login']

// ─── Helper Functions ───────────────────────────────────────

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canAccessPage(role: UserRole, path: string): boolean {
  // Viewer uses a strict whitelist — only allowed pages
  if (role === 'viewer') {
    return VIEWER_ALLOWED_PAGES.some(p => path === p || path.startsWith(p + '/'))
  }

  const requiredPermission = PAGE_PERMISSION[path]
  if (!requiredPermission) return true
  return hasPermission(role, requiredPermission)
}

/** Default landing page per role */
export function getDefaultPage(role: UserRole): string {
  return role === 'viewer' ? '/dashboard' : '/orders'
}
