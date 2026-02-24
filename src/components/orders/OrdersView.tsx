'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { MockOrder, OrderStatus } from '@/types';
import { STORES } from '@/lib/constants';
import StatusBadge from './StatusBadge';
import ProductImage from '@/components/ui/ProductImage';

interface OrdersViewProps {
  orders: MockOrder[];
  setOrders: React.Dispatch<React.SetStateAction<MockOrder[]>>;
}

export default function OrdersView({ orders, setOrders }: OrdersViewProps) {
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesStore = selectedStore === 'all' || order.store.id === parseInt(selectedStore);
    const matchesSearch = search === '' ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesStore && matchesSearch;
  });

  const updateStatus = (orderId: number, newStatus: OrderStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Order Queue</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedStore}
            onChange={e => setSelectedStore(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Stores</option>
            {STORES.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'picking', 'picked', 'packed', 'shipped'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {status === 'all' ? orders.length : orders.filter(o => o.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Store</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map(order => (
              <tr key={order.id} className={`hover:bg-slate-50 transition-colors ${order.isCarryover ? 'bg-orange-50' : ''}`}>
                <td className="px-4 py-4">
                  <div className="font-semibold text-slate-800">{order.orderNumber}</div>
                  <div className="text-xs text-slate-500">
                    {order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {order.isCarryover && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                      Carryover
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: order.store.color }}
                    />
                    <span className="text-sm font-medium text-slate-700">{order.store.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{order.customer}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="ring-2 ring-white rounded-lg">
                          <ProductImage sku={item.sku} name={item.name} size="sm" editable={false} />
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-slate-600">{order.items.reduce((sum, i) => sum + i.quantity, 0)} items</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={order.status} priority={order.priority} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(order.id, 'picking')}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Start Pick
                      </button>
                    )}
                    {order.status === 'picking' && (
                      <button
                        onClick={() => updateStatus(order.id, 'picked')}
                        className="px-3 py-1.5 bg-teal-500 text-white text-xs font-medium rounded-lg hover:bg-teal-600 transition-colors"
                      >
                        Mark Picked
                      </button>
                    )}
                    {order.status === 'picked' && (
                      <button
                        onClick={() => updateStatus(order.id, 'packed')}
                        className="px-3 py-1.5 bg-purple-500 text-white text-xs font-medium rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Mark Packed
                      </button>
                    )}
                    {order.status === 'packed' && (
                      <button
                        onClick={() => updateStatus(order.id, 'shipped')}
                        className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        Ship
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}