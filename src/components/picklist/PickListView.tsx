'use client';

import { useState, useEffect } from 'react';
import { Printer, MapPin, CheckCircle, ClipboardCheck, ScanLine } from 'lucide-react';
import { PickableOrder, OrderPriority } from '@/types';
import { markItemPicked, updateOrderStatus, deductInventoryForPick, getInventoryStockBySku } from '@/lib/supabase/queries';
import ProductImage from '@/components/ui/ProductImage';
import PickModal from './PickModal';
import ScannerMode from './ScannerMode';
import { usePickCount } from '@/lib/PickCountContext';
import { useLowStock } from '@/lib/LowStockContext';

interface PickListViewProps {
  orders: PickableOrder[];
  readOnly?: boolean;
}

interface PickItem {
  sku: string;
  name: string;
  variant: string;
  location: string;
  quantity: number;
  picked: boolean;
  orderNumber: string;
  orderId: string;
  customer: string;
  priority: OrderPriority;
}

export default function PickListView({ orders, readOnly = false }: PickListViewProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [activePickOrder, setActivePickOrder] = useState<PickableOrder | null>(null);
  const [scannerOrder, setScannerOrder] = useState<PickableOrder | null>(null);
  const [pickedOrderIds, setPickedOrderIds] = useState<Set<string>>(new Set());
  const [stockMap, setStockMap] = useState<Record<string, { quantity: number; threshold: number }>>({});
  const { markPicked } = usePickCount();
  const { refreshLowStock } = useLowStock();

  const pickableOrders = orders.filter(o => o.status === 'picking' && !pickedOrderIds.has(o.id));

  // Fetch stock levels for all SKUs in pickable orders
  useEffect(() => {
    const skus = [...new Set(pickableOrders.flatMap(o => o.items.map(i => i.sku)))];
    if (skus.length > 0) {
      getInventoryStockBySku(skus).then(setStockMap);
    }
  }, [orders]);

  const generatePickList = () => {
    const unpickedOrders = pickableOrders.filter(o => !pickedOrderIds.has(o.id));
    const ordersToProcess = selectedOrders.length > 0
      ? unpickedOrders.filter(o => selectedOrders.includes(o.id))
      : unpickedOrders;

    const itemsByLocation: Record<string, PickItem[]> = {};
    ordersToProcess.forEach(order => {
      order.items.forEach(item => {
        const key = item.location_code || 'UNASSIGNED';
        if (!itemsByLocation[key]) {
          itemsByLocation[key] = [];
        }
        itemsByLocation[key].push({
          sku: item.sku,
          name: item.product_name,
          variant: item.variant || '',
          location: item.location_code || 'UNASSIGNED',
          quantity: item.quantity,
          picked: item.is_picked || false,
          orderNumber: order.order_number,
          orderId: order.id,
          customer: order.customer_name,
          priority: order.priority,
        });
      });
    });

    return Object.entries(itemsByLocation)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([location, items]) => ({ location, items }));
  };

  const pickList = generatePickList();

  const toggleOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handlePickSubmit = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      for (const item of order.items) {
        await markItemPicked(item.id, item.quantity);
        await deductInventoryForPick(item.sku, item.quantity);
      }
      await updateOrderStatus(orderId, 'picked');
      setPickedOrderIds(prev => new Set(prev).add(orderId));
      markPicked(orderId);
      setActivePickOrder(null);
      refreshLowStock();

      // Refresh stock levels
      const allSkus = [...new Set(pickableOrders.flatMap(o => o.items.map(i => i.sku)))];
      if (allSkus.length > 0) getInventoryStockBySku(allSkus).then(setStockMap);
    } catch (err: any) {
      console.error('Failed to write pick status:', err);
      alert(`Failed to submit pick: ${err?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Pick List Generator</h2>
        {!readOnly && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const win = window.open('', '_blank');
                if (!win) return;
                win.document.write(`<!DOCTYPE html><html><head><title>Pick List</title><style>
                  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;margin:20px;color:#1e293b}
                  h1{font-size:18px;margin-bottom:4px}
                  .meta{color:#64748b;font-size:12px;margin-bottom:16px}
                  .loc{background:#f1f5f9;padding:6px 12px;border-radius:6px;font-weight:700;font-family:monospace;font-size:14px;margin-bottom:8px}
                  .row{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}
                  .name{font-weight:600}
                  .detail{color:#64748b;font-size:11px}
                  .qty{font-weight:800;font-size:18px}
                  .cb{width:14px;height:14px;border:2px solid #cbd5e1;border-radius:3px;margin-right:8px;display:inline-block}
                  .p{background:#f97316;color:#fff;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;margin-left:4px}
                  .sd{background:#ef4444}
                  .g{margin-bottom:16px;page-break-inside:avoid}
                  @media print{body{margin:10px}}
                </style></head><body><h1>Pick List</h1>`);
                win.document.write(`<div class="meta">${pickList.reduce((s, l) => s + l.items.length, 0)} items across ${pickList.length} locations &bull; ${new Date().toLocaleString()}</div>`);
                pickList.forEach(({ location, items }) => {
                  win.document.write(`<div class="g"><div class="loc">${location} (${items.length} items)</div>`);
                  items.forEach(item => {
                    const pt = item.priority === 'same-day' ? '<span class="p sd">SAME DAY</span>' : item.priority === 'rush' ? '<span class="p">RUSH</span>' : '';
                    win.document.write(`<div class="row"><div><span class="cb"></span><span class="name">${item.name}</span>${pt}<div class="detail">${item.variant} &bull; ${item.sku} &bull; For: ${item.orderNumber} (${item.customer})</div></div><div class="qty">&times;${item.quantity}</div></div>`);
                  });
                  win.document.write('</div>');
                });
                win.document.write('</body></html>');
                win.document.close();
                win.print();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print Pick List
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Order Selection */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-800 mb-4">Select Orders</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pickableOrders.map(order => {
                const isPicked = pickedOrderIds.has(order.id);
                return (
                  <div
                    key={order.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isPicked
                        ? 'bg-emerald-50 border border-emerald-200'
                        : selectedOrders.includes(order.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    {!readOnly && (
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrder(order.id)}
                        className="w-4 h-4 text-blue-500 rounded shrink-0"
                      />
                    )}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => !readOnly && setActivePickOrder(order)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-800">{order.order_number}</span>
                        {order.priority !== 'normal' && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            order.priority === 'same-day' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                          }`}>
                            {order.priority === 'same-day' ? 'SD' : 'R'}
                          </span>
                        )}
                        {isPicked && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">
                            <CheckCircle className="w-3 h-3" />
                            Picked
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{order.customer_name} &bull; {order.items.length} items</div>
                    </div>
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => setScannerOrder(order)}
                          className={`shrink-0 p-2 rounded-lg transition-colors ${
                            isPicked
                              ? 'text-emerald-500 hover:bg-emerald-100'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title="Scan mode"
                        >
                          <ScanLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActivePickOrder(order)}
                          className={`shrink-0 p-2 rounded-lg transition-colors ${
                            isPicked
                              ? 'text-emerald-500 hover:bg-emerald-100'
                              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={isPicked ? 'View pick' : 'Manual pick'}
                        >
                          <ClipboardCheck className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {selectedOrders.length === 0
                    ? `Showing all ${pickableOrders.length} pickable orders`
                    : `${selectedOrders.length} orders selected`
                  }
                </p>
                {pickedOrderIds.size > 0 && (
                  <p className="text-xs font-medium text-emerald-600">
                    {pickedOrderIds.size} picked
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Generated Pick List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4">
              <h3 className="font-bold text-lg">Optimized Pick List</h3>
              <p className="text-slate-300 text-sm">
                {pickList.reduce((sum, loc) => sum + loc.items.length, 0)} items across {pickList.length} locations
              </p>
            </div>
            <div className="divide-y divide-slate-200 max-h-125 overflow-y-auto">
              {pickList.map(({ location, items }) => (
                <div key={location} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                      <MapPin className="w-4 h-4 text-slate-600" />
                      <span className="font-mono font-bold text-slate-800">{location}</span>
                    </div>
                    <span className="text-sm text-slate-500">{items.length} items</span>
                  </div>
                  <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between py-2 rounded-lg px-2 -mx-2 transition-colors ${
                          readOnly ? '' : 'cursor-pointer hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          if (readOnly) return;
                          const order = pickableOrders.find(o => o.id === item.orderId);
                          if (order) setActivePickOrder(order);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <ProductImage sku={item.sku} name={item.name} size="md" editable={false} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{item.name}</span>
                              {item.priority !== 'normal' && (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                  item.priority === 'same-day' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                                }`}>
                                  {item.priority === 'same-day' ? 'SAME DAY' : 'RUSH'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">{item.variant} &bull; {item.sku}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400">For: {item.orderNumber} ({item.customer})</span>
                              {(() => {
                                const stock = stockMap[item.sku];
                                if (!stock) return null;
                                const isOutOfStock = stock.quantity <= 0;
                                const isInsufficient = stock.quantity > 0 && stock.quantity < item.quantity;
                                const isLowStock = stock.quantity > 0 && stock.quantity <= stock.threshold;
                                if (isOutOfStock) {
                                  return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700">Out of Stock</span>;
                                }
                                if (isInsufficient) {
                                  return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700">Insufficient Stock ({stock.quantity} available)</span>;
                                }
                                if (isLowStock) {
                                  return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700">Low Stock ({stock.quantity})</span>;
                                }
                                return <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-700">In Stock ({stock.quantity})</span>;
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-slate-800">&times;{item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pick Modal */}
      {!readOnly && activePickOrder && (
        <PickModal
          order={activePickOrder}
          onClose={() => setActivePickOrder(null)}
          onSubmit={handlePickSubmit}
        />
      )}

      {/* Scanner Mode Modal */}
      {!readOnly && scannerOrder && (
        <ScannerMode
          order={scannerOrder}
          onClose={() => setScannerOrder(null)}
          onComplete={async (orderId) => {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;
            try {
              for (const item of order.items) {
                await markItemPicked(item.id, item.quantity);
                await deductInventoryForPick(item.sku, item.quantity);
              }
              await updateOrderStatus(orderId, 'picked');
              setPickedOrderIds(prev => new Set(prev).add(orderId));
              markPicked(orderId);
              setScannerOrder(null);
            } catch (err: any) {
              console.error('Failed to write pick status:', err);
              alert(`Failed to submit pick: ${err?.message || 'Unknown error'}`);
            }
          }}
        />
      )}
    </div>
  );
}
