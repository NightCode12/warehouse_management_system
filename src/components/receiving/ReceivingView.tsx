'use client';

import { useState, useCallback } from 'react';
import { ClipboardList, Clock } from 'lucide-react';
import { MockInventoryItem, ReceivingReceipt, ReceivingItem, MockClient } from '@/types';
import ClientSelector from './ClientSelector';
import ItemEntryForm from './ItemEntryForm';
import ReceiptSummary from './ReceiptSummary';

interface ReceivingViewProps {
  inventory: MockInventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<MockInventoryItem[]>>;
}

let receiptCounter = 1;
let itemCounter = 1;

function generateReceiptNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(receiptCounter++).padStart(3, '0');
  return `RCV-${dateStr}-${seq}`;
}

export default function ReceivingView({ inventory, setInventory }: ReceivingViewProps) {
  const [activeReceipt, setActiveReceipt] = useState<ReceivingReceipt | null>(null);
  const [completedReceipts, setCompletedReceipts] = useState<ReceivingReceipt[]>([]);

  const startSession = useCallback((client: MockClient) => {
    setActiveReceipt({
      id: Date.now(),
      receiptNumber: generateReceiptNumber(),
      client,
      items: [],
      status: 'in-progress',
      createdAt: new Date(),
    });
  }, []);

  const addItem = useCallback((item: Omit<ReceivingItem, 'id' | 'receivedAt'>) => {
    setActiveReceipt(prev => {
      if (!prev) return prev;
      const newItem: ReceivingItem = {
        ...item,
        id: itemCounter++,
        receivedAt: new Date(),
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
  }, []);

  const removeItem = useCallback((itemId: number) => {
    setActiveReceipt(prev => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter(i => i.id !== itemId) };
    });
  }, []);

  const completeReceipt = useCallback(() => {
    if (!activeReceipt || activeReceipt.items.length === 0) return;

    const completedReceipt: ReceivingReceipt = {
      ...activeReceipt,
      status: 'completed',
      completedAt: new Date(),
    };

    // Update inventory
    setInventory(prev => {
      const updated = [...prev];
      for (const receivedItem of completedReceipt.items) {
        const existingIndex = updated.findIndex(
          inv => inv.sku === receivedItem.sku && inv.client.id === completedReceipt.client.id
        );
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + receivedItem.quantity,
            lastUpdated: new Date(),
          };
        } else {
          const newId = Math.max(...updated.map(i => i.id), 0) + 1;
          updated.push({
            id: newId,
            sku: receivedItem.sku,
            name: receivedItem.name,
            variant: receivedItem.variant,
            location: receivedItem.location,
            quantity: receivedItem.quantity,
            threshold: 10,
            client: completedReceipt.client,
            lastUpdated: new Date(),
          });
        }
      }
      return updated;
    });

    setCompletedReceipts(prev => [completedReceipt, ...prev]);
    setActiveReceipt(null);
  }, [activeReceipt, setInventory]);

  const cancelSession = useCallback(() => {
    if (activeReceipt && activeReceipt.items.length > 0) {
      if (!window.confirm(`Discard ${activeReceipt.items.length} scanned items?`)) return;
    }
    setActiveReceipt(null);
  }, [activeReceipt]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Receive Inventory</h2>
        {activeReceipt && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-emerald-700">
                Session active &bull; {activeReceipt.receiptNumber}
              </span>
            </div>
            <button
              onClick={cancelSession}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Change Client
            </button>
          </div>
        )}
      </div>

      {!activeReceipt ? (
        <ClientSelector onSelectClient={startSession} />
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <ItemEntryForm
              inventory={inventory}
              client={activeReceipt.client}
              onAddItem={addItem}
            />
          </div>
          <div className="col-span-2">
            <ReceiptSummary
              receipt={activeReceipt}
              onRemoveItem={removeItem}
              onComplete={completeReceipt}
              onCancel={cancelSession}
            />
          </div>
        </div>
      )}

      {/* Completed Receipts History */}
      {completedReceipts.length > 0 && (
        <div className="mt-8">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-700 mb-4">
            <Clock className="w-5 h-5 text-slate-400" />
            Completed Receipts
          </h3>
          <div className="space-y-3">
            {completedReceipts.map(receipt => (
              <div
                key={receipt.id}
                className="bg-white rounded-xl border border-slate-200 px-5 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-slate-400" />
                    <span className="font-mono text-sm font-medium text-slate-700">{receipt.receiptNumber}</span>
                  </div>
                  <div
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: receipt.client.color + '20', color: receipt.client.color }}
                  >
                    {receipt.client.name}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span>{receipt.items.length} items</span>
                  <span>{receipt.items.reduce((s, i) => s + i.quantity, 0)} units</span>
                  <span>
                    {receipt.completedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
