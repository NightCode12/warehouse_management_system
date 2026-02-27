import { createHmac } from 'crypto'
import { supabase } from './supabase/client'

// ─── HMAC Verification ───────────────────────────────────────────────────────
// Shopify signs every webhook with HMAC-SHA256 using your webhook secret.
// Always verify before processing to reject forged requests.

export function verifyShopifyHmac(rawBody: string, hmacHeader: string, secret: string): boolean {
  const hash = createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64')
  return hash === hmacHeader
}

// ─── GraphQL Client ──────────────────────────────────────────────────────────
// Used for: webhookSubscriptionCreate, GetOrderForWms, AdjustInventoryQuantities, fulfillmentCreate

export async function shopifyGraphQL(
  domain: string,
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<any> {
  const res = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`Shopify GraphQL ${res.status}: ${res.statusText}`)
  }

  return res.json()
}

// ─── Shopify Payload Types ───────────────────────────────────────────────────

export interface ShopifyLineItem {
  id: number
  variant_id: number | null
  product_id: number | null
  title: string
  variant_title: string | null
  sku: string
  quantity: number
  price: string
  image?: { src: string } | null
}

export interface ShopifyAddress {
  address1: string | null
  city: string | null
  province: string | null
  zip: string | null
  country: string | null
}

export interface ShopifyCustomer {
  first_name: string | null
  last_name: string | null
  email: string | null
}

export interface ShopifyOrderPayload {
  id: number            // numeric — used for API calls
  name: string          // display name e.g. "#FD10001" — shown to Ryan
  email: string | null
  created_at: string
  financial_status: string
  customer: ShopifyCustomer | null
  shipping_address: ShopifyAddress | null
  line_items: ShopifyLineItem[]
}

// ─── Order Mapper ────────────────────────────────────────────────────────────
// Maps a Shopify orders/paid payload to our Supabase schema.
// Per Khriz: store numeric shopify_order_id for API calls, name (#FD10001) as order_number for display.

export function mapShopifyOrder(payload: ShopifyOrderPayload, storeId: string) {
  const customerName = payload.customer
    ? `${payload.customer.first_name || ''} ${payload.customer.last_name || ''}`.trim()
    : ''

  const order = {
    shopify_order_id: String(payload.id),
    order_number: payload.name,
    source: 'shopify',
    source_id: String(payload.id),
    store_id: storeId,
    customer_name: customerName || null,
    customer_email: payload.email || payload.customer?.email || null,
    shipping_address: payload.shipping_address || null,
    shopify_created_at: payload.created_at,
    status: 'pending',
    priority: 'normal',
  }

  const items = payload.line_items.map(item => ({
    sku: item.sku || String(item.variant_id ?? item.product_id ?? 'UNKNOWN'),
    product_name: item.title,
    variant: item.variant_title || null,
    quantity: item.quantity,
    shopify_product_id: item.product_id ? String(item.product_id) : null,
    shopify_variant_id: item.variant_id ? String(item.variant_id) : null,
    image_url: item.image?.src || null,
    is_picked: false,
  }))

  return { order, items }
}

// ─── Store Lookup ─────────────────────────────────────────────────────────────

export async function getStoreByDomain(domain: string) {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, domain, access_token')
    .eq('domain', domain)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Error looking up store by domain:', error)
    return null
  }
  return data
}

// ─── Supabase Upsert ──────────────────────────────────────────────────────────
// Check-then-insert pattern — avoids needing a unique DB constraint on shopify_order_id.
// Skips orders that are already past 'pending' (picked/packed/shipped) so we don't overwrite them.

export async function upsertShopifyOrder(
  orderData: ReturnType<typeof mapShopifyOrder>['order'],
  itemsData: ReturnType<typeof mapShopifyOrder>['items']
) {
  // Check if this Shopify order already exists
  const { data: existing } = await supabase
    .from('orders')
    .select('id, status')
    .eq('shopify_order_id', orderData.shopify_order_id)
    .maybeSingle()

  if (existing) {
    // Don't touch orders that are already in progress or done
    if (existing.status !== 'pending') {
      console.log(`Order ${orderData.shopify_order_id} already at status '${existing.status}' — skipping`)
      return { id: existing.id, shopify_order_id: orderData.shopify_order_id, status: existing.status, isNew: false }
    }
    // Already pending — still a duplicate, no-op
    return { id: existing.id, shopify_order_id: orderData.shopify_order_id, status: existing.status, isNew: false }
  }

  // New order — insert it
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select('id, shopify_order_id, status')
    .single()

  if (orderError) {
    console.error('Error inserting order:', orderError)
    throw orderError
  }

  // Insert line items
  const itemRows = itemsData.map(item => ({ ...item, order_id: newOrder.id }))
  const { error: itemsError } = await supabase.from('order_items').insert(itemRows)

  if (itemsError) {
    console.error('Error inserting order items:', itemsError)
    throw itemsError
  }

  return { id: newOrder.id, shopify_order_id: newOrder.shopify_order_id, status: newOrder.status, isNew: true }
}

// ─── GraphQL Node → Webhook Payload Converter ────────────────────────────────
// The polling safety net uses GraphQL which returns a different shape.
// This converts it to match the webhook payload format so we can reuse mapShopifyOrder.

export function graphqlNodeToPayload(node: any): ShopifyOrderPayload {
  return {
    id: parseInt(node.id.replace('gid://shopify/Order/', '')),
    name: node.name,
    email: node.email,
    created_at: node.createdAt,
    financial_status: 'paid',
    customer: node.customer
      ? { first_name: node.customer.firstName, last_name: node.customer.lastName, email: node.email }
      : null,
    shipping_address: node.shippingAddress
      ? {
          address1: node.shippingAddress.address1,
          city: node.shippingAddress.city,
          province: node.shippingAddress.province,
          zip: node.shippingAddress.zip,
          country: node.shippingAddress.country,
        }
      : null,
    line_items: (node.lineItems?.nodes || []).map((item: any) => ({
      id: parseInt(item.id?.replace('gid://shopify/LineItem/', '') || '0'),
      variant_id: item.variant?.id
        ? parseInt(item.variant.id.replace('gid://shopify/ProductVariant/', ''))
        : null,
      product_id: item.variant?.product?.id
        ? parseInt(item.variant.product.id.replace('gid://shopify/Product/', ''))
        : null,
      title: item.title,
      variant_title: item.variantTitle || null,
      sku: item.sku || '',
      quantity: item.quantity,
      price: '0',
      image: item.image?.url
        ? { src: item.image.url }
        : item.variant?.image?.url
        ? { src: item.variant.image.url }
        : null,
    })),
  }
}
