import { supabase } from './client'
import { OrderStatus, OrderDisplay, PickableOrder, OrderItemDisplay, InventoryDisplay, ClientDisplay, ReceivingReceiptDisplay, ReceivingItemDisplay } from '@/types'

// ─── Barcode Alias System ──────────────────────────────────────

// Look up a manufacturer barcode in the aliases table
export async function lookupBarcodeAlias(barcode: string) {
  const { data, error } = await supabase
    .from('barcode_aliases')
    .select('*')
    .eq('external_barcode', barcode)
    .maybeSingle()

  if (error) {
    console.error('Error looking up barcode alias:', error)
    return null
  }
  return data
}

// Save a new barcode → SKU mapping so the system remembers it
export async function saveBarcodeAlias(externalBarcode: string, sku: string, inventoryId?: string) {
  const { data, error } = await supabase
    .from('barcode_aliases')
    .insert({
      external_barcode: externalBarcode,
      sku,
      inventory_id: inventoryId || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving barcode alias:', error)
    throw error
  }
  return data
}

// Fetch all known barcode aliases
export async function getAllBarcodeAliases() {
  const { data, error } = await supabase
    .from('barcode_aliases')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching barcode aliases:', error)
    return []
  }
  return data || []
}

// ─── Activity Logging ──────────────────────────────────────────

export async function logActivity(action: string, entityType: string, entityId: string, details?: Record<string, unknown>) {
  const { error } = await supabase
    .from('activity_log')
    .insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details ? JSON.stringify(details) : null,
    })

  if (error) {
    console.error('Error logging activity:', error)
  }
}

// ─── Inventory Logs ────────────────────────────────────────────

export async function logInventoryChange(
  productId: string,
  changeType: 'received' | 'picked' | 'adjustment' | 'return',
  quantityChange: number,
  previousQuantity: number,
  notes?: string
) {
  const { error } = await supabase
    .from('inventory_logs')
    .insert({
      product_id: productId,
      change_type: changeType,
      quantity_change: quantityChange,
      previous_quantity: previousQuantity,
      new_quantity: previousQuantity + quantityChange,
      notes: notes || null,
    })

  if (error) {
    console.error('Error logging inventory change:', error)
  }
}

// ─── Stores & Orders ───────────────────────────────────────────

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

// Fetch orders with store info, client info, and item count
export async function getOrdersWithDetails() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      stores (name, color),
      clients (name, color),
      order_items (id)
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
    client_name: (order as any).clients?.name || null,
    client_color: (order as any).clients?.color || null,
    customer_name: order.customer_name || '',
    customer_email: order.customer_email || '',
    status: order.status as OrderStatus,
    priority: order.priority as any,
    source: order.source || null,
    is_carryover: order.is_carryover || false,
    created_at: order.created_at || '',
    in_hands_date: order.in_hands_date || null,
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

// ─── Orders with Full Items (Pick List, Scanner, Dashboard) ──

function transformOrderWithItems(order: any): PickableOrder {
  return {
    id: order.id,
    order_number: order.order_number,
    store_id: order.store_id,
    store_name: order.stores?.name || 'Unknown',
    store_color: order.stores?.color || '#999999',
    client_name: order.clients?.name || null,
    client_color: order.clients?.color || null,
    customer_name: order.customer_name || '',
    status: order.status as OrderStatus,
    priority: order.priority as any,
    is_carryover: order.is_carryover || false,
    created_at: order.created_at || '',
    items: (order.order_items || []).map((item: any): OrderItemDisplay => ({
      id: item.id,
      sku: item.sku,
      product_name: item.product_name,
      variant: item.variant,
      quantity: item.quantity,
      picked_quantity: item.picked_quantity,
      is_picked: item.is_picked,
      location_code: item.location_code,
      image_url: item.image_url,
      order_id: item.order_id,
    })),
  }
}

// Fetch pickable orders (pending/picking) with full items
export async function getPickableOrdersWithItems(): Promise<PickableOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, stores (name, color), clients (name, color), order_items (*)`)
    .in('status', ['pending', 'picking'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pickable orders:', error)
    return []
  }
  return (data || []).map(transformOrderWithItems)
}

// Fetch ALL orders with full items (for dashboard)
export async function getAllOrdersWithItems(): Promise<PickableOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, stores (name, color), clients (name, color), order_items (*)`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all orders:', error)
    return []
  }
  return (data || []).map(transformOrderWithItems)
}

