'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import TopBar from '@/components/layout/TopBar';
import ManualEntryForm from '@/components/manual-entry/ManualEntryForm';

export default function ManualEntryPage() {
  const [key, setKey] = useState(0);

  return (
    <AppShell>
      <TopBar title="Manual Order Entry" />
      <ManualEntryForm key={key} onSubmitted={() => setKey(k => k + 1)} />
    </AppShell>
  );
}
