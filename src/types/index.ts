import { Database } from '@/lib/supabase/types'

// Helper to extract table row types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

// Table types
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type Store = Tables<'stores'>
export type Client = Tables<'clients'>
export type User = Tables<'users'>
export type Inventory = Tables<'inventory'>
export type BarcodeAlias = Tables<'barcode_aliases'>
export type Location = Tables<'locations'>

// Status and priority are stored as strings in DB (not enums)
// So we'll define them manually
export type OrderStatus = 'pending' | 'picking' | 'picked' | 'packed' | 'shipped' | 'cancelled'
export type OrderPriority = 'normal' | 'rush' | 'same-day'
export type OrderSource = 'facilis' | 'shopify' | 'inksoft' | 'manual'

// Extended types for UI (with joins)
export interface OrderWithStore extends Order {
  stores?: Store | null
}

// For display purposes
export interface OrderDisplay {
  id: string
  order_number: string
  store_name: string
  store_color: string
  client_name: string | null
  client_color: string | null
  customer_name: string
  customer_email: string
  status: OrderStatus
  priority: OrderPriority
  source: OrderSource | null
  is_carryover: boolean
  created_at: string
  in_hands_date: string | null
  item_count: number
}

// ============================================================
// Real display types — powered by Supabase queries
// ============================================================

// Replaces MockOrderProduct — order_item from DB
export interface OrderItemDisplay {
  id: string
  sku: string
  product_name: string
  variant: string | null
  quantity: number
  picked_quantity: number | null
  is_picked: boolean | null
  location_code: string | null
  image_url: string | null
  order_id: string | null
}

// Replaces MockOrder — order with full items + store + client info
export interface PickableOrder {
  id: string
  order_number: string
  store_id: string | null
  store_name: string
  store_color: string
  client_name: string | null
  client_color: string | null
  customer_name: string
  status: OrderStatus
  priority: OrderPriority
  is_carryover: boolean
  created_at: string
  items: OrderItemDisplay[]
}

// Replaces MockInventoryItem — inventory joined with client
export interface InventoryDisplay {
  id: string
  sku: string
  product_name: string
  variant: string | null
  quantity: number
  threshold: number | null
  location_code: string | null
  barcode: string | null
  image_url: string | null
  client_id: string | null
  client_name: string | null
  client_color: string | null
  last_updated: string | null
}

// Replaces MockClient
export interface ClientDisplay {
  id: string
  name: string
  color: string | null
  contact_name: string | null
  contact_email: string | null
}

// Receiving — real DB types
export interface ReceivingItemDisplay {
  id: string
  sku: string
  product_name: string | null
  variant: string | null
  quantity_received: number
  location_code: string | null
  inventory_id: string | null
  created_at: string | null
}

export interface ReceivingReceiptDisplay {
  id: string
  reference_number: string | null
  client_id: string | null
  client_name: string | null
  client_color: string | null
  status: string | null
  items: ReceivingItemDisplay[]
  created_at: string | null
  completed_at: string | null
}

