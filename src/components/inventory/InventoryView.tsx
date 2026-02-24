'use client';

import { useState } from 'react';
import { Package, AlertTriangle, MapPin, Search } from 'lucide-react';
import { MockInventoryItem } from '@/types';
import { STORAGE_CLIENTS } from '@/lib/constants';
import ProductImage from '@/components/ui/ProductImage';

interface InventoryViewProps {
  inventory: MockInventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<MockInventoryItem[]>>;
  onNavigate: (view: string) => void;
}

export default function InventoryView({ inventory, setInventory, onNavigate }: InventoryViewProps) {
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = search === '' ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());
    const matchesClient = clientFilter === 'all' || item.client.id === parseInt(clientFilter);
    const matchesLowStock = !showLowStock || item.quantity <= item.threshold;
    return matchesSearch && matchesClient && matchesLowStock;
  });

  const lowStockCount = inventory.filter(i => i.quantity <= i.threshold).length;

  const adjustQuantity = (itemId: number, delta: number) => {
    setInventory(inventory.map(item =>
      item.id === itemId
        ? { ...item, quantity: Math.max(0, item.quantity + delta), lastUpdated: new Date() }
        : item
    ));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Inventory Tracker</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('receiving')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Package className="w-4 h-4" />
            Receive Inventory
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800">Low Stock Alert</h3>
            <p className="text-sm text-amber-700">{lowStockCount} items are at or below reorder threshold</p>
          </div>
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showLowStock ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            {showLowStock ? 'Show All' : 'Show Low Stock'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU or product name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Clients</option>
          {STORAGE_CLIENTS.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInventory.map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border p-4 ${
              item.quantity <= item.threshold ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <ProductImage sku={item.sku} name={item.name} size="lg" />
                <div>
                  <div className="font-semibold text-slate-800">{item.name}</div>
                  <div className="text-sm text-slate-500">{item.variant}</div>
                </div>
              </div>
              <div
                className="px-2 py-1 rounded text-xs font-medium"
                style={{ backgroundColor: item.client.color + '20', color: item.client.color }}
              >
                {item.client.name}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 rounded text-sm">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span className="font-mono text-slate-700">{item.location}</span>
              </div>
              <div className="text-xs text-slate-400">SKU: {item.sku}</div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className={`text-3xl font-bold ${item.quantity <= item.threshold ? 'text-amber-600' : 'text-slate-800'}`}>
                  {item.quantity}
                </div>
                <div className="text-xs text-slate-500">
                  Threshold: {item.threshold}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => adjustQuantity(item.id, -1)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold transition-colors"
                >
                  -
                </button>
                <button
                  onClick={() => adjustQuantity(item.id, 1)}
                  className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}