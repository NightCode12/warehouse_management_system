'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import PickListView from '@/components/picklist/PickListView';
import { generateOrders } from '@/lib/mock-data';
import { MockOrder } from '@/types';

export default function PicklistPage() {
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setOrders(generateOrders());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AppShell>
      <PickListView orders={orders} />
    </AppShell>
  );
}
