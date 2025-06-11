export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  gps_lat?: number;
  gps_lon?: number;
  created_at: string;
  updated_at?: string;
  external_id?: string;
  tax_id?: string;
  account_status: 'active' | 'credit_hold' | 'closed';
  credit_terms_days: number;
}

export interface Address {
  id: string;
  customer_id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  delivery_window_start?: string;
  delivery_window_end?: string;
  is_primary: boolean;
  instructions?: string;
  created_at: string;
}

export interface CustomerWithAddresses extends Customer {
  addresses?: Address[];
}

export interface CustomerFilters {
  search: string;
  status: 'all' | 'active' | 'credit_hold' | 'closed';
}

export interface CustomerFormData {
  name: string;
  tax_id: string;
  phone: string;
  email?: string;
  account_status: 'active' | 'credit_hold' | 'closed';
  credit_terms_days: number;
}