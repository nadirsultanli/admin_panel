/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `delivery_address_id` (uuid, foreign key to addresses)
      - `order_date` (date, required order date)
      - `scheduled_date` (date, optional scheduled delivery date)
      - `status` (varchar, enum order status)
      - `total_amount` (numeric, order total amount)
      - `created_at` (timestamptz, auto-generated)
      - `updated_at` (timestamptz, auto-updated)

  2. Security
    - Enable RLS on `orders` table
    - Add policies for authenticated users to manage orders

  3. Constraints
    - Foreign key constraints to customers and addresses
    - Check constraint for valid status values
    - Check constraint for non-negative total amount
*/

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  delivery_address_id UUID REFERENCES addresses(id),
  order_date DATE NOT NULL,
  scheduled_date DATE,
  status VARCHAR(16) DEFAULT 'draft' CHECK (status IN ('draft','confirmed','scheduled','en_route','delivered','invoiced','cancelled')),
  total_amount NUMERIC(12,2) CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON orders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON orders
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON orders
  FOR DELETE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address_id ON orders(delivery_address_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_date ON orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();