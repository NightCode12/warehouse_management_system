import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { shopifyGraphQL } from '@/lib/shopify'

// ─── fulfillmentCreate GraphQL Mutation ──────────────────────────────────────
// Marks an order as shipped in Shopify and attaches a tracking number.
// Called after Ryan marks an order shipped in the WMS.

const FULFILLMENT_CREATE_MUTATION = `
  mutation fulfillmentCreate($fulfillment: FulfillmentInput!) {
    fulfillmentCreate(fulfillment: $fulfillment) {
      fulfillment {
        id
        status
        trackingInfo {
          number
          company
          url
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

// ─── POST /api/shopify/fulfillments ──────────────────────────────────────────
// Body: {
//   orderId: string          — our internal Supabase order UUID
//   trackingNumber?: string  — e.g. "1Z999AA10123456784"
//   trackingCompany?: string — e.g. "UPS", "FedEx", "USPS"
// }

export async function POST(req: NextRequest) {
  let body: { orderId: string; trackingNumber?: string; trackingCompany?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { orderId, trackingNumber, trackingCompany } = body

  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  }

  // Look up the order + the store's API credentials in one query
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, shopify_order_id, status, stores(domain, access_token)')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (!order.shopify_order_id) {
    return NextResponse.json({ error: 'This is not a Shopify order' }, { status: 400 })
  }

  const store = (order as any).stores
  if (!store?.access_token) {
    return NextResponse.json(
      { error: 'Store API token not configured yet — add it to the stores table first' },
      { status: 400 }
    )
  }

  // Build Shopify GID — GraphQL requires this format, not the numeric ID
  const shopifyOrderGid = `gid://shopify/Order/${order.shopify_order_id}`

  try {
    const result = await shopifyGraphQL(
      store.domain,
      store.access_token,
      FULFILLMENT_CREATE_MUTATION,
      {
        fulfillment: {
          orderId: shopifyOrderGid,
          trackingInfo: trackingNumber
            ? { number: trackingNumber, company: trackingCompany ?? null }
            : undefined,
          notifyCustomer: true,
        },
      }
    )

    const userErrors = result.data?.fulfillmentCreate?.userErrors ?? []
    if (userErrors.length > 0) {
      console.error('Shopify fulfillment userErrors:', userErrors)
      return NextResponse.json({ error: userErrors[0].message }, { status: 400 })
    }

    // Write shipment details back to our orders table
    await supabase
      .from('orders')
      .update({
        status: 'shipped',
        shipped_at: new Date().toISOString(),
        tracking_number: trackingNumber ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    const fulfillment = result.data?.fulfillmentCreate?.fulfillment
    console.log(`Fulfillment created for order ${order.shopify_order_id}: ${fulfillment?.id}`)

    return NextResponse.json({ success: true, fulfillment })
  } catch (err) {
    console.error('Error creating Shopify fulfillment:', err)
    return NextResponse.json(
      { error: 'Failed to create fulfillment in Shopify' },
      { status: 500 }
    )
  }
}
