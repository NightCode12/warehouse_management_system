'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/permissions';
import AppShell from '@/components/layout/AppShell';
import TopBar from '@/components/layout/TopBar';
import ManualEntryForm from '@/components/manual-entry/ManualEntryForm';

export default function ManualEntryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (user && !canAccessPage(user.role, '/manual-entry')) {
      router.replace('/orders');
    }
  }, [user, router]);

  if (!user || !canAccessPage(user.role, '/manual-entry')) return null;

  return (
    <AppShell>
      <TopBar title="Manual Order Entry" />
      <ManualEntryForm key={key} onSubmitted={() => setKey(k => k + 1)} />
    </AppShell>
  );
}
