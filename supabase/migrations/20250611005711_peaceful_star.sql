/*
  # Fix Customer RLS Policies

  1. Changes
     - Drop problematic insert policy
     - Create a new permissive insert policy for authenticated users
     - Update select and update policies to use correct auth functions
     - Ensure proper access control for customer records

  2. Security
     - Allows authenticated users to create customers
     - Restricts viewing and updating to appropriate users
     - Uses auth.uid() instead of uid() function
*/

-- Drop the existing problematic insert policy
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;

-- Create a new, more permissive insert policy for authenticated users
CREATE POLICY "Authenticated users can create customers"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure the policy for users to view their own customer record works properly
-- This policy should allow users to see customers they created or that match their phone
DROP POLICY IF EXISTS "Users can view own customer record" ON public.customers;

CREATE POLICY "Users can view own customer record"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user ID matches customer ID
    (auth.uid())::text = id::text
    OR
    -- Allow if user's phone matches customer phone (from JWT claims)
    phone::text = (current_setting('request.jwt.claims'::text, true))::json ->> 'phone'::text
    OR
    -- Allow if user is admin
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text
  );

-- Ensure the update policy works properly
DROP POLICY IF EXISTS "Users can update own customer record" ON public.customers;

CREATE POLICY "Users can update own customer record"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if user ID matches customer ID
    (auth.uid())::text = id::text
    OR
    -- Allow if user's phone matches customer phone (from JWT claims)
    phone::text = (current_setting('request.jwt.claims'::text, true))::json ->> 'phone'::text
    OR
    -- Allow if user is admin
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text
  )
  WITH CHECK (
    -- Same conditions for the check
    (auth.uid())::text = id::text
    OR
    phone::text = (current_setting('request.jwt.claims'::text, true))::json ->> 'phone'::text
    OR
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'admin'::text
  );