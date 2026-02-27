'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import PickListView from '@/components/picklist/PickListView';
import { getPickableOrdersWithItems, markCarryoverOrders } from '@/lib/supabase/queries';
import { usePickCount } from '@/lib/PickCountContext';
import { useAuth } from '@/lib/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { PickableOrder } from '@/types';

export default function PicklistPage() {
  const [orders, setOrders] = useState<PickableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshCount } = usePickCount();
  const { user } = useAuth();
  const canPick = user ? hasPermission(user.role, 'picklist:pick') : false;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await markCarryoverOrders();
      const data = await getPickableOrdersWithItems();
      setOrders(data);
      setLoading(false);
      refreshCount();
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
      <PickListView orders={orders} readOnly={!canPick} />
    </AppShell>
  );
}
