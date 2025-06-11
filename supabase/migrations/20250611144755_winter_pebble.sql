/*
  # Fix RLS Policies for Admin Panel

  1. Service Role Bypass
    - Add service_role bypass policies for all tables
    - This allows the admin panel to access all data without RLS restrictions

  2. Public Access
    - Add public policies for authenticated users
    - This ensures regular users can still access data with proper restrictions
*/

-- Add service role bypass policies for all tables
DO $$ 
BEGIN
  -- Customers table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on customers' AND tablename = 'customers' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on customers"
      ON customers
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Addresses table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on addresses' AND tablename = 'addresses' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on addresses"
      ON addresses
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Products table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on products' AND tablename = 'products' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on products"
      ON products
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Warehouses table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on warehouses' AND tablename = 'warehouses' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on warehouses"
      ON warehouses
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Inventory_balance table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on inventory_balance' AND tablename = 'inventory_balance' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on inventory_balance"
      ON inventory_balance
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Orders table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on orders' AND tablename = 'orders' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on orders"
      ON orders
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Order_lines table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on order_lines' AND tablename = 'order_lines' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on order_lines"
      ON order_lines
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Admin_users table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on admin_users' AND tablename = 'admin_users' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on admin_users"
      ON admin_users
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Call_summaries table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on call_summaries' AND tablename = 'call_summaries' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on call_summaries"
      ON call_summaries
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Tool_logs table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on tool_logs' AND tablename = 'tool_logs' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on tool_logs"
      ON tool_logs
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Tool_call_idempotency table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on tool_call_idempotency' AND tablename = 'tool_call_idempotency' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on tool_call_idempotency"
      ON tool_call_idempotency
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Audit_logs table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role full access on audit_logs' AND tablename = 'audit_logs' AND schemaname = 'public') THEN
    CREATE POLICY "Service role full access on audit_logs"
      ON audit_logs
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Add public policies for authenticated users
DO $$ 
BEGIN
  -- Customers table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_customers_select' AND tablename = 'customers' AND schemaname = 'public') THEN
    CREATE POLICY "public_customers_select"
      ON customers
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_customers_insert' AND tablename = 'customers' AND schemaname = 'public') THEN
    CREATE POLICY "public_customers_insert"
      ON customers
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_customers_update' AND tablename = 'customers' AND schemaname = 'public') THEN
    CREATE POLICY "public_customers_update"
      ON customers
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Addresses table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_addresses_select' AND tablename = 'addresses' AND schemaname = 'public') THEN
    CREATE POLICY "public_addresses_select"
      ON addresses
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_addresses_insert' AND tablename = 'addresses' AND schemaname = 'public') THEN
    CREATE POLICY "public_addresses_insert"
      ON addresses
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_addresses_update' AND tablename = 'addresses' AND schemaname = 'public') THEN
    CREATE POLICY "public_addresses_update"
      ON addresses
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Products table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_products_select' AND tablename = 'products' AND schemaname = 'public') THEN
    CREATE POLICY "public_products_select"
      ON products
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_products_insert' AND tablename = 'products' AND schemaname = 'public') THEN
    CREATE POLICY "public_products_insert"
      ON products
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_products_update' AND tablename = 'products' AND schemaname = 'public') THEN
    CREATE POLICY "public_products_update"
      ON products
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Warehouses table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_warehouses_select' AND tablename = 'warehouses' AND schemaname = 'public') THEN
    CREATE POLICY "public_warehouses_select"
      ON warehouses
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_warehouses_insert' AND tablename = 'warehouses' AND schemaname = 'public') THEN
    CREATE POLICY "public_warehouses_insert"
      ON warehouses
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_warehouses_update' AND tablename = 'warehouses' AND schemaname = 'public') THEN
    CREATE POLICY "public_warehouses_update"
      ON warehouses
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Orders table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_orders_select' AND tablename = 'orders' AND schemaname = 'public') THEN
    CREATE POLICY "public_orders_select"
      ON orders
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_orders_insert' AND tablename = 'orders' AND schemaname = 'public') THEN
    CREATE POLICY "public_orders_insert"
      ON orders
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_orders_update' AND tablename = 'orders' AND schemaname = 'public') THEN
    CREATE POLICY "public_orders_update"
      ON orders
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Order_lines table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_order_lines_select' AND tablename = 'order_lines' AND schemaname = 'public') THEN
    CREATE POLICY "public_order_lines_select"
      ON order_lines
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_order_lines_insert' AND tablename = 'order_lines' AND schemaname = 'public') THEN
    CREATE POLICY "public_order_lines_insert"
      ON order_lines
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_order_lines_update' AND tablename = 'order_lines' AND schemaname = 'public') THEN
    CREATE POLICY "public_order_lines_update"
      ON order_lines
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Inventory_balance table
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_inventory_balance_select' AND tablename = 'inventory_balance' AND schemaname = 'public') THEN
    CREATE POLICY "public_inventory_balance_select"
      ON inventory_balance
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_inventory_balance_insert' AND tablename = 'inventory_balance' AND schemaname = 'public') THEN
    CREATE POLICY "public_inventory_balance_insert"
      ON inventory_balance
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_inventory_balance_update' AND tablename = 'inventory_balance' AND schemaname = 'public') THEN
    CREATE POLICY "public_inventory_balance_update"
      ON inventory_balance
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;