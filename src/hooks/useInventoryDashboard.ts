import { useState, useCallback, useEffect } from 'react';
import { supabase, supabaseAdmin, isUserAdmin } from '@/lib/supabase';
import { validateInventoryData } from '@/lib/inventorySeeding';
import { toast } from 'sonner';

export interface WarehouseOverviewData {
  id: string;
  name: string;
  total_cylinders: number;
  capacity_cylinders?: number;
  utilization_percentage: number;
  status: 'good' | 'warning' | 'critical';
  address?: {
    city: string;
    state?: string;
  };
}

export interface StockLevelData {
  product_id: string;
  product_sku: string;
  product_name: string;
  warehouses: {
    [warehouseId: string]: {
      warehouse_name: string;
      qty_full: number;
      qty_empty: number;
      qty_reserved: number;
    };
  };
  total_full: number;
  total_empty: number;
  total_reserved: number;
  total_available: number;
  stock_status: 'good' | 'low' | 'out';
}

export interface MovementData {
  id: string;
  timestamp: string;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  movement_type: 'transfer_in' | 'transfer_out' | 'adjustment' | 'delivery' | 'receipt';
  quantity: number;
  reason?: string;
  reference?: string;
}

interface UseInventoryDashboardReturn {
  warehouses: WarehouseOverviewData[];
  stockLevels: StockLevelData[];
  movements: MovementData[];
  loading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
  updateInventory: (warehouseId: string, productId: string, quantities: {
    qty_full: number;
    qty_empty: number;
    qty_reserved: number;
  }) => Promise<boolean>;
  clearError: () => void;
}

