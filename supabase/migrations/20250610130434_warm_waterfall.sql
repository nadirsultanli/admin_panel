/*
  # Enhanced Address Schema

  1. New Columns Added to Addresses
    - `country` (char(2)) - Country code with US default
    - `latitude` (numeric(9,6)) - GPS latitude coordinate
    - `longitude` (numeric(9,6)) - GPS longitude coordinate  
    - `delivery_window_start` (time) - Delivery window start time
    - `delivery_window_end` (time) - Delivery window end time

  2. Security
    - Maintains existing RLS policies
    - Adds indexes for coordinates and delivery windows
*/

-- Add new columns to addresses table
DO $$
BEGIN
  -- Add country column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'country'
  ) THEN
    ALTER TABLE addresses ADD COLUMN country CHAR(2) DEFAULT 'US';
  END IF;

  -- Add latitude column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE addresses ADD COLUMN latitude NUMERIC(9,6);
  END IF;

  -- Add longitude column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE addresses ADD COLUMN longitude NUMERIC(9,6);
  END IF;

  -- Add delivery_window_start column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'delivery_window_start'
  ) THEN
    ALTER TABLE addresses ADD COLUMN delivery_window_start TIME;
  END IF;

  -- Add delivery_window_end column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'addresses' AND column_name = 'delivery_window_end'
  ) THEN
    ALTER TABLE addresses ADD COLUMN delivery_window_end TIME;
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_addresses_country ON addresses(country);
CREATE INDEX IF NOT EXISTS idx_addresses_delivery_window ON addresses(delivery_window_start, delivery_window_end);

-- Update existing coordinates index to include new columns
DROP INDEX IF EXISTS idx_addresses_coordinates;
CREATE INDEX IF NOT EXISTS idx_addresses_coordinates ON addresses(latitude, longitude);