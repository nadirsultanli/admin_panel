/*
  # Create inventory_balance table

  1. New Tables
    - `inventory_balance`
      - `id` (uuid, primary key)
      - `warehouse_id` (uuid, foreign key to warehouses)
      - `product_id` (uuid, foreign key to products)
      - `qty_full` (integer, default 0)
      - `qty_empty` (integer, default 0)
      - `qty_reserved` (integer, default 0)
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `inventory_balance` table
    - Add policies for authenticated users

  3. Indexes
    - Add indexes for warehouse_id and product_id for performance
*/

CREATE TABLE IF NOT EXISTS inventory_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  qty_full integer NOT NULL DEFAULT 0,
  qty_empty integer NOT NULL DEFAULT 0,
  qty_reserved integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
  ON inventory_balance
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON inventory_balance
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON inventory_balance
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users"
  ON inventory_balance
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_balance_warehouse_id ON inventory_balance(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_product_id ON inventory_balance(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_balance_updated_at ON inventory_balance(updated_at);