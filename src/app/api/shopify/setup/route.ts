import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { shopifyGraphQL } from '@/lib/shopify'

// ─── webhookSubscriptionCreate GraphQL Mutation ───────────────────────────────
// One-time call per store to tell Shopify where to send orders/paid events.
// Once registered, Shopify will POST to /api/shopify/orders on every paid order.

const WEBHOOK_SUBSCRIBE_MUTATION = `
  mutation webhookSubscriptionCreate(
    $topic: WebhookSubscriptionTopic!
    $webhookSubscription: WebhookSubscriptionInput!
  ) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
      webhookSubscription {
        id
        topic
        endpoint {
          __typename
          ... on WebhookHttpEndpoint {
            callbackUrl
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

// ─── POST /api/shopify/setup ──────────────────────────────────────────────────
// Registers the orders/paid webhook on a Shopify store.
// Run this once per store after adding their access_token to the stores table.
//
// Body: { storeId: string }  — the UUID from your Supabase stores table
//
// Requires NEXT_PUBLIC_APP_URL env var set to your public deployment URL.
// In dev, use ngrok and set NEXT_PUBLIC_APP_URL=https://xxxx.ngrok.io

export async function POST(req: NextRequest) {
  let body: { storeId: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 })
  }

  // Build the public webhook URL — Shopify must be able to reach this
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_APP_URL not set — Shopify needs a public URL to call back to' },
      { status: 500 }
    )
  }

  const webhookCallbackUrl = `${appUrl}/api/shopify/orders`

  // Look up the store
  const { data: store, error } = await supabase
    .from('stores')
    .select('id, name, domain, access_token')
    .eq('id', body.storeId)
    .maybeSingle()

  if (error || !store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }

  if (!store.access_token) {
    return NextResponse.json(
      { error: `Store "${store.name}" has no access_token — add it to the stores table first` },
      { status: 400 }
    )
  }

  try {
    const result = await shopifyGraphQL(
      store.domain,
      store.access_token,
      WEBHOOK_SUBSCRIBE_MUTATION,
      {
        topic: 'ORDERS_PAID',
        webhookSubscription: {
          callbackUrl: webhookCallbackUrl,
          format: 'JSON',
        },
      }
    )

    const userErrors = result.data?.webhookSubscriptionCreate?.userErrors ?? []
    if (userErrors.length > 0) {
      console.error('Shopify webhook setup userErrors:', userErrors)
      return NextResponse.json({ error: userErrors[0].message }, { status: 400 })
    }

    const webhook = result.data?.webhookSubscriptionCreate?.webhookSubscription
    console.log(`Webhook registered for ${store.name}: ${webhook?.id}`)

    return NextResponse.json({
      success: true,
      store: store.name,
      webhook,
      callbackUrl: webhookCallbackUrl,
    })
  } catch (err) {
    console.error('Error registering Shopify webhook:', err)
    return NextResponse.json(
      { error: 'Failed to register webhook with Shopify' },
      { status: 500 }
    )
  }
}
