/*
  # Fix RLS Policies to Allow Full Access
  
  1. Changes
     - Add service role bypass policies with existence checks
     - Fix customer, product, order, and other policies to be more permissive
     - Allow authenticated users to create and manage all data
     
  2. Purpose
     - Remove restrictions that prevent users from adding/editing data
     - Make the system usable for demonstration purposes
*/

-- Add service role bypass policies for all tables (with existence checks)
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
END $$;

-- Fix customer policies
DROP POLICY IF EXISTS "Authenticated users can create customers" ON customers;
DROP POLICY IF EXISTS "Users can view own customer record" ON customers;
DROP POLICY IF EXISTS "Users can update own customer record" ON customers;

-- Create permissive customer policies
CREATE POLICY "Authenticated users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);

-- Fix product policies
DROP POLICY IF EXISTS "Authenticated users can create products" ON products;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- Create permissive product policies
CREATE POLICY "Authenticated users can create products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);

-- Fix order policies
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own draft orders" ON orders;
DROP POLICY IF EXISTS "Users can cancel own orders" ON orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;

-- Create permissive order policies
CREATE POLICY "Authenticated users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);

-- Fix order lines policies
DROP POLICY IF EXISTS "Users can manage own draft order lines" ON order_lines;
DROP POLICY IF EXISTS "Users can view own order lines" ON order_lines;
DROP POLICY IF EXISTS "Admins can manage all order lines" ON order_lines;

-- Create permissive order lines policies
CREATE POLICY "Authenticated users can manage order lines"
  ON order_lines
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix address policies
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
DROP POLICY IF EXISTS "Admins can manage all addresses" ON addresses;

-- Create permissive address policies
CREATE POLICY "Authenticated users can insert addresses"
  ON addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view addresses"
  ON addresses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update addresses"
  ON addresses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete addresses"
  ON addresses
  FOR DELETE
  TO authenticated
  USING (true);

-- Fix inventory policies
DROP POLICY IF EXISTS "Admins can manage inventory" ON inventory_balance;
DROP POLICY IF EXISTS "Anyone can view inventory levels" ON inventory_balance;

-- Create permissive inventory policies
CREATE POLICY "Authenticated users can manage inventory"
  ON inventory_balance
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix warehouse policies
DROP POLICY IF EXISTS "Admins can manage warehouses" ON warehouses;
DROP POLICY IF EXISTS "Anyone can view warehouses" ON warehouses;

-- Create permissive warehouse policies
CREATE POLICY "Authenticated users can manage warehouses"
  ON warehouses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);