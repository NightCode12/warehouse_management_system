-- Migration: Add tracking_company column to orders table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_company text;
