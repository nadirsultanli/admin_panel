import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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

      // Update inventory
      const { error } = await supabase
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
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }
      
      // Generate mock warehouse data
      const mockWarehouses: WarehouseOverviewData[] = [
        {
          id: '880e8400-e29b-41d4-a716-446655440001',
          name: 'Main Depot',
          total_cylinders: 750,
          capacity_cylinders: 1000,
          utilization_percentage: 75,
          status: 'good',
          address: {
            city: 'Nairobi',
            state: 'Nairobi County'
          }
        },
        {
          id: '880e8400-e29b-41d4-a716-446655440002',
          name: 'Industrial Area Depot',
          total_cylinders: 450,
          capacity_cylinders: 500,
          utilization_percentage: 90,
          status: 'warning',
          address: {
            city: 'Nairobi',
            state: 'Industrial Area'
          }
        },
        {
          id: '880e8400-e29b-41d4-a716-446655440003',
          name: 'Mombasa Distribution Center',
          total_cylinders: 320,
          capacity_cylinders: 800,
          utilization_percentage: 40,
          status: 'good',
          address: {
            city: 'Mombasa',
            state: 'Coastal Region'
          }
        }
      ];
      
      setWarehouses(mockWarehouses);
      
      // Generate mock stock levels
      const mockStockLevels: StockLevelData[] = [
        {
          product_id: '770e8400-e29b-41d4-a716-446655440001',
          product_sku: 'CYL-6KG-STD',
          product_name: '6kg Standard Cylinder',
          warehouses: {
            '880e8400-e29b-41d4-a716-446655440001': {
              warehouse_name: 'Main Depot',
              qty_full: 200,
              qty_empty: 100,
              qty_reserved: 15
            },
            '880e8400-e29b-41d4-a716-446655440002': {
              warehouse_name: 'Industrial Area Depot',
              qty_full: 150,
              qty_empty: 75,
              qty_reserved: 10
            }
          },
          total_full: 350,
          total_empty: 175,
          total_reserved: 25,
          total_available: 325,
          stock_status: 'good'
        },
        {
          product_id: '770e8400-e29b-41d4-a716-446655440002',
          product_sku: 'CYL-13KG-STD',
          product_name: '13kg Standard Cylinder',
          warehouses: {
            '880e8400-e29b-41d4-a716-446655440001': {
              warehouse_name: 'Main Depot',
              qty_full: 120,
              qty_empty: 60,
              qty_reserved: 30
            },
            '880e8400-e29b-41d4-a716-446655440002': {
              warehouse_name: 'Industrial Area Depot',
              qty_full: 80,
              qty_empty: 40,
              qty_reserved: 20
            }
          },
          total_full: 200,
          total_empty: 100,
          total_reserved: 50,
          total_available: 150,
          stock_status: 'good'
        },
        {
          product_id: '770e8400-e29b-41d4-a716-446655440003',
          product_sku: 'CYL-6KG-COMP',
          product_name: '6kg Composite Cylinder',
          warehouses: {
            '880e8400-e29b-41d4-a716-446655440001': {
              warehouse_name: 'Main Depot',
              qty_full: 8,
              qty_empty: 4,
              qty_reserved: 2
            }
          },
          total_full: 8,
          total_empty: 4,
          total_reserved: 2,
          total_available: 6,
          stock_status: 'low'
        },
        {
          product_id: '770e8400-e29b-41d4-a716-446655440004',
          product_sku: 'CYL-13KG-COMP',
          product_name: '13kg Composite Cylinder',
          warehouses: {
            '880e8400-e29b-41d4-a716-446655440001': {
              warehouse_name: 'Main Depot',
              qty_full: 0,
              qty_empty: 5,
              qty_reserved: 0
            }
          },
          total_full: 0,
          total_empty: 5,
          total_reserved: 0,
          total_available: 0,
          stock_status: 'out'
        }
      ];
      
      setStockLevels(mockStockLevels);
      
      // Generate mock movement data
      const mockMovements: MovementData[] = [
        {
          id: 'mvt-001',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          product_name: '6kg Standard Cylinder',
          product_sku: 'CYL-6KG-STD',
          warehouse_name: 'Main Depot',
          movement_type: 'adjustment',
          quantity: 5,
          reason: 'Stock count adjustment'
        },
        {
          id: 'mvt-002',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          product_name: '13kg Standard Cylinder',
          product_sku: 'CYL-13KG-STD',
          warehouse_name: 'Main Depot',
          movement_type: 'receipt',
          quantity: 25,
          reason: 'New stock delivery'
        },
        {
          id: 'mvt-003',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          product_name: '6kg Standard Cylinder',
          product_sku: 'CYL-6KG-STD',
          warehouse_name: 'Main Depot',
          movement_type: 'delivery',
          quantity: -10,
          reason: 'Order delivery to Acme Restaurant',
          reference: 'Order #ORD-123456'
        },
        {
          id: 'mvt-004',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          product_name: '13kg Standard Cylinder',
          product_sku: 'CYL-13KG-STD',
          warehouse_name: 'Industrial Area Depot',
          movement_type: 'transfer_in',
          quantity: 15,
          reason: 'Transfer from Main Depot',
          reference: 'Transfer #TRF-789012'
        },
        {
          id: 'mvt-005',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          product_name: '13kg Standard Cylinder',
          product_sku: 'CYL-13KG-STD',
          warehouse_name: 'Main Depot',
          movement_type: 'transfer_out',
          quantity: -15,
          reason: 'Transfer to Industrial Area Depot',
          reference: 'Transfer #TRF-789012'
        }
      ];
      
      setMovements(mockMovements);

    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to fetch inventory data');
      toast.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

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