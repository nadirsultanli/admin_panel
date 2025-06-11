/*
  # Security Enhancements for Production

  1. Row Level Security
    - Strengthen RLS policies for all tables
    - Add proper authentication checks
    - Implement role-based access control

  2. Database Indexes
    - Add missing indexes for performance
    - Optimize query performance

  3. Security Functions
    - Add helper functions for security checks
*/

-- Ensure RLS is enabled on all tables
DO $$ 
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT IN ('schema_migrations')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', table_record.tablename);
  END LOOP;
END $$;

-- Create admin role check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in JWT claims
  RETURN (current_setting('request.jwt.claims', true)::json->>'role' = 'admin');
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user owns a record
CREATE OR REPLACE FUNCTION auth_user_owns_record(record_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if authenticated user ID matches the record's user ID
  RETURN auth.uid() = record_user_id::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Strengthen customers table policies
DROP POLICY IF EXISTS "Allow all for development" ON customers;
DROP POLICY IF EXISTS "Service role bypass" ON customers;

-- Admin users can view all customers
CREATE POLICY "Admins can view all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admin users can manage all customers
CREATE POLICY "Admins can manage all customers"
  ON customers
  USING (is_admin());

-- Users can view their own customer record
CREATE POLICY "Users can view own customer record"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = id::text OR 
    phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
  );

-- Users can update their own customer record
CREATE POLICY "Users can update own customer record"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = id::text OR 
    phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
  )
  WITH CHECK (
    auth.uid()::text = id::text OR 
    phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
  );

-- Strengthen addresses table policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON addresses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON addresses;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON addresses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON addresses;

-- Admin users can manage all addresses
CREATE POLICY "Admins can manage all addresses"
  ON addresses
  USING (is_admin());

-- Users can view addresses for their customer record
CREATE POLICY "Users can view own addresses"
  ON addresses
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  );

-- Users can manage addresses for their customer record
CREATE POLICY "Users can manage own addresses"
  ON addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  );

CREATE POLICY "Users can update own addresses"
  ON addresses
  FOR UPDATE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  );

CREATE POLICY "Users can delete own addresses"
  ON addresses
  FOR DELETE
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  );

-- Strengthen orders table policies
DROP POLICY IF EXISTS "Allow all for development" ON orders;
DROP POLICY IF EXISTS "Service role bypass" ON orders;

-- Admin users can manage all orders
CREATE POLICY "Admins can manage all orders"
  ON orders
  USING (is_admin());

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  );

-- Users can create orders for themselves
CREATE POLICY "Users can create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  );

-- Users can update their own draft/pending orders
CREATE POLICY "Users can update own draft orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    status IN ('draft', 'pending') AND
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  )
  WITH CHECK (
    status IN ('draft', 'pending') AND
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  );

-- Users can cancel their own orders that aren't delivered/cancelled
CREATE POLICY "Users can cancel own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    status NOT IN ('delivered', 'cancelled') AND
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  )
  WITH CHECK (
    NEW.status = 'cancelled' AND
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  );

-- Strengthen order_lines table policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON order_lines;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON order_lines;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON order_lines;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON order_lines;

-- Admin users can manage all order lines
CREATE POLICY "Admins can manage all order lines"
  ON order_lines
  USING (is_admin());

-- Users can view order lines for their orders
CREATE POLICY "Users can view own order lines"
  ON order_lines
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (
        SELECT id FROM customers
        WHERE auth.uid()::text = id::text OR 
              phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
      )
    )
  );

-- Users can manage order lines for their draft orders
CREATE POLICY "Users can manage own draft order lines"
  ON order_lines
  FOR ALL
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE status = 'draft' AND
      customer_id IN (
        SELECT id FROM customers
        WHERE auth.uid()::text = id::text OR 
              phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
      )
    )
  );

-- Strengthen products table policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;

-- Anyone can view active products
CREATE POLICY "Anyone can view active products"
  ON products
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Admin users can view all products
CREATE POLICY "Admins can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Only admins can manage products
CREATE POLICY "Admins can manage products"
  ON products
  USING (is_admin());

-- Strengthen inventory_balance table policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON inventory_balance;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inventory_balance;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_balance;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON inventory_balance;

-- Anyone can view inventory levels
CREATE POLICY "Anyone can view inventory levels"
  ON inventory_balance
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage inventory
CREATE POLICY "Admins can manage inventory"
  ON inventory_balance
  USING (is_admin());

-- Strengthen warehouses table policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON warehouses;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON warehouses;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON warehouses;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON warehouses;

-- Anyone can view warehouses
CREATE POLICY "Anyone can view warehouses"
  ON warehouses
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage warehouses
CREATE POLICY "Admins can manage warehouses"
  ON warehouses
  USING (is_admin());

-- Add missing indexes for performance
-- Customers table
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Orders table
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);

-- Products table
CREATE INDEX IF NOT EXISTS idx_products_capacity_kg ON products(capacity_kg);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Inventory balance
CREATE INDEX IF NOT EXISTS idx_inventory_balance_product_warehouse ON inventory_balance(product_id, warehouse_id);

-- Create audit log table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Create audit log trigger function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB := null;
  new_data JSONB := null;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    old_data := to_jsonb(OLD);
    INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, old_data, new_data, auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, old_data, new_data, auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    new_data := to_jsonb(NEW);
    INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, old_data, new_data, auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit log triggers to important tables
CREATE TRIGGER audit_customers_changes
AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_orders_changes
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_inventory_balance_changes
AFTER INSERT OR UPDATE OR DELETE ON inventory_balance
FOR EACH ROW EXECUTE FUNCTION log_audit_event();