/*
  # Create inventory_balance table

  1. New Tables
    - `inventory_balance`
      - `id` (uuid, primary key)
      - `warehouse_id` (uuid, foreign key to warehouses)
      - `product_id` (uuid, foreign key to products)
      - `qty_full` (integer, quantity of full cylinders)
      - `qty_empty` (integer, quantity of empty cylinders)
      - `qty_reserved` (integer, quantity reserved for orders)
      - `updated_at` (timestamptz, last update timestamp)

  2. Security
    - Enable RLS on `inventory_balance` table
    - Add policies for authenticated users to manage inventory

  3. Constraints
    - Foreign key constraints with cascade delete for warehouse
    - Unique constraint on warehouse_id + product_id combination
    - Check constraints to ensure non-negative quantities
*/

CREATE TABLE IF NOT EXISTS inventory_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  qty_full INTEGER NOT NULL DEFAULT 0 CHECK (qty_full >= 0),
  qty_empty INTEGER NOT NULL DEFAULT 0 CHECK (qty_empty >= 0),
  qty_reserved INTEGER NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE inventory_balance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON inventory_balance
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON inventory_balance
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON inventory_balance
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON inventory_balance
  FOR DELETE TO authenticated USING (true);

-- Create unique constraint on warehouse + product combination
ALTER TABLE inventory_balance 
ADD CONSTRAINT unique_warehouse_product UNIQUE (warehouse_id, product_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory_balance(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory_balance(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_qty_full ON inventory_balance(qty_full);

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_balance_updated_at BEFORE UPDATE ON inventory_balance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();