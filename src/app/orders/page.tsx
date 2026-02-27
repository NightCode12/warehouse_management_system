'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import OrderTable from '@/components/orders/OrderTable'
import OrderItemsModal from '@/components/orders/OrderItemsModal'
import ShipOrderModal from '@/components/orders/ShipOrderModal'
import Pagination, { usePagination } from '@/components/ui/Pagination'
import { getOrdersWithDetails, getStores, updateOrderStatus, shipOrder } from '@/lib/supabase/queries'
import { usePickCount } from '@/lib/PickCountContext'
import { useAuth } from '@/lib/AuthContext'
import { hasPermission } from '@/lib/permissions'
import { OrderDisplay, OrderStatus, Store } from '@/types'

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderDisplay[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [storeFilter, setStoreFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderDisplay | null>(null)
  const [shippingOrder, setShippingOrder] = useState<OrderDisplay | null>(null)
  const { refreshCount } = usePickCount()
  const { user } = useAuth()
  const canEditStatus = user ? hasPermission(user.role, 'orders:edit_status') : false

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [ordersData, storesData] = await Promise.all([
        getOrdersWithDetails(),
        getStores()
      ])
      setOrders(ordersData)
      setStores(storesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesStore = storeFilter === 'all' || order.store_name === storeFilter
    const matchesSearch =
      searchQuery === '' ||
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesStore && matchesSearch
  })

  const { paginatedItems: paginatedOrders, currentPage, totalPages, totalItems, pageSize, setCurrentPage } = usePagination(filteredOrders, 10)

  // Status counts
  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    picked: orders.filter((o) => o.status === 'picked').length,
    packed: orders.filter((o) => o.status === 'packed').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
  }

  // Handle status change — intercept 'shipped' to show tracking modal
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // For shipping, show the modal to collect tracking info
    if (newStatus === 'shipped') {
      const order = orders.find((o) => o.id === orderId)
      if (order) {
        setShippingOrder(order)
        return
      }
    }

    try {
      await updateOrderStatus(orderId, newStatus as OrderStatus)

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus as OrderStatus } : order
        )
      )

      // Refresh sidebar pick count badge
      refreshCount()
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert('Failed to update order status. Please try again.')
    }
  }

  // Handle ship confirmation from modal
  const handleShipConfirm = async (orderId: string, trackingNumber: string, trackingCompany: string) => {
    const result = await shipOrder(orderId, trackingNumber || undefined, trackingCompany || undefined)

    // Update local state with tracking info
    setOrders(prevOrders =>
      prevOrders.map((order) =>
        order.id === orderId ? {
          ...order,
          status: 'shipped' as OrderStatus,
          tracking_number: trackingNumber || null,
          tracking_company: trackingCompany || null,
        } : order
      )
    )

    refreshCount()

    if (!result.shopifySynced && orders.find(o => o.id === orderId)?.source === 'shopify') {
      console.warn('Order shipped locally but Shopify sync failed — will sync when store token is configured')
    }
  }

  if (loading) {
    return (
      <AppShell>
        <TopBar title="Orders" />
        <div className="flex h-96 items-center justify-center">
          <div className="text-gray-500">Loading orders...</div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <TopBar title="Orders" />

      <div className="p-4 sm:p-6">
        {/* Status Tabs */}
        <div className="mb-4 sm:mb-6 flex gap-2 border-b border-gray-200 overflow-x-auto">
          {(['all', 'pending', 'picked', 'packed', 'shipped'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`border-b-2 px-3 sm:px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 sm:ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <div className="flex gap-3">
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="flex-1 sm:flex-none rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Stores</option>
              {stores.map((store) => (
                <option key={store.id} value={store.name}>
                  {store.name}
                </option>
              ))}
            </select>

            <button
              onClick={loadData}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 font-medium hover:bg-slate-50 whitespace-nowrap"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <OrderTable orders={paginatedOrders} onStatusChange={canEditStatus ? handleStatusChange : undefined} onViewItems={setSelectedOrder} />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={pageSize}
        />

        {filteredOrders.length === 0 && !loading && (
          <div className="mt-8 text-center text-gray-500">
            {orders.length === 0 ? (
              <div>
                <p className="mb-2 text-lg font-medium">No orders yet</p>
                <p className="text-sm">Orders from Shopify will appear here once synced.</p>
              </div>
            ) : (
              'No orders found matching your filters.'
            )}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderItemsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {shippingOrder && (
        <ShipOrderModal
          order={shippingOrder}
          onConfirm={handleShipConfirm}
          onClose={() => setShippingOrder(null)}
        />
      )}
    </AppShell>
  )
}