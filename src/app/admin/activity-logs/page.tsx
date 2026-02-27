'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import { getActivityLogs } from '@/lib/supabase/queries'
import Pagination, { usePagination } from '@/components/ui/Pagination'
import { RefreshCw, Calendar } from 'lucide-react'

const entityTypeStyles: Record<string, string> = {
  order: 'bg-blue-100 text-blue-700',
  inventory: 'bg-emerald-100 text-emerald-700',
  receiving: 'bg-purple-100 text-purple-700',
  user: 'bg-red-100 text-red-700',
  store: 'bg-amber-100 text-amber-700',
}

export default function ActivityLogsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/orders')
    }
  }, [user, router])

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    const data = await getActivityLogs(500)
    setLogs(data)
    setLoading(false)
  }

  const entityTypes = [...new Set(logs.map(l => l.entity_type).filter(Boolean))]

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
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter
    const matchesSearch =
      searchQuery === '' ||
      (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entity_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user_name || '').toLowerCase().includes(searchQuery.toLowerCase())

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

    return matchesEntity && matchesSearch && matchesDate
  })

  // usePagination is a hook — must be called before any early return
  const { paginatedItems: paginatedLogs, currentPage, totalPages, totalItems, pageSize, setCurrentPage } = usePagination(filteredLogs, 10)

  if (!user || user.role !== 'admin') return null

  return (
    <AppShell>
      <TopBar title="Activity Logs" />
      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search by action, entity, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Entities</option>
            {entityTypes.map((type) => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
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
          <div className="mb-4 flex items-center gap-3">
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
          <div className="text-center text-slate-400 py-12">No activity logs found.</div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log) => {
                  const date = log.created_at ? new Date(log.created_at) : null
                  const entityStyle = entityTypeStyles[log.entity_type] || 'bg-slate-100 text-slate-600'
                  let detailsStr = ''
                  if (log.details) {
                    try {
                      const parsed = typeof log.details === 'string' ? JSON.parse(log.details) : log.details
                      detailsStr = JSON.stringify(parsed, null, 0)
                      if (detailsStr.length > 80) detailsStr = detailsStr.substring(0, 80) + '...'
                    } catch {
                      detailsStr = String(log.details)
                    }
                  }

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
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{log.user_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-800">{log.action}</td>
                      <td className="px-4 py-3">
                        {log.entity_type ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${entityStyle}`}>
                            {log.entity_type}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono text-xs">{log.entity_id ? log.entity_id.substring(0, 8) + '...' : '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate font-mono">{detailsStr || '—'}</td>
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
