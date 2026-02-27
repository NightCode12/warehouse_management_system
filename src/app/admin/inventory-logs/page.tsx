'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { canAccessPage } from '@/lib/permissions'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import { getInventoryLogs } from '@/lib/supabase/queries'
import Pagination, { usePagination } from '@/components/ui/Pagination'
import { ArrowUp, ArrowDown, RefreshCw, Calendar } from 'lucide-react'

const changeTypeStyles: Record<string, { label: string; color: string }> = {
  received: { label: 'Received', color: 'bg-emerald-100 text-emerald-700' },
  picked: { label: 'Picked', color: 'bg-blue-100 text-blue-700' },
  adjustment: { label: 'Adjustment', color: 'bg-amber-100 text-amber-700' },
  return: { label: 'Return', color: 'bg-purple-100 text-purple-700' },
}

export default function InventoryLogsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => {
    if (user && !canAccessPage(user.role, '/admin/inventory-logs')) {
      router.replace('/orders')
    }
  }, [user, router])

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    const data = await getInventoryLogs(500)
    setLogs(data)
    setLoading(false)
  }

  const getDateRange = (): { from: Date | null; to: Date | null } => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    switch (dateFilter) {
      case 'today':
        return { from: startOfDay, to: null }
      case 'week': {
        const d = new Date(startOfDay)
        d.setDate(d.getDate() - 7)
        return { from: d, to: null }
      }
      case 'month': {
        const d = new Date(startOfDay)
        d.setMonth(d.getMonth() - 1)
        return { from: d, to: null }
      }
      case 'year': {
        const d = new Date(startOfDay)
        d.setFullYear(d.getFullYear() - 1)
        return { from: d, to: null }
      }
      case 'custom': {
        const from = customFrom ? new Date(customFrom + 'T00:00:00') : null
        const to = customTo ? new Date(customTo + 'T23:59:59') : null
        return { from, to }
      }
      default:
        return { from: null, to: null }
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesType = typeFilter === 'all' || log.change_type === typeFilter
    const matchesSearch =
      searchQuery === '' ||
      (log.product_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.notes || '').toLowerCase().includes(searchQuery.toLowerCase())

    let matchesDate = true
    if (dateFilter !== 'all') {
      const { from, to } = getDateRange()
      const logDate = log.created_at ? new Date(log.created_at) : null
      if (logDate) {
        if (from && logDate < from) matchesDate = false
        if (to && logDate > to) matchesDate = false
      } else {
        matchesDate = false
      }
    }

    return matchesType && matchesSearch && matchesDate
  })

  // usePagination is a hook — must be called before any early return
  const { paginatedItems: paginatedLogs, currentPage, totalPages, totalItems, pageSize, setCurrentPage } = usePagination(filteredLogs, 10)

  if (!user || !canAccessPage(user.role, '/admin/inventory-logs')) return null

  return (
    <AppShell>
      <TopBar title="Inventory Logs" />
      <div className="p-4 sm:p-6">
        {/* Filters */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search by product ID or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="received">Received</option>
            <option value="picked">Picked</option>
            <option value="adjustment">Adjustment</option>
            <option value="return">Return</option>
          </select>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <button
            onClick={loadLogs}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {dateFilter === 'custom' && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-600">From:</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <label className="text-sm text-slate-600">To:</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {(customFrom || customTo) && (
              <button
                onClick={() => { setCustomFrom(''); setCustomTo('') }}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Clear
              </button>
            )}
          </div>
        )}

        <p className="text-sm text-slate-500 mb-4">{filteredLogs.length} log entries</p>

        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center text-slate-400 py-12">No inventory logs found.</div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-150">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Change</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Previous</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">New Qty</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log) => {
                  const style = changeTypeStyles[log.change_type] || { label: log.change_type, color: 'bg-slate-100 text-slate-600' }
                  const isPositive = log.quantity_change > 0
                  const date = log.created_at ? new Date(log.created_at) : null

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {date ? (
                          <>
                            <div>{date.toLocaleDateString()}</div>
                            <div className="text-xs text-slate-400">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${style.color}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPositive ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                          {isPositive ? '+' : ''}{log.quantity_change}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{log.previous_quantity}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{log.new_quantity}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{log.notes || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
    </AppShell>
  )
}
