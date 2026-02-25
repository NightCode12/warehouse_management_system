import { NextResponse } from 'next/server'

// Shopify Orders API Route
// Pulls orders from all 7 Shopify stores and syncs to Supabase
// Requires: SHOPIFY_<STORE>_URL and SHOPIFY_<STORE>_TOKEN env vars per store

const SHOPIFY_STORES = [
  { key: 'FEDERAL_DONUTS', name: 'Federal Donuts' },
  { key: 'UNDERDOG', name: 'Underdog' },
  { key: 'ZAHAV', name: 'Zahav' },
  { key: 'LASER_WOLF', name: 'Laser Wolf' },
  { key: 'GOLDIE', name: 'Goldie' },
  { key: 'KFAR', name: "K'Far" },
  { key: 'DIZENGOFF', name: 'Dizengoff' },
]

export async function GET() {
  // TODO: Implement when Shopify admin access is granted
  // For each store:
  //   1. Fetch orders from Shopify REST API: GET /admin/api/2024-01/orders.json
  //   2. Map to our orders schema (source = 'shopify')
  //   3. Upsert into Supabase orders + order_items tables
  //   4. Return sync summary

  return NextResponse.json({
    message: 'Shopify orders sync endpoint — awaiting API credentials',
    stores: SHOPIFY_STORES.map(s => s.name),
    status: 'pending_credentials',
  })
}

export async function POST() {
  // TODO: Webhook endpoint for Shopify order notifications
  // Shopify can POST to this endpoint when new orders are created

  return NextResponse.json({
    message: 'Shopify webhook endpoint — not yet configured',
  })
}
