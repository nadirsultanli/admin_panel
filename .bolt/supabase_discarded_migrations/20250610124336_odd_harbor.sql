/*
  # Create customers table

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `external_id` (varchar, unique, optional external system reference)
      - `name` (varchar, required customer name)
      - `tax_id` (varchar, unique, tax identification number)
      - `phone` (varchar, contact phone number)
      - `email` (varchar, contact email)
      - `account_status` (varchar, enum: active/credit_hold/closed)
      - `credit_terms_days` (smallint, payment terms in days)
      - `created_at` (timestamptz, auto-generated)
      - `updated_at` (timestamptz, auto-updated)

  2. Security
    - Enable RLS on `customers` table
    - Add policy for authenticated users to manage customer data

  3. Indexes
    - Index on external_id for fast lookups
    - Index on tax_id for unique constraint performance
    - Index on account_status for filtering
*/

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(64) UNIQUE,
  name VARCHAR(120) NOT NULL,
  tax_id VARCHAR(32) UNIQUE,
  phone VARCHAR(32),
  email VARCHAR(120),
  account_status VARCHAR(16) DEFAULT 'active' CHECK (account_status IN ('active','credit_hold','closed')),
  credit_terms_days SMALLINT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON customers
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON customers
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON customers
  FOR DELETE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_external_id ON customers(external_id);
CREATE INDEX IF NOT EXISTS idx_customers_tax_id ON customers(tax_id);
CREATE INDEX IF NOT EXISTS idx_customers_account_status ON customers(account_status);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();