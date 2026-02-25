'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import ReceivingView from '@/components/receiving/ReceivingView';
import { getInventoryWithClients, getClients, getCompletedReceipts } from '@/lib/supabase/queries';
import { InventoryDisplay, ClientDisplay, ReceivingReceiptDisplay } from '@/types';

export default function ReceivingPage() {
  const [inventory, setInventory] = useState<InventoryDisplay[]>([]);
  const [clients, setClients] = useState<ClientDisplay[]>([]);
  const [completedReceipts, setCompletedReceipts] = useState<ReceivingReceiptDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [inv, cl, receipts] = await Promise.all([
      getInventoryWithClients(),
      getClients(),
      getCompletedReceipts(),
    ]);
    setInventory(inv);
    setClients(cl);
    setCompletedReceipts(receipts);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 flex items-center justify-center min-h-100">
          <div className="text-slate-400 text-sm">Loading receiving...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ReceivingView
        inventory={inventory}
        setInventory={setInventory}
        clients={clients}
        completedReceipts={completedReceipts}
        setCompletedReceipts={setCompletedReceipts}
      />
    </AppShell>
  );
}
