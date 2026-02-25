-- Migration: Create inventory_logs table for tracking stock changes
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

CREATE TABLE IF NOT EXISTS inventory_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES inventory(id) ON DELETE SET NULL,
  change_type text NOT NULL CHECK (change_type IN ('received', 'picked', 'adjustment', 'return')),
  quantity_change integer NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups by product
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at DESC);

-- Enable RLS
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read logs
CREATE POLICY "Allow read access to inventory_logs" ON inventory_logs
  FOR SELECT USING (true);

-- Allow all authenticated users to insert logs
CREATE POLICY "Allow insert access to inventory_logs" ON inventory_logs
  FOR INSERT WITH CHECK (true);
