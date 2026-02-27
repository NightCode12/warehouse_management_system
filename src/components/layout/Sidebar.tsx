'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, CheckCircle, Box, BarChart3, ClipboardList, Menu, X, PenLine, LogOut, Users, FileText, Activity, Settings } from 'lucide-react';
import { usePickCount } from '@/lib/PickCountContext';
import { useLowStock } from '@/lib/LowStockContext';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/permissions';
import type { LucideIcon } from 'lucide-react';

import { UserRole } from '@/types';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

// Role-based nav: which pages each role can see
const ROLE_NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/dashboard' },
    { id: 'orders', label: 'Orders', icon: Package, href: '/orders' },
    { id: 'picklist', label: 'Pick List', icon: CheckCircle, href: '/picklist' },
    { id: 'inventory', label: 'Inventory', icon: Box, href: '/inventory' },
    { id: 'receiving', label: 'Receiving', icon: ClipboardList, href: '/receiving' },
    { id: 'manual-entry', label: 'Manual Entry', icon: PenLine, href: '/manual-entry' },
  ],
  picker: [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/dashboard' },
    { id: 'orders', label: 'Orders', icon: Package, href: '/orders' },
    { id: 'picklist', label: 'Pick List', icon: CheckCircle, href: '/picklist' },
    { id: 'inventory', label: 'Inventory', icon: Box, href: '/inventory' },
    { id: 'receiving', label: 'Receiving', icon: ClipboardList, href: '/receiving' },
  ],
  viewer: [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/dashboard' },
    { id: 'orders', label: 'Orders', icon: Package, href: '/orders' },
    { id: 'picklist', label: 'Pick List', icon: CheckCircle, href: '/picklist' },
    { id: 'inventory', label: 'Inventory', icon: Box, href: '/inventory' },
  ],
};

const ADMIN_NAV: NavItem[] = [
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
  { id: 'inventory-logs', label: 'Inv. Logs', icon: FileText, href: '/admin/inventory-logs' },
  { id: 'activity-logs', label: 'Activity Logs', icon: Activity, href: '/admin/activity-logs' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const pathname = usePathname();
  const { pendingPickCount } = usePickCount();
  const { lowStockCount } = useLowStock();
  const { user, logout } = useAuth();

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const role = (user?.role || 'viewer') as UserRole;
  const mainNav = ROLE_NAV[role] || ROLE_NAV.viewer;
  const visibleAdminNav = ADMIN_NAV.filter(item => canAccessPage(role, item.href));

  function renderNavItem(item: NavItem, labelsVisible: boolean) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const showPickBadge = item.id === 'picklist' && pendingPickCount > 0;
    const showLowStockBadge = item.id === 'inventory' && lowStockCount > 0;
    const badgeCount = showPickBadge ? pendingPickCount : showLowStockBadge ? lowStockCount : 0;
    const badgeColor = showLowStockBadge ? 'bg-red-500' : 'bg-amber-500';
    const showBadge = showPickBadge || showLowStockBadge;

    return (
      <li key={item.id} className="relative">
        <Link
          href={item.href}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
            !labelsVisible ? 'justify-center px-0' : ''
          } ${
            isActive
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <item.icon className="w-[18px] h-[18px] shrink-0" />
          {labelsVisible && (
            <>
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {showBadge && (
                <span className={`px-1.5 py-0.5 ${badgeColor} text-white text-[10px] font-bold rounded-full text-center leading-none whitespace-nowrap`}>
                  {showLowStockBadge ? `${badgeCount} Low Stock` : badgeCount}
                </span>
              )}
            </>
          )}
          {!labelsVisible && showBadge && (
            <span className={`absolute top-1 right-1 w-2 h-2 ${badgeColor} rounded-full`} />
          )}
        </Link>
      </li>
    );
  }

  function renderSidebarContent(labelsVisible: boolean, closeFn: () => void) {
    return (
      <>
        {/* Header */}
        <div className="p-3 border-b border-slate-800">
          {labelsVisible ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-linear-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center font-black text-sm shrink-0">
                A
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold leading-tight">A-Best Swag</div>
                <div className="text-[10px] text-slate-400">Warehouse Ops</div>
              </div>
              <button
                onClick={closeFn}
                className="shrink-0 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center font-black text-sm">
                A
              </div>
              <button
                onClick={() => setDesktopExpanded(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {mainNav.map(item => renderNavItem(item, labelsVisible))}
          </ul>

          {visibleAdminNav.length > 0 && (
            <>
              {labelsVisible ? (
                <div className="mt-3 mb-1.5 px-3">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Admin</div>
                </div>
              ) : (
                <div className="my-2 mx-2 border-t border-slate-700" />
              )}
              <ul className="space-y-0.5">
                {visibleAdminNav.map(item => renderNavItem(item, labelsVisible))}
              </ul>
            </>
          )}
        </nav>

        {/* User Info + Logout */}
        {user && (
          <div className="border-t border-slate-800 p-2.5">
            {labelsVisible ? (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="shrink-0 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className={`hidden lg:flex ${desktopExpanded ? 'w-56' : 'w-16'} bg-slate-900 text-white transition-all duration-300 flex-col shrink-0`}>
        {renderSidebarContent(desktopExpanded, () => setDesktopExpanded(false))}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <div className="relative w-64 h-full bg-slate-900 text-white flex flex-col">
            {renderSidebarContent(true, onMobileClose)}
          </div>
        </div>
      )}
    </>
  );
}
