import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin, isUserAdmin } from '@/lib/supabase';
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isUserAdmin();
      setIsAdmin(adminStatus);
    };
    
    checkAdminStatus();
  }, []);

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
        // Use the appropriate client based on admin status
        const client = isAdmin ? supabaseAdmin : supabase;
        
        // Fetch today's orders
        const today = new Date().toISOString().split('T')[0];
        const { data: todayOrdersData, error: todayOrdersError } = await client
          .from('orders')
          .select('id, total_amount_kes')
          .eq('order_date', today);
          
        if (todayOrdersError) throw todayOrdersError;
        
        const todayOrdersCount = todayOrdersData?.length || 0;
        const todayOrdersValue = todayOrdersData?.reduce((sum, order) => 
          sum + parseFloat(order.total_amount_kes), 0) || 0;
        
        // Fetch pending deliveries
        const { count: pendingCount, error: pendingError } = await client
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'confirmed', 'scheduled', 'en_route']);
          
        if (pendingError) throw pendingError;
        
        // Fetch low stock items
        const { data: lowStockData, error: lowStockError } = await client
          .from('inventory_balance')
          .select(`
            id,
            qty_full,
            qty_reserved,
            product:products(id, name, sku),
            warehouse:warehouses(id, name)
          `)
          .lt('qty_full', 20);
          
        if (lowStockError) throw lowStockError;
        
        const lowStockCount = lowStockData?.filter(item => 
          (item.qty_full - item.qty_reserved) < 10
        ).length || 0;
        
        // Fetch active customers
        const { count: customersCount, error: customersError } = await client
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('account_status', 'active');
          
        if (customersError) throw customersError;
        
        // Update metrics with random trends for demo
        setMetrics({
          todayOrders: {
            count: todayOrdersCount,
            value: todayOrdersValue,
            trend: Math.floor(Math.random() * 20) - 5 // Random trend between -5 and +15
          },
          pendingDeliveries: {
            count: pendingCount || 0,
            trend: Math.floor(Math.random() * 15) - 3 // Random trend between -3 and +12
          },
          lowStockItems: {
            count: lowStockCount,
            trend: Math.floor(Math.random() * 10) - 8 // Random trend between -8 and +2
          },
          activeCustomers: {
            count: customersCount || 0,
            trend: Math.floor(Math.random() * 12) // Random trend between 0 and +12
          }
        });
        
        // Fetch recent orders
        const { data: recentOrdersData, error: recentOrdersError } = await client
          .from('orders')
          .select(`
            id,
            order_date,
            status,
            total_amount_kes,
            quantity,
            customer:customers(name)
          `)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (recentOrdersError) throw recentOrdersError;
        
        const formattedRecentOrders: RecentOrder[] = (recentOrdersData || []).map(order => ({
          id: order.id,
          customer_name: order.customer?.name || 'Unknown Customer',
          order_date: order.order_date,
          status: order.status,
          total_amount: parseFloat(order.total_amount_kes),
          items: order.quantity
        }));
        
        setRecentOrders(formattedRecentOrders);
        
        // Format low stock items
        const formattedLowStock: LowStockItem[] = (lowStockData || [])
          .filter(item => (item.qty_full - item.qty_reserved) < 20)
          .map(item => {
            const availableStock = item.qty_full - item.qty_reserved;
            return {
              id: item.product?.id || '',
              name: item.product?.name || 'Unknown Product',
              sku: item.product?.sku || 'N/A',
              current_stock: availableStock,
              threshold: 10,
              warehouse_name: item.warehouse?.name || 'Unknown Warehouse',
              urgency: availableStock < 5 ? 'critical' : 'warning'
            };
          })
          .sort((a, b) => a.current_stock - b.current_stock) // Sort by lowest stock first
          .slice(0, 5); // Take top 5 most critical
        
        setLowStockItems(formattedLowStock);
        
        // Generate activity feed
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
            message: 'Inventory adjustment: +10 units of "13kg Industrial Cylinder"',
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
  }, [refreshTrigger, isAdmin]);

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to orders table changes
    const ordersSubscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change detected:', payload);
          
          // Show notification
          if (payload.eventType === 'INSERT') {
            toast.success('New order received!', {
              description: `Order #${payload.new.id.slice(-8)} has been created.`,
              action: {
                label: 'View',
                onClick: () => {
                  // In a real app, this would navigate to the order
                  console.log('Navigate to order:', payload.new.id);
                }
              }
            });
          } else if (payload.eventType === 'UPDATE' && payload.new.status !== payload.old.status) {
            toast.info(`Order status changed to ${payload.new.status}`, {
              description: `Order #${payload.new.id.slice(-8)} updated.`
            });
          }
          
          // Refresh dashboard data
          refreshDashboard();
        }
      )
      .subscribe();

    // Subscribe to inventory_balance changes
    const inventorySubscription = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_balance'
        },
        (payload) => {
          console.log('Inventory change detected:', payload);
          
          // Show notification for low stock
          if (payload.eventType === 'UPDATE') {
            const newQty = payload.new.qty_full - payload.new.qty_reserved;
            if (newQty < 10 && newQty > 0) {
              toast.warning('Low stock alert!', {
                description: `Product is running low on stock (${newQty} units available).`
              });
            } else if (newQty <= 0) {
              toast.error('Out of stock!', {
                description: 'Product is now out of stock. Please restock soon.'
              });
            }
          }
          
          // Refresh dashboard data
          refreshDashboard();
        }
      )
      .subscribe();

    // Subscribe to customers table changes
    const customersSubscription = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customers'
        },
        (payload) => {
          console.log('New customer added:', payload);
          
          // Show notification
          toast.success('New customer added!', {
            description: `${payload.new.name} has been added to the system.`
          });
          
          // Refresh dashboard data
          refreshDashboard();
        }
      )
      .subscribe();

    // Clean up subscriptions
    return () => {
      ordersSubscription.unsubscribe();
      inventorySubscription.unsubscribe();
      customersSubscription.unsubscribe();
    };
  }, [refreshDashboard]);

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