// ─── Pick Confirmation (write-back) ──────────────────────────

export async function markItemPicked(itemId: string, pickedQuantity: number) {
  const { error } = await supabase
    .from('order_items')
    .update({
      is_picked: true,
      picked_quantity: pickedQuantity,
      picked_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) {
    console.error('Error marking item picked:', error)
    throw error
  }
}

// ─── Carryover Detection ─────────────────────────────────────

export async function markCarryoverOrders(): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('orders')
    .update({ is_carryover: true, updated_at: new Date().toISOString() })
    .lt('created_at', today.toISOString())
    .in('status', ['pending', 'picking'])
    .eq('is_carryover', false)
    .select('id')

  if (error) {
    console.error('Error marking carryover orders:', error)
    return 0
  }
  return data?.length || 0
}

// ─── Pending Pick Count (sidebar badge) ──────────────────────

export async function getPendingPickCount(): Promise<number> {
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'picking'])

  if (error) {
    console.error('Error getting pending pick count:', error)
    return 0
  }
  return count || 0
}

// ─── Inventory CRUD ──────────────────────────────────────────

// Lightweight inventory fetch for product dropdowns in manual entry
export async function getInventoryProducts(): Promise<{ sku: string; product_name: string; variant: string | null }[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('sku, product_name, variant')
    .order('product_name')

  if (error) {
    console.error('Error fetching inventory products:', error)
    return []
  }

  return data || []
}

export async function getInventoryWithClients(): Promise<InventoryDisplay[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select(`*, clients (name, color)`)
    .order('product_name')

  if (error) {
    console.error('Error fetching inventory:', error)
    return []
  }

  return (data || []).map((item: any): InventoryDisplay => ({
    id: item.id,
    sku: item.sku,
    product_name: item.product_name,
    variant: item.variant,
    quantity: item.quantity,
    threshold: item.threshold,
    location_code: item.location_code,
    barcode: item.barcode,
    image_url: item.image_url,
    client_id: item.client_id,
    client_name: item.clients?.name || null,
    client_color: item.clients?.color || null,
    last_updated: item.last_updated,
  }))
}

export async function adjustInventoryQuantity(
  inventoryId: string,
  delta: number,
  currentQuantity: number
) {
  const newQuantity = Math.max(0, currentQuantity + delta)

  const { error } = await supabase
    .from('inventory')
    .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
    .eq('id', inventoryId)

  if (error) {
    console.error('Error adjusting inventory:', error)
    throw error
  }

  await logInventoryChange(
    inventoryId,
    'adjustment',
    delta,
    currentQuantity,
    `Manual adjustment ${delta > 0 ? '+' : ''}${delta}`
  )
}

export async function incrementInventoryQuantity(
  inventoryId: string,
  additionalQuantity: number,
  currentQuantity: number
) {
  const newQty = currentQuantity + additionalQuantity

  const { error } = await supabase
    .from('inventory')
    .update({ quantity: newQty, last_updated: new Date().toISOString() })
    .eq('id', inventoryId)

  if (error) {
    console.error('Error incrementing inventory:', error)
    throw error
  }

  await logInventoryChange(inventoryId, 'received', additionalQuantity, currentQuantity)
}

// Create a brand-new inventory row (used when receiving an item that doesn't exist yet)
// Look up location_id from the locations table by code (e.g. "A-01-03")
export async function lookupLocationId(locationCode: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('locations')
    .select('id')
    .eq('code', locationCode)
    .maybeSingle()

  if (error) {
    console.error('Error looking up location:', error)
    return null
  }
  return data?.id || null
}

export async function createInventoryItem(item: {
  sku: string
  product_name: string
  variant?: string | null
  quantity: number
  location_code?: string | null
  client_id: string
  barcode?: string | null
  image_url?: string | null
}): Promise<InventoryDisplay> {
  // Resolve location_id from location_code
  let locationId: string | null = null
  if (item.location_code) {
    locationId = await lookupLocationId(item.location_code)
  }

  const { data, error } = await supabase
    .from('inventory')
    .insert({
      sku: item.sku,
      product_name: item.product_name,
      variant: item.variant || null,
      quantity: item.quantity,
      location_code: item.location_code || null,
      location_id: locationId,
      client_id: item.client_id,
      barcode: item.barcode || item.sku,
      image_url: item.image_url || null,
      last_updated: new Date().toISOString(),
    })
    .select('*, clients (name, color)')
    .single()

  if (error) {
    console.error('Error creating inventory item:', error)
    throw error
  }

  return {
    id: data.id,
    sku: data.sku,
    product_name: data.product_name,
    variant: data.variant,
    quantity: data.quantity,
    threshold: data.threshold,
    location_code: data.location_code,
    barcode: data.barcode,
    image_url: data.image_url,
    client_id: data.client_id,
    client_name: (data as any).clients?.name || null,
    client_color: (data as any).clients?.color || null,
    last_updated: data.last_updated,
  }
}

