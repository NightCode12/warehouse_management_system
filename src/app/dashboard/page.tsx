'use client';

import { useState, useEffect } from 'react';
import OperationsDashboard from '@/components/dashboard/OperationsDashboard';
import { getAllOrdersWithItems, markCarryoverOrders, getStores } from '@/lib/supabase/queries';
import { PickableOrder } from '@/types';
import { supabase } from '@/lib/supabase/client';

interface StoreInfo {
  id: string;
  name: string;
  color: string;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<PickableOrder[]>([]);
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    await markCarryoverOrders();
    const [ordersData, storesData] = await Promise.all([
      getAllOrdersWithItems(),
      getStores(),
    ]);
    setOrders(ordersData);
    setStores(storesData.map(s => ({ id: s.id, name: s.name, color: s.color || '#999' })));
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time order changes from Supabase
    const channel = supabase
      .channel('dashboard-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
        Loading dashboard...
      </div>
    );
  }

  return <OperationsDashboard orders={orders} stores={stores} />;
}
