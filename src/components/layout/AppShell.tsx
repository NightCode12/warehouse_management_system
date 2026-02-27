'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage, getDefaultPage } from '@/lib/permissions';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Redirect if the user's role can't access this page
  useEffect(() => {
    if (loading || !user) return;
    if (!canAccessPage(user.role, pathname)) {
      router.replace(getDefaultPage(user.role));
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) return null; // AuthContext handles redirect to /login

  // Don't render content for unauthorized pages (redirect is in progress)
  if (!canAccessPage(user.role, pathname)) return null;

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 overflow-auto min-w-0">
        {/* Mobile header with hamburger */}
        <div className="sticky top-0 z-30 flex items-center gap-3 bg-slate-900 px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-6 h-6 bg-linear-to-br from-emerald-400 to-blue-500 rounded-md flex items-center justify-center font-black text-[10px] text-white">
            A
          </div>
          <span className="text-sm font-semibold text-white">A-Best Swag</span>
        </div>
        {children}
      </div>
    </div>
  );
}
