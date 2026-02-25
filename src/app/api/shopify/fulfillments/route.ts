import { NextResponse } from 'next/server'

// Shopify Fulfillments API Route
// Marks orders as fulfilled/shipped in Shopify when shipped in WMS

export async function POST() {
  // TODO: Implement when Shopify admin access is granted
  // 1. Receive order ID from WMS
  // 2. Look up Shopify source_id from orders table
  // 3. POST to Shopify: /admin/api/2024-01/orders/{id}/fulfillments.json
  // 4. Update order status in Supabase

  return NextResponse.json({
    message: 'Shopify fulfillment endpoint — awaiting API credentials',
    status: 'pending_credentials',
  })
}
