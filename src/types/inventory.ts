export interface InventoryBalance {
  id: string;
  warehouse_id: string;
  product_id: string;
  qty_full: number;
  qty_empty: number;
  qty_reserved: number;
  updated_at: string;
  warehouse?: Warehouse;
}

export interface Warehouse {
  id: string;
  name: string;
  address_id?: string;
  capacity_cylinders?: number;
  created_at: string;
  address?: {
    city: string;
    state?: string;
  };
}

export interface InventoryAdjustment {
  id: string;
  warehouse_id: string;
  product_id: string;
  adjustment_type: 'full' | 'empty' | 'reserved';
  quantity_change: number;
  reason: string;
  created_at: string;
  created_by?: string;
  warehouse?: Warehouse;
}

export interface ProductUsageAnalytics {
  total_delivered_month: number;
  average_daily_usage: number;
  usage_trend: {
    date: string;
    quantity: number;
  }[];
}

export interface StockLevel {
  level: 'good' | 'low' | 'out';
  color: string;
  threshold: number;
}