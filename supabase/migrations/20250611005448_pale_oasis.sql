/*
  # Fix Customer Insert Policy

  1. Security Changes
    - Add INSERT policy for customers table to allow authenticated users to create new customers
    - This resolves the RLS violation error when creating customers through the admin interface

  The current policies only allow users to view/update their own records, but there's no policy
  allowing the creation of new customer records. This migration adds that missing policy.
*/

-- Add INSERT policy for customers table
CREATE POLICY "Authenticated users can insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);