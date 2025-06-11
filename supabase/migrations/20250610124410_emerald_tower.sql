/*
  # Create warehouses table

  1. New Tables
    - `warehouses`
      - `id` (uuid, primary key)
      - `name` (varchar, unique warehouse name)
      - `address_id` (uuid, foreign key to addresses)
      - `capacity_cylinders` (integer, storage capacity)
      - `created_at` (timestamptz, auto-generated)

  2. Security
    - Enable RLS on `warehouses` table
    - Add policies for authenticated users to manage warehouses

  3. Constraints
    - Foreign key constraint to addresses table
    - Unique constraint on warehouse name
*/

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) UNIQUE NOT NULL,
  address_id UUID REFERENCES addresses(id),
  capacity_cylinders INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON warehouses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON warehouses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON warehouses
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON warehouses
  FOR DELETE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_warehouses_name ON warehouses(name);
CREATE INDEX IF NOT EXISTS idx_warehouses_address_id ON warehouses(address_id);