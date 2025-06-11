export interface Order {
  id: string;
  customer_id: string;
  delivery_address_id: string;
  order_date: string;
  scheduled_date?: string;
  status: 'draft' | 'pending' | 'confirmed' | 'scheduled' | 'en_route' | 'delivered' | 'cancelled';
  cylinder_size: string;
  quantity: number;
  price_kes: number;
  total_amount_kes: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  delivery_address?: {
    id: string;
    city: string;
    line1: string;
    line2?: string;
    state?: string;
  };
}

export interface OrderFilters {
  search: string;
  status: 'all' | 'draft' | 'pending' | 'confirmed' | 'scheduled' | 'en_route' | 'delivered' | 'cancelled';
  dateFrom: string;
  dateTo: string;
}

export interface OrderMetrics {
  totalOrders: number;
  pendingDeliveries: number;
  revenueThisMonth: number;
  averageOrderValue: number;
}