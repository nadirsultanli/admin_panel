import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { InventoryBalance, InventoryAdjustment, ProductUsageAnalytics } from '@/types/inventory';
import { toast } from 'sonner';

interface UseInventoryReturn {
  inventory: InventoryBalance[];
  adjustments: InventoryAdjustment[];
  analytics: ProductUsageAnalytics | null;
  loading: boolean;
  error: string | null;
  fetchInventory: (productId: string) => Promise<void>;
  fetchAdjustments: (productId: string) => Promise<void>;
  fetchAnalytics: (productId: string) => Promise<void>;
  adjustInventory: (adjustment: Omit<InventoryAdjustment, 'id' | 'created_at'>) => Promise<boolean>;
  clearError: () => void;
}

export function useInventory(): UseInventoryReturn {
  const [inventory, setInventory] = useState<InventoryBalance[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [analytics, setAnalytics] = useState<ProductUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchInventory = useCallback(async (productId: string) => {
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
      
      // Generate mock inventory data for the given product
      const mockInventory: InventoryBalance[] = [
        {
          id: 'inv-001',
          warehouse_id: '880e8400-e29b-41d4-a716-446655440001',
          product_id: productId,
          qty_full: 200,
          qty_empty: 100,
          qty_reserved: 15,
          updated_at: new Date().toISOString(),
          warehouse: {
            id: '880e8400-e29b-41d4-a716-446655440001',
            name: 'Main Depot',
            address: {
              city: 'Nairobi',
              state: 'Nairobi County'
            }
          }
        },
        {
          id: 'inv-002',
          warehouse_id: '880e8400-e29b-41d4-a716-446655440002',
          product_id: productId,
          qty_full: 150,
          qty_empty: 75,
          qty_reserved: 10,
          updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          warehouse: {
            id: '880e8400-e29b-41d4-a716-446655440002',
            name: 'Industrial Area Depot',
            address: {
              city: 'Nairobi',
              state: 'Industrial Area'
            }
          }
        }
      ];
      
      setInventory(mockInventory);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdjustments = useCallback(async (productId: string) => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return;
      }
      
      // Generate mock adjustment data
      const mockAdjustments: InventoryAdjustment[] = [
        {
          id: 'adj-001',
          warehouse_id: '880e8400-e29b-41d4-a716-446655440001',
          product_id: productId,
          adjustment_type: 'full',
          quantity_change: 10,
          reason: 'Stock count adjustment',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'admin@example.com',
          warehouse: {
            id: '880e8400-e29b-41d4-a716-446655440001',
            name: 'Main Depot',
            address: {
              city: 'Nairobi',
              state: 'Nairobi County'
            }
          }
        },
        {
          id: 'adj-002',
          warehouse_id: '880e8400-e29b-41d4-a716-446655440001',
          product_id: productId,
          adjustment_type: 'empty',
          quantity_change: 5,
          reason: 'Returned cylinders',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'admin@example.com',
          warehouse: {
            id: '880e8400-e29b-41d4-a716-446655440001',
            name: 'Main Depot',
            address: {
              city: 'Nairobi',
              state: 'Nairobi County'
            }
          }
        }
      ];
      
      setAdjustments(mockAdjustments);
    } catch (err) {
      console.error('Error fetching adjustments:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async (productId: string) => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return;
      }
      
      // Generate mock analytics data
      const mockAnalytics: ProductUsageAnalytics = {
        total_delivered_month: 45,
        average_daily_usage: 1.5,
        usage_trend: [
          { date: '2024-01-01', quantity: 2 },
          { date: '2024-01-03', quantity: 3 },
          { date: '2024-01-05', quantity: 1 },
          { date: '2024-01-08', quantity: 4 },
          { date: '2024-01-10', quantity: 2 },
          { date: '2024-01-15', quantity: 3 },
          { date: '2024-01-18', quantity: 5 }
        ]
      };
      
      setAnalytics(mockAnalytics);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalytics({
        total_delivered_month: 0,
        average_daily_usage: 0,
        usage_trend: []
      });
    }
  }, []);

  const adjustInventory = useCallback(async (
    adjustmentData: Omit<InventoryAdjustment, 'id' | 'created_at'>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication required. Please log in.');
      }
      
      // In a real implementation, this would update inventory in the database
      // For now, we'll simulate a successful adjustment
      toast.success('Inventory adjusted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust inventory';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    inventory,
    adjustments,
    analytics,
    loading,
    error,
    fetchInventory,
    fetchAdjustments,
    fetchAnalytics,
    adjustInventory,
    clearError
  };
}