'use client'

import { useEffect, useState } from 'react'
import { Package, MapPin, CheckCircle2, Circle, Truck } from 'lucide-react'
import { OrderDisplay, OrderItemDisplay } from '@/types'
import { getOrderItemsByOrderId } from '@/lib/supabase/queries'

interface OrderItemsModalProps {
  order: OrderDisplay
  onClose: () => void
}

export default function OrderItemsModal({ order, onClose }: OrderItemsModalProps) {
  const [items, setItems] = useState<OrderItemDisplay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchItems() {
      setLoading(true)
      const data = await getOrderItemsByOrderId(order.id)
      setItems(data)
      setLoading(false)
    }
    fetchItems()
  }, [order.id])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const pickedCount = items.filter((item) => item.is_picked).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-800">
                Order {order.order_number}
              </h2>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: order.store_color }}
                />
                <span className="text-sm text-slate-500">{order.store_name}</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {order.customer_name}
              {order.customer_email && (
                <span className="ml-2 text-slate-400">{order.customer_email}</span>
              )}
            </p>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm">
          <span className="text-slate-500">
            <span className="font-semibold text-slate-700">{items.length}</span> line items
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">
            <span className="font-semibold text-slate-700">{totalQuantity}</span> total units
          </span>
          {pickedCount > 0 && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                <span className="font-semibold text-emerald-600">{pickedCount}</span>/{items.length} picked
              </span>
            </>
          )}
        </div>

        {/* Tracking info banner */}
        {order.status === 'shipped' && (order.tracking_number || order.tracking_company) && (
          <div className="mx-6 mt-4 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {order.tracking_company && (
                  <span className="text-sm font-bold text-emerald-800">{order.tracking_company}</span>
                )}
                {!order.tracking_company && (
                  <span className="text-sm font-semibold text-emerald-700">Shipped</span>
                )}
              </div>
              {order.tracking_number && (
                <p className="text-sm text-emerald-700 font-mono mt-0.5 truncate">{order.tracking_number}</p>
              )}
            </div>
          </div>
        )}

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">Loading items...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Package className="w-10 h-10 mb-2" />
              <p>No items found for this order.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    item.is_picked
                      ? 'border-emerald-200 bg-emerald-50/50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Image or placeholder */}
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-400" />
                    </div>
                  )}

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item.product_name}
                      </p>
                      {item.is_picked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500 font-mono">{item.sku}</span>
                      {item.variant && (
                        <span className="text-xs text-slate-400">{item.variant}</span>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {item.location_code && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="font-mono">{item.location_code}</span>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-700">
                      x{item.quantity}
                    </div>
                    {item.is_picked && item.picked_quantity !== null && (
                      <div className="text-xs text-emerald-600">
                        {item.picked_quantity} picked
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
