'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, CheckCircle, Box, BarChart3, ClipboardList, Menu, X } from 'lucide-react';
import { usePickCount } from '@/lib/PickCountContext';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/dashboard' },
  { id: 'orders', label: 'Orders', icon: Package, href: '/orders' },
  { id: 'picklist', label: 'Pick List', icon: CheckCircle, href: '/picklist' },
  { id: 'inventory', label: 'Inventory', icon: Box, href: '/inventory' },
  { id: 'receiving', label: 'Receiving', icon: ClipboardList, href: '/receiving' },
];

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { pendingPickCount } = usePickCount();

  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center font-black text-lg">
            A
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold">A-Best Swag</div>
              <div className="text-xs text-slate-400">Warehouse Ops</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            const showBadge = item.id === 'picklist' && pendingPickCount > 0;
            return (
              <li key={item.id} className="relative">
                <Link
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {sidebarOpen && (
                    <>
                      <span className="font-medium flex-1">{item.label}</span>
                      {showBadge && (
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                          {pendingPickCount}
                        </span>
                      )}
                    </>
                  )}
                  {!sidebarOpen && showBadge && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
