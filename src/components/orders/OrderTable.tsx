'use client'

import { CalendarDays } from 'lucide-react'
import { OrderDisplay, OrderStatus } from '@/types'

interface OrderTableProps {
  orders: OrderDisplay[]
  onStatusChange?: (orderId: string, newStatus: string) => void
  onViewItems: (order: OrderDisplay) => void
}

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  picking: 'bg-blue-100 text-blue-800',
  picked: 'bg-teal-100 text-teal-800',
  packed: 'bg-purple-100 text-purple-800',
  shipped: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

const priorityStyles: Record<string, string> = {
  'same-day': 'bg-red-500 text-white',
  rush: 'bg-orange-500 text-white',
  normal: '',
}

const sourceStyles: Record<string, { label: string; color: string }> = {
  facilis: { label: 'Facilis', color: 'bg-indigo-100 text-indigo-700' },
  shopify: { label: 'Shopify', color: 'bg-green-100 text-green-700' },
  inksoft: { label: 'Inksoft', color: 'bg-pink-100 text-pink-700' },
  manual: { label: 'Manual', color: 'bg-slate-100 text-slate-600' },
}

const nextStatus: Partial<Record<OrderStatus, { label: string; status: OrderStatus; color: string }>> = {
  picked: { label: 'Mark Packed', status: 'packed', color: 'bg-purple-500 hover:bg-purple-600' },
  packed: { label: 'Ship', status: 'shipped', color: 'bg-emerald-500 hover:bg-emerald-600' },
}

function formatInHandsDate(dateStr: string | null): { text: string; urgent: boolean } | null {
  if (!dateStr) return null
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const text = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return { text, urgent: diffDays <= 2 }
}

export default function OrderTable({ orders, onStatusChange, onViewItems }: OrderTableProps) {
  if (orders.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
      <table className="w-full min-w-175">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Store</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">In-Hands</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
            {onStatusChange && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => {
            const action = nextStatus[order.status]
            const createdAt = order.created_at ? new Date(order.created_at) : null
            const inHands = formatInHandsDate(order.in_hands_date)
            const src = order.source ? sourceStyles[order.source] : null

            return (
              <tr
                key={order.id}
                className={`hover:bg-slate-50 transition-colors ${order.is_carryover ? 'bg-orange-50' : ''}`}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{order.order_number}</span>
                    {src && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${src.color}`}>
                        {src.label}
                      </span>
                    )}
                  </div>
                  {createdAt && (
                    <div className="text-xs text-slate-500">
                      {createdAt.toLocaleDateString()}{' '}
                      {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  {order.is_carryover && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                      Carryover
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: order.store_color }}
                    />
                    <span className="text-sm font-medium text-slate-700">{order.store_name}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">{order.customer_name}</td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => onViewItems(order)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                  >
                    {order.item_count} items
                  </button>
                </td>
                <td className="px-4 py-4">
                  {inHands ? (
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${
                      inHands.urgent ? 'text-red-600' : 'text-slate-600'
                    }`}>
                      <CalendarDays className={`w-3.5 h-3.5 ${inHands.urgent ? 'text-red-500' : 'text-slate-400'}`} />
                      {inHands.text}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[order.status]}`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    {order.priority !== 'normal' && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${priorityStyles[order.priority] || ''}`}
                      >
                        {order.priority === 'same-day' ? 'SAME DAY' : 'RUSH'}
                      </span>
                    )}
                  </div>
                </td>
                {onStatusChange && (
                <td className="px-4 py-4">
                  {(order.status === 'pending' || order.status === 'picking') ? (
                    <button
                      onClick={() => onStatusChange(order.id, 'picking')}
                      className="px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors bg-blue-500 hover:bg-blue-600"
                    >
                      Go Pick
                    </button>
                  ) : action && (
                    <button
                      onClick={() => onStatusChange(order.id, action.status)}
                      className={`px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors ${action.color}`}
                    >
                      {action.label}
                    </button>
                  )}
                </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
