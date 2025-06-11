/*
  # Complete Database Rebuild

  This migration will:
  1. Clean up all existing data
  2. Rebuild the database structure according to the provided schema
  3. Insert comprehensive sample data

  ## Changes Made
  - Remove all existing data from all tables
  - Update database functions to use correct column names
  - Insert sample data that matches the actual schema structure
*/

-- Clean up all existing data (in correct order to respect foreign keys)
TRUNCATE TABLE order_lines CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE inventory_balance CASCADE;
TRUNCATE TABLE warehouses CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE addresses CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE call_summaries CASCADE;
TRUNCATE TABLE tool_logs CASCADE;
TRUNCATE TABLE tool_call_idempotency CASCADE;
TRUNCATE TABLE admin_users CASCADE;

-- Fix the update_order_total function to use correct column name
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
DECLARE
  order_total NUMERIC(12,2);
BEGIN
  -- Calculate the total from order_lines
  SELECT COALESCE(SUM(subtotal), 0)
  INTO order_total
  FROM order_lines
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);

  -- Update the order with the new total using correct column name
  UPDATE orders 
  SET total_amount_kes = order_total,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Insert sample customers
INSERT INTO customers (id, external_id, name, tax_id, phone, email, account_status, credit_terms_days) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'CUST001', 'Acme Restaurant Group', 'P051234567A', '+254701234567', 'orders@acmerestaurants.co.ke', 'active', 30),
  ('550e8400-e29b-41d4-a716-446655440002', 'CUST002', 'Downtown Diner', 'P051234568B', '+254702345678', 'manager@downtowndiner.co.ke', 'active', 15),
  ('550e8400-e29b-41d4-a716-446655440003', 'CUST003', 'City Catering Co', 'P051234569C', '+254703456789', 'purchasing@citycatering.co.ke', 'credit_hold', 45),
  ('550e8400-e29b-41d4-a716-446655440004', 'CUST004', 'Suburban Grill', 'P051234570D', '+254704567890', 'owner@suburbangrill.co.ke', 'active', 30),
  ('550e8400-e29b-41d4-a716-446655440005', 'CUST005', 'Mama Njeri Kitchen', 'P051234571E', '+254705678901', 'mama@njerikitchen.co.ke', 'active', 30),
  ('550e8400-e29b-41d4-a716-446655440006', 'CUST006', 'Safari Lodge Catering', 'P051234572F', '+254706789012', 'catering@safarilodge.co.ke', 'active', 45);

-- Insert sample addresses
INSERT INTO addresses (id, customer_id, label, line1, line2, city, state, postal_code, country, latitude, longitude, is_primary, instructions) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Main Restaurant', 'Westlands Square', 'Ground Floor, Shop 12', 'Nairobi', 'Nairobi', '00600', 'KE', -1.2634, 36.8078, true, 'Delivery dock on north side, ring bell twice'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Branch Office', 'Sarit Centre', 'Level 1, Shop 45', 'Nairobi', 'Nairobi', '00606', 'KE', -1.2634, 36.8078, false, 'Ring bell at back entrance'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Diner Location', 'Yaya Centre', 'Level 2, Unit 23', 'Nairobi', 'Nairobi', '00100', 'KE', -1.2921, 36.7856, true, 'Kitchen entrance only, avoid lunch hours'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Catering Kitchen', 'Industrial Area', 'Warehouse 12B, Lunga Lunga Road', 'Nairobi', 'Nairobi', '00200', 'KE', -1.3197, 36.8510, true, 'Loading bay #3, security clearance required'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'Grill Location', 'Karen Shopping Centre', 'Unit 8, Ground Floor', 'Nairobi', 'Nairobi', '00502', 'KE', -1.3197, 36.6820, true, 'Side alley access, delivery 8AM-5PM only'),
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 'Kitchen Location', 'Kibera Drive', 'Plot 45, Near Chief Camp', 'Nairobi', 'Nairobi', '00100', 'KE', -1.3133, 36.7892, true, 'Ask for Mama Njeri, narrow access road'),
  ('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440006', 'Lodge Kitchen', 'Langata Road', 'KM 15, Safari Lodge Main Kitchen', 'Nairobi', 'Nairobi', '00509', 'KE', -1.3667, 36.7333, true, 'Main gate security, ask for head chef');

