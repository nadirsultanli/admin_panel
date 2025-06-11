/*
  # Create products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `sku` (varchar, unique stock keeping unit)
      - `name` (varchar, required product name)
      - `description` (text, product description)
      - `unit_of_measure` (varchar, enum: cylinder/kg)
      - `capacity_kg` (numeric, product capacity in kg)
      - `tare_weight_kg` (numeric, empty weight in kg)
      - `valve_type` (varchar, valve specification)
      - `status` (varchar, enum: active/end_of_sale/obsolete)
      - `barcode_uid` (varchar, unique barcode identifier)
      - `created_at` (timestamptz, auto-generated)

  2. Security
    - Enable RLS on `products` table
    - Add policies for authenticated users to manage products

  3. Indexes
    - Unique index on SKU for fast product lookups
    - Index on status for filtering active products
    - Index on barcode_uid for scanning operations
*/

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  unit_of_measure VARCHAR(12) CHECK (unit_of_measure IN ('cylinder','kg')),
  capacity_kg NUMERIC(6,2),
  tare_weight_kg NUMERIC(6,2),
  valve_type VARCHAR(20),
  status VARCHAR(16) DEFAULT 'active' CHECK (status IN ('active','end_of_sale','obsolete')),
  barcode_uid VARCHAR(64) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON products
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON products
  FOR DELETE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_barcode_uid ON products(barcode_uid);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_unit_of_measure ON products(unit_of_measure);