// ─── Clients ─────────────────────────────────────────────────

export async function getClients(): Promise<ClientDisplay[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, color, contact_name, contact_email')
    .order('name')

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }
  return data || []
}

// ─── Receiving ───────────────────────────────────────────────

export async function createReceivingReceipt(clientId: string, referenceNumber: string) {
  const { data, error } = await supabase
    .from('receiving_receipts')
    .insert({
      client_id: clientId,
      reference_number: referenceNumber,
    })
    .select('id, reference_number, status')
    .single()

  if (error) {
    console.error('Error creating receipt:', error.message, error.code, error.details, error.hint)
    throw error
  }
  return data
}

export async function addReceivingItem(
  receiptId: string,
  item: { sku: string; product_name: string | null; variant?: string | null; quantity_received: number; location_code: string | null; inventory_id?: string | null }
) {
  const { data, error } = await supabase
    .from('receiving_items')
    .insert({
      receipt_id: receiptId,
      sku: item.sku,
      product_name: item.product_name,
      variant: item.variant || null,
      quantity_received: item.quantity_received,
      location_code: item.location_code,
      inventory_id: item.inventory_id || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error adding receiving item:', error)
    throw error
  }
  return data as ReceivingItemDisplay
}

export async function removeReceivingItem(itemId: string) {
  const { error } = await supabase
    .from('receiving_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error removing receiving item:', error)
    throw error
  }
}

export async function completeReceivingReceipt(receiptId: string) {
  const { error } = await supabase
    .from('receiving_receipts')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', receiptId)

  if (error) {
    console.error('Error completing receipt:', error)
    throw error
  }
}

export async function getReceivingReceiptWithItems(receiptId: string): Promise<ReceivingReceiptDisplay | null> {
  const { data, error } = await supabase
    .from('receiving_receipts')
    .select(`*, clients (name, color), receiving_items (*)`)
    .eq('id', receiptId)
    .single()

  if (error) {
    console.error('Error fetching receipt:', error)
    return null
  }

  return {
    id: data.id,
    reference_number: data.reference_number,
    client_id: data.client_id,
    client_name: (data as any).clients?.name || null,
    client_color: (data as any).clients?.color || null,
    status: data.status,
    items: ((data as any).receiving_items || []).map((item: any): ReceivingItemDisplay => ({
      id: item.id,
      sku: item.sku,
      product_name: item.product_name,
      variant: item.variant || null,
      quantity_received: item.quantity_received,
      location_code: item.location_code,
      inventory_id: item.inventory_id,
      created_at: item.created_at,
    })),
    created_at: data.created_at,
    completed_at: data.completed_at,
  }
}

export async function getCompletedReceipts(): Promise<ReceivingReceiptDisplay[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('receiving_receipts')
    .select(`*, clients (name, color), receiving_items (*)`)
    .eq('status', 'completed')
    .gte('completed_at', today.toISOString())
    .order('completed_at', { ascending: false })

  if (error) {
    console.error('Error fetching completed receipts:', error)
    return []
  }

  return (data || []).map((r: any): ReceivingReceiptDisplay => ({
    id: r.id,
    reference_number: r.reference_number,
    client_id: r.client_id,
    client_name: r.clients?.name || null,
    client_color: r.clients?.color || null,
    status: r.status,
    items: (r.receiving_items || []).map((item: any): ReceivingItemDisplay => ({
      id: item.id,
      sku: item.sku,
      product_name: item.product_name,
      variant: item.variant || null,
      quantity_received: item.quantity_received,
      location_code: item.location_code,
      inventory_id: item.inventory_id,
      created_at: item.created_at,
    })),
    created_at: r.created_at,
    completed_at: r.completed_at,
  }))
}