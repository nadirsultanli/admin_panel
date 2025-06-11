/*
  # Update orders table structure

  1. New Columns
    - `delivery_address_id` (uuid, foreign key to addresses)
    - `order_date` (date, not null)
    - `scheduled_date` (date, nullable)
    - `total_amount` (numeric(12,2), nullable)

  2. Updated Columns
    - Update `status` check constraint to include new statuses
    - Remove old columns that don't match the new structure

  3. Security
    - Update existing policies as needed

  4. Changes
    - Add foreign key constraint for delivery_address_id
    - Update status values to match new requirements
*/

-- Add new columns to orders table
DO $$
BEGIN
  -- Add delivery_address_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_address_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_address_id uuid REFERENCES addresses(id);
  END IF;

  -- Add order_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_date'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_date date NOT NULL DEFAULT CURRENT_DATE;
  END IF;

  -- Add scheduled_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE orders ADD COLUMN scheduled_date date;
  END IF;

  -- Update total_amount to proper numeric type if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total_amount'
    AND (data_type != 'numeric' OR numeric_precision != 12 OR numeric_scale != 2)
  ) THEN
    ALTER TABLE orders ALTER COLUMN total_amount TYPE NUMERIC(12,2);
  END IF;
END $$;

-- Update status check constraint to include new statuses
DO $$
BEGIN
  -- Drop existing status check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'orders_status_check'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;

  -- Add updated status check constraint with new values
  ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('draft', 'pending', 'confirmed', 'scheduled', 'out_for_delivery', 'en_route', 'delivered', 'invoiced', 'cancelled'));
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address_id ON orders(delivery_address_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_date ON orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);