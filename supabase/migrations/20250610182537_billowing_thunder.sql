/*
# Security Enhancements for Production

1. Security Functions
   - Admin role check function
   - User record ownership function
   - Policy existence check function

2. Row Level Security
   - Enable RLS on all tables
   - Strengthen policies for all tables
   - Add proper authentication checks
   - Implement role-based access control

3. Database Indexes
   - Add missing indexes for performance
   - Optimize query performance

4. Audit Logging
   - Create audit log table
   - Add trigger function for change tracking
   - Apply triggers to important tables
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

-- Check if policy exists before creating it
CREATE OR REPLACE FUNCTION policy_exists(policy_name text, table_name text) 
RETURNS boolean AS $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE policyname = policy_name
  AND tablename = table_name
  AND schemaname = 'public';
  
  RETURN policy_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Strengthen customers table policies
DO $$ 
BEGIN
  -- Drop development policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for development' AND tablename = 'customers' AND schemaname = 'public') THEN
    DROP POLICY "Allow all for development" ON customers;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role bypass' AND tablename = 'customers' AND schemaname = 'public') THEN
    DROP POLICY "Service role bypass" ON customers;
  END IF;
  
  -- Create admin view policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all customers' AND tablename = 'customers' AND schemaname = 'public') THEN
    CREATE POLICY "Admins can view all customers"
      ON customers
      FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
  
  -- Create admin manage policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all customers' AND tablename = 'customers' AND schemaname = 'public') THEN
    CREATE POLICY "Admins can manage all customers"
      ON customers
      FOR ALL
      TO authenticated
      USING (is_admin());
  END IF;
  
  -- Create user view policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own customer record' AND tablename = 'customers' AND schemaname = 'public') THEN
    CREATE POLICY "Users can view own customer record"
      ON customers
      FOR SELECT
      TO authenticated
      USING (
        auth.uid()::text = id::text OR 
        phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
      );
  END IF;
  
  -- Create user update policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own customer record' AND tablename = 'customers' AND schemaname = 'public') THEN
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
  END IF;
END $$;

-- Strengthen addresses table policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete for authenticated users' AND tablename = 'addresses' AND schemaname = 'public') THEN
    DROP POLICY "Enable delete for authenticated users" ON addresses;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert for authenticated users' AND tablename = 'addresses' AND schemaname = 'public') THEN
    DROP POLICY "Enable insert for authenticated users" ON addresses;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for authenticated users' AND tablename = 'addresses' AND schemaname = 'public') THEN
    DROP POLICY "Enable read access for authenticated users" ON addresses;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update for authenticated users' AND tablename = 'addresses' AND schemaname = 'public') THEN
    DROP POLICY "Enable update for authenticated users" ON addresses;
  END IF;
  
  -- Create admin manage policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all addresses' AND tablename = 'addresses' AND schemaname = 'public') THEN
    CREATE POLICY "Admins can manage all addresses"
      ON addresses
      FOR ALL
      TO authenticated
      USING (is_admin());
  END IF;
  
  -- Create user view policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own addresses' AND tablename = 'addresses' AND schemaname = 'public') THEN
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
  END IF;
  
  -- Create user insert policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own addresses' AND tablename = 'addresses' AND schemaname = 'public') THEN
    CREATE POLICY "Users can insert own addresses"
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
  END IF;
  
  -- Create user update policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own addresses' AND tablename = 'addresses' AND schemaname = 'public') THEN
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
  END IF;
  
  -- Create user delete policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own addresses' AND tablename = 'addresses' AND schemaname = 'public') THEN
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
  END IF;
END $$;

-- Strengthen orders table policies
DO $$ 
BEGIN
  -- Drop development policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for development' AND tablename = 'orders' AND schemaname = 'public') THEN
    DROP POLICY "Allow all for development" ON orders;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role bypass' AND tablename = 'orders' AND schemaname = 'public') THEN
    DROP POLICY "Service role bypass" ON orders;
  END IF;
  
  -- Create admin manage policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all orders' AND tablename = 'orders' AND schemaname = 'public') THEN
    CREATE POLICY "Admins can manage all orders"
      ON orders
      FOR ALL
      TO authenticated
      USING (is_admin());
  END IF;
  
  -- Create user view policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own orders' AND tablename = 'orders' AND schemaname = 'public') THEN
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
  END IF;
  
  -- Create user create policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create own orders' AND tablename = 'orders' AND schemaname = 'public') THEN
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
  END IF;
  
  -- Create user update draft policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own draft orders' AND tablename = 'orders' AND schemaname = 'public') THEN
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
  END IF;
END $$;

-- Create cancel orders policy directly (not in DO block to avoid NEW reference issue)
DROP POLICY IF EXISTS "Users can cancel own orders" ON orders;
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
    status = 'cancelled' AND
    customer_id IN (
      SELECT id FROM customers
      WHERE auth.uid()::text = id::text OR 
            phone::text = (current_setting('request.jwt.claims', true)::json->>'phone')
    )
  );

-- Strengthen order_lines table policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete for authenticated users' AND tablename = 'order_lines' AND schemaname = 'public') THEN
    DROP POLICY "Enable delete for authenticated users" ON order_lines;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert for authenticated users' AND tablename = 'order_lines' AND schemaname = 'public') THEN
    DROP POLICY "Enable insert for authenticated users" ON order_lines;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for authenticated users' AND tablename = 'order_lines' AND schemaname = 'public') THEN
    DROP POLICY "Enable read access for authenticated users" ON order_lines;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update for authenticated users' AND tablename = 'order_lines' AND schemaname = 'public') THEN
    DROP POLICY "Enable update for authenticated users" ON order_lines;
  END IF;
  
  -- Create admin manage policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all order lines' AND tablename = 'order_lines' AND schemaname = 'public') THEN
    CREATE POLICY "Admins can manage all order lines"
      ON order_lines
      FOR ALL
      TO authenticated
      USING (is_admin());
  END IF;
  
  -- Create user view policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own order lines' AND tablename = 'order_lines' AND schemaname = 'public') THEN
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
  END IF;
  
  -- Create user manage draft policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own draft order lines' AND tablename = 'order_lines' AND schemaname = 'public') THEN
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
  END IF;
END $$;

-- Strengthen products table policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete for authenticated users' AND tablename = 'products' AND schemaname = 'public') THEN
    DROP POLICY "Enable delete for authenticated users" ON products;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert for authenticated users' AND tablename = 'products' AND schemaname = 'public') THEN
    DROP POLICY "Enable insert for authenticated users" ON products;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for authenticated users' AND tablename = 'products' AND schemaname = 'public') THEN
    DROP POLICY "Enable read access for authenticated users" ON products;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update for authenticated users' AND tablename = 'products' AND schemaname = 'public') THEN
    DROP POLICY "Enable update for authenticated users" ON products;
  END IF;
  
  -- Create view active policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view active products' AND tablename = 'products' AND schemaname = 'public') THEN
    CREATE POLICY "Anyone can view active products"
      ON products
      FOR SELECT
      TO authenticated
      USING (status = 'active');
  END IF;
  
  -- Create admin view policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all products' AND tablename = 'products' AND schemaname = 'public') THEN
    CREATE POLICY "Admins can view all products"
      ON products
      FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
  
  -- Create admin manage policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage products' AND tablename = 'products' AND schemaname = 'public') THEN
    CREATE POLICY "Admins can manage products"
      ON products
      FOR ALL
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- Strengthen inventory_balance table policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete for authenticated users' AND tablename = 'inventory_balance' AND schemaname = 'public') THEN
    DROP POLICY "Enable delete for authenticated users" ON inventory_balance;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert for authenticated users' AND tablename = 'inventory_balance' AND schemaname = 'public') THEN
    DROP POLICY "Enable insert for authenticated users" ON inventory_balance;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for authenticated users' AND tablename = 'inventory_balance' AND schemaname = 'public') THEN
    DROP POLICY "Enable read access for authenticated users" ON inventory_balance;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update for authenticated users' AND tablename = 'inventory_balance' AND schemaname = 'public') THEN
    DROP POLICY "Enable update for authenticated users" ON inventory_balance;
  END IF;
  
  -- Create view policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view inventory levels' AND tablename = 'inventory_balance' AND schemaname = 'public') THEN
    CREATE POLICY "Anyone can view inventory levels"
      ON inventory_balance
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  
  -- Create admin manage policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage inventory' AND tablename = 'inventory_balance' AND schemaname = 'public') THEN
    CREATE POLICY "Admins can manage inventory"
      ON inventory_balance
      FOR ALL
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- Strengthen warehouses table policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable delete for authenticated users' AND tablename = 'warehouses' AND schemaname = 'public') THEN
    DROP POLICY "Enable delete for authenticated users" ON warehouses;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert for authenticated users' AND tablename = 'warehouses' AND schemaname = 'public') THEN
    DROP POLICY "Enable insert for authenticated users" ON warehouses;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for authenticated users' AND tablename = 'warehouses' AND schemaname = 'public') THEN
    DROP POLICY "Enable read access for authenticated users" ON warehouses;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable update for authenticated users' AND tablename = 'warehouses' AND schemaname = 'public') THEN
    DROP POLICY "Enable update for authenticated users" ON warehouses;
  END IF;
  
  -- Create view policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view warehouses' AND tablename = 'warehouses' AND schemaname = 'public') THEN
    CREATE POLICY "Anyone can view warehouses"
      ON warehouses
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
  
  -- Create admin manage policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage warehouses' AND tablename = 'warehouses' AND schemaname = 'public') THEN
    CREATE POLICY "Admins can manage warehouses"
      ON warehouses
      FOR ALL
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- Add missing indexes for performance
DO $$ 
BEGIN
  -- Customers table
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_email' AND tablename = 'customers' AND schemaname = 'public') THEN
    CREATE INDEX idx_customers_email ON customers(email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_created_at' AND tablename = 'customers' AND schemaname = 'public') THEN
    CREATE INDEX idx_customers_created_at ON customers(created_at);
  END IF;
  
  -- Orders table
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_delivery_date' AND tablename = 'orders' AND schemaname = 'public') THEN
    CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_updated_at' AND tablename = 'orders' AND schemaname = 'public') THEN
    CREATE INDEX idx_orders_updated_at ON orders(updated_at);
  END IF;
  
  -- Products table
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_capacity_kg' AND tablename = 'products' AND schemaname = 'public') THEN
    CREATE INDEX idx_products_capacity_kg ON products(capacity_kg);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_created_at' AND tablename = 'products' AND schemaname = 'public') THEN
    CREATE INDEX idx_products_created_at ON products(created_at);
  END IF;
  
  -- Inventory balance
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inventory_balance_product_warehouse' AND tablename = 'inventory_balance' AND schemaname = 'public') THEN
    CREATE INDEX idx_inventory_balance_product_warehouse ON inventory_balance(product_id, warehouse_id);
  END IF;
END $$;

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
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view audit logs' AND tablename = 'audit_logs' AND schemaname = 'public') THEN
    CREATE POLICY "Admins can view audit logs"
      ON audit_logs
      FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

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
DO $$ 
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS audit_customers_changes ON customers;
  DROP TRIGGER IF EXISTS audit_orders_changes ON orders;
  DROP TRIGGER IF EXISTS audit_inventory_balance_changes ON inventory_balance;
  
  -- Create new triggers
  CREATE TRIGGER audit_customers_changes
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
  
  CREATE TRIGGER audit_orders_changes
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
  
  CREATE TRIGGER audit_inventory_balance_changes
  AFTER INSERT OR UPDATE OR DELETE ON inventory_balance
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
END $$;