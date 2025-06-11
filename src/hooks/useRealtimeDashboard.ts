import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface DashboardMetrics {
  todayOrders: {
    count: number;
    value: number;
    trend: number;
  };
  pendingDeliveries: {
    count: number;
    trend: number;
  };
  lowStockItems: {
    count: number;
    trend: number;
  };
  activeCustomers: {
    count: number;
    trend: number;
  };
}

export interface RecentOrder {
  id: string;
  customer_name: string;
  order_date: string;
  status: string;
  total_amount: number;
  items: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  threshold: number;
  warehouse_name: string;
  urgency: 'critical' | 'warning';
}

export interface ActivityItem {
  id: string;
  type: 'order_status' | 'customer_added' | 'stock_movement' | 'system';
  message: string;
  timestamp: string;
  entity_id?: string;
  entity_type?: string;
  user?: string;
  icon?: string;
}

interface UseRealtimeDashboardReturn {
  metrics: DashboardMetrics;
  recentOrders: RecentOrder[];
  lowStockItems: LowStockItem[];
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
}

// Initial metrics state
const initialMetrics: DashboardMetrics = {
  todayOrders: { count: 0, value: 0, trend: 0 },
  pendingDeliveries: { count: 0, trend: 0 },
  lowStockItems: { count: 0, trend: 0 },
  activeCustomers: { count: 0, trend: 0 }
};

export function useRealtimeDashboard(): UseRealtimeDashboardReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh dashboard data
  const refreshDashboard = useCallback(async () => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Generate mock data for dashboard
        
        // Mock today's orders
        const mockTodayOrders = {
          count: 8,
          value: 35000,
          trend: 12
        };
        
        // Mock pending deliveries
        const mockPendingDeliveries = {
          count: 15,
          trend: 5
        };
        
        // Mock low stock items
        const mockLowStockItems = {
          count: 4,
          trend: -2
        };
        
        // Mock active customers
        const mockActiveCustomers = {
          count: 42,
          trend: 8
        };
        
        // Update metrics with mock data
        setMetrics({
          todayOrders: mockTodayOrders,
          pendingDeliveries: mockPendingDeliveries,
          lowStockItems: mockLowStockItems,
          activeCustomers: mockActiveCustomers
        });
        
        // Generate mock recent orders
        const mockRecentOrders: RecentOrder[] = [
          {
            id: 'ord-001',
            customer_name: 'Acme Restaurant Group',
            order_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            total_amount: 12995,
            items: 5
          },
          {
            id: 'ord-002',
            customer_name: 'Downtown Diner',
            order_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            status: 'confirmed',
            total_amount: 7500,
            items: 3
          },
          {
            id: 'ord-003',
            customer_name: 'City Catering Co',
            order_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'scheduled',
            total_amount: 18200,
            items: 7
          },
          {
            id: 'ord-004',
            customer_name: 'Suburban Grill',
            order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'en_route',
            total_amount: 5400,
            items: 2
          },
          {
            id: 'ord-005',
            customer_name: 'Hotel Sunshine',
            order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'delivered',
            total_amount: 22500,
            items: 9
          }
        ];
        
        setRecentOrders(mockRecentOrders);
        
        // Generate mock low stock items
        const mockLowStockList: LowStockItem[] = [
          {
            id: 'prod-1',
            name: '6kg Standard Cylinder',
            sku: 'CYL-6KG-STD',
            current_stock: 5,
            threshold: 10,
            warehouse_name: 'Main Depot',
            urgency: 'warning'
          },
          {
            id: 'prod-2',
            name: '13kg Standard Cylinder',
            sku: 'CYL-13KG-STD',
            current_stock: 2,
            threshold: 10,
            warehouse_name: 'Main Depot',
            urgency: 'critical'
          },
          {
            id: 'prod-3',
            name: '6kg Composite Cylinder',
            sku: 'CYL-6KG-COMP',
            current_stock: 8,
            threshold: 15,
            warehouse_name: 'Main Depot',
            urgency: 'warning'
          },
          {
            id: 'prod-4',
            name: '13kg Composite Cylinder',
            sku: 'CYL-13KG-COMP',
            current_stock: 0,
            threshold: 10,
            warehouse_name: 'Industrial Area Depot',
            urgency: 'critical'
          }
        ];
        
        setLowStockItems(mockLowStockList);
        
        // Generate mock activity feed
        const mockActivities: ActivityItem[] = [
          {
            id: '1',
            type: 'order_status',
            message: 'Order #ORD-123456 marked as delivered',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
            entity_id: 'ORD-123456',
            entity_type: 'order',
            user: 'System',
            icon: 'check_circle'
          },
          {
            id: '2',
            type: 'customer_added',
            message: 'New customer "Acme Corporation" added',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
            entity_id: 'CUST-789',
            entity_type: 'customer',
            user: 'Admin',
            icon: 'user_plus'
          },
          {
            id: '3',
            type: 'stock_movement',
            message: '25 units of "13kg Standard Cylinder" transferred to Main Depot',
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
            entity_id: 'PROD-456',
            entity_type: 'product',
            user: 'System',
            icon: 'truck'
          },
          {
            id: '4',
            type: 'order_status',
            message: 'Order #ORD-654321 scheduled for delivery tomorrow',
            timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
            entity_id: 'ORD-654321',
            entity_type: 'order',
            user: 'System',
            icon: 'calendar'
          },
          {
            id: '5',
            type: 'system',
            message: 'Low stock alert: "6kg Standard Cylinder" below threshold',
            timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
            entity_id: 'PROD-123',
            entity_type: 'product',
            icon: 'alert_triangle'
          },
          {
            id: '6',
            type: 'stock_movement',
            message: 'Inventory adjustment: +10 units of "13kg Composite Cylinder"',
            timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
            entity_id: 'PROD-789',
            entity_type: 'product',
            user: 'Admin',
            icon: 'plus_circle'
          },
          {
            id: '7',
            type: 'customer_added',
            message: 'Customer "Hotel Sunshine" updated contact information',
            timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
            entity_id: 'CUST-456',
            entity_type: 'customer',
            user: 'Admin',
            icon: 'edit'
          }
        ];
        
        setActivities(mockActivities);
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [refreshTrigger]);

  return {
    metrics,
    recentOrders,
    lowStockItems,
    activities,
    loading,
    error,
    refreshDashboard
  };
}