'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import InventoryView from '@/components/inventory/InventoryView';
import { getInventoryWithClients, getClients } from '@/lib/supabase/queries';
import { InventoryDisplay, ClientDisplay } from '@/types';

export default function InventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryDisplay[]>([]);
  const [clients, setClients] = useState<ClientDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [inv, cl] = await Promise.all([
      getInventoryWithClients(),
      getClients(),
    ]);
    setInventory(inv);
    setClients(cl);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 flex items-center justify-center min-h-100">
          <div className="text-slate-400 text-sm">Loading inventory...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <InventoryView
        inventory={inventory}
        setInventory={setInventory}
        clients={clients}
        onNavigate={(view) => router.push(`/${view}`)}
      />
    </AppShell>
  );
}
