/*
  # Fix Customer Insert RLS Policy

  1. Security Updates
    - Update the customer insert policy to allow authenticated users to create customers
    - Ensure the policy allows proper customer creation workflow
    - Maintain security while enabling functionality

  2. Changes
    - Modify existing insert policy to be more permissive for customer creation
    - Keep existing policies for other operations intact
*/

-- Drop the existing problematic insert policy
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;

-- Create a new, more permissive insert policy for authenticated users
CREATE POLICY "Authenticated users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure the policy for users to view their own customer record works properly
-- This policy should allow users to see customers they created or that match their phone
DROP POLICY IF EXISTS "Users can view own customer record" ON customers;

CREATE POLICY "Users can view own customer record"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user ID matches customer ID
    (uid())::text = id::text
    OR
    -- Allow if user's phone matches customer phone (from JWT claims)
    phone::text = (jwt() ->> 'phone'::text)
    OR
    -- Allow if user is admin
    is_admin()
  );

-- Ensure the update policy works properly
DROP POLICY IF EXISTS "Users can update own customer record" ON customers;

CREATE POLICY "Users can update own customer record"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if user ID matches customer ID
    (uid())::text = id::text
    OR
    -- Allow if user's phone matches customer phone (from JWT claims)
    phone::text = (jwt() ->> 'phone'::text)
    OR
    -- Allow if user is admin
    is_admin()
  )
  WITH CHECK (
    -- Same conditions for the check
    (uid())::text = id::text
    OR
    phone::text = (jwt() ->> 'phone'::text)
    OR
    is_admin()
  );