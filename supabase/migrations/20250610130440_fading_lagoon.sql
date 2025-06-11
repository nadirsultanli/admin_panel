/*
  # Enhanced Product Schema

  1. New Columns Added to Products
    - `unit_of_measure` (varchar(12)) - Unit of measure with check constraint
    - `valve_type` (varchar(20)) - Type of valve on cylinder
    - `barcode_uid` (varchar(64), unique) - Barcode unique identifier

  2. Updates to Existing Columns
    - Update status check constraint to include new values
    - Ensure capacity_kg and tare_weight_kg are proper numeric types

  3. Security
    - Maintains existing RLS policies
    - Adds indexes for new fields
*/

-- Add new columns to products table
DO $$
BEGIN
  -- Add unit_of_measure column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit_of_measure'
  ) THEN
    ALTER TABLE products ADD COLUMN unit_of_measure VARCHAR(12);
  END IF;

  -- Add valve_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'valve_type'
  ) THEN
    ALTER TABLE products ADD COLUMN valve_type VARCHAR(20);
  END IF;

  -- Add barcode_uid column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'barcode_uid'
  ) THEN
    ALTER TABLE products ADD COLUMN barcode_uid VARCHAR(64) UNIQUE;
  END IF;
END $$;

-- Update capacity_kg and tare_weight_kg to proper numeric types if needed
DO $$
BEGIN
  -- Check if capacity_kg needs type update
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'capacity_kg'
    AND data_type != 'numeric'
  ) THEN
    ALTER TABLE products ALTER COLUMN capacity_kg TYPE NUMERIC(6,2);
  END IF;

  -- Check if tare_weight_kg needs type update
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'tare_weight_kg'
    AND data_type != 'numeric'
  ) THEN
    ALTER TABLE products ALTER COLUMN tare_weight_kg TYPE NUMERIC(6,2);
  END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
  -- Add unit_of_measure check constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'products_unit_of_measure_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_unit_of_measure_check 
    CHECK (unit_of_measure IN ('cylinder', 'kg'));
  END IF;

  -- Drop existing status check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'products_status_check'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_status_check;
  END IF;

  -- Add updated status check constraint
  ALTER TABLE products ADD CONSTRAINT products_status_check 
  CHECK (status IN ('active', 'end_of_sale', 'obsolete'));
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_products_valve_type ON products(valve_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_uid ON products(barcode_uid);