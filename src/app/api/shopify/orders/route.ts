import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import {
  verifyShopifyHmac,
  mapShopifyOrder,
  getStoreByDomain,
  upsertShopifyOrder,
  shopifyGraphQL,
  graphqlNodeToPayload,
  ShopifyOrderPayload,
} from '@/lib/shopify'

// ─── POST — Shopify orders/paid Webhook Handler ──────────────────────────────
// Shopify calls this endpoint every time an order is paid in any of the 7 stores.
// Step 1: Register this URL via /api/shopify/setup once you have each store's API token.

export async function POST(req: NextRequest) {
  // Read raw body first — HMAC verification requires the exact bytes Shopify sent
  const rawBody = await req.text()
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256') ?? ''
  const shopDomain = req.headers.get('x-shopify-shop-domain') ?? ''
  const topic = req.headers.get('x-shopify-topic') ?? ''

  // 1. Verify the request is genuinely from Shopify
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret) {
    console.error('SHOPIFY_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  if (!verifyShopifyHmac(rawBody, hmacHeader, secret)) {
    console.warn(`Rejected webhook — invalid HMAC from ${shopDomain}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Only process orders/paid — Shopify may send other topics to this URL
  if (topic !== 'orders/paid') {
    return NextResponse.json({ message: 'Topic ignored' }, { status: 200 })
  }

  // 3. Identify which store sent this (matched by domain from Supabase stores table)
  const store = await getStoreByDomain(shopDomain)
  if (!store) {
    console.error(`No active store found for domain: ${shopDomain}`)
    return NextResponse.json({ error: 'Unknown store' }, { status: 400 })
  }

  // 4. Parse payload
  let payload: ShopifyOrderPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // 5. Map + save to Supabase
  const { order, items } = mapShopifyOrder(payload, store.id)

  try {
    const result = await upsertShopifyOrder(order, items)

    if (result.isNew) {
      console.log(`Webhook: new order ${payload.name} (${payload.id}) from ${store.name}`)
    } else {
      console.log(`Webhook: duplicate order ${payload.name} — already exists, skipped`)
    }

    // Shopify expects a fast 200 — always return success after saving
    return NextResponse.json({ received: true, order_id: result.id, is_new: result.isNew })
  } catch (err) {
    console.error('Error saving Shopify order:', err)
    // Return 500 so Shopify will retry the webhook
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
  }
}

// ─── GET — Polling Safety Net ─────────────────────────────────────────────────
// Runs every 5 minutes (triggered by a cron job or manual call) to catch any orders
// that the webhook missed. Fetches paid orders from the last 10 minutes per store.
//
// Protect with CRON_SECRET header in production.
// Example cron call: GET /api/shopify/orders  with header x-cron-secret: <your secret>

const GET_ORDERS_QUERY = `
  query GetOrdersForWms($query: String!) {
    orders(first: 50, query: $query, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        name
        email
        createdAt
        customer {
          firstName
          lastName
        }
        shippingAddress {
          address1
          city
          province
          zip
          country
        }
        lineItems(first: 50) {
          nodes {
            id
            title
            variantTitle
            sku
            quantity
            variant {
              id
              product { id }
              image { url }
            }
            image { url }
          }
        }
      }
    }
  }
`

export async function GET(req: NextRequest) {
  // Protect the poll endpoint — only allow cron or admin calls
  const cronSecret = req.headers.get('x-cron-secret')
  const configuredSecret = process.env.CRON_SECRET

  if (configuredSecret && cronSecret !== configuredSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all active stores that have an access token configured
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, domain, access_token')
    .eq('is_active', true)
    .not('access_token', 'is', null)

  if (error) {
    console.error('Error fetching stores for poll:', error)
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }

  if (!stores?.length) {
    return NextResponse.json({
      message: 'No stores with API tokens configured yet',
      synced: 0,
    })
  }

  // Look back 10 minutes — wider window than 5-min cron to ensure no gaps
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const results: { store: string; synced: number; skipped: number; errors: number }[] = []

  for (const store of stores) {
    let synced = 0
    let skipped = 0
    let errors = 0

    try {
      const res = await shopifyGraphQL(
        store.domain,
        store.access_token!,
        GET_ORDERS_QUERY,
        { query: `financial_status:paid created_at:>=${since}` }
      )

      const orders = res.data?.orders?.nodes ?? []

      for (const node of orders) {
        const payload = graphqlNodeToPayload(node)
        const { order, items } = mapShopifyOrder(payload, store.id)

        try {
          const result = await upsertShopifyOrder(order, items)
          if (result.isNew) {
            synced++
          } else {
            skipped++
          }
        } catch {
          errors++
        }
      }

      // Update last_synced_at so admin can see when each store last polled
      await supabase
        .from('stores')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', store.id)

    } catch (err) {
      console.error(`Poll error for ${store.name}:`, err)
      errors++
    }

    results.push({ store: store.name, synced, skipped, errors })
  }

  return NextResponse.json({
    polled_at: new Date().toISOString(),
    since,
    results,
  })
}
