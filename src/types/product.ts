export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unit_of_measure?: string;
  capacity_kg?: number;
  tare_weight_kg?: number;
  valve_type?: string;
  status: 'active' | 'end_of_sale' | 'obsolete';
  barcode_uid?: string;
  created_at: string;
}

export interface ProductFilters {
  search: string;
  status: 'all' | 'active' | 'end_of_sale' | 'obsolete';
}

export interface ProductFormData {
  sku: string;
  name: string;
  description?: string;
  unit_of_measure: string;
  capacity_kg: number;
  tare_weight_kg: number;
  valve_type?: string;
  status: 'active' | 'end_of_sale' | 'obsolete';
  barcode_uid?: string;
}