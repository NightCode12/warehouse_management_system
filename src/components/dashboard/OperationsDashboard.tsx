'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Truck, AlertTriangle, Clock, Box, ChevronRight } from 'lucide-react';
import { PickableOrder } from '@/types';

interface StoreInfo {
  id: string;
  name: string;
  color: string;
}

interface OperationsDashboardProps {
  orders: PickableOrder[];
  stores: StoreInfo[];
}

export default function OperationsDashboard({ orders, stores }: OperationsDashboardProps) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    picking: orders.filter(o => o.status === 'picking').length,
    packed: orders.filter(o => o.status === 'packed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    rush: orders.filter(o => o.priority === 'rush' || o.priority === 'same-day').length,
    carryover: orders.filter(o => o.is_carryover).length,
  };

  const storeStats = stores.map(store => ({
    ...store,
    count: orders.filter(o => o.store_id === store.id && o.status !== 'shipped').length
  }));

  return (
    <div className="h-screen overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex flex-col">
      <style>{`
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          50% { box-shadow: 0 0 20px 8px rgba(239, 68, 68, 0.4); }
        }
        .pulse-red-glow { animation: pulse-red 2s ease-in-out infinite; }
      `}</style>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-1">A-BEST SWAG</h1>
          <p className="text-slate-400 text-lg">Warehouse Operations Center</p>
        </div>
        <div className="flex items-start gap-6">
          <div className="text-right">
            <div className="text-5xl font-mono font-bold text-emerald-400">
              {time?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) ?? '--:--'}
            </div>
            <div className="text-slate-400">
              {time?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) ?? '\u00A0'}
            </div>
          </div>
          <Link
            href="/orders"
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all font-medium text-sm"
          >
            Exit TV Mode
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-slate-400 font-medium text-sm">PENDING</span>
          </div>
          <div className="text-4xl font-black text-amber-400">{stats.pending}</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400 font-medium text-sm">PICKING</span>
          </div>
          <div className="text-4xl font-black text-blue-400">{stats.picking}</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Box className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-slate-400 font-medium text-sm">PACKED</span>
          </div>
          <div className="text-4xl font-black text-purple-400">{stats.packed}</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <Truck className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-slate-400 font-medium text-sm">SHIPPED</span>
          </div>
          <div className="text-4xl font-black text-emerald-400">{stats.shipped}</div>
        </div>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {stats.rush > 0 && (
          <div className="bg-red-500/20 backdrop-blur rounded-2xl p-4 border border-red-500/30 flex items-center gap-4 pulse-red-glow">
            <div className="p-3 bg-red-500 rounded-xl animate-pulse">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-red-400 font-bold animate-pulse">PRIORITY ORDERS</div>
              <div className="text-3xl font-black text-white">{stats.rush} Rush/Same-Day</div>
            </div>
          </div>
        )}

        {stats.carryover > 0 && (
          <div className="bg-orange-500/20 backdrop-blur rounded-2xl p-4 border border-orange-500/30 flex items-center gap-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-orange-400 font-bold">CARRYOVER</div>
              <div className="text-3xl font-black text-white">{stats.carryover} From Yesterday</div>
            </div>
          </div>
        )}
      </div>

      {/* Store Breakdown + Progress — fill remaining space */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-4 border border-slate-700 flex-1 flex flex-col">
          <h2 className="text-lg font-bold text-slate-300 mb-4">Orders by Store</h2>
          <div className={`grid gap-3 flex-1`} style={{ gridTemplateColumns: `repeat(${Math.min(storeStats.length, 7)}, minmax(0, 1fr))` }}>
            {storeStats.map(store => (
              <div key={store.id} className="text-center flex flex-col items-center">
                <div
                  className="w-full aspect-square rounded-2xl flex items-center justify-center text-3xl font-black"
                  style={{ backgroundColor: store.color + '30', color: store.color }}
                >
                  {store.count}
                </div>
                <div className="text-sm text-slate-400 font-medium truncate mt-2">{store.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Daily Progress</span>
            <span>{stats.shipped} of {stats.total} orders completed ({stats.total > 0 ? Math.round(stats.shipped / stats.total * 100) : 0}%)</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${stats.total > 0 ? (stats.shipped / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
