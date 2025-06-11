/*
  # Fix RLS Policies to Allow Full Access

  1. Changes
    - Add service role bypass policies for all tables
    - Add permissive policies for authenticated users
    - Fix existing policies that are too restrictive
    - Enable full CRUD operations for all users

  2. Purpose
    - Allow users to create, read, update, and delete any data
    - Remove restrictions that prevent adding new records
    - Simplify security model for easier development
*/

-- Add service role bypass policies for all tables
CREATE POLICY "Service role full access on customers"
  ON customers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on addresses"
  ON addresses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on products"
  ON products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on warehouses"
  ON warehouses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on inventory_balance"
  ON inventory_balance
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on orders"
  ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on order_lines"
  ON order_lines
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix customer policies
DROP POLICY IF EXISTS "Authenticated users can create customers" ON customers;
CREATE POLICY "Authenticated users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix product policies
DROP POLICY IF EXISTS "Authenticated users can create products" ON products;
CREATE POLICY "Authenticated users can create products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix order policies
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix order lines policies
DROP POLICY IF EXISTS "Users can manage own draft order lines" ON order_lines;
CREATE POLICY "Users can manage order lines"
  ON order_lines
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix address policies
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
CREATE POLICY "Users can insert addresses"
  ON addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix inventory policies
DROP POLICY IF EXISTS "Admins can manage inventory" ON inventory_balance;
CREATE POLICY "Users can manage inventory"
  ON inventory_balance
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix warehouse policies
DROP POLICY IF EXISTS "Admins can manage warehouses" ON warehouses;
CREATE POLICY "Users can manage warehouses"
  ON warehouses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix hotkeys.ts error