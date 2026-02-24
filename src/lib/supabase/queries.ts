import { supabase } from './client'
import { OrderStatus, OrderDisplay } from '@/types'

// Fetch all stores
export async function getStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) {
    console.error('Error fetching stores:', error)
    return []
  }
  return data || []
}

// Fetch orders with store info and item count
export async function getOrdersWithDetails() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      stores (
        name,
        color
      ),
      order_items (
        id
      )
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  // Transform to OrderDisplay format
  const displayOrders: OrderDisplay[] = (orders || []).map(order => ({
    id: order.id,
    order_number: order.order_number,
    store_name: order.stores?.name || 'Unknown',
    store_color: order.stores?.color || '#999999',
    customer_name: order.customer_name || '',
    customer_email: order.customer_email || '',
    status: order.status as OrderStatus,
    priority: order.priority as any,
    is_carryover: order.is_carryover || false,
    created_at: order.created_at || '',
    item_count: order.order_items?.length || 0,
  }))

  return displayOrders
}

// Update order status
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const updates: any = { 
    status,
    updated_at: new Date().toISOString()
  }

  // Set timestamps based on status
  if (status === 'picked') {
    updates.picked_at = new Date().toISOString()
  } else if (status === 'packed') {
    updates.packed_at = new Date().toISOString()
  } else if (status === 'shipped') {
    updates.shipped_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating order status:', error)
    throw error
  }
  return data
}