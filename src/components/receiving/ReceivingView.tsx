'use client';

import { useState, useCallback } from 'react';
import { ClipboardList, Clock, ChevronDown, ChevronRight, Package, MapPin } from 'lucide-react';
import { InventoryDisplay, ClientDisplay, ReceivingReceiptDisplay } from '@/types';
import {
  createReceivingReceipt,
  addReceivingItem,
  removeReceivingItem,
  completeReceivingReceipt,
  incrementInventoryQuantity,
  createInventoryItem,
} from '@/lib/supabase/queries';
import ClientSelector from './ClientSelector';
import ItemEntryForm from './ItemEntryForm';
import ReceiptSummary from './ReceiptSummary';

interface ReceivingViewProps {
  inventory: InventoryDisplay[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryDisplay[]>>;
  clients: ClientDisplay[];
  completedReceipts: ReceivingReceiptDisplay[];
  setCompletedReceipts: React.Dispatch<React.SetStateAction<ReceivingReceiptDisplay[]>>;
}

let receiptCounter = 1;

function generateReceiptNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(receiptCounter++).padStart(3, '0');
  return `RCV-${dateStr}-${seq}`;
}

export default function ReceivingView({
  inventory,
  setInventory,
  clients,
  completedReceipts,
  setCompletedReceipts,
}: ReceivingViewProps) {
  const [activeReceipt, setActiveReceipt] = useState<ReceivingReceiptDisplay | null>(null);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);

  const startSession = useCallback(async (client: ClientDisplay) => {
    const refNumber = generateReceiptNumber();
    try {
      const receipt = await createReceivingReceipt(client.id, refNumber);
      setActiveReceipt({
        id: receipt.id,
        reference_number: receipt.reference_number,
        client_id: client.id,
        client_name: client.name,
        client_color: client.color,
        status: receipt.status || 'pending',
        items: [],
        created_at: new Date().toISOString(),
        completed_at: null,
      });
      setActiveClientId(client.id);
    } catch (err) {
      console.error('Failed to create receiving session:', err);
    }
  }, []);

  const handleAddItem = useCallback(async (item: {
    sku: string;
    product_name: string;
    variant: string;
    quantity: number;
    location_code: string;
    scannedBarcode?: string;
  }) => {
    if (!activeReceipt) return;

    // Find matching inventory item to get inventory_id
    const invMatch = inventory.find(
      i => i.sku.toUpperCase() === item.sku.toUpperCase() && i.client_id === activeClientId
    );

    try {
      const saved = await addReceivingItem(activeReceipt.id, {
        sku: item.sku,
        product_name: item.product_name || null,
        variant: item.variant || null,
        quantity_received: item.quantity,
        location_code: item.location_code || null,
        inventory_id: invMatch?.id || null,
      });

      setActiveReceipt(prev => {
        if (!prev) return prev;
        return { ...prev, items: [...prev.items, saved] };
      });
    } catch (err) {
      console.error('Failed to add receiving item:', err);
    }
  }, [activeReceipt, activeClientId, inventory]);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    try {
      await removeReceivingItem(itemId);
      setActiveReceipt(prev => {
        if (!prev) return prev;
        return { ...prev, items: prev.items.filter(i => i.id !== itemId) };
      });
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  }, []);

  const handleComplete = useCallback(async () => {
    if (!activeReceipt || activeReceipt.items.length === 0) return;

    try {
      await completeReceivingReceipt(activeReceipt.id);

      for (const item of activeReceipt.items) {
        if (item.inventory_id) {
          // Existing inventory item → increment quantity
          const invItem = inventory.find(i => i.id === item.inventory_id);
          if (invItem) {
            await incrementInventoryQuantity(item.inventory_id, item.quantity_received, invItem.quantity);
            setInventory(prev =>
              prev.map(i =>
                i.id === item.inventory_id
                  ? { ...i, quantity: i.quantity + item.quantity_received, last_updated: new Date().toISOString() }
                  : i
              )
            );
          }
        } else if (activeClientId) {
          // No matching inventory → create a new inventory row
          try {
            const newInv = await createInventoryItem({
              sku: item.sku,
              product_name: item.product_name || item.sku,
              variant: item.variant,
              quantity: item.quantity_received,
              location_code: item.location_code,
              client_id: activeClientId,
              barcode: item.sku,
            });
            setInventory(prev => [...prev, newInv]);
          } catch (err) {
            console.error(`Failed to create inventory for SKU ${item.sku}:`, err);
          }
        }
      }

      const completedReceipt: ReceivingReceiptDisplay = {
        ...activeReceipt,
        status: 'completed',
        completed_at: new Date().toISOString(),
      };

      setCompletedReceipts(prev => [completedReceipt, ...prev]);
      setActiveReceipt(null);
      setActiveClientId(null);
    } catch (err) {
      console.error('Failed to complete receipt:', err);
    }
  }, [activeReceipt, activeClientId, inventory, setInventory, setCompletedReceipts]);

  const cancelSession = useCallback(() => {
    if (activeReceipt && activeReceipt.items.length > 0) {
      if (!window.confirm(`Discard ${activeReceipt.items.length} scanned items?`)) return;
    }
    setActiveReceipt(null);
    setActiveClientId(null);
  }, [activeReceipt]);

  const toggleReceiptExpand = (receiptId: string) => {
    setExpandedReceiptId(prev => (prev === receiptId ? null : receiptId));
  };

  // Find active client display for ItemEntryForm
  const activeClient = clients.find(c => c.id === activeClientId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Receive Inventory</h2>
        {activeReceipt && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-emerald-700">
                Session active &bull; {activeReceipt.reference_number}
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
        <ClientSelector clients={clients} onSelectClient={startSession} />
      ) : activeClient ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1">
            <ItemEntryForm
              inventory={inventory}
              client={activeClient}
              onAddItem={handleAddItem}
            />
          </div>
          <div className="col-span-2">
            <ReceiptSummary
              receipt={activeReceipt}
              onRemoveItem={handleRemoveItem}
              onComplete={handleComplete}
              onCancel={cancelSession}
            />
          </div>
        </div>
      ) : null}

      {/* Completed Receipts History */}
      {completedReceipts.length > 0 && (
        <div className="mt-8">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-700 mb-4">
            <Clock className="w-5 h-5 text-slate-400" />
            Completed Receipts
          </h3>
          <div className="space-y-3">
            {completedReceipts.map(receipt => {
              const isExpanded = expandedReceiptId === receipt.id;
              const totalUnits = receipt.items.reduce((s, i) => s + i.quantity_received, 0);

              return (
                <div
                  key={receipt.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all"
                >
                  {/* Receipt header row — clickable */}
                  <button
                    onClick={() => toggleReceiptExpand(receipt.id)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-sm font-medium text-slate-700">
                          {receipt.reference_number}
                        </span>
                      </div>
                      {receipt.client_name && (
                        <div
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: (receipt.client_color || '#999') + '20',
                            color: receipt.client_color || '#999',
                          }}
                        >
                          {receipt.client_name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <span>{receipt.items.length} items</span>
                      <span>{totalUnits} units</span>
                      <span>
                        {receipt.completed_at
                          ? new Date(receipt.completed_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-5 pb-4">
                      <table className="w-full text-sm mt-3">
                        <thead>
                          <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                            <th className="pb-2 font-medium">SKU</th>
                            <th className="pb-2 font-medium">Product</th>
                            <th className="pb-2 font-medium">Variant</th>
                            <th className="pb-2 font-medium">Location</th>
                            <th className="pb-2 font-medium text-right">Qty Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {receipt.items.map(item => (
                            <tr key={item.id} className="text-slate-700">
                              <td className="py-2.5 pr-4">
                                <span className="font-mono text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded">
                                  {item.sku}
                                </span>
                              </td>
                              <td className="py-2.5 pr-4">
                                <div className="flex items-center gap-2">
                                  <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{item.product_name || '—'}</span>
                                </div>
                              </td>
                              <td className="py-2.5 pr-4 text-slate-500">
                                {item.variant || '—'}
                              </td>
                              <td className="py-2.5 pr-4">
                                {item.location_code ? (
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span className="font-mono text-xs">{item.location_code}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="py-2.5 text-right">
                                <span className="font-semibold text-emerald-600">
                                  +{item.quantity_received}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200">
                            <td colSpan={4} className="pt-3 text-right font-medium text-slate-500">
                              Total
                            </td>
                            <td className="pt-3 text-right font-bold text-emerald-700">
                              +{totalUnits} units
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
