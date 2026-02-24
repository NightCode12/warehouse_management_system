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
  customer_name: string
  customer_email: string
  status: OrderStatus
  priority: OrderPriority
  is_carryover: boolean
  created_at: string
  item_count: number
}

// ============================================================
// Mock / UI types — used by components with mock data.
// These will be replaced by DB queries + transforms later.
// ============================================================

export interface MockStore {
  id: number
  name: string
  color: string
  domain: string
}

export interface MockClient {
  id: number
  name: string
  color: string
}

export interface MockOrderProduct {
  sku: string
  name: string
  variant: string
  location: string
  quantity: number
  picked: boolean
}

export interface MockOrder {
  id: number
  orderNumber: string
  store: MockStore
  customer: string
  items: MockOrderProduct[]
  status: OrderStatus
  priority: OrderPriority
  createdAt: Date
  isCarryover: boolean
}

export interface MockInventoryItem {
  id: number
  sku: string
  name: string
  variant: string
  location: string
  quantity: number
  threshold: number
  client: MockClient
  lastUpdated: Date
}

// Receiving Module (mock phase)

export type ReceivingStatus = 'in-progress' | 'completed'

export interface ReceivingItem {
  id: number
  sku: string
  name: string
  variant: string
  quantity: number
  location: string
  scannedBarcode?: string
  receivedAt: Date
}

export interface ReceivingReceipt {
  id: number
  receiptNumber: string
  client: MockClient
  items: ReceivingItem[]
  status: ReceivingStatus
  createdAt: Date
  completedAt?: Date
}