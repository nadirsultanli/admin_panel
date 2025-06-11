import { supabase } from './supabase';
import { toast } from 'sonner';

export interface SeedingProgress {
  step: string;
  progress: number;
  total: number;
}

export interface InventoryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Default warehouse data
const DEFAULT_WAREHOUSE = {
  name: 'Main Depot',
  capacity_cylinders: 1000,
  address: {
    line1: 'Industrial Area',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'KE',
    postal_code: '00100'
  }
};

// Default products to seed
const DEFAULT_PRODUCTS = [
  {
    sku: 'CYL-20KG-STD',
    name: '20kg Standard Cylinder',
    description: 'Standard 20kg LPG cylinder for residential use',
    unit_of_measure: 'cylinder',
    capacity_kg: 20,
    tare_weight_kg: 15,
    valve_type: 'Standard',
    status: 'active'
  },
  {
    sku: 'CYL-50KG-STD',
    name: '50kg Standard Cylinder',
    description: 'Standard 50kg LPG cylinder for commercial use',
    unit_of_measure: 'cylinder',
    capacity_kg: 50,
    tare_weight_kg: 25,
    valve_type: 'Standard',
    status: 'active'
  },
  {
    sku: 'CYL-100KG-IND',
    name: '100kg Industrial Cylinder',
    description: 'Heavy-duty 100kg LPG cylinder for industrial applications',
    unit_of_measure: 'cylinder',
    capacity_kg: 100,
    tare_weight_kg: 45,
    valve_type: 'Industrial',
    status: 'active'
  }
];

// Default inventory quantities
const DEFAULT_INVENTORY = [
  { sku: 'CYL-20KG-STD', qty_full: 100, qty_empty: 50, qty_reserved: 0 },
  { sku: 'CYL-50KG-STD', qty_full: 75, qty_empty: 25, qty_reserved: 0 },
  { sku: 'CYL-100KG-IND', qty_full: 30, qty_empty: 10, qty_reserved: 0 }
];

export async function checkIfInventoryExists(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('inventory_balance')
      .select('id')
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking inventory existence:', error);
    return false;
  }
}

