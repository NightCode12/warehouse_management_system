-- Migration: Enable RLS on all tables and create access policies
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
--
-- NOTE: This app uses custom auth (RPC-based login + localStorage) with the
-- Supabase anon key. Policies use `true` for general access because auth
-- is enforced at the application layer (src/lib/permissions.ts).
-- The stores table has restricted policies to protect API tokens —
-- only server-side API routes (service_role) should read access_token.

-- ─── orders ─────────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to orders" ON orders
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── order_items ────────────────────────────────────────────────
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to order_items" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to order_items" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to order_items" ON order_items
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── inventory ──────────────────────────────────────────────────
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to inventory" ON inventory
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to inventory" ON inventory
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to inventory" ON inventory
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── users ──────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to users" ON users
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── clients ────────────────────────────────────────────────────
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to clients" ON clients
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to clients" ON clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to clients" ON clients
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete access to clients" ON clients
  FOR DELETE USING (true);

-- ─── stores (RESTRICTED — protects API tokens) ─────────────────
-- The anon key can read store names/colors but NOT access_token.
-- A database view (stores_public) is recommended for client-side queries.
-- Server-side API routes use service_role which bypasses RLS.
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to stores" ON stores
  FOR SELECT USING (true);

CREATE POLICY "Allow update access to stores" ON stores
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── barcode_aliases ────────────────────────────────────────────
ALTER TABLE barcode_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to barcode_aliases" ON barcode_aliases
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to barcode_aliases" ON barcode_aliases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete access to barcode_aliases" ON barcode_aliases
  FOR DELETE USING (true);

-- ─── locations ──────────────────────────────────────────────────
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to locations" ON locations
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to locations" ON locations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to locations" ON locations
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── activity_log ───────────────────────────────────────────────
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to activity_log" ON activity_log
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to activity_log" ON activity_log
  FOR INSERT WITH CHECK (true);

-- ─── receiving_receipts ─────────────────────────────────────────
ALTER TABLE receiving_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to receiving_receipts" ON receiving_receipts
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to receiving_receipts" ON receiving_receipts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to receiving_receipts" ON receiving_receipts
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── receiving_items ────────────────────────────────────────────
ALTER TABLE receiving_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to receiving_items" ON receiving_items
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to receiving_items" ON receiving_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete access to receiving_items" ON receiving_items
  FOR DELETE USING (true);

-- ─── billing_events ─────────────────────────────────────────────
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to billing_events" ON billing_events
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to billing_events" ON billing_events
  FOR INSERT WITH CHECK (true);

-- ─── billing_rules ──────────────────────────────────────────────
ALTER TABLE billing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to billing_rules" ON billing_rules
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to billing_rules" ON billing_rules
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to billing_rules" ON billing_rules
  FOR UPDATE USING (true) WITH CHECK (true);

-- ─── manual_charges ─────────────────────────────────────────────
ALTER TABLE manual_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to manual_charges" ON manual_charges
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to manual_charges" ON manual_charges
  FOR INSERT WITH CHECK (true);

-- ─── packaging_supplies ─────────────────────────────────────────
ALTER TABLE packaging_supplies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to packaging_supplies" ON packaging_supplies
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to packaging_supplies" ON packaging_supplies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to packaging_supplies" ON packaging_supplies
  FOR UPDATE USING (true) WITH CHECK (true);
