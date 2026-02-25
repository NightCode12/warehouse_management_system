import { NextResponse } from 'next/server'

// Facilis Syncore Orders API Route
// Pulls B2B orders from Syncore and syncs to Supabase
// Docs: https://docs.syncore.app/docs/syncore/lqlzo8hwoz76g-authentication
// Requires: FACILIS_API_KEY env var

export async function GET() {
  // TODO: Implement when Facilis API keys are issued
  // 1. Authenticate with Syncore API (API Key auth)
  // 2. Fetch Sales Orders: GET /api/v1/sales-orders
  // 3. Fetch Line Items for each order
  // 4. Map to our orders schema (source = 'facilis')
  // 5. Upsert into Supabase orders + order_items tables
  // 6. Return sync summary

  return NextResponse.json({
    message: 'Facilis Syncore orders sync endpoint — awaiting API keys',
    docs: 'https://docs.syncore.app/docs/syncore/lqlzo8hwoz76g-authentication',
    status: 'pending_credentials',
  })
}

export async function POST() {
  // TODO: Two-way status sync
  // When an order is shipped in WMS, update status in Syncore
  // POST /api/v1/sales-orders/{id}/status

  return NextResponse.json({
    message: 'Facilis status sync endpoint — awaiting API keys',
    status: 'pending_credentials',
  })
}
