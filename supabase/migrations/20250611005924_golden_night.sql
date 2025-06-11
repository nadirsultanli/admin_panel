/*
  # Fix Products Table RLS Policy for Insert Operations

  1. Security Changes
    - Add INSERT policy for authenticated users to create products
    - This allows the ProductFormModal to successfully create new products
    - Maintains existing security by requiring authentication

  2. Policy Details
    - Policy name: "Authenticated users can create products"
    - Allows INSERT operations for authenticated role
    - No additional restrictions beyond authentication requirement
*/

-- Add INSERT policy for authenticated users to create products
CREATE POLICY "Authenticated users can create products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);