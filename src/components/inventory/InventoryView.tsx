'use client';

import { useState } from 'react';
import { Package, AlertTriangle, MapPin, Search, Layers } from 'lucide-react';
import { InventoryDisplay, ClientDisplay } from '@/types';
import { adjustInventoryQuantity } from '@/lib/supabase/queries';
import ProductImage from '@/components/ui/ProductImage';
import Pagination, { usePagination } from '@/components/ui/Pagination';
import { useLowStock } from '@/lib/LowStockContext';

interface InventoryViewProps {
  inventory: InventoryDisplay[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryDisplay[]>>;
  clients: ClientDisplay[];
  onNavigate: (view: string) => void;
  canAdjust?: boolean;
}

export default function InventoryView({ inventory, setInventory, clients, onNavigate, canAdjust = true }: InventoryViewProps) {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const { refreshLowStock } = useLowStock();
  const [groupBySize, setGroupBySize] = useState(false);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = search === '' ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.product_name.toLowerCase().includes(search.toLowerCase());
    const matchesClient = clientFilter === 'all' || item.client_id === clientFilter;
    const matchesLowStock = !showLowStock || item.quantity <= (item.threshold ?? 0);
    return matchesSearch && matchesClient && matchesLowStock;
  });

  const { paginatedItems: paginatedInventory, currentPage, totalPages, totalItems, pageSize, setCurrentPage } = usePagination(filteredInventory, 10);

  const lowStockCount = inventory.filter(i => i.quantity <= (i.threshold ?? 0)).length;

  const handleAdjustQuantity = async (itemId: string, delta: number) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    // Optimistic update
    setInventory(prev => prev.map(i =>
      i.id === itemId
        ? { ...i, quantity: Math.max(0, i.quantity + delta), last_updated: new Date().toISOString() }
        : i
    ));

    try {
      await adjustInventoryQuantity(itemId, delta, item.quantity);
      refreshLowStock();
    } catch {
      // Revert on error
      setInventory(prev => prev.map(i =>
        i.id === itemId ? { ...i, quantity: item.quantity } : i
      ));
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Inventory Tracker</h2>
        {canAdjust && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('receiving')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <Package className="w-4 h-4" />
              Receive Inventory
            </button>
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-amber-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800">Low Stock Alert</h3>
            <p className="text-sm text-amber-700">{lowStockCount} items are at or below reorder threshold</p>
          </div>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              showLowStock ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            {showLowStock ? 'Show All' : 'Show Low Stock'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU or product name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <button
            onClick={() => setGroupBySize(!groupBySize)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              groupBySize ? 'bg-blue-500 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Group by Size</span>
            <span className="sm:hidden">Group</span>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filteredInventory.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No inventory items found</p>
          <p className="text-sm mt-1">Add items via the Receiving module</p>
        </div>
      )}

      {/* Inventory Grid */}
      {groupBySize ? (
        (() => {
          const groups: Record<string, InventoryDisplay[]> = {};
          paginatedInventory.forEach(item => {
            const baseName = item.product_name;
            if (!groups[baseName]) groups[baseName] = [];
            groups[baseName].push(item);
          });
          return (
            <div className="space-y-6">
              {Object.entries(groups).map(([name, items]) => (
                <div key={name} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <ProductImage sku={items[0].sku} name={items[0].product_name} size="lg" />
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{name}</h3>
                      <p className="text-sm text-slate-500">{items.length} variant{items.length > 1 ? 's' : ''} &bull; {items.reduce((s, i) => s + i.quantity, 0)} total units</p>
                    </div>
                    <div className="ml-auto">
                      {items[0].client_name && (
                        <div
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: (items[0].client_color || '#999') + '20', color: items[0].client_color || '#999' }}
                        >
                          {items[0].client_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-3 ${
                          item.quantity <= (item.threshold ?? 0) ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-slate-700">{item.variant || 'Default'}</span>
                          <span className="text-xs text-slate-400 font-mono">{item.sku}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded text-xs">
                            <MapPin className="w-2.5 h-2.5 text-slate-400" />
                            <span className="font-mono text-slate-600">{item.location_code || '—'}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`text-2xl font-bold ${item.quantity <= (item.threshold ?? 0) ? 'text-amber-600' : 'text-slate-800'}`}>
                            {item.quantity}
                            <span className="text-xs font-normal text-slate-400 ml-1">/ {item.threshold ?? 0}</span>
                          </div>
                          {canAdjust && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleAdjustQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-200 rounded text-slate-600 font-bold text-sm transition-colors">-</button>
                            <button onClick={() => handleAdjustQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white hover:bg-slate-200 rounded text-slate-600 font-bold text-sm transition-colors">+</button>
                          </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedInventory.map(item => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-4 ${
                item.quantity <= (item.threshold ?? 0) ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <ProductImage sku={item.sku} name={item.product_name} size="lg" />
                  <div>
                    <div className="font-semibold text-slate-800">{item.product_name}</div>
                    <div className="text-sm text-slate-500">{item.variant || 'Default'}</div>
                  </div>
                </div>
                {item.client_name && (
                  <div
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ backgroundColor: (item.client_color || '#999') + '20', color: item.client_color || '#999' }}
                  >
                    {item.client_name}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 rounded text-sm">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span className="font-mono text-slate-700">{item.location_code || '—'}</span>
                </div>
                <div className="text-xs text-slate-400">SKU: {item.sku}</div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-3xl font-bold ${item.quantity <= (item.threshold ?? 0) ? 'text-amber-600' : 'text-slate-800'}`}>
                    {item.quantity}
                  </div>
                  <div className="text-xs text-slate-500">
                    Threshold: {item.threshold ?? 0}
                  </div>
                </div>
                {canAdjust && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleAdjustQuantity(item.id, -1)}
                    className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold transition-colors"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleAdjustQuantity(item.id, 1)}
                    className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
                )}
              </div>
            </div>
          ))}
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
  );
}
