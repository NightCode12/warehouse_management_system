'use client';

import { useState, useCallback } from 'react';
import { ClipboardList, Clock, ChevronDown, ChevronRight, Package, MapPin, Calendar } from 'lucide-react';
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
import Pagination, { usePagination } from '@/components/ui/Pagination';

interface ReceivingViewProps {
  inventory: InventoryDisplay[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryDisplay[]>>;
  clients: ClientDisplay[];
  setClients: React.Dispatch<React.SetStateAction<ClientDisplay[]>>;
  completedReceipts: ReceivingReceiptDisplay[];
  setCompletedReceipts: React.Dispatch<React.SetStateAction<ReceivingReceiptDisplay[]>>;
  canManageClients?: boolean;
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
  setClients,
  completedReceipts,
  setCompletedReceipts,
  canManageClients = true,
}: ReceivingViewProps) {
  const [activeReceipt, setActiveReceipt] = useState<ReceivingReceiptDisplay | null>(null);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

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

  const getDateRange = (): { from: Date | null; to: Date | null } => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (dateFilter) {
      case 'today':
        return { from: startOfDay, to: null };
      case 'week': {
        const d = new Date(startOfDay);
        d.setDate(d.getDate() - 7);
        return { from: d, to: null };
      }
      case 'month': {
        const d = new Date(startOfDay);
        d.setMonth(d.getMonth() - 1);
        return { from: d, to: null };
      }
      case 'year': {
        const d = new Date(startOfDay);
        d.setFullYear(d.getFullYear() - 1);
        return { from: d, to: null };
      }
      case 'custom': {
        const from = customFrom ? new Date(customFrom + 'T00:00:00') : null;
        const to = customTo ? new Date(customTo + 'T23:59:59') : null;
        return { from, to };
      }
      default:
        return { from: null, to: null };
    }
  };

  const filteredReceipts = completedReceipts.filter((receipt) => {
    if (dateFilter === 'all') return true;
    const { from, to } = getDateRange();
    const receiptDate = receipt.completed_at ? new Date(receipt.completed_at) : null;
    if (!receiptDate) return false;
    if (from && receiptDate < from) return false;
    if (to && receiptDate > to) return false;
    return true;
  });

  const {
    paginatedItems: paginatedReceipts,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
  } = usePagination(filteredReceipts, 10);

  // Find active client display for ItemEntryForm
  const activeClient = clients.find(c => c.id === activeClientId);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Receive Inventory</h2>
        {activeReceipt && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-emerald-700">
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
        <ClientSelector
          clients={clients}
          onSelectClient={startSession}
          onClientAdded={(client) => setClients(prev => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)))}
          onClientDeleted={(id) => setClients(prev => prev.filter(c => c.id !== id))}
          canManageClients={canManageClients}
        />
      ) : activeClient ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-1">
            <ItemEntryForm
              inventory={inventory}
              client={activeClient}
              onAddItem={handleAddItem}
            />
          </div>
          <div className="lg:col-span-2">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-700">
              <Clock className="w-5 h-5 text-slate-400" />
              Completed Receipts
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <span className="text-sm text-slate-400">{filteredReceipts.length} receipts</span>
            </div>
          </div>

          {dateFilter === 'custom' && (
            <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
              <label className="text-sm text-slate-600">From:</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <label className="text-sm text-slate-600">To:</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {(customFrom || customTo) && (
                <button
                  onClick={() => { setCustomFrom(''); setCustomTo(''); }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {filteredReceipts.length === 0 ? (
            <div className="text-center text-slate-400 py-8 bg-white rounded-xl border border-slate-200">
              No receipts found for the selected period.
            </div>
          ) : (
          <div className="space-y-3">
            {paginatedReceipts.map(receipt => {
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
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="flex items-center gap-2 min-w-0">
                        <ClipboardList className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                        <span className="font-mono text-xs sm:text-sm font-medium text-slate-700 truncate">
                          {receipt.reference_number}
                        </span>
                      </div>
                      {receipt.client_name && (
                        <div
                          className="px-2 py-0.5 rounded text-xs font-medium shrink-0"
                          style={{
                            backgroundColor: (receipt.client_color || '#999') + '20',
                            color: receipt.client_color || '#999',
                          }}
                        >
                          {receipt.client_name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-500 pl-6 sm:pl-0">
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
                    <div className="border-t border-slate-100 px-3 sm:px-5 pb-4 overflow-x-auto">
                      <table className="w-full text-sm mt-3 min-w-125">
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
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            pageSize={pageSize}
          />
        </div>
      )}
    </div>
  );
}
