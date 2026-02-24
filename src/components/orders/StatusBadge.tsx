'use client';

import { OrderStatus, OrderPriority } from '@/types';

interface StatusBadgeProps {
  status: OrderStatus;
  priority: OrderPriority;
}

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  picking: 'bg-blue-100 text-blue-800 border-blue-200',
  picked: 'bg-teal-100 text-teal-800 border-teal-200',
  packed: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

const priorityStyles: Record<OrderPriority, string> = {
  'same-day': 'bg-red-500 text-white',
  'rush': 'bg-orange-500 text-white',
  'normal': ''
};

export default function StatusBadge({ status, priority }: StatusBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
      {priority !== 'normal' && (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${priorityStyles[priority]}`}>
          {priority === 'same-day' ? 'SAME DAY' : 'RUSH'}
        </span>
      )}
    </div>
  );
}