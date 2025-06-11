/*
  # Insert Sample Data for LPG Order Management System

  1. Sample Data
    - Customers with Kenyan business context
    - Addresses in Nairobi areas
    - LPG products (6kg and 13kg cylinders only)
    - Warehouse with inventory
    - Orders and order lines

  2. Data Consistency
    - Uses only allowed cylinder sizes (6kg, 13kg)
    - Proper foreign key relationships
    - Realistic Kenyan pricing in KES
    - Conflict handling for safe re-runs
*/

-- Insert sample customers
INSERT INTO customers (id, external_id, name, tax_id, phone, email, account_status, credit_terms_days) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'CUST001', 'Acme Restaurant Group', '12-3456789', '+254701234567', 'orders@acmerestaurants.co.ke', 'active', 30),
  ('550e8400-e29b-41d4-a716-446655440002', 'CUST002', 'Downtown Diner', '98-7654321', '+254702345678', 'manager@downtowndiner.co.ke', 'active', 15),
  ('550e8400-e29b-41d4-a716-446655440003', 'CUST003', 'City Catering Co', '11-2233445', '+254703456789', 'purchasing@citycatering.co.ke', 'credit_hold', 45),
  ('550e8400-e29b-41d4-a716-446655440004', 'CUST004', 'Suburban Grill', '55-6677889', '+254704567890', 'owner@suburbangrill.co.ke', 'active', 30)
ON CONFLICT (id) DO NOTHING;

-- Insert sample addresses
INSERT INTO addresses (id, customer_id, label, line1, line2, city, state, postal_code, country, latitude, longitude, is_primary, instructions) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Main Location', 'Westlands Square', 'Ground Floor', 'Nairobi', 'Nairobi', '00600', 'KE', -1.2634, 36.8078, true, 'Delivery dock on north side'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Branch Office', 'Sarit Centre', 'Shop 45', 'Nairobi', 'Nairobi', '00606', 'KE', -1.2634, 36.8078, false, 'Ring bell at back entrance'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Restaurant', 'Yaya Centre', 'Level 2', 'Nairobi', 'Nairobi', '00100', 'KE', -1.2921, 36.7856, true, 'Kitchen entrance only'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Catering Kitchen', 'Industrial Area', 'Warehouse 12B', 'Nairobi', 'Nairobi', '00200', 'KE', -1.3197, 36.8510, true, 'Loading bay #3'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'Grill Location', 'Karen Shopping Centre', 'Unit 8', 'Nairobi', 'Nairobi', '00502', 'KE', -1.3197, 36.6820, true, 'Side alley access')
ON CONFLICT (id) DO NOTHING;

-- Insert sample products (focusing on 6kg and 13kg cylinders as per schema constraints)
INSERT INTO products (id, sku, name, description, unit_of_measure, capacity_kg, tare_weight_kg, valve_type, status, barcode_uid) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'LPG-6KG-STD', '6kg Standard LPG Cylinder', 'Standard 6kg propane cylinder for domestic use', 'cylinder', 6.00, 5.50, 'POL', 'active', '1234567890123'),
  ('770e8400-e29b-41d4-a716-446655440002', 'LPG-13KG-STD', '13kg Standard LPG Cylinder', 'Standard 13kg propane cylinder for commercial use', 'cylinder', 13.00, 10.50, 'POL', 'active', '1234567890124'),
  ('770e8400-e29b-41d4-a716-446655440003', 'LPG-6KG-COMP', '6kg Composite LPG Cylinder', 'Lightweight composite 6kg propane cylinder', 'cylinder', 6.00, 3.50, 'POL', 'active', '1234567890125'),
  ('770e8400-e29b-41d4-a716-446655440004', 'LPG-13KG-COMP', '13kg Composite LPG Cylinder', 'Lightweight composite 13kg propane cylinder', 'cylinder', 13.00, 8.00, 'POL', 'active', '1234567890126'),
  ('770e8400-e29b-41d4-a716-446655440005', 'LPG-BULK-KG', 'Bulk LPG per Kg', 'Bulk propane sold by kilogram', 'kg', null, null, null, 'active', '1234567890127')
ON CONFLICT (sku) DO NOTHING;

-- Insert sample warehouse
INSERT INTO warehouses (id, name, address_id, capacity_cylinders) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'Main Distribution Center', '660e8400-e29b-41d4-a716-446655440001', 5000)
ON CONFLICT (name) DO NOTHING;

-- Insert sample inventory balances
INSERT INTO inventory_balance (warehouse_id, product_id, qty_full, qty_empty, qty_reserved) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 200, 100, 15),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 150, 75, 10),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 80, 40, 5),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', 120, 60, 8)
ON CONFLICT (warehouse_id, product_id) DO NOTHING;

-- Insert sample orders using only allowed cylinder sizes (6kg and 13kg) and correct column names
INSERT INTO orders (id, customer_id, delivery_address_id, cylinder_size, quantity, price_kes, total_amount_kes, delivery_date, status, notes, order_date, scheduled_date) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '13kg', 5, 2599.00, 12995.00, '2024-01-17', 'delivered', 'Standard delivery completed', '2024-01-15', '2024-01-17'),
  ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '6kg', 8, 1899.00, 15192.00, '2024-01-18', 'out_for_delivery', 'En route to customer', '2024-01-16', '2024-01-18'),
  ('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', '13kg', 3, 2599.00, 7797.00, '2024-01-19', 'confirmed', 'Awaiting dispatch', '2024-01-17', '2024-01-19'),
  ('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', '6kg', 10, 1899.00, 18990.00, null, 'pending', 'Customer requested quote', '2024-01-18', null)
ON CONFLICT (id) DO NOTHING;

-- Insert sample order lines (these will trigger the order total calculation)
INSERT INTO order_lines (order_id, product_id, quantity, unit_price) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 5, 2599.00),
  ('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 8, 1899.00),
  ('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', 3, 2599.00),
  ('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 10, 1899.00)
ON CONFLICT (order_id, product_id) DO NOTHING;