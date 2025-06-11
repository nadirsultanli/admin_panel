/*
  # Add Sample Data for LPG Order Management System

  1. Sample Data
    - Customers with business information
    - Addresses with GPS coordinates and delivery instructions
    - Products with detailed LPG cylinder specifications
    - Warehouses and inventory tracking
    - Orders with proper status workflow
    - Order lines with pricing

  2. Data Integrity
    - Uses ON CONFLICT DO NOTHING to prevent duplicate data
    - Maintains referential integrity with foreign keys
    - Includes realistic business scenarios
*/

-- Insert sample customers
INSERT INTO customers (id, external_id, name, tax_id, phone, email, account_status, credit_terms_days) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'CUST001', 'Acme Restaurant Group', '12-3456789', '555-0101', 'orders@acmerestaurants.com', 'active', 30),
  ('550e8400-e29b-41d4-a716-446655440002', 'CUST002', 'Downtown Diner', '98-7654321', '555-0102', 'manager@downtowndiner.com', 'active', 15),
  ('550e8400-e29b-41d4-a716-446655440003', 'CUST003', 'City Catering Co', '11-2233445', '555-0103', 'purchasing@citycatering.com', 'credit_hold', 45),
  ('550e8400-e29b-41d4-a716-446655440004', 'CUST004', 'Suburban Grill', '55-6677889', '555-0104', 'owner@suburbangrill.com', 'active', 30)
ON CONFLICT (id) DO NOTHING;

-- Insert sample addresses
INSERT INTO addresses (id, customer_id, label, line1, line2, city, state, postal_code, country, latitude, longitude, is_primary, instructions) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Main Location', '123 Main St', 'Suite 100', 'Downtown', 'CA', '90210', 'US', 34.0522, -118.2437, true, 'Delivery dock on north side'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Branch Office', '456 Oak Ave', null, 'Uptown', 'CA', '90211', 'US', 34.0622, -118.2537, false, 'Ring bell at back entrance'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Restaurant', '789 Pine St', null, 'Midtown', 'CA', '90212', 'US', 34.0722, -118.2637, true, 'Kitchen entrance only'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Catering Kitchen', '321 Elm Dr', 'Building B', 'Industrial Park', 'CA', '90213', 'US', 34.0822, -118.2737, true, 'Loading bay #3'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'Grill Location', '654 Cedar Ln', null, 'Suburbia', 'CA', '90214', 'US', 34.0922, -118.2837, true, 'Side alley access')
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO products (id, sku, name, description, unit_of_measure, capacity_kg, tare_weight_kg, valve_type, status, barcode_uid) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'LPG-15KG-STD', '15kg Standard LPG Cylinder', 'Standard 15kg propane cylinder for commercial use', 'cylinder', 15.00, 12.50, 'POL', 'active', '1234567890123'),
  ('770e8400-e29b-41d4-a716-446655440002', 'LPG-30KG-STD', '30kg Standard LPG Cylinder', 'Standard 30kg propane cylinder for heavy commercial use', 'cylinder', 30.00, 18.00, 'POL', 'active', '1234567890124'),
  ('770e8400-e29b-41d4-a716-446655440003', 'LPG-45KG-STD', '45kg Standard LPG Cylinder', 'Large 45kg propane cylinder for industrial use', 'cylinder', 45.00, 25.00, 'POL', 'active', '1234567890125'),
  ('770e8400-e29b-41d4-a716-446655440004', 'LPG-9KG-PORT', '9kg Portable LPG Cylinder', 'Portable 9kg propane cylinder for mobile applications', 'cylinder', 9.00, 8.50, 'POL', 'active', '1234567890126'),
  ('770e8400-e29b-41d4-a716-446655440005', 'LPG-BULK-KG', 'Bulk LPG per Kg', 'Bulk propane sold by kilogram', 'kg', null, null, null, 'active', '1234567890127')
ON CONFLICT (id) DO NOTHING;

-- Insert sample warehouse (using existing warehouse if it exists)
INSERT INTO warehouses (id, name, address_id, capacity_cylinders) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'Main Distribution Center', '660e8400-e29b-41d4-a716-446655440001', 5000)
ON CONFLICT (id) DO NOTHING;

-- Insert sample inventory balances
INSERT INTO inventory_balance (warehouse_id, product_id, qty_full, qty_empty, qty_reserved) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 150, 75, 10),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 80, 40, 5),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 45, 25, 3),
  ('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', 200, 100, 15)
ON CONFLICT DO NOTHING;

-- Insert sample orders using existing schema structure
INSERT INTO orders (id, customer_id, delivery_address_id, cylinder_size, quantity, price_kes, total_amount_kes, delivery_date, status, notes) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '15kg', 5, 2599.00, 12995.00, '2024-01-17', 'delivered', 'Standard delivery completed'),
  ('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '30kg', 2, 4599.00, 9198.00, '2024-01-18', 'out_for_delivery', 'En route to customer'),
  ('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', '45kg', 1, 6599.00, 6599.00, '2024-01-19', 'confirmed', 'Awaiting dispatch'),
  ('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440005', '6kg', 10, 1899.00, 18990.00, null, 'pending', 'Customer requested quote')
ON CONFLICT (id) DO NOTHING;

-- Insert sample order lines
INSERT INTO order_lines (order_id, product_id, quantity, unit_price) VALUES
  ('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 5, 2599.00),
  ('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 2, 4599.00),
  ('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 1, 6599.00),
  ('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004', 10, 1899.00)
ON CONFLICT DO NOTHING;