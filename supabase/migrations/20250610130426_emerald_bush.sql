/*
  # Enhanced Customer Schema

  1. New Columns Added to Customers
    - `external_id` (varchar(64), unique) - External system reference
    - `tax_id` (varchar(32), unique) - Tax identification number
    - `account_status` (varchar(16)) - Account status with check constraint
    - `credit_terms_days` (smallint) - Credit terms in days
    - `address` (text) - Legacy address field (keeping existing)

  2. Security
    - Maintains existing RLS policies
    - Adds indexes for new fields
*/

-- Add new columns to customers table
DO $$
BEGIN
  -- Add external_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN external_id VARCHAR(64) UNIQUE;
  END IF;

  -- Add tax_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'tax_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN tax_id VARCHAR(32) UNIQUE;
  END IF;

  -- Add account_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE customers ADD COLUMN account_status VARCHAR(16) DEFAULT 'active';
  END IF;

  -- Add credit_terms_days column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'credit_terms_days'
  ) THEN
    ALTER TABLE customers ADD COLUMN credit_terms_days SMALLINT DEFAULT 30;
  END IF;
END $$;

-- Add check constraint for account_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'customers_account_status_check'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_account_status_check 
    CHECK (account_status IN ('active', 'credit_hold', 'closed'));
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_customers_external_id ON customers(external_id);
CREATE INDEX IF NOT EXISTS idx_customers_tax_id ON customers(tax_id);
CREATE INDEX IF NOT EXISTS idx_customers_account_status ON customers(account_status);