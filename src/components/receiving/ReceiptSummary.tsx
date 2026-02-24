'use client';

import { useState } from 'react';
import { Trash2, CheckCircle, X, Package } from 'lucide-react';
import { ReceivingReceipt } from '@/types';

interface ReceiptSummaryProps {
  receipt: ReceivingReceipt;
  onRemoveItem: (itemId: number) => void;
  onComplete: () => void;
  onCancel: () => void;
}

export default function ReceiptSummary({ receipt, onRemoveItem, onComplete, onCancel }: ReceiptSummaryProps) {
  const [confirming, setConfirming] = useState(false);

  const totalUnits = receipt.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Receipt Summary</h3>
            <p className="text-slate-300 text-sm">
              {receipt.receiptNumber} &bull; {receipt.items.length} line items &bull; {totalUnits} units
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: receipt.client.color + '40', color: '#fff' }}
            >
              {receipt.client.name}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      {receipt.items.length === 0 ? (
        <div className="p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No items scanned yet</p>
          <p className="text-slate-400 text-sm mt-1">Scan a barcode or enter a SKU to add items</p>
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipt.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-400">{index + 1}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-slate-600">{item.sku}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-800">{item.name}</div>
                    {item.variant && (
                      <div className="text-xs text-slate-500">{item.variant}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-slate-800">{item.quantity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-slate-600">{item.location}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400">
                      {item.receivedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Actions */}
      {receipt.items.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{receipt.items.length}</span> line items &bull;{' '}
              <span className="font-semibold text-slate-700">{totalUnits}</span> total units
            </div>
            <div className="flex items-center gap-3">
              {!confirming ? (
                <>
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm text-slate-500 hover:text-red-600 transition-colors"
                  >
                    Cancel Session
                  </button>
                  <button
                    onClick={() => setConfirming(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Complete Receipt
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-slate-600 font-medium">Confirm completion?</span>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    No, go back
                  </button>
                  <button
                    onClick={() => {
                      setConfirming(false);
                      onComplete();
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Yes, Complete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
