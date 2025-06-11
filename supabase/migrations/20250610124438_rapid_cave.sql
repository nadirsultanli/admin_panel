/*
  # Create order_lines table

  1. New Tables
    - `order_lines`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `product_id` (uuid, foreign key to products)
      - `quantity` (integer, required quantity ordered)
      - `unit_price` (numeric, price per unit)
      - `subtotal` (numeric, calculated line total)

  2. Security
    - Enable RLS on `order_lines` table
    - Add policies for authenticated users to manage order lines

  3. Constraints
    - Foreign key constraint to orders with cascade delete
    - Foreign key constraint to products
    - Check constraints for positive quantities and prices
    - Trigger to automatically calculate subtotal
*/

CREATE TABLE IF NOT EXISTS order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12,2) CHECK (subtotal >= 0)
);

-- Enable Row Level Security
ALTER TABLE order_lines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON order_lines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON order_lines
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON order_lines
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON order_lines
  FOR DELETE TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_lines_order_id ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_product_id ON order_lines(product_id);

-- Function to calculate subtotal automatically
CREATE OR REPLACE FUNCTION calculate_order_line_subtotal()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate subtotal on insert/update
CREATE TRIGGER trigger_calculate_order_line_subtotal
  BEFORE INSERT OR UPDATE ON order_lines
  FOR EACH ROW
  EXECUTE FUNCTION calculate_order_line_subtotal();

-- Function to update order total when order lines change
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
DECLARE
  order_total NUMERIC(12,2);
BEGIN
  -- Calculate new total for the order
  SELECT COALESCE(SUM(subtotal), 0) INTO order_total
  FROM order_lines
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
  
  -- Update the order total
  UPDATE orders 
  SET total_amount = order_total,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to update order total when order lines change
CREATE TRIGGER trigger_update_order_total_insert
  AFTER INSERT ON order_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trigger_update_order_total_update
  AFTER UPDATE ON order_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trigger_update_order_total_delete
  AFTER DELETE ON order_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();