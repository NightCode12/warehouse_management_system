'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import { getAllStores, updateStore, getAllBarcodeAliases, deleteBarcodeAlias } from '@/lib/supabase/queries'
import Pagination, { usePagination } from '@/components/ui/Pagination'
import { RefreshCw, Trash2, Save, Shield, Check, Minus } from 'lucide-react'
import { ROLE_PERMISSIONS, Permission } from '@/lib/permissions'
import { UserRole } from '@/types'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'stores' | 'barcodes' | 'permissions'>('stores')

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/orders')
    }
  }, [user, router])

  if (!user || user.role !== 'admin') return null

  return (
    <AppShell>
      <TopBar title="Settings" />
      <div className="p-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('stores')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'stores'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Stores
          </button>
          <button
            onClick={() => setActiveTab('barcodes')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'barcodes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Barcode Aliases
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'permissions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Permissions
          </button>
        </div>

        {activeTab === 'stores' && <StoresSection />}
        {activeTab === 'barcodes' && <BarcodeAliasesSection />}
        {activeTab === 'permissions' && <PermissionsSection />}
      </div>
    </AppShell>
  )
}

// ─── Stores Section ──────────────────────────────────────────

function StoresSection() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', domain: '', color: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadStores()
  }, [])

  async function loadStores() {
    setLoading(true)
    const data = await getAllStores()
    setStores(data)
    setLoading(false)
  }

  function startEdit(store: any) {
    setEditingId(store.id)
    setEditForm({ name: store.name, domain: store.domain, color: store.color || '#3b82f6' })
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setSaving(true)
    try {
      await updateStore(editingId, editForm)
      setEditingId(null)
      loadStores()
    } catch (err) {
      alert('Failed to update store: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      await updateStore(id, { is_active: !currentActive })
      loadStores()
    } catch (err) {
      alert('Failed to update store: ' + (err as Error).message)
    }
  }

  if (loading) return <div className="text-center text-slate-400 py-12">Loading stores...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{stores.length} stores configured</p>
        <button
          onClick={loadStores}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Color</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Domain</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stores.map((store) => (
              <tr key={store.id} className="hover:bg-slate-50 transition-colors">
                {editingId === store.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="rounded border border-slate-300 px-2 py-1 text-sm w-full"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editForm.domain}
                        onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                        className="rounded border border-slate-300 px-2 py-1 text-sm w-full"
                      />
                    </td>
                    <td className="px-4 py-3">—</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <div className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: store.color || '#ccc' }} />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{store.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{store.domain}</td>
                    <td className="px-4 py-3">
                      {store.is_active ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Active</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(store)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(store.id, store.is_active)}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg ${
                            store.is_active
                              ? 'text-red-600 bg-red-50 hover:bg-red-100'
                              : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {store.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Barcode Aliases Section ─────────────────────────────────

function BarcodeAliasesSection() {
  const [aliases, setAliases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadAliases()
  }, [])

  async function loadAliases() {
    setLoading(true)
    const data = await getAllBarcodeAliases()
    setAliases(data)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this barcode alias?')) return
    try {
      await deleteBarcodeAlias(id)
      loadAliases()
    } catch (err) {
      alert('Failed to delete: ' + (err as Error).message)
    }
  }

  const filteredAliases = aliases.filter((a) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      a.external_barcode.toLowerCase().includes(q) ||
      a.sku.toLowerCase().includes(q)
    )
  })

  const { paginatedItems: paginatedAliases, currentPage, totalPages, totalItems, pageSize, setCurrentPage } = usePagination(filteredAliases, 10)

  if (loading) return <div className="text-center text-slate-400 py-12">Loading barcode aliases...</div>

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by barcode or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={loadAliases}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 font-medium hover:bg-slate-50 flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <p className="text-sm text-slate-500 mb-4">{filteredAliases.length} barcode aliases</p>

      {filteredAliases.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          {aliases.length === 0
            ? 'No barcode aliases yet. They are created automatically when scanning unknown barcodes.'
            : 'No aliases match your search.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">External Barcode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Maps to SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedAliases.map((alias) => {
                const date = alias.created_at ? new Date(alias.created_at) : null
                return (
                  <tr key={alias.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-slate-800">{alias.external_barcode}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{alias.sku}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{date ? date.toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(alias.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
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
  )
}

// ─── Permissions Section ────────────────────────────────────

const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: 'orders:edit_status', label: 'Edit order status', group: 'Orders' },
  { key: 'inventory:adjust', label: 'Adjust inventory quantities', group: 'Inventory' },
  { key: 'receiving:manage_clients', label: 'Add / delete clients', group: 'Receiving' },
  { key: 'manual_entry:access', label: 'Access manual entry', group: 'Manual Entry' },
  { key: 'admin:users', label: 'User management', group: 'Admin' },
  { key: 'admin:settings', label: 'Settings', group: 'Admin' },
  { key: 'admin:activity_logs', label: 'Activity logs', group: 'Admin' },
  { key: 'admin:inventory_logs', label: 'Inventory logs', group: 'Admin' },
]

const ROLES: UserRole[] = ['admin', 'picker', 'viewer']

const roleBadgeStyles: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  picker: 'bg-blue-100 text-blue-700',
  viewer: 'bg-slate-100 text-slate-600',
}

function PermissionsSection() {
  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">
        Reference guide showing what each role can do. Contact a developer to modify these permissions.
      </p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Permission</th>
              {ROLES.map(role => (
                <th key={role} className="text-center px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${roleBadgeStyles[role]}`}>
                    {role}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ALL_PERMISSIONS.map(perm => (
              <tr key={perm.key} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-800">{perm.label}</div>
                  <div className="text-xs text-slate-400">{perm.group}</div>
                </td>
                {ROLES.map(role => (
                  <td key={role} className="text-center px-4 py-3">
                    {ROLE_PERMISSIONS[role].includes(perm.key) ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 rounded-full">
                        <Minus className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {ROLES.map(role => {
          const perms = ROLE_PERMISSIONS[role]
          return (
            <div key={role} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${roleBadgeStyles[role]}`}>
                  {role}
                </span>
                <span className="text-xs text-slate-400">{perms.length} permissions</span>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                {role === 'admin' ? (
                  <p className="text-xs text-slate-500">Full access to all features</p>
                ) : role === 'picker' ? (
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>Dashboard, Orders (view), Pick List, Inventory (view), Receiving, Inv. Logs</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Dashboard, Orders (view), Inventory (view)</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
