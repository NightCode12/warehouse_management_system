'use client';

import { useState } from 'react';
import { X, CheckCircle, MapPin, ArrowLeft, Package } from 'lucide-react';
import { MockOrder } from '@/types';
import ProductImage from '@/components/ui/ProductImage';

interface PickModalProps {
  order: MockOrder;
  onClose: () => void;
  onSubmit: (orderId: number) => void;
}

export default function PickModal({ order, onClose, onSubmit }: PickModalProps) {
  const [pickedItems, setPickedItems] = useState<Record<number, boolean>>({});
  const [phase, setPhase] = useState<'picking' | 'review'>('picking');

  const totalItems = order.items.length;
  const pickedCount = Object.values(pickedItems).filter(Boolean).length;
  const allPicked = pickedCount === totalItems;
  const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const toggleItem = (index: number) => {
    setPickedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSubmit = () => {
    onSubmit(order.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                {phase === 'review' && (
                  <button
                    onClick={() => setPhase('picking')}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h3 className="font-bold text-lg">
                  {phase === 'picking' ? 'Pick Order' : 'Review Pick'} — {order.orderNumber}
                </h3>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-slate-300 text-sm">{order.customer}</span>
                <div
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: order.store.color + '40', color: '#fff' }}
                >
                  {order.store.name}
                </div>
                {order.priority !== 'normal' && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    order.priority === 'same-day' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {order.priority === 'same-day' ? 'SAME DAY' : 'RUSH'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {phase === 'picking' ? (
          <>
            {/* Progress Bar */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">
                  {pickedCount} of {totalItems} items picked
                </span>
                <span className="text-slate-500">{totalUnits} total units</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                  style={{ width: `${totalItems > 0 ? (pickedCount / totalItems) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Item Checklist */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {order.items.map((item, index) => {
                const isPicked = pickedItems[index] || false;
                return (
                  <div
                    key={index}
                    onClick={() => toggleItem(index)}
                    className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors ${
                      isPicked ? 'bg-emerald-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isPicked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                    }`}>
                      {isPicked && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>

                    {/* Product Image */}
                    <ProductImage sku={item.sku} name={item.name} size="md" editable={false} />

                    {/* Item Details */}
                    <div className={`flex-1 ${isPicked ? 'opacity-60' : ''}`}>
                      <div className={`font-medium text-slate-800 ${isPicked ? 'line-through' : ''}`}>
                        {item.name}
                      </div>
                      <div className="text-sm text-slate-500">{item.variant} &bull; {item.sku}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                          <MapPin className="w-3 h-3" />
                          <span className="font-mono font-medium">{item.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className={`text-2xl font-bold ${isPicked ? 'text-emerald-600' : 'text-slate-800'}`}>
                      &times;{item.quantity}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setPhase('review')}
                disabled={!allPicked}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Review Pick
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Review Summary */}
            <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-emerald-800">All items picked</div>
                  <div className="text-sm text-emerald-600">{totalItems} items &bull; {totalUnits} total units</div>
                </div>
              </div>
            </div>

            {/* Review List */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <ProductImage sku={item.sku} name={item.name} size="sm" editable={false} />
                          <div>
                            <div className="font-medium text-slate-800 text-sm">{item.name}</div>
                            <div className="text-xs text-slate-500">{item.variant}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-slate-600">{item.sku}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-slate-600">{item.location}</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-sm font-bold text-slate-800">{item.quantity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
              <button
                onClick={() => setPhase('picking')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Checklist
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Submit Pick
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
