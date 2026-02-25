'use client'

import { useState, useEffect } from 'react'
import { getStores } from '@/lib/supabase/queries'

interface TopBarProps {
  title: string
  onRefresh?: () => void
}

export default function TopBar({ title, onRefresh }: TopBarProps) {
  const [stores, setStores] = useState<{ id: string; name: string; color: string | null }[]>([])

  useEffect(() => {
    getStores().then(data => setStores(data.map(s => ({ id: s.id, name: s.name, color: s.color }))))
  }, [])

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm"
          >
            Refresh
          </button>
        )}
        {stores.length > 0 && (
          <div className="flex items-center gap-2">
            {stores.slice(0, 3).map(store => (
              <div
                key={store.id}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: store.color || '#999999' }}
                title={store.name}
              >
                {store.name.substring(0, 2)}
              </div>
            ))}
            {stores.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">
                +{stores.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
