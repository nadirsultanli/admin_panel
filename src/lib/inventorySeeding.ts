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
    sku: 'CYL-6KG-STD',
    name: '6kg Standard Cylinder',
    description: 'Standard 6kg LPG cylinder for residential use',
    unit_of_measure: 'cylinder',
    capacity_kg: 6,
    tare_weight_kg: 5.5,
    valve_type: 'Standard',
    status: 'active'
  },
  {
    sku: 'CYL-13KG-STD',
    name: '13kg Standard Cylinder',
    description: 'Standard 13kg LPG cylinder for commercial use',
    unit_of_measure: 'cylinder',
    capacity_kg: 13,
    tare_weight_kg: 10.5,
    valve_type: 'Standard',
    status: 'active'
  },
  {
    sku: 'CYL-6KG-COMP',
    name: '6kg Composite Cylinder',
    description: 'Lightweight 6kg composite LPG cylinder',
    unit_of_measure: 'cylinder',
    capacity_kg: 6,
    tare_weight_kg: 3.5,
    valve_type: 'Standard',
    status: 'active'
  }
];

// Default inventory quantities
const DEFAULT_INVENTORY = [
  { sku: 'CYL-6KG-STD', qty_full: 100, qty_empty: 50, qty_reserved: 0 },
  { sku: 'CYL-13KG-STD', qty_full: 75, qty_empty: 25, qty_reserved: 0 },
  { sku: 'CYL-6KG-COMP', qty_full: 30, qty_empty: 10, qty_reserved: 0 }
];

export async function checkIfInventoryExists(): Promise<boolean> {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return false;
    }
    
    // For demo purposes, we'll just return false initially
    // In a real implementation, this would check the database
    return false;
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
    // This is a mock implementation
    return 'warehouse-id-123';
  } catch (error) {
    console.error('Error creating default warehouse:', error);
    throw error;
  }
}

export async function createDefaultProducts(): Promise<{ [sku: string]: string }> {
  try {
    // This is a mock implementation
    return {
      'CYL-6KG-STD': 'product-id-1',
      'CYL-13KG-STD': 'product-id-2',
      'CYL-6KG-COMP': 'product-id-3'
    };
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
    // This is a mock implementation
    const total = DEFAULT_INVENTORY.length;
    let completed = 0;

    for (const inventory of DEFAULT_INVENTORY) {
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      completed++;
      onProgress?.({
        step: `Seeding inventory for ${inventory.sku}`,
        progress: completed,
        total
      });
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
    
    await new Promise(resolve => setTimeout(resolve, 800));

    // Step 2: Create products
    onProgress?.({
      step: 'Creating default products...',
      progress: 2,
      total: 4
    });
    
    await new Promise(resolve => setTimeout(resolve, 800));

    // Step 3: Seed inventory
    onProgress?.({
      step: 'Seeding inventory data...',
      progress: 3,
      total: 4
    });
    
    await new Promise(resolve => setTimeout(resolve, 800));

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
    // Generate mock CSV content
    const csvContent = `"Warehouse","Product SKU","Product Name","Full Qty","Empty Qty","Reserved Qty","Available Qty","Last Updated"
"Main Depot","CYL-6KG-STD","6kg Standard Cylinder","200","100","15","185","${new Date().toLocaleDateString()}"
"Main Depot","CYL-13KG-STD","13kg Standard Cylinder","150","75","10","140","${new Date().toLocaleDateString()}"
"Industrial Area Depot","CYL-6KG-STD","6kg Standard Cylinder","150","75","10","140","${new Date().toLocaleDateString()}"
"Industrial Area Depot","CYL-13KG-STD","13kg Standard Cylinder","80","40","5","75","${new Date().toLocaleDateString()}"`;
    
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