export async function validateInventoryData(
  warehouseId: string,
  productId: string,
  quantities: { qty_full: number; qty_empty: number; qty_reserved: number }
): Promise<InventoryValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate quantities are non-negative
  if (quantities.qty_full < 0) errors.push('Full quantity cannot be negative');
  if (quantities.qty_empty < 0) errors.push('Empty quantity cannot be negative');
  if (quantities.qty_reserved < 0) errors.push('Reserved quantity cannot be negative');

  // Validate reserved doesn't exceed full
  if (quantities.qty_reserved > quantities.qty_full) {
    errors.push('Reserved quantity cannot exceed full quantity');
  }

  // Check for low stock warning
  const availableStock = quantities.qty_full - quantities.qty_reserved;
  if (availableStock < 10 && availableStock > 0) {
    warnings.push(`Low stock warning: Only ${availableStock} units available`);
  }

  // Check for out of stock
  if (availableStock <= 0) {
    warnings.push('Product is out of stock');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export async function createDefaultWarehouse(): Promise<string | null> {
  try {
    // Check if Main Depot already exists
    const { data: existingWarehouse, error: checkError } = await supabase
      .from('warehouses')
      .select('id')
      .eq('name', DEFAULT_WAREHOUSE.name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingWarehouse) {
      return existingWarehouse.id;
    }

    // Create address first
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .insert({
        customer_id: null, // Warehouse address
        label: 'Main Warehouse Address',
        ...DEFAULT_WAREHOUSE.address,
        is_primary: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (addressError) throw addressError;

    // Create warehouse
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .insert({
        name: DEFAULT_WAREHOUSE.name,
        address_id: address.id,
        capacity_cylinders: DEFAULT_WAREHOUSE.capacity_cylinders,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (warehouseError) throw warehouseError;

    return warehouse.id;
  } catch (error) {
    console.error('Error creating default warehouse:', error);
    throw error;
  }
}

export async function createDefaultProducts(): Promise<{ [sku: string]: string }> {
  try {
    const productIds: { [sku: string]: string } = {};

    for (const product of DEFAULT_PRODUCTS) {
      // Check if product already exists
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('sku', product.sku)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingProduct) {
        productIds[product.sku] = existingProduct.id;
        continue;
      }

      // Create product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          ...product,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (productError) throw productError;

      productIds[product.sku] = newProduct.id;
    }

    return productIds;
  } catch (error) {
    console.error('Error creating default products:', error);
    throw error;
  }
}

export async function seedInventoryData(
  warehouseId: string,
  productIds: { [sku: string]: string },
  onProgress?: (progress: SeedingProgress) => void
): Promise<void> {
  try {
    const total = DEFAULT_INVENTORY.length;
    let completed = 0;

    for (const inventory of DEFAULT_INVENTORY) {
      const productId = productIds[inventory.sku];
      if (!productId) {
        throw new Error(`Product not found for SKU: ${inventory.sku}`);
      }

      // Validate inventory data
      const validation = await validateInventoryData(warehouseId, productId, {
        qty_full: inventory.qty_full,
        qty_empty: inventory.qty_empty,
        qty_reserved: inventory.qty_reserved
      });

      if (!validation.isValid) {
        throw new Error(`Validation failed for ${inventory.sku}: ${validation.errors.join(', ')}`);
      }

      // Check if inventory already exists
      const { data: existingInventory, error: checkError } = await supabase
        .from('inventory_balance')
        .select('id')
        .eq('warehouse_id', warehouseId)
        .eq('product_id', productId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingInventory) {
        // Update existing inventory
        const { error: updateError } = await supabase
          .from('inventory_balance')
          .update({
            qty_full: inventory.qty_full,
            qty_empty: inventory.qty_empty,
            qty_reserved: inventory.qty_reserved,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInventory.id);

        if (updateError) throw updateError;
      } else {
        // Create new inventory record
        const { error: insertError } = await supabase
          .from('inventory_balance')
          .insert({
            warehouse_id: warehouseId,
            product_id: productId,
            qty_full: inventory.qty_full,
            qty_empty: inventory.qty_empty,
            qty_reserved: inventory.qty_reserved,
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      completed++;
      onProgress?.({
        step: `Seeding inventory for ${inventory.sku}`,
        progress: completed,
        total
      });

      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error('Error seeding inventory data:', error);
    throw error;
  }
}

export async function runCompleteSeeding(
  onProgress?: (progress: SeedingProgress) => void
): Promise<void> {
  try {
    // Step 1: Create warehouse
    onProgress?.({
      step: 'Creating Main Depot warehouse...',
      progress: 1,
      total: 4
    });

    const warehouseId = await createDefaultWarehouse();
    if (!warehouseId) {
      throw new Error('Failed to create warehouse');
    }

    // Step 2: Create products
    onProgress?.({
      step: 'Creating default products...',
      progress: 2,
      total: 4
    });

    const productIds = await createDefaultProducts();

    // Step 3: Seed inventory
    onProgress?.({
      step: 'Seeding inventory data...',
      progress: 3,
      total: 4
    });

    await seedInventoryData(warehouseId, productIds, (inventoryProgress) => {
      onProgress?.({
        step: inventoryProgress.step,
        progress: 3,
        total: 4
      });
    });

    // Step 4: Complete
    onProgress?.({
      step: 'Seeding completed successfully!',
      progress: 4,
      total: 4
    });

  } catch (error) {
    console.error('Error in complete seeding:', error);
    throw error;
  }
}

export async function exportInventoryToCSV(): Promise<string> {
  try {
    // Fetch all inventory data with warehouse and product details
    // Fix: Don't use dot notation in order parameter
    const { data, error } = await supabase
      .from('inventory_balance')
      .select(`
        qty_full,
        qty_empty,
        qty_reserved,
        updated_at,
        warehouse:warehouses(name),
        product:products(sku, name)
      `)
      .order('warehouse_id')  // Changed from warehouse.name
      .order('product_id');   // Changed from product.sku

    if (error) throw error;

    // Create CSV headers
    const headers = [
      'Warehouse',
      'Product SKU',
      'Product Name',
      'Full Qty',
      'Empty Qty',
      'Reserved Qty',
      'Available Qty',
      'Last Updated'
    ];

    // Create CSV rows
    const rows = (data || []).map(item => {
      const availableQty = item.qty_full - item.qty_reserved;
      return [
        item.warehouse?.name || 'Unknown',
        item.product?.sku || 'Unknown',
        item.product?.name || 'Unknown',
        item.qty_full.toString(),
        item.qty_empty.toString(),
        item.qty_reserved.toString(),
        availableQty.toString(),
        new Date(item.updated_at).toLocaleDateString()
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting inventory to CSV:', error);
    throw error;
  }
}

export function downloadCSV(csvContent: string, filename: string = 'inventory-export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}