export function useInventoryDashboard(): UseInventoryDashboardReturn {
  const [warehouses, setWarehouses] = useState<WarehouseOverviewData[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevelData[]>([]);
  const [movements, setMovements] = useState<MovementData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isUserAdmin();
      setIsAdmin(adminStatus);
    };
    
    checkAdminStatus();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateInventory = useCallback(async (
    warehouseId: string,
    productId: string,
    quantities: { qty_full: number; qty_empty: number; qty_reserved: number }
  ): Promise<boolean> => {
    try {
      // Validate inventory data
      const validation = await validateInventoryData(warehouseId, productId, quantities);
      
      if (!validation.isValid) {
        toast.error(`Validation failed: ${validation.errors.join(', ')}`);
        return false;
      }

      // Show warnings if any
      validation.warnings.forEach(warning => {
        toast.warning(warning);
      });

      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;

      // Update inventory
      const { error } = await client
        .from('inventory_balance')
        .upsert({
          warehouse_id: warehouseId,
          product_id: productId,
          ...quantities,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Inventory updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to update inventory');
      return false;
    }
  }, [isAdmin]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the appropriate client based on admin status
      const client = isAdmin ? supabaseAdmin : supabase;
      
      // Fetch warehouses with inventory summary
      const { data: warehouseData, error: warehouseError } = await client
        .from('warehouses')
        .select(`
          id,
          name,
          capacity_cylinders,
          address:addresses(city, state)
        `);

      if (warehouseError) throw warehouseError;

      // Fetch inventory balances
      const { data: inventoryData, error: inventoryError } = await client
        .from('inventory_balance')
        .select(`
          warehouse_id,
          qty_full,
          qty_empty,
          qty_reserved
        `);

      if (inventoryError) throw inventoryError;

      // Calculate warehouse overview data
      const warehouseOverview: WarehouseOverviewData[] = (warehouseData || []).map(warehouse => {
        const warehouseInventory = inventoryData?.filter(inv => inv.warehouse_id === warehouse.id) || [];
        const totalCylinders = warehouseInventory.reduce((sum, inv) => 
          sum + inv.qty_full + inv.qty_empty, 0
        );
        
        const capacity = warehouse.capacity_cylinders || 1000; // Default capacity
        const utilization = capacity > 0 ? (totalCylinders / capacity) * 100 : 0;
        
        let status: 'good' | 'warning' | 'critical' = 'good';
        if (utilization > 90) status = 'critical';
        else if (utilization > 75) status = 'warning';

        return {
          id: warehouse.id,
          name: warehouse.name,
          total_cylinders: totalCylinders,
          capacity_cylinders: capacity,
          utilization_percentage: Math.round(utilization),
          status,
          address: warehouse.address
        };
      });

      setWarehouses(warehouseOverview);

      // Fetch products with inventory levels
      const { data: productData, error: productError } = await client
        .from('products')
        .select(`
          id,
          sku,
          name,
          status
        `)
        .eq('status', 'active');

      if (productError) throw productError;

      // Fetch detailed inventory with warehouse info
      const { data: detailedInventory, error: detailedError } = await client
        .from('inventory_balance')
        .select(`
          product_id,
          warehouse_id,
          qty_full,
          qty_empty,
          qty_reserved,
          warehouse:warehouses(name)
        `);

      if (detailedError) throw detailedError;

      // Process stock levels data
      const stockLevelsMap = new Map<string, StockLevelData>();

      (productData || []).forEach(product => {
        const productInventory = detailedInventory?.filter(inv => inv.product_id === product.id) || [];
        
        const warehouses: StockLevelData['warehouses'] = {};
        let totalFull = 0;
        let totalEmpty = 0;
        let totalReserved = 0;

        productInventory.forEach(inv => {
          warehouses[inv.warehouse_id] = {
            warehouse_name: inv.warehouse?.name || 'Unknown',
            qty_full: inv.qty_full,
            qty_empty: inv.qty_empty,
            qty_reserved: inv.qty_reserved
          };
          totalFull += inv.qty_full;
          totalEmpty += inv.qty_empty;
          totalReserved += inv.qty_reserved;
        });

        const totalAvailable = totalFull - totalReserved;
        let stockStatus: 'good' | 'low' | 'out' = 'good';
        if (totalAvailable === 0) stockStatus = 'out';
        else if (totalAvailable < 10) stockStatus = 'low';

        stockLevelsMap.set(product.id, {
          product_id: product.id,
          product_sku: product.sku,
          product_name: product.name,
          warehouses,
          total_full: totalFull,
          total_empty: totalEmpty,
          total_reserved: totalReserved,
          total_available: totalAvailable,
          stock_status: stockStatus
        });
      });

      setStockLevels(Array.from(stockLevelsMap.values()));

      // Fetch recent movements (enhanced with real data)
      const { data: recentOrders, error: ordersError } = await client
        .from('orders')
        .select(`
          id,
          status,
          quantity,
          cylinder_size,
          created_at,
          customer:customers(name),
          delivery_address:addresses(city)
        `)
        .in('status', ['delivered', 'out_for_delivery'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;

      // Convert orders to movement data
      const orderMovements: MovementData[] = (recentOrders || []).map(order => ({
        id: order.id,
        timestamp: order.created_at,
        product_name: `${order.cylinder_size} Cylinder`,
        product_sku: `CYL-${order.cylinder_size.toUpperCase()}-STD`,
        warehouse_name: 'Main Depot',
        movement_type: order.status === 'delivered' ? 'delivery' : 'transfer_out',
        quantity: -order.quantity, // Negative for outbound
        reason: `Order delivery to ${order.customer?.name || 'Customer'}`,
        reference: `Order #${order.id.slice(-8)}`
      }));

      // Add some mock adjustment movements for demonstration
      const mockMovements: MovementData[] = [
        {
          id: 'adj-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          product_name: '13kg Standard Cylinder',
          product_sku: 'CYL-13KG-STD',
          warehouse_name: 'Main Depot',
          movement_type: 'adjustment',
          quantity: 5,
          reason: 'Stock count adjustment'
        },
        {
          id: 'rcpt-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          product_name: '6kg Standard Cylinder',
          product_sku: 'CYL-6KG-STD',
          warehouse_name: 'Main Depot',
          movement_type: 'receipt',
          quantity: 25,
          reason: 'New stock delivery'
        }
      ];

      const allMovements = [...orderMovements, ...mockMovements]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);

      setMovements(allMovements);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  return {
    warehouses,
    stockLevels,
    movements,
    loading,
    error,
    fetchDashboardData,
    updateInventory,
    clearError
  };
}