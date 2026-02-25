'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import PickListView from '@/components/picklist/PickListView';
import { getPickableOrdersWithItems, markCarryoverOrders } from '@/lib/supabase/queries';
import { PickableOrder } from '@/types';

export default function PicklistPage() {
  const [orders, setOrders] = useState<PickableOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await markCarryoverOrders();
      const data = await getPickableOrdersWithItems();
      setOrders(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 flex items-center justify-center min-h-100">
          <div className="text-slate-400 text-sm">Loading pick list...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PickListView orders={orders} />
    </AppShell>
  );
}
