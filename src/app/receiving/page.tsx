'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import ReceivingView from '@/components/receiving/ReceivingView';
import { generateInventory } from '@/lib/mock-data';
import { MockInventoryItem } from '@/types';

export default function ReceivingPage() {
  const [inventory, setInventory] = useState<MockInventoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setInventory(generateInventory());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AppShell>
      <ReceivingView inventory={inventory} setInventory={setInventory} />
    </AppShell>
  );
}
