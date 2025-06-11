/*
  # Restaurant Seed Data Migration

  1. New Customers
    - Tony's Italian Kitchen (tax_id: 123456789)
    - Mumbai Spice Restaurant (tax_id: 987654321)
    - Golden Dragon Chinese (tax_id: 456789123)

  2. Addresses
    - 2 realistic restaurant addresses per customer (6 total)

  3. Warehouse
    - Main Depot warehouse

  4. Products
    - Note: Schema only allows 6kg and 13kg cylinders, so adjusting to:
      - 6kg Standard Cylinder (closest to 20kg request)
      - 13kg Standard Cylinder (closest to 50kg request)
      - 13kg Industrial Cylinder (for 100kg equivalent)

  5. Inventory
    - 50 full cylinders of each product type in Main Depot
*/

-- Clear existing data first
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

-- Insert restaurant customers
INSERT INTO customers (id, external_id, name, tax_id, phone, email, account_status, credit_terms_days) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'REST001', 'Tony''s Italian Kitchen', '123456789', '+254701234567', 'orders@tonysitalian.co.ke', 'active', 30),
  ('550e8400-e29b-41d4-a716-446655440002', 'REST002', 'Mumbai Spice Restaurant', '987654321', '+254702345678', 'manager@mumbaispice.co.ke', 'active', 30),
  ('550e8400-e29b-41d4-a716-446655440003', 'REST003', 'Golden Dragon Chinese', '456789123', '+254703456789', 'orders@goldendragon.co.ke', 'active', 30);

-- Insert 2 addresses per restaurant (6 total)
INSERT INTO addresses (id, customer_id, label, line1, line2, city, state, postal_code, country, latitude, longitude, is_primary, instructions) VALUES
  -- Tony's Italian Kitchen addresses
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Main Restaurant', 'Westlands Road', 'Opposite Sarit Centre', 'Nairobi', 'Nairobi', '00600', 'KE', -1.2634, 36.8078, true, 'Kitchen entrance at the back, ring bell twice'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Catering Kitchen', 'Industrial Area', 'Lunga Lunga Road, Warehouse 5A', 'Nairobi', 'Nairobi', '00200', 'KE', -1.3197, 36.8510, false, 'Loading dock #2, delivery hours 6AM-4PM'),
  
  -- Mumbai Spice Restaurant addresses
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Main Restaurant', 'Kimathi Street', 'City Centre, Ground Floor', 'Nairobi', 'Nairobi', '00100', 'KE', -1.2921, 36.8219, true, 'Staff entrance on Koinange Street side'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Banquet Hall', 'Ngong Road', 'Karen Country Club Complex', 'Nairobi', 'Nairobi', '00502', 'KE', -1.3197, 36.6820, false, 'Security gate clearance required, ask for head chef'),
  
  -- Golden Dragon Chinese addresses
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'Main Restaurant', 'Moi Avenue', 'Opposite Hilton Hotel', 'Nairobi', 'Nairobi', '00100', 'KE', -1.2921, 36.8219, true, 'Service elevator to 3rd floor kitchen'),
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Takeaway Branch', 'Thika Road', 'Roysambu Shopping Centre', 'Nairobi', 'Nairobi', '00618', 'KE', -1.2297, 36.8925, false, 'Rear entrance through shopping centre loading bay');

-- Insert Main Depot warehouse
INSERT INTO warehouses (id, name, address_id, capacity_cylinders) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'Main Depot', '660e8400-e29b-41d4-a716-446655440002', 10000);

-- Insert LPG products (adjusted to match schema constraints of 6kg and 13kg only)
INSERT INTO products (id, sku, name, description, unit_of_measure, capacity_kg, tare_weight_kg, valve_type, status, barcode_uid) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'CYL-6KG-STD', '6kg Standard Cylinder', 'Standard 6kg LPG cylinder for small to medium restaurants', 'cylinder', 6.00, 5.50, 'POL', 'active', '1234567890001'),
  ('770e8400-e29b-41d4-a716-446655440002', 'CYL-13KG-STD', '13kg Standard Cylinder', 'Standard 13kg LPG cylinder for medium to large restaurants', 'cylinder', 13.00, 10.50, 'POL', 'active', '1234567890002'),
  ('770e8400-e29b-41d4-a716-446655440003', 'CYL-13KG-IND', '13kg Industrial Cylinder', 'Heavy-duty 13kg LPG cylinder for high-volume commercial use', 'cylinder', 13.00, 11.00, 'POL', 'active', '1234567890003');

-- Insert inventory balances - 50 full cylinders of each product type
INSERT INTO inventory_balance (warehouse_id, product_id, qty_full, qty_empty, qty_reserved) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 50, 25, 5),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 50, 25, 5),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 50, 25, 5);

-- Insert sample orders for the restaurants
INSERT INTO orders (id, customer_id, delivery_address_id, cylinder_size, quantity, price_kes, total_amount_kes, delivery_date, status, notes, order_date, scheduled_date) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '13kg', 4, 2800.00, 11200.00, '2024-01-20', 'confirmed', 'Weekly supply for Tony''s Italian Kitchen', '2024-01-18', '2024-01-20'),
  ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '6kg', 6, 2200.00, 13200.00, '2024-01-21', 'pending', 'Mumbai Spice monthly order', '2024-01-19', '2024-01-21'),
  ('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005', '13kg', 8, 2800.00, 22400.00, '2024-01-22', 'scheduled', 'Golden Dragon large order for weekend rush', '2024-01-19', '2024-01-22');

-- Insert corresponding order lines
INSERT INTO order_lines (order_id, product_id, quantity, unit_price) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 4, 2800.00),
  ('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 6, 2200.00),
  ('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', 8, 2800.00);

-- Insert admin user
INSERT INTO admin_users (id, email, name, role, active) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', 'admin@lpgdepot.co.ke', 'LPG Depot Administrator', 'admin', true);

-- Insert sample call summaries
INSERT INTO call_summaries (id, call_id, phone_number, customer_id, duration_seconds, transcript, summary, ended_reason) VALUES
  ('cc0e8400-e29b-41d4-a716-446655440001', 'call_tony_20240118', '+254701234567', '550e8400-e29b-41d4-a716-446655440001', 240, 'Tony called to place weekly order for 4x 13kg cylinders for the restaurant...', 'Tony''s Italian Kitchen placed weekly order, delivery confirmed for Saturday', 'completed'),
  ('cc0e8400-e29b-41d4-a716-446655440002', 'call_mumbai_20240119', '+254702345678', '550e8400-e29b-41d4-a716-446655440002', 180, 'Mumbai Spice manager called for monthly cylinder supply...', 'Mumbai Spice Restaurant ordered monthly supply, 6x 6kg cylinders', 'completed');