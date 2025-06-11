/*
  # Create addresses table

  1. New Tables
    - `addresses`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `label` (varchar, address nickname/label)
      - `line1` (varchar, required address line 1)
      - `line2` (varchar, optional address line 2)
      - `city` (varchar, required city)
      - `state` (varchar, state/province)
      - `postal_code` (varchar, zip/postal code)
      - `country` (char, 2-letter country code, defaults to US)
      - `latitude` (decimal, GPS coordinates)
      - `longitude` (decimal, GPS coordinates)
      - `delivery_window_start` (time, delivery window start)
      - `delivery_window_end` (time, delivery window end)
      - `is_primary` (boolean, primary address flag)
      - `instructions` (text, delivery instructions)
      - `created_at` (timestamptz, auto-generated)

  2. Security
    - Enable RLS on `addresses` table
    - Add policies for authenticated users to manage addresses

  3. Constraints
    - Foreign key constraint to customers table with cascade delete
    - Check constraint to ensure only one primary address per customer
*/

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  label VARCHAR(60),
  line1 VARCHAR(120) NOT NULL,
  line2 VARCHAR(120),
  city VARCHAR(60) NOT NULL,
  state VARCHAR(60),
  postal_code VARCHAR(20),
  country CHAR(2) DEFAULT 'US',
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  delivery_window_start TIME,
  delivery_window_end TIME,
  is_primary BOOLEAN DEFAULT FALSE,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON addresses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON addresses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON addresses
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON addresses
  FOR DELETE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_primary ON addresses(is_primary);
CREATE INDEX IF NOT EXISTS idx_addresses_postal_code ON addresses(postal_code);
CREATE INDEX IF NOT EXISTS idx_addresses_coordinates ON addresses(latitude, longitude);

-- Function to ensure only one primary address per customer
CREATE OR REPLACE FUNCTION ensure_single_primary_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    -- Set all other addresses for this customer to non-primary
    UPDATE addresses 
    SET is_primary = FALSE 
    WHERE customer_id = NEW.customer_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single primary address
CREATE TRIGGER trigger_ensure_single_primary_address
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_address();