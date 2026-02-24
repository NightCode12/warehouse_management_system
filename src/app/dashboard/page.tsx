'use client';

import { useState, useEffect } from 'react';
import OperationsDashboard from '@/components/dashboard/OperationsDashboard';
import { generateOrders } from '@/lib/mock-data';
import { MockOrder } from '@/types';

export default function DashboardPage() {
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setOrders(generateOrders());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <OperationsDashboard orders={orders} />;
}
