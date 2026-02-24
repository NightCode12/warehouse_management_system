'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import InventoryView from '@/components/inventory/InventoryView';
import { generateInventory } from '@/lib/mock-data';
import { MockInventoryItem } from '@/types';

export default function InventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<MockInventoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setInventory(generateInventory());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AppShell>
      <InventoryView
        inventory={inventory}
        setInventory={setInventory}
        onNavigate={(view) => router.push(`/${view}`)}
      />
    </AppShell>
  );
}