-- Insert sample products (only 6kg and 13kg as per schema constraints)
INSERT INTO products (id, sku, name, description, unit_of_measure, capacity_kg, tare_weight_kg, valve_type, status, barcode_uid) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'LPG-6KG-STD', '6kg Standard LPG Cylinder', 'Standard 6kg propane cylinder for domestic and small commercial use', 'cylinder', 6.00, 5.50, 'POL', 'active', '1234567890123'),
  ('770e8400-e29b-41d4-a716-446655440002', 'LPG-13KG-STD', '13kg Standard LPG Cylinder', 'Standard 13kg propane cylinder for commercial use', 'cylinder', 13.00, 10.50, 'POL', 'active', '1234567890124'),
  ('770e8400-e29b-41d4-a716-446655440003', 'LPG-6KG-COMP', '6kg Composite LPG Cylinder', 'Lightweight composite 6kg propane cylinder', 'cylinder', 6.00, 3.50, 'POL', 'active', '1234567890125'),
  ('770e8400-e29b-41d4-a716-446655440004', 'LPG-13KG-COMP', '13kg Composite LPG Cylinder', 'Lightweight composite 13kg propane cylinder', 'cylinder', 13.00, 8.00, 'POL', 'active', '1234567890126'),
  ('770e8400-e29b-41d4-a716-446655440005', 'LPG-6KG-PREM', '6kg Premium LPG Cylinder', 'Premium grade 6kg propane cylinder with enhanced safety features', 'cylinder', 6.00, 5.00, 'POL', 'active', '1234567890127'),
  ('770e8400-e29b-41d4-a716-446655440006', 'LPG-13KG-PREM', '13kg Premium LPG Cylinder', 'Premium grade 13kg propane cylinder with enhanced safety features', 'cylinder', 13.00, 9.50, 'POL', 'active', '1234567890128'),
  ('770e8400-e29b-41d4-a716-446655440007', 'LPG-BULK-KG', 'Bulk LPG per Kg', 'Bulk propane sold by kilogram for large commercial customers', 'kg', null, null, null, 'active', '1234567890129');

-- Insert sample warehouses
INSERT INTO warehouses (id, name, address_id, capacity_cylinders) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'Main Distribution Center', '660e8400-e29b-41d4-a716-446655440001', 5000),
  ('880e8400-e29b-41d4-a716-446655440002', 'Industrial Area Depot', '660e8400-e29b-41d4-a716-446655440004', 3000);

-- Insert sample inventory balances
INSERT INTO inventory_balance (warehouse_id, product_id, qty_full, qty_empty, qty_reserved) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 250, 120, 20),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 180, 90, 15),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 100, 50, 8),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', 150, 75, 12),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440005', 80, 40, 5),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440006', 120, 60, 10),
  ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 200, 100, 15),
  ('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 150, 75, 12);

-- Insert sample orders with proper dates and status progression
INSERT INTO orders (id, customer_id, delivery_address_id, cylinder_size, quantity, price_kes, total_amount_kes, delivery_date, status, notes, order_date, scheduled_date) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '13kg', 5, 2599.00, 12995.00, '2024-01-17', 'delivered', 'Standard delivery completed successfully', '2024-01-15', '2024-01-17'),
  ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '6kg', 8, 1899.00, 15192.00, '2024-01-18', 'out_for_delivery', 'En route to customer, ETA 2PM', '2024-01-16', '2024-01-18'),
  ('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', '13kg', 3, 2599.00, 7797.00, '2024-01-19', 'confirmed', 'Awaiting dispatch from warehouse', '2024-01-17', '2024-01-19'),
  ('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', '6kg', 10, 1899.00, 18990.00, null, 'pending', 'Customer requested quote, awaiting approval', '2024-01-18', null),
  ('990e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440006', '6kg', 15, 1899.00, 28485.00, '2024-01-20', 'scheduled', 'Large order for community kitchen', '2024-01-18', '2024-01-20'),
  ('990e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440007', '13kg', 8, 2599.00, 20792.00, '2024-01-21', 'confirmed', 'Safari lodge weekly supply', '2024-01-19', '2024-01-21'),
  ('990e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', '6kg', 6, 1899.00, 11394.00, null, 'draft', 'Branch office monthly order - draft', '2024-01-19', null);

-- Insert sample order lines (these will trigger automatic total calculation)
INSERT INTO order_lines (order_id, product_id, quantity, unit_price) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 5, 2599.00),
  ('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 8, 1899.00),
  ('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', 3, 2599.00),
  ('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 10, 1899.00),
  ('990e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', 15, 1899.00),
  ('990e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', 8, 2599.00),
  ('990e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440001', 6, 1899.00);

-- Insert sample admin users
INSERT INTO admin_users (id, email, name, role, active) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', 'admin@lpgcompany.co.ke', 'System Administrator', 'admin', true),
  ('aa0e8400-e29b-41d4-a716-446655440002', 'manager@lpgcompany.co.ke', 'Operations Manager', 'admin', true);

-- Insert sample call summaries
INSERT INTO call_summaries (id, call_id, phone_number, customer_id, duration_seconds, transcript, summary, ended_reason) VALUES
  ('cc0e8400-e29b-41d4-a716-446655440001', 'call_001_20240115', '+254701234567', '550e8400-e29b-41d4-a716-446655440001', 180, 'Customer called to place order for 5x 13kg cylinders...', 'Customer placed order for 5x 13kg cylinders, delivery scheduled for Jan 17', 'completed'),
  ('cc0e8400-e29b-41d4-a716-446655440002', 'call_002_20240116', '+254702345678', '550e8400-e29b-41d4-a716-446655440002', 120, 'Customer inquired about delivery status...', 'Customer checking on delivery status, confirmed en route', 'completed');